module.exports = (req, res, next) => {
  try {
    const roleHeader = req.header('x-user-role');
    const role = req.user?.role || roleHeader || 'student';
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Admin access required' });
  }
};