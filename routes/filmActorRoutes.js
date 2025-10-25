const express = require('express');
const router = express.Router();
const filmActorController = require('../controllers/filmActorController');

router.get('/', filmActorController.getFilmActors);
router.get('/film/:filmId', filmActorController.getByFilm);
router.get('/actor/:actorId', filmActorController.getByActor);
router.post('/', filmActorController.createFilmActor);
router.post('/upsert', filmActorController.upsertFilmActor);
router.put('/:film_id/:actor_id', filmActorController.updateFilmActor);
router.delete('/:film_id/:actor_id', filmActorController.deleteFilmActor);

module.exports = router;
