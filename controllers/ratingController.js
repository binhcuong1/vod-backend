const rating = require('../models/ratingModel');


exports.getRatings = (req, res) => {
  rating.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};


exports.getRatingsByFilm = (req, res) => {
  const filmId = req.params.filmId;
  rating.getByFilm(filmId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};


exports.getRatingsByProfile = (req, res) => {
  const profileId = req.params.profileId;
  rating.getByProfile(profileId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};


exports.upsertRating = (req, res) => {
  const { profile_id, film_id, episode_id, score, review } = req.body;

  if (!profile_id || !film_id || !score)
    return res.status(400).json({ error: 'profile_id, film_id và score là bắt buộc' });

  if (score < 1 || score > 5)
    return res.status(400).json({ error: 'Score phải nằm trong khoảng 1-5' });

  rating.upsert({ profile_id, film_id, episode_id, score, review }, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ success: true, message: 'Đã lưu đánh giá thành công' });
  });
};


exports.deleteRating = (req, res) => {
  const { profile_id, film_id } = req.params;
  rating.delete(profile_id, film_id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy đánh giá để xóa' });
    res.json({ success: true, message: 'Đã xóa đánh giá' });
  });
};


exports.getAverageScore = (req, res) => {
  const filmId = req.params.filmId;
  rating.getAverageScore(filmId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result || { avg_score: 0, total_reviews: 0 } });
  });
};
