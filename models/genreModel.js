const db = require('../config/db');
const table_name = 'Genre';

const genre = {
    getByID: (id, callback) => {
        db.query(
            `SELECT * FROM ${table_name} WHERE Genre_id = ? AND is_deleted = 0 LIMIT 1`,
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
            `SELECT * FROM ${table_name} WHERE is_deleted = 0 ORDER BY Genre_id DESC`,
            (err, result) => {
                if (err) return callback(err, null);
                callback(null, result);
            }
        );
    },

    create: (data, callback) => {
        db.query(
            `INSERT INTO ${table_name} (Genre_name) VALUES (?)`,
            [data.genre_name],
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
            `UPDATE ${table_name} SET ${fields} WHERE Genre_id = ?`,
            values,
            (err, result) => {
                if (err) return callback(err, null);
                callback(null, result);
            }
        );
    },

    delete: (id, callback) => {
        db.query(
            `UPDATE ${table_name} SET is_deleted = 1 WHERE Genre_id = ?`,
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
            `SELECT * FROM ${table_name} WHERE Genre_name LIKE ? AND is_deleted = 0`,
            [searchTerm],
            (err, result) => {
                if (err) return callback(err, null);
                callback(null, result);
            }
        );
    },
};

module.exports = genre;
