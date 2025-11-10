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

exports.getFilmDetail = (req, res) => {
    const id = Number(req.params.id);
    if (!id)
        return res.status(400).json({
            success: false,
            error: 'Thiếu Film_id'
        });

    film.getDetail(id, (err, data) => {
        if (err)
            return res.status(500).json({
                success: false,
                error: err.message || String(err)
            });
        if (!data || !data.film)
            return res.status(404).json({
                success: false, 
                error: 'Không tìm thấy phim!'
            });
        res.json({ success: true, data });
    });
};

exports.createFilm = (req, res) => {
    // log để xem chính xác FE gửi gì
    console.log('[createFilm] body =', JSON.stringify(req.body, null, 2));

    // Hỗ trợ cả "film_info" (FE hiện tại) lẫn "info" (mẫu cũ)
    const {
        film_name,
        is_series = false,
        film_info: fiFromFe, // FE hiện tại dùng "film_info"
        info: fiFromOld,     // phòng trường hợp sau này dùng "info"
        genre_ids = [],
        posters = [],
        sources = [],
        cast_ids = []
    } = req.body || {};

    if (!film_name) {
        return res.status(400).json({ success: false, error: 'film_name là bắt buộc' });
    }

    // Chọn object info hợp lệ
    const infoSrc = fiFromFe || fiFromOld || {};
    // Ép kiểu an toàn
    const payload = {
        film_name: String(film_name).trim(),
        is_series: !!is_series,
        info: {
            original_name: infoSrc.original_name ?? null,
            description: infoSrc.description ?? null,
            // Release_year trong DB là kiểu YEAR → số hoặc null
            release_year: infoSrc.release_year != null ? Number(infoSrc.release_year) : null,
            duration: infoSrc.duration != null ? Number(infoSrc.duration) : null,
            maturity_rating: infoSrc.maturity_rating ?? null,
            country_id: infoSrc.country_id != null ? Number(infoSrc.country_id) : null,
            film_status: infoSrc.film_status ?? null,         // enum('đang chiếu','hoàn thành','sắp chiếu')
            trailer_url: infoSrc.trailer_url ?? null,
            // với series có thể muốn set mặc định:
            process_episode: infoSrc.process_episode != null ? Number(infoSrc.process_episode) : 0,
            total_episode: infoSrc.total_episode != null ? Number(infoSrc.total_episode) : 0,
        },
        genre_ids: Array.isArray(genre_ids) ? genre_ids.map(Number).filter(n => !Number.isNaN(n)) : [],
        posters: Array.isArray(posters) ? posters : [],
        // filmsource yêu cầu Film_id hoặc Episode_id (ít nhất 1 cái phải có)
        sources: Array.isArray(sources) ? sources : [],
        // Bảng link là film_actor với Actor_id
        cast_ids: Array.isArray(cast_ids) ? cast_ids.map(Number).filter(n => !Number.isNaN(n)) : [],
    };

    film.createDeep(payload, (err, newId) => {
        if (err) return res.status(500).json({ success: false, error: err.message || String(err) });
        res.status(201).json({ success: true, id: newId });
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

exports.getSearchData = (req, res) => {
    film.getSearchData((err, result) => {
        if (err) {
            console.error("❌ Lỗi lấy dữ liệu phim:", err);
            return res.status(500).json({ success: false, error: err.message });
        }

        console.log(`🎬 Truy vấn thành công: ${result.length} phim`);
        res.status(200).json({ success: true, data: result });
    });
};

// 📌 Lấy chi tiết phim cho trang Detail FE
exports.getFilmDetail = (req, res) => {
  const { id } = req.params;

  film.getDetailByID(id, (err, data) => {
    if (err) {
      console.error("❌ Lỗi lấy chi tiết phim:", err);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
    if (!data) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phim" });
    }
    res.json({ success: true, data });
  });
};

// 📌 Lấy danh sách phim đề xuất cùng quốc gia
exports.getRecommendations = (req, res) => {
  const { countryName, excludeFilmId } = req.query;

  if (!countryName || !excludeFilmId) {
    return res.status(400).json({
      success: false,
      message: "Thiếu tham số countryName hoặc excludeFilmId"
    });
  }

  film.getRecommendationsByCountry(countryName, excludeFilmId, (err, data) => {
    if (err) {
      console.error("❌ Lỗi lấy phim đề xuất:", err);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
    res.json({ success: true, data });
  });
};
