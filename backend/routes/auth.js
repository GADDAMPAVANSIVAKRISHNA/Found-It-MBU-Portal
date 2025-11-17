const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const auth = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, sapId, branch, year, contactNumber } = req.body;
    
    if (!email.endsWith('@mbu.asia')) {
      return res.status(400).json({ error: 'Must use @mbu.asia email' });
    }

    let user = await User.findOne({ $or: [{ email }, { sapId }] });
    if (user) return res.status(400).json({ error: 'User exists' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    user = new User({
      name, email, password, sapId, branch, year, contactNumber,
      verificationToken,
      verificationTokenExpires: Date.now() + 86400000
    });

    await user.save();
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: 'Check email to verify account' });
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
        sapId: user.sapId,
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

module.exports = router;
