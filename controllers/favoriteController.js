const favorite = require('../models/favoriteModel');


exports.getFavorites = (req, res) => {
  favorite.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

exports.getFavoritesByProfile = (req, res) => {
  const profileId = req.params.profileId;
  favorite.getByProfile(profileId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};


exports.addFavorite = (req, res) => {
  const { profile_id, film_id } = req.body;
  if (!profile_id || !film_id)
    return res.status(400).json({ error: 'profile_id và film_id là bắt buộc' });

  favorite.addFavorite({ profile_id, film_id }, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Phim này đã có trong danh sách yêu thích' });
      return res.status(500).json({ error: err });
    }
    res.status(201).json({ success: true, message: 'Đã thêm vào danh sách yêu thích' });
  });
};


exports.removeFavorite = (req, res) => {
  const { profile_id, film_id } = req.params;
  favorite.removeFavorite(profile_id, film_id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy dữ liệu để xóa' });
    res.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích' });
  });
};


