import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// Helper to check if user is admin or super_admin
async function getUserRole(uid: string): Promise<string | null> {
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) return null;
  return userDoc.data()?.role || null;
}

// Helper to write audit log
async function writeAuditLog(
  userId: string,
  userEmail: string,
  action: string,
  entity: string,
  entityId: string,
  details: any
) {
  const logRef = db.collection('audit_logs').doc();
  await logRef.set({
    id: logRef.id,
    userId,
    userEmail,
    action,
    entity,
    entityId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    details
  });
}

/**
 * Redeem an access code to register / get access to the portal
 */
export const redeemAccessCode = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // 1. Verify Authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { uid, token } = context.auth;
  const email = token.email || '';
  const name = token.name || '';
  const code = (data.code || '').trim().toUpperCase();

  if (!code) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'An invitation code is required.'
    );
  }

  // 2. Lookup Code
  const codeRef = db.collection('access_codes').doc(code);
  
  return db.runTransaction(async (transaction) => {
    const codeDoc = await transaction.get(codeRef);

    if (!codeDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Invalid invitation code.'
      );
    }

    const codeData = codeDoc.data();
    if (!codeData) {
      throw new functions.https.HttpsError(
        'internal',
        'Access code record is empty.'
      );
    }

    if (codeData.used) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This invitation code has already been used.'
      );
    }

    const now = admin.firestore.Timestamp.now();
    if (codeData.expiresAt && codeData.expiresAt.toMillis() < now.toMillis()) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This invitation code has expired.'
      );
    }

    // Enforce that only rajajeevankumar@gmail.com can be the super_admin
    const targetAdminEmail = 'rajajeevankumar@gmail.com';
    const isAdminUser = email.toLowerCase() === targetAdminEmail.toLowerCase();

    const role = isAdminUser ? 'super_admin' : 'authorized_user';
    const status = 'approved'; // Approved automatically upon code redemption

    let accessExpiresAt: admin.firestore.Timestamp | null = null;
    if (!isAdminUser) {
      const accessDuration = codeData.accessDuration || '1_month';
      const accessDate = new Date();
      if (accessDuration === '1_month') {
        accessDate.setMonth(accessDate.getMonth() + 1);
      } else if (accessDuration === '3_months') {
        accessDate.setMonth(accessDate.getMonth() + 3);
      } else if (accessDuration === '1_year') {
        accessDate.setFullYear(accessDate.getFullYear() + 1);
      } else {
        // Default fallback: 30 days
        accessDate.setDate(accessDate.getDate() + 30);
      }
      accessExpiresAt = admin.firestore.Timestamp.fromDate(accessDate);
    }

    // 3. Mark Code as Used
    transaction.update(codeRef, {
      used: true,
      redeemedBy: uid,
      redeemedEmail: email,
      redeemedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 4. Create or Update User Document
    const userRef = db.collection('users').doc(uid);
    const userData: any = {
      id: uid,
      email,
      name,
      role,
      status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    };
    if (accessExpiresAt) {
      userData.accessExpiresAt = accessExpiresAt;
    }
    transaction.set(userRef, userData);

    // 5. Write Audit Log
    const logRef = db.collection('audit_logs').doc();
    transaction.set(logRef, {
      id: logRef.id,
      userId: uid,
      userEmail: email,
      action: 'redeem_code',
      entity: 'access_code',
      entityId: code,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { 
        email, 
        name, 
        role, 
        status, 
        accessDuration: isAdminUser ? 'unlimited' : (codeData.accessDuration || '1_month'),
        accessExpiresAt: accessExpiresAt ? accessExpiresAt.toDate().toISOString() : 'never'
      }
    });

    return { success: true, role, status };
  });
});

/**
 * Generate a new access code (Admin / Super Admin only)
 */
