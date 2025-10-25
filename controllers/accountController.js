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
