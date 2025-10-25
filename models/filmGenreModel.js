const db = require('../config/db');
const table_name = 'Film_genre';

const filmGenre = {

  getAll: (callback) => {
    db.query(
      `SELECT fg.*, f.Film_name, g.Genre_name
       FROM ${table_name} fg
       JOIN Film f ON fg.Film_id = f.Film_id
       JOIN Genre g ON fg.Genre_id = g.Genre_id
       ORDER BY f.Film_name`,
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },


  getGenresByFilm: (filmId, callback) => {
    db.query(
      `SELECT g.* 
       FROM ${table_name} fg
       JOIN Genre g ON fg.Genre_id = g.Genre_id
       WHERE fg.Film_id = ?`,
      [filmId],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  
  getFilmsByGenre: (genreId, callback) => {
    db.query(
      `SELECT f.* 
       FROM ${table_name} fg
       JOIN Film f ON fg.Film_id = f.Film_id
       WHERE fg.Genre_id = ?`,
      [genreId],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  
  create: (data, callback) => {
    db.query(
      `INSERT INTO ${table_name} (Film_id, Genre_id) VALUES (?, ?)`,
      [data.film_id, data.genre_id],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

 
  delete: (filmId, genreId, callback) => {
    db.query(
      `DELETE FROM ${table_name} WHERE Film_id = ? AND Genre_id = ?`,
      [filmId, genreId],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },
};

module.exports = filmGenre;
