const admin = require('firebase-admin');

function ensureInit() {
  if (admin.apps.length > 0) return;
  try {
    const raw = process.env.FIREBASE_ADMIN_JSON;
    if (raw) {
      const svc = JSON.parse(raw);
      admin.initializeApp({ credential: admin.credential.cert(svc) });
      return;
    }
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');
    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
      return;
    }
    admin.initializeApp();
  } catch (e) {
    // Will fail later in verify if not properly initialized
  }
}

module.exports = async (req, res, next) => {
  ensureInit();
  try {
    const auth = admin.auth();
    const header = req.header('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = await auth.verifyIdToken(token);
    if (!decoded.email_verified) {
      return res.status(401).json({ error: 'Verify email first' });
    }
    req.user = {
      id: decoded.uid,
      email: decoded.email,
      name: req.header('x-user-name') || decoded.name || '',
      role: req.header('x-user-role') || 'student'
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid Firebase token' });
  }
};
