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
  const { season_name, film_id } = req.body;

  if (!season_name || !film_id)
    return res.status(400).json({ error: 'season_name và film_id là bắt buộc' });

  const data = { season_name, film_id };

  season.create(data, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ success: true, id: result.insertId });
  });
};

exports.updateSeason = (req, res) => {
  const id = req.params.id;
  const data = {};

  if (req.body.season_name !== undefined) data.Season_name = req.body.season_name;
  if (req.body.film_id !== undefined) data.Film_id = req.body.film_id;

  if (Object.keys(data).length === 0)
    return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });

  season.update(id, data, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy season!' });
    res.json({ success: true });
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
