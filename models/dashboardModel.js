const db = require("../config/db");
const util = require("util");

const query = util.promisify(db.query).bind(db);

const dashboardModel = {
    // KPI: tổng quan cho dashboard
    getStats: async (callback) => {
        try {
            // Tổng số phim (chỉ phim chưa xóa)
            const filmRows = await query(
                "SELECT COUNT(*) AS total_films FROM Film WHERE is_deleted = 0"
            );

            // Tổng số account + premium đang active
            const accountRows = await query(`
        SELECT 
          COUNT(*) AS total_accounts,
          SUM(
            CASE 
              WHEN is_premium = 1 
                   AND (premium_expired IS NULL OR premium_expired > NOW())
              THEN 1 ELSE 0 
            END
          ) AS premium_active
        FROM Account
        WHERE is_deleted = 0
      `);

            // Tổng số profile (chỉ profile chưa xóa)
            const profileRows = await query(
                "SELECT COUNT(*) AS total_profiles FROM Profile WHERE is_deleted = 0"
            );

            // Doanh thu premium tháng hiện tại
            const revenueRows = await query(`
        SELECT IFNULL(SUM(Amount), 0) AS revenue_this_month
        FROM PremiumPayment
        WHERE YEAR(Paid_at) = YEAR(NOW())
          AND MONTH(Paid_at) = MONTH(NOW())
      `);

            // Số comment 7 ngày gần đây
            const commentRows = await query(`
        SELECT COUNT(*) AS comments_7_days
        FROM Comment
        WHERE Created_at >= NOW() - INTERVAL 7 DAY
      `);

            // Số lịch sử xem 7 ngày gần đây (chỉ history chưa xóa)
            const historyRows = await query(`
        SELECT COUNT(*) AS views_7_days
        FROM History
        WHERE is_deleted = 0
          AND last_watched >= NOW() - INTERVAL 7 DAY
      `);

            const data = {
                total_films: filmRows[0]?.total_films || 0,
                total_accounts: accountRows[0]?.total_accounts || 0,
                total_profiles: profileRows[0]?.total_profiles || 0,
                premium_active: accountRows[0]?.premium_active || 0,
                revenue_this_month: Number(revenueRows[0]?.revenue_this_month || 0),
                comments_7_days: commentRows[0]?.comments_7_days || 0,
                views_7_days: historyRows[0]?.views_7_days || 0,
            };

            callback(null, data);
        } catch (err) {
            callback(err);
        }
    },

    // Top phim hot (theo favorite hoặc theo lượt xem)
    getTopFilms: async (type = "favorite", limit = 5, callback) => {
        try {
            limit = Number(limit) || 5;
            let rows;

            if (type === "views") {
                // Top theo lượt xem (History)
                rows = await query(
                    `
          SELECT 
            f.Film_id,
            f.Film_name,
            COUNT(*) AS view_count
          FROM History h
          JOIN Film f ON h.Film_id = f.Film_id
          WHERE h.is_deleted = 0
            AND f.is_deleted = 0
          GROUP BY f.Film_id, f.Film_name
          ORDER BY view_count DESC
          LIMIT ?
        `,
                    [limit]
                );
            } else {
                // Mặc định: top theo Favorite
                rows = await query(
                    `
          SELECT 
            f.Film_id,
            f.Film_name,
            COUNT(*) AS favorite_count
          FROM Favorite fv
          JOIN Film f ON fv.Film_id = f.Film_id
          WHERE f.is_deleted = 0
          GROUP BY f.Film_id, f.Film_name
          ORDER BY favorite_count DESC
          LIMIT ?
        `,
                    [limit]
                );
            }

            callback(null, rows);
        } catch (err) {
            callback(err);
        }
    },

    // Phân bố phim theo thể loại
    getGenreDistribution: async (callback) => {
        try {
            const rows = await query(`
        SELECT 
          g.Genre_id,
          g.Genre_name,
          COUNT(fg.Film_id) AS film_count
        FROM Genre g
        LEFT JOIN Film_genre fg ON g.Genre_id = fg.Genre_id
        LEFT JOIN Film f ON fg.Film_id = f.Film_id AND f.is_deleted = 0
        WHERE g.is_deleted = 0
        GROUP BY g.Genre_id, g.Genre_name
        ORDER BY film_count DESC, g.Genre_name ASC
      `);

            callback(null, rows);
        } catch (err) {
            callback(err);
        }
    },

    // Phân bố phim theo quốc gia
    getCountryDistribution: async (callback) => {
        try {
            const rows = await query(`
        SELECT 
          c.Country_id,
          c.Country_name,
          COUNT(fi.Film_id) AS film_count
        FROM Country c
        LEFT JOIN Film_info fi ON c.Country_id = fi.Country_id
        LEFT JOIN Film f ON fi.Film_id = f.Film_id AND f.is_deleted = 0
        GROUP BY c.Country_id, c.Country_name
        ORDER BY film_count DESC, c.Country_name ASC
      `);

            callback(null, rows);
        } catch (err) {
            callback(err);
        }
    },

    // Doanh thu premium theo thời gian (chart)
    getRevenueTrend: async (days = 30, callback) => {
        try {
            days = Number(days) || 30;

            const rows = await query(
                `
        SELECT 
          DATE(Paid_at) AS day,
          SUM(Amount) AS total_amount,
          COUNT(*) AS payments
        FROM PremiumPayment
        WHERE Paid_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(Paid_at)
        ORDER BY day ASC
      `,
                [days]
            );

            // Chuẩn hóa kiểu số
            const normalized = rows.map((r) => ({
                day: r.day,
                total_amount: Number(r.total_amount || 0),
                payments: r.payments,
            }));

            callback(null, normalized);
        } catch (err) {
            callback(err);
        }
    },
};

module.exports = dashboardModel;
