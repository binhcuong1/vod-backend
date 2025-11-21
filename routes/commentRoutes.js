const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');


router.get('/:filmId', commentController.getCommentsByFilm);
router.get('/replies/:parentId', commentController.getReplies);
router.post('/', commentController.addComment);
router.post('/like/:commentId', commentController.likeComment);
router.delete('/:commentId', commentController.deleteComment);
router.post('/reply', commentController.addReply);

module.exports = router;
