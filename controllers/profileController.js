const profile = require('../models/profileModel');


exports.getProfiles = (req, res) => {
  profile.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};


exports.getProfileByID = (req, res) => {
  const id = req.params.id;
  profile.getByID(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result) return res.status(404).json({ error: 'Không tìm thấy profile!' });
    res.json({ success: true, data: result });
  });
};


exports.getProfileByAccount = (req, res) => {
  const accountId = req.params.accountId;
  profile.getByAccount(accountId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result) return res.status(404).json({ error: 'Tài khoản này chưa có profile!' });
    res.json({ success: true, data: result });
  });
};


exports.createProfile = (req, res) => {
  const { profile_name, avatar_url, account_id } = req.body;
  if (!profile_name || !account_id)
    return res.status(400).json({ error: 'profile_name và account_id là bắt buộc' });

  profile.create({ profile_name, avatar_url, account_id }, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ success: true, id: result.insertId, message: 'Đã thêm profile' });
  });
};


exports.updateProfile = (req, res) => {
  const id = req.params.id;
  const data = {};
  if (req.body.profile_name !== undefined) data.Profile_name = req.body.profile_name;
  if (req.body.avatar_url !== undefined) data.Avatar_url = req.body.avatar_url;
  if (req.body.account_id !== undefined) data.Account_id = req.body.account_id;

  if (Object.keys(data).length === 0)
    return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });

  profile.update(id, data, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy profile!' });
    res.json({ success: true });
  });
};


exports.deleteProfile = (req, res) => {
  const id = req.params.id;
  profile.delete(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy profile!' });
    res.json({ success: true });
  });
};


exports.searchProfiles = (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword)
    return res.status(400).json({ success: false, error: 'Thiếu từ khóa tìm kiếm' });

  profile.search(keyword, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, data: result });
  });
};
