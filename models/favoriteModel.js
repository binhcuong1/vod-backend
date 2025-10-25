const db = require('../config/db');
const table_name = 'Favorite';

const favorite = {
 
  getAll: (callback) => {
    db.query(
      `SELECT f.Profile_id, p.Profile_name, f.Film_id, fi.Film_name
       FROM ${table_name} f
       JOIN Profile p ON f.Profile_id = p.Profile_id
       JOIN Film fi ON f.Film_id = fi.Film_id
       ORDER BY p.Profile_id DESC`,
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

 
  getByProfile: (profile_id, callback) => {
    db.query(
      `SELECT f.Film_id, fi.Film_name
       FROM ${table_name} f
       JOIN Film fi ON f.Film_id = fi.Film_id
       WHERE f.Profile_id = ?`,
      [profile_id],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  
  addFavorite: (data, callback) => {
    db.query(
      `INSERT INTO ${table_name} (Profile_id, Film_id) VALUES (?, ?)`,
      [data.profile_id, data.film_id],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

 
  removeFavorite: (profile_id, film_id, callback) => {
    db.query(
      `DELETE FROM ${table_name} WHERE Profile_id = ? AND Film_id = ?`,
      [profile_id, film_id],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

};

module.exports = favorite;
