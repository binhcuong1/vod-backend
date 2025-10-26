const account = require('../models/accountModel');

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
      res.status(201).json({
        success: true,
        message: 'Tạo tài khoản thành công',
        insertedId: result.insertId,
      });
    });
  });
};

exports.updateAccount = (req, res) => {
  account.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy tài khoản!' });
    res.json({ success: true });
  });
};

exports.deleteAccount = (req, res) => {
  account.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy tài khoản!' });
    res.json({ success: true });
  });
};
