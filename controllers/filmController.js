const film = require('../models/filmModel');

exports.getFilms = (req, res) => {
    film.getAll((err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ success: true, data: result });
    });
};

exports.getFilmByID = (req, res) => {
    const id = req.params.id;
    film.getByID(id, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (!result) return res.status(404).json({ error: 'Không tìm thấy phim!' });
        res.json({ success: true, data: result });
    });
};

exports.createFilm = (req, res) => {
    const { film_name, is_series = false } = req.body;

    if (!film_name)
        return res.status(400).json({ error: 'film_name là bắt buộc' });

    const data = { film_name, is_series: !!is_series };

    film.create(data, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.status(201).json({ success: true, id: result.insertId });
    });
};

exports.updateFilm = (req, res) => {
    const id = req.params.id;
    const data = {};
    if (req.body.film_name !== undefined) data.film_name = req.body.film_name;
    if (req.body.is_series !== undefined) data.is_series = !!req.body.is_series;

    film.update(id, data, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Không tìm thấy phim!' });
        res.json({ success: true });
    });
};

exports.deleteFilm = (req, res) => {
    const id = req.params.id;
    film.delete(id, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Không tìm thấy phim!' });
        res.json({ success: true });
    });
};

exports.searchFilms = (req, res) => {
    const keyword = req.query.keyword;
    if (!keyword)
        return res.status(400).json({ success: false, error: 'Thiếu từ khóa tìm kiếm' });

    film.search(keyword, (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, data: result });
    });
};


// ✅ Lấy dữ liệu phim hiển thị cho trang Home (JOIN nhiều bảng)
exports.getHomeFilms = (req, res) => {
    film.getHomeData((err, result) => {
        if (err) {
            console.error("❌ Lỗi truy vấn getHomeData:", err);
            return res.status(500).json({ success: false, error: err.message });
        }
        // 🔸 Chỉ lấy Top 10 phim mới nhất
        const topFilms = result.slice(0, 10);
        res.status(200).json({
            success: true,
            data: topFilms,
        });
    });
};

