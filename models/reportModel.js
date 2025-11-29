const db = require("../config/db");

/**
 * Helper: chạy query theo kiểu Promise, dùng được với async/await
 * Nếu db của bạn dùng db.query(...) thay vì db.execute(...),
 * thì đổi db.execute thành db.query là xong.
 */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

/**
 * Thống kê tổng quan cho trang Overview
 */
async function getOverviewCounters(startDate, endDateExclusive) {
  const sqlRevenueSummary = `
    SELECT 
      IFNULL(SUM(Amount), 0) AS total_amount,
      COUNT(*) AS total_payments
    FROM PremiumPayment
    WHERE Paid_at >= ? AND Paid_at < ?
  `;

  const sqlNewPremiumAccounts = `
    SELECT 
      COUNT(DISTINCT Account_id) AS new_premium_accounts
    FROM PremiumPayment
    WHERE Paid_at >= ? AND Paid_at < ?
  `;

  const sqlCurrentPremiumAccounts = `
    SELECT 
      COUNT(*) AS current_premium_accounts
    FROM Account
    WHERE is_premium = 1 AND is_deleted = 0
  `;

  const sqlActiveProfiles = `
    SELECT 
      COUNT(DISTINCT Profile_id) AS active_profiles,
      IFNULL(SUM(duration_seconds), 0) AS total_watch_seconds,
      COUNT(*) AS views
    FROM History
    WHERE is_deleted = 0
      AND last_watched >= ? AND last_watched < ?
  `;

  const sqlNewComments = `
    SELECT 
      COUNT(*) AS new_comments
    FROM Comment
    WHERE Created_at >= ? AND Created_at < ?
  `;

  const sqlTotalComments = `
    SELECT COUNT(*) AS total_comments FROM Comment
  `;

  const [
    revRows,
    newPremRows,
    curPremRows,
    activeRows,
    newCommentRows,
    totalCommentRows,
  ] = await Promise.all([
    query(sqlRevenueSummary, [startDate, endDateExclusive]),
    query(sqlNewPremiumAccounts, [startDate, endDateExclusive]),
    query(sqlCurrentPremiumAccounts),
    query(sqlActiveProfiles, [startDate, endDateExclusive]),
    query(sqlNewComments, [startDate, endDateExclusive]),
    query(sqlTotalComments),
  ]);

  const rev = revRows[0] || {};
  const newPrem = newPremRows[0] || {};
  const curPrem = curPremRows[0] || {};
  const active = activeRows[0] || {};
  const newCmt = newCommentRows[0] || {};
  const totalCmt = totalCommentRows[0] || {};

  return {
    revenue: {
      total_amount: Number(rev.total_amount || 0),
      total_payments: Number(rev.total_payments || 0),
      new_premium_accounts: Number(newPrem.new_premium_accounts || 0),
      current_premium_accounts: Number(
        curPrem.current_premium_accounts || 0
      ),
    },
    watching: {
      active_profiles: Number(active.active_profiles || 0),
      total_watch_seconds: Number(active.total_watch_seconds || 0),
      views: Number(active.views || 0),
    },
    comments: {
      new_comments: Number(newCmt.new_comments || 0),
      total_comments: Number(totalCmt.total_comments || 0),
    },
  };
}

/**
 * Doanh thu Premium theo ngày hoặc tháng
 */
async function getPremiumRevenue(startDate, endDateExclusive, groupBy = "day") {
  const groupExpr =
    groupBy === "month"
      ? "DATE_FORMAT(Paid_at, '%Y-%m')"
      : "DATE(Paid_at)";

  const sql = `
    SELECT 
      ${groupExpr} AS label,
      IFNULL(SUM(Amount), 0) AS total_amount,
      COUNT(*) AS payments
    FROM PremiumPayment
    WHERE Paid_at >= ? AND Paid_at < ?
    GROUP BY ${groupExpr}
    ORDER BY ${groupExpr}
  `;

  const rows = await query(sql, [startDate, endDateExclusive]);
  return rows;
}

/**
 * Top N phim theo lượt xem trong khoảng thời gian
 */
