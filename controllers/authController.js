const account = require('../models/accountModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();


//  Đăng ký thường

exports.register = (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });

  account.create({ email, password, role }, (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Email đã tồn tại' });
      return res.status(500).json({ error: err });
    }
    res.status(201).json({ success: true, message: 'Đăng ký thành công' });
  });
};


//  Đăng nhập thuờng
exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' });

  account.getByEmail(email, async (err, user) => {
    if (err) return res.status(500).json({ error: err });
    if (!user)
      return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

    const match = await bcrypt.compare(password, user.Password);
    if (!match)
      return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });

    const token = jwt.sign(
      { id: user.Account_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.Account_id,
        email: user.Email,
        role: user.role,
      },
    });
  });
};


//  Đăng nhập bằng Google

exports.googleLogin = (req, res) => {
  const { email, name, avatar } = req.body;
  if (!email) return res.status(400).json({ error: 'Thiếu email Google' });

  account.getByEmail(email, async (err, user) => {
    if (err)
      return res.status(500).json({ error: 'Lỗi máy chủ', detail: err });

    //  Nếu đã có tài khoản → cấp token 
    if (user) {
      const token = jwt.sign(
        { id: user.Account_id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        message: 'Đăng nhập Google thành công',
        token,
        user: {
          id: user.Account_id,
          email,
          name,
          avatar,
          role: user.role,
        },
      });
    }

    //  Nếu chưa có → tạo tài khoản 
    account.createGoogle(email, (err2, result) => {
      if (err2) {
        if (err2.code === 'ER_DUP_ENTRY')
          return res.status(400).json({ error: 'Email đã tồn tại' });
        return res.status(500).json({ error: 'Không thể tạo tài khoản Google' });
      }

      const token = jwt.sign(
        { id: result.insertId, role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        success: true,
        message: 'Đăng nhập Google thành công (tài khoản mới)',
        token,
        user: {
          id: result.insertId,
          email,
          name,
          avatar,
          role: 'user',
        },
      });
    });
  });
};


//  Lấy thông tin người dùng
exports.me = (req, res) => {
  res.json({ success: true, user: req.user });
};
