const reportModel = require("../models/reportModel");

/**
 * Hàm hỗ trợ: chuẩn hóa Date -> 'YYYY-MM-DD'
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Hàm hỗ trợ: cộng ngày
 */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Hàm hỗ trợ:
 *   - Nếu có year + month => lấy nguyên tháng
 *   - Nếu có from + to   => dùng đúng khoảng ngày
 *   - Nếu có lastDays    => lấy N ngày gần nhất
 *   - Nếu không truyền gì => mặc định 30 ngày gần nhất
 *
 * Trả về:
 *   startDate, endDateExclusive (YYYY-MM-DD)
 *   meta: { mode, label, from, to }
 */
function resolveDateRange(query) {
  const now = new Date();
  let start, endInclusive, mode, label;

  // Ưu tiên: year + month (lấy nguyên tháng)
  if (query.year && query.month) {
    const year = Number(query.year);
    const month = Number(query.month); // 1-12

    start = new Date(year, month - 1, 1);
    endInclusive = new Date(year, month, 0); // ngày cuối tháng
    mode = "month";
    label = `Tháng ${month}/${year}`;
  }
  // Tiếp theo: from + to (YYYY-MM-DD)
  else if (query.from && query.to) {
    const from = new Date(query.from);
    const to = new Date(query.to);

    if (isNaN(from) || isNaN(to)) {
      // fallback 30 ngày nếu bị sai format
      endInclusive = now;
      start = addDays(endInclusive, -29);
      mode = "lastDays";
      label = "30 ngày gần nhất";
    } else {
      start = from;
      endInclusive = to;
      mode = "range";
      label = `Từ ${formatDate(from)} đến ${formatDate(to)}`;
    }
  }
  // Tiếp theo: lastDays (7, 14, 30,... ngày gần nhất)
  else if (query.lastDays) {
    const days = Math.max(parseInt(query.lastDays, 10) || 7, 1);
    endInclusive = now;
    start = addDays(endInclusive, -(days - 1));
    mode = "lastDays";
    label = `${days} ngày gần nhất`;
  }
  // Mặc định: 30 ngày gần nhất
  else {
    endInclusive = now;
    start = addDays(endInclusive, -29);
    mode = "lastDays";
    label = "30 ngày gần nhất";
  }

  // endExclusive = endInclusive + 1 ngày
  const endExclusive = addDays(endInclusive, 1);

  const fromStr = formatDate(start);
  const toStr = formatDate(endInclusive);
  const endExclusiveStr = formatDate(endExclusive);

  return {
    startDate: fromStr,
    endDateExclusive: endExclusiveStr,
    meta: {
      mode,
      label,
      from: fromStr,
      to: toStr,
    },
  };
}

/**
 * GET /api/reports/overview
 * Trả về:
 *  - counters: doanh thu, user, comment, ...
 *  - charts.revenueByDay: dùng vẽ biểu đồ
 *  - topFilms: top phim theo views trong khoảng thời gian
 */
exports.getOverview = async (req, res) => {
  try {
    const { startDate, endDateExclusive, meta } = resolveDateRange(req.query);

    const [counters, revenueByDay, topFilms] = await Promise.all([
      reportModel.getOverviewCounters(startDate, endDateExclusive),
      reportModel.getPremiumRevenue(startDate, endDateExclusive, "day"),
      reportModel.getTopFilms(startDate, endDateExclusive, 10),
    ]);

    return res.json({
      success: true,
      filter: meta,
      counters,
      charts: {
        revenueByDay,
      },
      topFilms,
    });
  } catch (err) {
    console.error("[reports] getOverview error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê tổng quan",
    });
  }
};

/**
 * GET /api/reports/premium-revenue
 * Query:
 *  - year, month, from, to, lastDays (xử lý như resolveDateRange)
 *  - groupBy = 'day' | 'month'
 */
exports.getPremiumRevenue = async (req, res) => {
  try {
    const { startDate, endDateExclusive, meta } = resolveDateRange(req.query);
    const groupBy = req.query.groupBy === "month" ? "month" : "day";

    const data = await reportModel.getPremiumRevenue(
      startDate,
      endDateExclusive,
      groupBy
    );

    return res.json({
      success: true,
      filter: meta,
      groupBy,
      data,
    });
  } catch (err) {
    console.error("[reports] getPremiumRevenue error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê doanh thu",
    });
  }
};

/**
 * GET /api/reports/films
 * Thống kê hiệu suất phim theo khoảng thời gian, có phân trang + sort
 *
 * Query:
 *  - year, month, from, to, lastDays
 *  - page, limit
 *  - sortBy = views | favorites | avg_rating | comments | total_watch_seconds
 *  - order = asc | desc
 */
exports.getFilmStats = async (req, res) => {
  try {
    const { startDate, endDateExclusive, meta } = resolveDateRange(req.query);

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100
    );

    const allowedSorts = {
      views: "views",
      favorites: "favorites",
      avg_rating: "avg_rating",
      comments: "comments",
      total_watch_seconds: "total_watch_seconds",
    };
    const sortByKey = req.query.sortBy || "views";
    const sortBy = allowedSorts[sortByKey] || "views";

    const order = req.query.order === "asc" ? "ASC" : "DESC";

    const result = await reportModel.getFilmStats(startDate, endDateExclusive, {
      page,
      limit,
      sortBy,
      order,
    });

    return res.json({
      success: true,
      filter: meta,
      page: result.page,
      limit: result.limit,
      total: result.total,
      data: result.data,
    });
  } catch (err) {
    console.error("[reports] getFilmStats error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê phim",
    });
  }
};
