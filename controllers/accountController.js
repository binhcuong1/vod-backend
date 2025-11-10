const account = require('../models/accountModel');
const profile = require('../models/profileModel'); 

exports.getAccounts = (req, res) => {
  account.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

exports.getAccountByID = (req, res) => {
  account.getByID(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result) return res.status(404).json({ error: 'Không tìm thấy tài khoản!' });
    res.json({ success: true, data: result });
  });
};

exports.createAccount = (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, error: 'Thiếu email hoặc mật khẩu' });

  account.getByEmail(email, (err, existing) => {
    if (err) return res.status(500).json({ success: false, error: err });
    if (existing)
      return res.status(400).json({ success: false, error: 'Email đã tồn tại' });

    account.create({ email, password, role }, (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });

      const accountId = result.insertId;
      const profileName = email.split('@')[0];
      const avatarUrl = "images/avatar.png";

      //  Sau khi tạo account -> tạo profile mặc định
      profile.create(
        { profile_name: profileName, avatar_url: avatarUrl, account_id: accountId },
        (pErr) => {
          if (pErr) {
            return res.status(500).json({
              success: false,
              message: 'Tạo tài khoản thành công nhưng lỗi khi tạo profile',
            });
          }

          res.status(201).json({
            success: true,
            message: 'Tạo tài khoản và profile thành công',
            insertedId: accountId,
          });
        }
      );
    });
  });
};

exports.updateAccount = (req, res) => {
  account.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy tài khoản!' });
    res.json({ success: true });
  });
};

exports.deleteAccount = (req, res) => {
  account.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy tài khoản!' });
    res.json({ success: true });
  });
};
