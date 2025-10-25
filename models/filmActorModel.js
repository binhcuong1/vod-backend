const db = require('../config/db');
const table_name = 'Film_actor';

const filmActor = {
  
  getAll: (callback) => {
    db.query(
      `SELECT fa.Film_id, f.Film_name,
              fa.Actor_id, a.Actor_name, a.Actor_gender,
              fa.Character_name
       FROM ${table_name} fa
       JOIN Film f ON fa.Film_id = f.Film_id
       JOIN Actor a ON fa.Actor_id = a.Actor_id
       ORDER BY fa.Film_id DESC, fa.Actor_id DESC`,
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  
  getByFilm: (filmId, callback) => {
    db.query(
      `SELECT fa.Actor_id, a.Actor_name, a.Actor_gender, fa.Character_name
       FROM ${table_name} fa
       JOIN Actor a ON fa.Actor_id = a.Actor_id
       WHERE fa.Film_id = ?
       ORDER BY a.Actor_name`,
      [filmId],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },


  getByActor: (actorId, callback) => {
    db.query(
      `SELECT fa.Film_id, f.Film_name, fa.Character_name
       FROM ${table_name} fa
       JOIN Film f ON fa.Film_id = f.Film_id
       WHERE fa.Actor_id = ?
       ORDER BY f.Film_name`,
      [actorId],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  
  create: (data, callback) => {
    db.query(
      `INSERT INTO ${table_name} (Film_id, Actor_id, Character_name)
       VALUES (?, ?, ?)`,
      [data.film_id, data.actor_id, data.character_name || null],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  // 🔹 Upsert tên vai (nếu cặp Film-Actor đã tồn tại thì chỉ cập nhật Character_name)
  upsert: (data, callback) => {
    db.query(
      `INSERT INTO ${table_name} (Film_id, Actor_id, Character_name)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE Character_name = VALUES(Character_name)`,
      [data.film_id, data.actor_id, data.character_name || null],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  
  update: (filmId, actorId, data, callback) => {
    db.query(
      `UPDATE ${table_name} SET Character_name = ?
       WHERE Film_id = ? AND Actor_id = ?`,
      [data.character_name || null, filmId, actorId],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  
  delete: (filmId, actorId, callback) => {
    db.query(
      `DELETE FROM ${table_name} WHERE Film_id = ? AND Actor_id = ?`,
      [filmId, actorId],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  
};

module.exports = filmActor;
