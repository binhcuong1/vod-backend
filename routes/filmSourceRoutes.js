const express = require('express');
const router = express.Router();
const filmSourceController = require('../controllers/filmSourceController');

router.get('/', filmSourceController.getFilmSources);
// Lấy theo Film_id hoặc Episode_id (frontend)
router.get('/by-parent', filmSourceController.getSourceByParent);
router.post('/', filmSourceController.createFilmSource);
router.delete('/', filmSourceController.deleteFilmSource);

module.exports = router;
