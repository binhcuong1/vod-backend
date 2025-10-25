const filmGenre = require('../models/filmGenreModel');

exports.getFilmGenres = (req, res) => {
  filmGenre.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

// lấy thể loại của 1 film
exports.getGenresByFilm = (req, res) => {
  const filmId = req.params.filmId;
  filmGenre.getGenresByFilm(filmId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

// lấy các film theo thể loại
exports.getFilmsByGenre = (req, res) => {
  const genreId = req.params.genreId;
  filmGenre.getFilmsByGenre(genreId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

exports.createFilmGenre = (req, res) => {
  const { film_id, genre_id } = req.body;

  if (!film_id || !genre_id)
    return res.status(400).json({ error: 'film_id và genre_id là bắt buộc' });

  filmGenre.create({ film_id, genre_id }, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ success: true, message: 'Đã gán thể loại cho phim' });
  });
};

exports.deleteFilmGenre = (req, res) => {
  const { filmId, genreId } = req.params;

  filmGenre.delete(filmId, genreId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy mối quan hệ này' });
    res.json({ success: true });
  });
};
