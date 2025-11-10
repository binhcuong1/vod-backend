const season = require('../models/seasonModel');

exports.getSeasons = (req, res) => {
  season.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

// 🔹 Lấy Season theo ID 
exports.getSeasonByID = (req, res) => {
  const id = req.params.id;
  season.getByID(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result) return res.status(404).json({ error: 'Không tìm thấy season!' });
    res.json({ success: true, data: result });
  });
};

//Lấy Season theo Film 
exports.getSeasonsByFilm = (req, res) => {
  const filmId = req.params.filmId;
  season.getByFilm(filmId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};


exports.createSeason = (req, res) => {
  // ưu tiên filmId từ params; fallback sang body.film_id
  const film_id = req.params.filmId ?? req.body.film_id;
  const season_name = (req.body.name ?? req.body.season_name ?? '').trim();
  if (!season_name || !film_id)
    return res.status(400).json({ error: 'Thiếu filmId hoặc tên mùa' });

  const data = { season_name, film_id };
  season.create(data, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ success: true, id: result.insertId });
  });
};

exports.updateSeason = (req, res) => {
  const id = Number(req.params.id);
  const { season_name, film_id } = req.body || {};

  const patch = {};
  if (typeof season_name !== 'undefined') patch.Season_name = season_name;
  if (typeof film_id !== 'undefined') patch.Film_id = Number(film_id);

  season.update(id, patch, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, affected: result.affectedRows || 0 });
  });
};


exports.deleteSeason = (req, res) => {
  const id = req.params.id;
  season.delete(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy season!' });
    res.json({ success: true });
  });
};
