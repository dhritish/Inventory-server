import admin from 'firebase-admin';
import fs from 'fs';

const initializeFirebase = () => {
  if (admin.apps.length > 0) {
    return admin;
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(fileContent);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin;
};

export const getFirebaseAdmin = () => initializeFirebase();
