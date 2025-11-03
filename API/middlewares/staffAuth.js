const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports.staffAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ status: 401, msg: 'Unauthorized' });

    // Support both 'Bearer <token>' and raw token
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    if (!decoded || decoded.type !== 'Scanner Staff') {
      return res.status(401).json({ status: 401, msg: 'Unauthorized' });
    }

    const [rows] = await db.execute(`SELECT id, username, name, isActive FROM staff_users WHERE token = ?`, [token]);
    if (!rows || rows.length === 0 || rows[0].isActive !== 1) {
      return res.status(401).json({ status: 401, msg: 'Unauthorized' });
    }

    req.staff = rows[0];
    next();
  } catch (e) {
    console.log(e);
    return res.status(401).json({ status: 401, msg: 'Unauthorized' });
  }
};
