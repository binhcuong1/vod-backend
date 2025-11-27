const db = require("../config/db");
const bcrypt = require("bcrypt");
const profile = require("./profileModel");

const table_name = "Account";

const account = {
  getAll: (callback) => {
    db.query(
      `SELECT Account_id, Email, role, is_premium, premium_expired
       FROM ${table_name}
       WHERE is_deleted = 0
       ORDER BY Account_id DESC`,
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  //  Khi getByID → kiểm tra premium hết hạn → nếu hết thì tự tắt
  getByID: (id, callback) => {
    db.query(
      `SELECT Account_id, Email, role, is_premium, premium_expired
       FROM ${table_name}
       WHERE Account_id = ? AND is_deleted = 0
       LIMIT 1`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        if (result.length === 0) return callback(null, null);

        const acc = result[0];

        //  Nếu premium đã hết hạn → tự động tắt
        if (acc.is_premium && acc.premium_expired && new Date(acc.premium_expired) < new Date()) {
          db.query(
            `UPDATE ${table_name} SET is_premium = 0 WHERE Account_id = ?`,
            [id]
          );
          acc.is_premium = 0;
        }

        callback(null, acc);
      }
    );
  },

  getByEmail: (email, callback) => {
    db.query(
      `SELECT * FROM ${table_name}
       WHERE Email = ? AND is_deleted = 0
       LIMIT 1`,
      [email],
      (err, result) => {
        if (err) return callback(err, null);
        let acc = result[0] || null;

        if (!acc) return callback(null, null);

        //  Check premium hết hạn
        if (acc.is_premium && acc.premium_expired && new Date(acc.premium_expired) < new Date()) {
          db.query(
            `UPDATE ${table_name} SET is_premium = 0 WHERE Account_id = ?`,
            [acc.Account_id]
          );
          acc.is_premium = 0;
        }

        callback(null, acc);
      }
    );
  },

  //  Tạo tài khoản user thường + tạo profile mặc định
  create: async (data, callback) => {
    try {
      const hashed = await bcrypt.hash(data.password, 10);

      const sql = `
        INSERT INTO ${table_name}
          (Email, Password, role, is_premium, premium_expired)
        VALUES (?, ?, ?, ?, ?)
      `;

      const params = [
        data.email,
        hashed,
        data.role || "user",
        data.is_premium ? 1 : 0,
        data.premium_expired || null,
      ];

      db.query(sql, params, (err, result) =>
        err ? callback(err, null) : callback(null, result)
      );
    } catch (err) {
      callback(err, null);
    }
  },

  //  Tạo tài khoản bằng Google
  createGoogle: async (email, name, avatar, callback) => {
    try {
      const hashed = await bcrypt.hash("", 10);

      db.query(
        `INSERT INTO ${table_name}
         (Email, Password, role, is_premium, premium_expired)
         VALUES (?, ?, 'user', 0, NULL)`,
        [email, hashed],
        (err, result) => {
          if (err) return callback(err, null);

          const accountId = result.insertId;

          //  Avatar Google (nếu có)
          const avatarUrl =
            typeof avatar === "string" && avatar.trim().startsWith("http")
              ? avatar.trim()
              : "images/avatar.png";

          profile.create(
            {
              profile_name: name || email.split("@")[0],
              avatar_url: avatarUrl,
              account_id: accountId,
            },
            (pErr) => {
              if (pErr) console.error("❌ Lỗi tạo profile:", pErr);
              callback(null, result);
            }
          );
        }
      );
    } catch (err) {
      callback(err, null);
    }
  },

  //  Update account (có hỗ trợ premium)
  update: async (id, data, callback) => {
    const fields = [];
    const values = [];

    if (data.email !== undefined) {
      fields.push("Email = ?");
      values.push(data.email);
    }
    if (data.password !== undefined) {
      const hashed = await bcrypt.hash(data.password, 10);
      fields.push("Password = ?");
      values.push(hashed);
    }
    if (data.role !== undefined) {
      fields.push("role = ?");
      values.push(data.role);
    }
    if (data.is_premium !== undefined) {
      fields.push("is_premium = ?");
      values.push(data.is_premium);
    }
    if (data.premium_expired !== undefined) {
      fields.push("premium_expired = ?");
      values.push(data.premium_expired);
    }

    if (fields.length === 0)
      return callback({ message: "Không có dữ liệu cập nhật" }, null);

    values.push(id);

    db.query(
      `UPDATE ${table_name}
       SET ${fields.join(", ")}
       WHERE Account_id = ? AND is_deleted = 0`,
      values,
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  delete: (id, callback) => {
    db.query(
      `UPDATE ${table_name}
       SET is_deleted = 1
       WHERE Account_id = ?`,
      [id],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },
};

module.exports = account;
