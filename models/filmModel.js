const db = require('../config/db');
const table_name = 'Film';

const film = {
    getByID: (id, callback) => {
        db.query(
            `SELECT * FROM ${table_name} WHERE Film_id = ? AND is_deleted = 0 LIMIT 1`,
            [id],
            (err, result) => {
                if (err) return callback(err, null);
                if (result.length === 0) return callback(null, null);
                callback(null, result[0]);
            }
        );
    },

    getAll: (callback) => {
        db.query(
            `SELECT * FROM ${table_name} WHERE is_deleted = 0 ORDER BY Film_id DESC`,
            (err, result) => {
                if (err) return callback(err, null);
                callback(null, result);
            }
        );
    },

    create: (data, callback) => {
        db.query(
            `INSERT INTO ${table_name} (Film_name, is_series) VALUES (?, ?)`,
            [data.film_name, !!data.is_series],
            (err, result) => {
                if (err) return callback(err, null);
                callback(null, result);
            }
        );
    },

    update: (id, data, callback) => {
        const fields = Object.keys(data)
            .map((key) => `${key} = ?`)
            .join(', ');
        const values = Object.values(data);
        values.push(id);

        db.query(
            `UPDATE ${table_name} SET ${fields} WHERE Film_id = ?`,
            values,
            (err, result) => {
                if (err) return callback(err, null);
                callback(null, result);
            }
        );
    },

    delete: (id, callback) => {
        db.query(
            `UPDATE ${table_name} SET is_deleted = 1 WHERE Film_id = ?`,
            [id],
            (err, result) => {
                if (err) return callback(err, null);
                callback(null, result);
            }
        );
    },

    search: (keyword, callback) => {
        const searchTerm = `%${keyword}%`;
        db.query(
            `SELECT * FROM ${table_name} WHERE Film_name LIKE ? AND is_deleted = 0`,
            [searchTerm],
            (err, result) => {
                if (err) return callback(err, null);
                callback(null, result);
            }
        );
    },
};

module.exports = film;