export const generateAccessCode = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const callerUid = context.auth.uid;
  const callerEmail = context.auth.token.email || '';
  const callerRole = await getUserRole(callerUid);

  if (callerRole !== 'super_admin' && callerRole !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can generate access codes.'
    );
  }

  const issuedTo = (data.issuedTo || '').trim();
  const daysValid = parseInt(data.daysValid) || 7;
  const accessDuration = data.accessDuration || '1_month';

  if (!['1_month', '3_months', '1_year'].includes(accessDuration)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Access duration must be one of: 1_month, 3_months, 1_year.'
    );
  }
  
  // Generate a random 8-character alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like I, O, 0, 1
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const expiresAt = admin.firestore.Timestamp.fromMillis(
    Date.now() + daysValid * 24 * 60 * 60 * 1000
  );

  const codeRef = db.collection('access_codes').doc(code);
  await codeRef.set({
    id: code,
    code,
    issuedTo,
    createdBy: callerUid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt,
    used: false,
    accessDuration
  });

  await writeAuditLog(
    callerUid,
    callerEmail,
    'generate_code',
    'access_code',
    code,
    { issuedTo, expiresAt: expiresAt.toDate().toISOString(), accessDuration }
  );

  return { success: true, code, expiresAt: expiresAt.toDate().toISOString() };
});

/**
 * Update user status and/or role (Admin / Super Admin only)
 */
export const updateUserRoleAndStatus = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const callerUid = context.auth.uid;
  const callerEmail = context.auth.token.email || '';
  const callerRole = await getUserRole(callerUid);

  if (callerRole !== 'super_admin' && callerRole !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can modify user status.'
    );
  }

  const { targetUserId, newRole, newStatus } = data;

  if (!targetUserId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Target User ID is required.'
    );
  }

  const targetUserRef = db.collection('users').doc(targetUserId);
  const targetUserDoc = await targetUserRef.get();

  if (!targetUserDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Target user not found.'
    );
  }

  const targetUserData = targetUserDoc.data() || {};
  const currentRole = targetUserData.role;

  // Strict Security Checks:
  // 0. Enforce single administrator constraint
  if ((newRole === 'admin' || newRole === 'super_admin') && targetUserData.email.toLowerCase() !== 'rajajeevankumar@gmail.com'.toLowerCase()) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'The ecosystem is restricted to a single administrator (rajajeevankumar@gmail.com).'
    );
  }

  // 1. Only Super Admin can change someone's role to admin or super_admin, or demote them from it.
  // 2. Normal Admins can only approve, suspend, or reactivate standard 'authorized_user's.
  // 3. Normal Admins cannot change roles of other users.
  // 4. Nobody can demote or suspend the last super_admin (to prevent owner lockout).
  if (callerRole === 'admin') {
    if (newRole && newRole !== currentRole) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Normal administrators cannot modify user roles.'
      );
    }
    if (currentRole === 'super_admin' || currentRole === 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Normal administrators cannot modify other administrators or super administrators.'
      );
    }
  }

  // Prevent lockouts: if target is a super_admin and is being suspended/demoted
  if (currentRole === 'super_admin' && (newRole !== 'super_admin' || newStatus === 'suspended')) {
    // Check if there is at least one other approved super_admin
    const superAdminsSnap = await db.collection('users')
      .where('role', '==', 'super_admin')
      .where('status', '==', 'approved')
      .get();
    
    if (superAdminsSnap.size <= 1) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Cannot modify the only active Super Admin to prevent lockout.'
      );
    }
  }

  const updates: any = {};
  if (newRole) updates.role = newRole;
  if (newStatus) updates.status = newStatus;
  updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  await targetUserRef.update(updates);

  await writeAuditLog(
    callerUid,
    callerEmail,
    'update_user',
    'user',
    targetUserId,
    {
      targetUserEmail: targetUserData.email,
      targetUserName: targetUserData.name,
      previousRole: currentRole,
      previousStatus: targetUserData.status,
      newRole: newRole || currentRole,
      newStatus: newStatus || targetUserData.status
    }
  );

  return { success: true };
});
