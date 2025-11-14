const account = require('../models/accountModel');
const profile = require('../models/profileModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('../config/db');


//  Đăng ký thường
exports.register = (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });

  // Kiểm tra trùng email
  account.getByEmail(email, (err, existing) => {
    if (err) return res.status(500).json({ error: err });
    if (existing)
      return res.status(400).json({ error: 'Email đã tồn tại' });

    // Tạo tài khoản mới
    account.create({ email, password, role: role || 'user' }, (err2, result) => {
      if (err2) return res.status(500).json({ error: err2 });

      const accountId = result.insertId;
      const profileName = email.split('@')[0];

      // Tạo profile mặc định
      profile.create(
        {
          profile_name: profileName,
          avatar_url: 'images/avatar.png',
          account_id: accountId,
        },
        (pErr) => {
          if (pErr) console.error('⚠️ Lỗi khi tạo profile:', pErr);
        }
      );

      //  Cấp token
      const token = jwt.sign(
        { id: accountId, role: role || 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        token,
        user: {
          id: accountId,
          email,
          role: role || 'user',
        },
      });
    });
  });
};


//  Đăng nhập thường
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

  account.getByEmail(email, (err, user) => {
    if (err) return res.status(500).json({ error: err });

    // ===== Nếu đã tồn tại tài khoản trong DB =====
    if (user) {
      const accountId = user.Account_id;

      // Query profile mới NHẤT
      profile.getByAccount(accountId, (pErr, p) => {
        if (pErr) return res.status(500).json({ error: pErr });

        // Nếu chưa có profile → tạo mới
        if (!p) {
          return profile.create({
            profile_name: name || email.split('@')[0],
            avatar_url: avatar?.startsWith("http") ? avatar : "images/avatar.png",
            account_id: accountId
          }, (cErr) => {
            if (cErr) return res.status(500).json({ error: cErr });

            // → Truy vấn lại profile mới
            profile.getByAccount(accountId, (err3, newP) => {
              const token = jwt.sign(
                { id: accountId, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
              );

              return res.json({
                success: true,
                token,
                user: {
                  id: accountId,
                  email,
                  role: user.role,
                  name: newP.Profile_name,
                  avatar: newP.Avatar_url,
                  profile_id: newP.Profile_id
                }
              });
            });
          });
        }

        // Nếu đã có profile → cập nhật avatar nếu cần
        if (p.Avatar_url === "images/avatar.png" && avatar?.startsWith("http")) {
          profile.update(p.Profile_id, { Avatar_url: avatar }, () => {});
        }

        // → Query lại profile để đảm bảo LẤY MỚI NHẤT
        profile.getByAccount(accountId, (pErr2, fresh) => {
          const token = jwt.sign(
            { id: accountId, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
          );

          res.json({
            success: true,
            token,
            user: {
              id: accountId,
              email,
              role: user.role,
              name: fresh.Profile_name,
              avatar: fresh.Avatar_url,
              profile_id: fresh.Profile_id
            }
          });
        });

      });

      return;
    }

    // ===== Nếu chưa có tài khoản → tạo mới =====
    account.createGoogle(email, name, avatar, (err2, result) => {
      if (err2) return res.status(500).json({ error: err2 });

      const accountId = result.insertId;

      // Query lại profile vừa tạo trong model
      profile.getByAccount(accountId, (pErr3, fresh) => {
        const token = jwt.sign(
          { id: accountId, role: 'user' },
          process.env.JWT_SECRET,
          { expiresIn: '30d' }
        );

        res.json({
          success: true,
          token,
          user: {
            id: accountId,
            email,
            role: 'user',
            name: fresh.Profile_name,
            avatar: fresh.Avatar_url,
            profile_id: fresh.Profile_id
          }
        });
      });
    });
  });
};



//  Lấy thông tin người dùng 
exports.me = (req, res) => {
  const user = req.user; 

  db.query(
    `SELECT 
        a.Account_id AS id,
        a.Email AS email,
        a.role AS role,
        p.Profile_id AS profile_id,
        p.Profile_name AS name,
        p.Avatar_url AS avatar
     FROM Account a
     LEFT JOIN Profile p ON a.Account_id = p.Account_id
     WHERE a.Account_id = ?`,
    [user.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      if (result.length === 0)
        return res.status(404).json({ error: 'Không tìm thấy người dùng' });

      res.json({ success: true, user: result[0] });
    }
  );
};

