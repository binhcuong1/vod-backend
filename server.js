const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
require('./config/db');

const router = require('./routes/index');

app.use(cors({
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    
}));


require('dotenv').config();
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    
}));
app.use(express.json()); 
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.use('/api', router);

app.get('/', (req, res) => {
    res.send('vod-backend đang chạy');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server đang chạy tại port :${PORT}`);
});