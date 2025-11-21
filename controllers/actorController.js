const actor = require('../models/actorModel');

exports.getActors = (req, res) => {
  actor.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

exports.getActorByID = (req, res) => {
  const id = req.params.id;
  actor.getByID(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result) return res.status(404).json({ error: 'Không tìm thấy diễn viên!' });
    res.json({ success: true, data: result });
  });
};

exports.createActor = (req, res) => {
  const { actor_name, actor_gender, actor_avatar } = req.body;

  if (!actor_name)
    return res.status(400).json({ error: 'actor_name là bắt buộc' });

  const data = {
    actor_name,
    actor_gender: actor_gender || null,
    actor_avatar: actor_avatar || null,
  };

  actor.create(data, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ success: true, id: result.insertId });
  });
};

exports.updateActor = (req, res) => {
  const id = req.params.id;
  const data = {};

  if (req.body.actor_name !== undefined) data.Actor_name = req.body.actor_name;
  if (req.body.actor_gender !== undefined) data.Actor_gender = req.body.actor_gender;
  if (req.body.actor_avatar !== undefined) data.Actor_avatar = req.body.actor_avatar;

  if (Object.keys(data).length === 0)
    return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });

  actor.update(id, data, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy diễn viên!' });
    res.json({ success: true });
  });
};

exports.deleteActor = (req, res) => {
  const id = req.params.id;
  actor.delete(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy diễn viên!' });
    res.json({ success: true });
  });
};

exports.searchActors = (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword)
    return res.status(400).json({ success: false, error: 'Thiếu từ khóa tìm kiếm' });

  actor.search(keyword, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, data: result });
  });
};

exports.getFilmsByActor = (req, res) => {
  const actorId = req.params.actorId;

  actor.getFilmsByActor(actorId, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });

    res.json({
      success: true,
      data: result
    });
  });
};