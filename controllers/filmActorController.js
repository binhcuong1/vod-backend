const filmActor = require('../models/filmActorModel');

// 🔹 Lấy tất cả
exports.getFilmActors = (req, res) => {
  filmActor.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};


exports.getByFilm = (req, res) => {
  filmActor.getByFilm(req.params.filmId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};


exports.getByActor = (req, res) => {
  filmActor.getByActor(req.params.actorId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};


exports.createFilmActor = (req, res) => {
  const { film_id, actor_id, character_name } = req.body;
  if (!film_id || !actor_id)
    return res.status(400).json({ error: 'film_id và actor_id là bắt buộc' });

  filmActor.create({ film_id, actor_id, character_name }, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Cặp Film-Actor đã tồn tại' });
      return res.status(500).json({ error: err });
    }
    res.status(201).json({ success: true, message: 'Đã thêm diễn viên cho phim' });
  });
};


exports.upsertFilmActor = (req, res) => {
  const { film_id, actor_id, character_name } = req.body;
  if (!film_id || !actor_id)
    return res.status(400).json({ error: 'film_id và actor_id là bắt buộc' });

  filmActor.upsert({ film_id, actor_id, character_name }, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ success: true, message: 'Đã lưu thông tin vai diễn' });
  });
};


exports.updateFilmActor = (req, res) => {
  const { film_id, actor_id } = req.params;
  const { character_name } = req.body;

  if (character_name === undefined)
    return res.status(400).json({ error: 'character_name là bắt buộc' });

  filmActor.update(film_id, actor_id, { character_name }, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy cặp Film-Actor' });
    res.json({ success: true, message: 'Đã cập nhật vai diễn' });
  });
};


exports.deleteFilmActor = (req, res) => {
  const { film_id, actor_id } = req.params;
  filmActor.delete(film_id, actor_id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy cặp Film-Actor để xóa' });
    res.json({ success: true, message: 'Đã xóa diễn viên khỏi phim' });
  });
};

