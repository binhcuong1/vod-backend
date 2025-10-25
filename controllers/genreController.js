const genre = require('../models/genreModel');

exports.getGenres = (req, res) => {
    genre.getAll((err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ success: true, data: result });
    });
};

exports.getGenreByID = (req, res) => {
    const id = req.params.id;
    genre.getByID(id, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (!result) return res.status(404).json({ error: 'Không tìm thấy thể loại!' });
        res.json({ success: true, data: result });
    });
};

exports.createGenre = (req, res) => {
    const { genre_name, is_series = false } = req.body;

    if (!genre_name)
        return res.status(400).json({ error: 'genre_name là bắt buộc' });

    const data = { genre_name};

    genre.create(data, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.status(201).json({ success: true, id: result.insertId });
    });
};

exports.updategenre = (req, res) => {
    const id = req.params.id;
    const data = {};
    if (req.body.genre_name !== undefined) data.genre_name = req.body.genre_name;
    
    genre.update(id, data, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Không tìm thấy thể loại!' });
        res.json({ success: true });
    });
};

exports.deleteGenre = (req, res) => {
    const id = req.params.id;
    genre.delete(id, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Không tìm thấy thể loại!' });
        res.json({ success: true });
    });
};

exports.searchGenres = (req, res) => {
    const keyword = req.query.keyword;
    if (!keyword)
        return res.status(400).json({ success: false, error: 'Thiếu từ khóa tìm kiếm' });

    genre.search(keyword, (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, data: result });
    });
};