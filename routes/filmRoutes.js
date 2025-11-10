const express = require('express');
const router = express.Router();
const filmController = require('../controllers/filmController');
const seasonController = require('../controllers/seasonController');

router.get('/home', filmController.getHomefilms);
router.get('/find/all', filmController.getSearchData);
router.get('/search', filmController.searchfilms);

router.get('/:id/detail', filmController.getfilmDetail);
router.get('/:id', filmController.getfilmDetail);
router.get('/', filmController.getfilms);

router.post('/', filmController.createfilm);
router.put('/:id', filmController.updatefilm);
router.delete('/:id', filmController.deletefilm);

// === NEW: alias seasons theo phim (giữ nguyên router seasons hiện có) ===
router.get('/:filmId/seasons', seasonController.getSeasonsByFilm);
router.post('/:filmId/seasons', (req, res) => {
    // bọc lại để không phải đổi controller hiện có
    req.body = {
        ...(req.body || {}),
        film_id: Number(req.params.filmId)
    };
    seasonController.createSeason(req, res);
});

module.exports = router;