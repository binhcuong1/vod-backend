const express = require('express');
const app = express();
require('./config/db');

const router = require('./routes/index');

require('dotenv').config();

app.use(express.json()); 
app.use('/api', router);

app.get('/', (req, res) => {
    res.send('vod-backend đang chạy');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server đang chạy tại port :${PORT}`);
});