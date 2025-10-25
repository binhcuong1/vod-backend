const express = require('express');
const router = express.Router();
const filmInfoController = require('../controllers/filmInfoController');


router.get('/', filmInfoController.getFilmInfos);
router.get('/search', filmInfoController.searchFilmInfos);
router.get('/:id', filmInfoController.getFilmInfoByID);
router.post('/', filmInfoController.createFilmInfo);
router.put('/:id', filmInfoController.updateFilmInfo);
router.delete('/:id', filmInfoController.deleteFilmInfo);

module.exports = router;
