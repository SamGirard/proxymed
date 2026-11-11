const admin = require('firebase-admin');
const path  = require('path');

let enabled = false;

try {
  const key = require(path.join(__dirname, '../serviceAccountKey.json'));
  admin.initializeApp({ credential: admin.credential.cert(key) });
  enabled = true;
  console.log('FCM activé i guess');
} catch (e) {
  console.warn('FCM désactivé :', e.message);
}

async function notifyNurse(nurseId, title, body, data = {}) {
  if (!enabled || !nurseId) return;

  try {
    const messageId = await admin.messaging().send({
      topic: `nurse_${nurseId}`,
      data: { title, body, ...data },
      android: { priority: 'high' }
    });
    console.log(`📨 Push envoyé à nurse_${nurseId} (${messageId})`);
  } catch (err) {
    console.error('Échec de envoi FCM:', err.message);
  }
}

module.exports = { notifyNurse };