const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.requireLogin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Thiếu token xác thực' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Token không hợp lệ hoặc hết hạn' });
  }
};

exports.requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Chưa đăng nhập' });
  if (req.user.role !== role) return res.status(403).json({ error: 'Không đủ quyền truy cập' });
  next();
};

exports.requireAdmin = (req, res, next) => {
  try {
    const user = req.user; 

    if (!user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    if (user.role !== "admin")
      return res.status(403).json({ success: false, message: "Forbidden: Admin only" });

    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: "Middleware error" });
  }
};
