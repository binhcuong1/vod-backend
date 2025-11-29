const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

// Tổng quan cho trang thống kê (cards + 1 số chart + top phim)
router.get("/overview", reportController.getOverview);

// Doanh thu Premium theo thời gian (biểu đồ riêng)
router.get("/premium-revenue", reportController.getPremiumRevenue);

// Thống kê hiệu suất phim chi tiết (bảng có phân trang)
router.get("/films", reportController.getFilmStats);

module.exports = router;
