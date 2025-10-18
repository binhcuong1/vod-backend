const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: '+07:00'
});

connection.connect(err => {
  if (err) {
    console.error("Lỗi kết nối database!", err.message);
    process.exit(1);
  }
  console.log('Đã kết nối tới MySQL');
});

module.exports = connection;