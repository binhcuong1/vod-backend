const express = require('express');
const router = express.Router();

router.use('/films', require('./filmRoutes'));

module.exports = router;