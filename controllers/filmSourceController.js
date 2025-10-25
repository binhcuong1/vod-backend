const filmSource = require('../models/filmSourceModel');


exports.getFilmSources = (req, res) => {
  filmSource.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

// 🔹 Lấy theo Film hoặc Episode
exports.getSourceByParent = (req, res) => {
  const filmId = req.query.film_id || null;
  const episodeId = req.query.episode_id || null;

  if (!filmId && !episodeId)
    return res.status(400).json({ error: 'Cần truyền film_id hoặc episode_id' });

  filmSource.getByParent(filmId, episodeId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

exports.createFilmSource = (req, res) => {
  const { film_id, episode_id, resolution_id, source_url } = req.body;
  if (!source_url || !resolution_id)
    return res.status(400).json({ error: 'source_url và resolution_id là bắt buộc' });

  filmSource.create({ film_id, episode_id, resolution_id, source_url }, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ success: true, message: 'Đã thêm nguồn video thành công' });
  });
};

exports.deleteFilmSource = (req, res) => {
  const { film_id, episode_id, resolution_id } = req.query;
  if (!resolution_id)
    return res.status(400).json({ error: 'resolution_id là bắt buộc để xác định nguồn' });

  filmSource.delete(film_id, episode_id, resolution_id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, message: 'Đã xóa nguồn video' });
  });
};
