import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Check if running against Firestore Emulator
const isEmulator = process.env.FIRESTORE_EMULATOR_HOST || process.env.VITE_USE_EMULATORS === 'true';

if (isEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  admin.initializeApp({ projectId: 'demo-ai-agent-portal' });
} else {
  admin.initializeApp();
}

const db = admin.firestore();

async function runBackup() {
  const backupDate = new Date().toISOString().split('T')[0];
  const backupDir = path.resolve(__dirname, `../backups/${backupDate}`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const collections = ['categories', 'agents', 'users', 'access_codes', 'audit_logs', 'settings'];
  console.log(`Starting Firestore JSON backup for date: ${backupDate}...`);

  for (const col of collections) {
    try {
      const snap = await db.collection(col).get();
      const data: any[] = [];
      snap.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });

      const file = path.join(backupDir, `${col}.json`);
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
      console.log(`[Backup Success] Collection [${col}] -> ${data.length} records -> ${file}`);
    } catch (err: any) {
      console.error(`[Backup Error] Failed to backup collection ${col}:`, err.message);
    }
  }

  console.log('JSON Backup completed.');
}

runBackup().catch(err => {
  console.error('Backup task failed with error:', err);
  process.exit(1);
});
