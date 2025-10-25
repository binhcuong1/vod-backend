const db = require('../config/db');
const table_name = 'Country';

const country = {
   getAll: (callback) => {
        db.query(`SELECT * FROM ${table_name}`, (err, result) => {
            if (err) return callback(err, null);
            callback(null, result);
        });
    },

    getByID: (id, callback) => {
        db.query(`SELECT * FROM ${table_name} WHERE Country_id = ? `, [id], (err, result) => {
            if (err) return callback(err, null);
            callback(null, result[0]);
        });
    },

    create: (data, callback) => {
        db.query(`INSERT INTO ${table_name} (Country_name) VALUES (?)`, [data.country_name], (err, result) => {
            if (err) return callback(err, null);
            callback(null, result);
        });
    },

    update: (id, data, callback) => {
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), id];
        db.query(`UPDATE ${table_name} SET ${fields} WHERE Country_id = ?`, values, (err, result) => {
            if (err) return callback(err, null);
            callback(null, result);
        });
    },

    delete: (id, callback) => {
        db.query(`DELETE FROM ${table_name} WHERE Country_id = ?`, [id], (err, result) => {
            if (err) return callback(err, null);
            callback(null, result);
        });
    },
    search: (keyword, callback) => {
        const searchTerm = `%${keyword}%`;
        db.query(
            `SELECT * FROM ${table_name} WHERE Country_name LIKE ?`,
            [searchTerm],
            (err, result) => {
                if (err) return callback(err, null);
                callback(null, result);
            }
        );
    },
};

module.exports = country;
