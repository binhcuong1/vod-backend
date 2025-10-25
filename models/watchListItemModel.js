const db = require('../config/db');
const table_name = 'WatchList_item';

const watchListItem = {

  getAll: (callback) => {
    db.query(
      `SELECT wli.*, wl.WatchList_name, f.Film_name
       FROM ${table_name} wli
       JOIN WatchList wl ON wli.WatchList_id = wl.WatchList_id
       JOIN Film f ON wli.Film_id = f.Film_id
       ORDER BY wli.Add_at DESC`,
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  
  getByWatchList: (watchListId, callback) => {
    db.query(
      `SELECT wli.Film_id, f.Film_name, f.is_series, wli.Add_at
       FROM ${table_name} wli
       JOIN Film f ON wli.Film_id = f.Film_id
       WHERE wli.WatchList_id = ?`,
      [watchListId],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  
  add: (data, callback) => {
    db.query(
      `INSERT INTO ${table_name} (WatchList_id, Film_id)
       VALUES (?, ?)`,
      [data.watchlist_id, data.film_id],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

 
  remove: (watchlist_id, film_id, callback) => {
    db.query(
      `DELETE FROM ${table_name} WHERE WatchList_id = ? AND Film_id = ?`,
      [watchlist_id, film_id],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  
};

module.exports = watchListItem;
