const account = require('../models/accountModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.register = (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });

  account.create({ email, password, role }, (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email đã tồn tại' });
      return res.status(500).json({ error: err });
    }
    res.status(201).json({ success: true, message: 'Đăng ký thành công' });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' });

  account.getByEmail(email, async (err, user) => {
    if (err) return res.status(500).json({ error: err });
    if (!user) return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

    const match = await bcrypt.compare(password, user.Password);
    if (!match) return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

    const token = jwt.sign(
      { id: user.Account_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: { id: user.Account_id, email: user.Email, role: user.role },
    });
  });
};

exports.me = (req, res) => {
  res.json({ success: true, user: req.user });
};
