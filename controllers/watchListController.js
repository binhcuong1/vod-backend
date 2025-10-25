const watchList = require('../models/watchListModel');

exports.getWatchLists = (req, res) => {
  watchList.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

exports.getWatchListByID = (req, res) => {
  const id = req.params.id;
  watchList.getByID(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result) return res.status(404).json({ error: 'Không tìm thấy danh sách' });
    res.json({ success: true, data: result });
  });
};

exports.getWatchListsByProfile = (req, res) => {
  const profileId = req.params.profileId;
  watchList.getByProfile(profileId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

exports.createWatchList = (req, res) => {
  const { profile_id, watchlist_name } = req.body;
  if (!profile_id || !watchlist_name)
    return res.status(400).json({ error: 'profile_id và watchlist_name là bắt buộc' });

  watchList.create({ profile_id, watchlist_name }, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'Đã tạo danh sách xem mới',
    });
  });
};

exports.updateWatchList = (req, res) => {
  const id = req.params.id;
  const data = {};
  if (req.body.watchlist_name !== undefined)
    data.WatchList_name = req.body.watchlist_name;

  if (Object.keys(data).length === 0)
    return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });

  watchList.update(id, data, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy danh sách' });
    res.json({ success: true, message: 'Cập nhật thành công' });
  });
};

exports.deleteWatchList = (req, res) => {
  const id = req.params.id;
  watchList.delete(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy danh sách để xóa' });
    res.json({ success: true, message: 'Đã xóa danh sách' });
  });
};

exports.searchWatchLists = (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword)
    return res.status(400).json({ success: false, error: 'Thiếu từ khóa tìm kiếm' });

  watchList.search(keyword, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, data: result });
  });
};
