const dashboardModel = require("../models/dashboardModel");

exports.getStats = (req, res) => {
    dashboardModel.getStats((err, data) => {
        if (err) {
            console.error("[dashboard] getStats error:", err);
            return res
                .status(500)
                .json({ success: false, error: "Lỗi khi lấy thống kê tổng quan" });
        }

        res.json({ success: true, data });
    });
};

exports.getTopFilms = (req, res) => {
    const { type = "favorite", limit = 5 } = req.query;

    dashboardModel.getTopFilms(type, limit, (err, rows) => {
        if (err) {
            console.error("[dashboard] getTopFilms error:", err);
            return res
                .status(500)
                .json({ success: false, error: "Lỗi khi lấy top phim" });
        }

        res.json({
            success: true,
            type: type === "views" ? "views" : "favorite",
            data: rows,
        });
    });
};

exports.getGenreDistribution = (req, res) => {
    dashboardModel.getGenreDistribution((err, rows) => {
        if (err) {
            console.error("[dashboard] getGenreDistribution error:", err);
            return res
                .status(500)
                .json({ success: false, error: "Lỗi khi lấy phân bố thể loại" });
        }

        res.json({ success: true, data: rows });
    });
};

exports.getCountryDistribution = (req, res) => {
    dashboardModel.getCountryDistribution((err, rows) => {
        if (err) {
            console.error("[dashboard] getCountryDistribution error:", err);
            return res
                .status(500)
                .json({ success: false, error: "Lỗi khi lấy phân bố quốc gia" });
        }

        res.json({ success: true, data: rows });
    });
};

exports.getRevenueTrend = (req, res) => {
    const { days = 30 } = req.query;

    dashboardModel.getRevenueTrend(days, (err, rows) => {
        if (err) {
            console.error("[dashboard] getRevenueTrend error:", err);
            return res
                .status(500)
                .json({ success: false, error: "Lỗi khi lấy biểu đồ doanh thu" });
        }

        res.json({ success: true, days: Number(days) || 30, data: rows });
    });
};
