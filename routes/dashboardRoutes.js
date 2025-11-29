const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/stats", dashboardController.getStats);

router.get("/top-films", dashboardController.getTopFilms);

// Phân bố phim theo thể loại
router.get("/genre-distribution", dashboardController.getGenreDistribution);

// Phân bố phim theo quốc gia
router.get("/country-distribution", dashboardController.getCountryDistribution);

// Doanh thu premium theo thời gian 
router.get("/revenue", dashboardController.getRevenueTrend);

module.exports = router;
