import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Check if running against Firestore Emulator
const isEmulator = process.env.FIRESTORE_EMULATOR_HOST || process.env.VITE_USE_EMULATORS === 'true';

if (isEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  console.log('Connecting to FIRESTORE EMULATOR at 127.0.0.1:8080');
  admin.initializeApp({
    projectId: 'demo-ai-agent-portal'
  });
} else {
  console.log('Connecting to PRODUCTION Firebase Project');
  // Initialize with default credentials (looks for GOOGLE_APPLICATION_CREDENTIALS)
  admin.initializeApp();
}

const db = admin.firestore();

const dataPath = path.resolve(__dirname, './data/default-agents.json');

async function seed() {
  console.log(`Loading seed data from: ${dataPath}`);
  if (!fs.existsSync(dataPath)) {
    console.error('Seed data default-agents.json not found! Please run the parse script first.');
    process.exit(1);
  }

  const fileData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  const categories = [
    { id: 'plan', name: 'plan', sortOrder: 1 },
    { id: 'do', name: 'do', sortOrder: 2 },
    { id: 'check', name: 'check', sortOrder: 3 },
    { id: 'act', name: 'act', sortOrder: 4 },
  ];

  console.log('Seeding categories...');
  for (const cat of categories) {
    await db.collection('categories').doc(cat.id).set({
      id: cat.id,
      name: cat.name,
      sortOrder: cat.sortOrder
    });
  }
  console.log('Categories seeded.');

  console.log('Seeding agents...');
  let totalAgents = 0;
  
  for (const group of fileData) {
    const categoryId = group.category;
    const list = group.agents || [];
    
    console.log(`Category [${categoryId}]: Seeding ${list.length} agents...`);
    
    // Batch writes for efficiency
    const batch = db.batch();
    
    for (const item of list) {
      // Create a deterministic ID from category + name hash
      const safeName = item.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const agentId = `${categoryId}_${safeName}`;
      const docRef = db.collection('agents').doc(agentId);
      
      batch.set(docRef, {
        id: agentId,
        name: item.name,
        url: item.url,
        description: item.desc || '',
        categoryId: categoryId,
        createdBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      totalAgents++;
    }
    await batch.commit();
  }

  console.log(`Seeding of ${totalAgents} agents finished successfully.`);

  // Seed default access code for bootstrap
  const bootstrapCode = 'WELCOME2026';
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 2); // Valid for 2 years

  await db.collection('access_codes').doc(bootstrapCode).set({
    id: bootstrapCode,
    code: bootstrapCode,
    issuedTo: 'Initial Administrator Bootstrapping',
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'system',
    used: false
  });

  console.log(`\n==========================================`);
  console.log(`BOOTSTRAP INVITATION CODE CREATED:`);
  console.log(`👉  ${bootstrapCode}  👈`);
  console.log(`Use this code on the register screen to bootstrap your admin account.`);
  console.log(`==========================================\n`);
}

seed().then(() => {
  console.log('Seeding process complete.');
  process.exit(0);
}).catch(err => {
  console.error('Seeding failed with error:', err);
  process.exit(1);
});
