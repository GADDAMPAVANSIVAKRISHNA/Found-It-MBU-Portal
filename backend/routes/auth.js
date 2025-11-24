const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const { sendVerificationEmail, sendPasswordResetEmail, sendVerificationOtpEmail } = require('../utils/email');
const auth = require('../middleware/auth');
const https = require('https');
const jwksClient = require('jwks-rsa');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, branch, year, contactNumber } = req.body;
    if (!email.endsWith('@mbu.asia')) {
      return res.status(400).json({ error: 'Must use @mbu.asia email' });
    }

    let existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User exists' });

    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    const user = new User({
      name, email, password, branch, year, contactNumber,
      verificationOtp: otp,
      verificationOtpExpires: otpExpires,
      isVerified: false
    });

    await user.save();
    await sendVerificationOtpEmail(email, otp);

    res.status(201).json({ message: 'OTP sent to email. Verify to activate account.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid token' });

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified! You can login now.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.verificationOtp || !user.verificationOtpExpires) return res.status(400).json({ error: 'No OTP pending' });
    if (Date.now() > user.verificationOtpExpires) return res.status(400).json({ error: 'OTP expired' });
    if (user.verificationOtp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified! You can login now.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (!user.isVerified) return res.status(400).json({ error: 'Verify email first' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
        contactNumber: user.contactNumber
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: 'No account found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    await sendPasswordResetEmail(req.body.email, resetToken);
    res.json({ message: 'Reset link sent to email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid/expired token' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', auth, (req, res) => res.json(req.user));

// Microsoft SSO login/register
router.post('/microsoft', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

    const tenantId = process.env.MS_TENANT_ID;
    const clientId = process.env.MS_CLIENT_ID;
    if (!tenantId || !clientId) return res.status(500).json({ error: 'SSO not configured' });

    const openIdConfigUrl = `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`;
    const fetchJson = (url) => new Promise((resolve, reject) => {
      https.get(url, (resp) => {
        let data = '';
        resp.on('data', (chunk) => data += chunk);
        resp.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const oidc = await fetchJson(openIdConfigUrl);
    const client = jwksClient({ jwksUri: oidc.jwks_uri });
    const getKey = (header, callback) => {
      client.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
      });
    };

    const verified = await new Promise((resolve, reject) => {
      jwt.verify(idToken, getKey, { algorithms: ['RS256'], audience: clientId }, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      });
    });

    const email = verified.preferred_username || verified.email || verified.upn;
    if (!email || !email.endsWith('@mbu.asia')) {
      return res.status(403).json({ error: 'Must use @mbu.asia account' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name: verified.name || email.split('@')[0],
        email,
        password: crypto.randomBytes(32).toString('hex'),
        branch: 'NA',
        year: 'NA',
        contactNumber: '',
        isVerified: true
      });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
        contactNumber: user.contactNumber
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Microsoft SSO failed' });
  }
});

module.exports = router;