async function getTopFilms(startDate, endDateExclusive, limit = 10) {
  const sql = `
    SELECT 
      f.Film_id,
      f.Film_name,
      f.is_series,
      f.is_premium_only,
      fi.Release_year,
      c.Country_name,
      COUNT(DISTINCT h.History_id) AS views,
      IFNULL(SUM(h.duration_seconds), 0) AS total_watch_seconds,
      COUNT(DISTINCT cm.Comment_id) AS comments,
      COUNT(DISTINCT fav.Profile_id) AS favorites,
      AVG(r.Score) AS avg_rating,
      COUNT(r.Score) AS rating_count
    FROM Film f
    LEFT JOIN Film_info fi ON fi.Film_id = f.Film_id
    LEFT JOIN Country c ON c.Country_id = fi.Country_id
    LEFT JOIN History h 
      ON h.Film_id = f.Film_id
     AND h.is_deleted = 0
     AND h.last_watched >= ? AND h.last_watched < ?
    LEFT JOIN Comment cm 
      ON cm.Film_id = f.Film_id
     AND cm.Created_at >= ? AND cm.Created_at < ?
    LEFT JOIN Favorite fav 
      ON fav.Film_id = f.Film_id
    LEFT JOIN Rating r 
      ON r.Film_id = f.Film_id
    WHERE f.is_deleted = 0
    GROUP BY f.Film_id
    ORDER BY views DESC, f.Film_id ASC
    LIMIT ?
  `;

  const rows = await query(sql, [
    startDate,
    endDateExclusive,
    startDate,
    endDateExclusive,
    limit,
  ]);

  return rows;
}

/**
 * Thống kê chi tiết phim (có phân trang + sort)
 */
async function getFilmStats(
  startDate,
  endDateExclusive,
  { page, limit, sortBy, order }
) {
  const offset = (page - 1) * limit;

  const baseSql = `
    SELECT 
      f.Film_id,
      f.Film_name,
      f.is_series,
      f.is_premium_only,
      fi.Release_year,
      fi.Duration,
      fi.maturity_rating,
      c.Country_name,
      GROUP_CONCAT(DISTINCT g.Genre_name ORDER BY g.Genre_name SEPARATOR ', ') AS genres,
      COUNT(DISTINCT h.History_id) AS views,
      IFNULL(SUM(h.duration_seconds), 0) AS total_watch_seconds,
      COUNT(DISTINCT cm.Comment_id) AS comments,
      COUNT(DISTINCT fav.Profile_id) AS favorites,
      AVG(r.Score) AS avg_rating,
      COUNT(r.Score) AS rating_count
    FROM Film f
    LEFT JOIN Film_info fi ON fi.Film_id = f.Film_id
    LEFT JOIN Country c ON c.Country_id = fi.Country_id
    LEFT JOIN Film_genre fg ON fg.Film_id = f.Film_id
    LEFT JOIN Genre g ON g.Genre_id = fg.Genre_id
    LEFT JOIN History h 
      ON h.Film_id = f.Film_id
     AND h.is_deleted = 0
     AND h.last_watched >= ? AND h.last_watched < ?
    LEFT JOIN Comment cm 
      ON cm.Film_id = f.Film_id
     AND cm.Created_at >= ? AND cm.Created_at < ?
    LEFT JOIN Favorite fav 
      ON fav.Film_id = f.Film_id
    LEFT JOIN Rating r 
      ON r.Film_id = f.Film_id
    WHERE f.is_deleted = 0
    GROUP BY f.Film_id
  `;

  const orderClause = `ORDER BY ${sortBy} ${order}`;
  const pagingClause = `LIMIT ? OFFSET ?`;

  const sql = `${baseSql} ${orderClause} ${pagingClause};`;

  const rows = await query(sql, [
    startDate,
    endDateExclusive,
    startDate,
    endDateExclusive,
    limit,
    offset,
  ]);

  const countRows = await query(
    "SELECT COUNT(*) AS total FROM Film WHERE is_deleted = 0"
  );

  return {
    page,
    limit,
    total: countRows[0]?.total || 0,
    data: rows,
  };
}

module.exports = {
  getOverviewCounters,
  getPremiumRevenue,
  getTopFilms,
  getFilmStats,
};
