const film = require('../models/filmModel');
const db = require('../config/db');

exports.getfilms = (req, res) => {
    film.getAll((err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ success: true, data: result });
    });
};

exports.getfilmByID = (req, res) => {
    const id = req.params.id;
    film.getByID(id, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (!result) return res.status(404).json({ error: 'Không tìm thấy phim!' });
        res.json({ success: true, data: result });
    });
};

exports.getfilmDetail = (req, res) => {
    const id = Number(req.params.id);
    if (!id)
        return res.status(400).json({
            success: false,
            error: 'Thiếu film_id'
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

exports.createfilm = (req, res) => {
    // log để xem chính xác FE gửi gì
    console.log('[createfilm] body =', JSON.stringify(req.body, null, 2));

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
        // filmsource yêu cầu film_id hoặc Episode_id (ít nhất 1 cái phải có)
        sources: Array.isArray(sources) ? sources : [],
        // Bảng link là film_actor với Actor_id
        cast_ids: Array.isArray(cast_ids) ? cast_ids.map(Number).filter(n => !Number.isNaN(n)) : [],
    };

    film.createDeep(payload, (err, newId) => {
        if (err) return res.status(500).json({ success: false, error: err.message || String(err) });
        res.status(201).json({ success: true, id: newId });
    });
};

exports.updatefilm = async (req, res) => {
    const filmId = Number(req.params.id);
    const {
        film_name,
        is_series,
        info = {},
        genre_ids = [],
        cast = [],              // [{ actor_id, character_name? }]
        posters = [],           // [{ poster_id?, postertype_id, poster_url, is_deleted? }]
        sources = []            // movie-level only here: [{ resolution_id, source_url }]
    } = req.body || {};

    const usePool = typeof db.getConnection === 'function';
    const getConn = () => new Promise((resolve, reject) => {
        if (usePool) db.getConnection((e, c) => e ? reject(e) : resolve(c));
        else resolve(db);
    });

    let conn;
    try {
        conn = await getConn();
        await conn.beginTransaction();

        // 1) Cập nhật bảng film (basic)
        const basic = {};
        if (typeof film_name !== 'undefined') basic.film_name = film_name;
        if (typeof is_series !== 'undefined') basic.is_series = !!is_series ? 1 : 0;
        if (Object.keys(basic).length) {
            await film.updateBasic(conn, filmId, basic);
        }

        // 2) Upsert film_info
        const infoPatch = {};
        const map = {
            original_name: 'Original_name',
            description: 'Description',
            release_year: 'Release_year',
            duration: 'Duration',
            maturity_rating: 'maturity_rating',
            country_id: 'Country_id',
            process_episode: 'process_episode',
            total_episode: 'total_episode',
            trailer_url: 'trailer_url',
            film_status: 'film_status'
        };
        for (const k in map) if (k in info) infoPatch[map[k]] = info[k] ?? null;
        await film.upsertInfo(conn, filmId, infoPatch);

        // 3) Replace genres
        await film.replaceGenres(conn, filmId, Array.isArray(genre_ids) ? genre_ids : []);

        // 4) Replace actors
        const actors = Array.isArray(cast) ? cast : [];
        await film.replaceActors(conn, filmId, actors);

        // 5) Sync posters (insert/update/soft-delete)
        await film.syncPosters(conn, filmId, Array.isArray(posters) ? posters : []);

        // 6) Movie-level sources (không đụng Episode_id)
        if (Array.isArray(sources)) {
            // Xóa các filmSource movie-level cũ rồi insert lại (đơn giản, dễ kiểm soát)
            await conn.query(`DELETE FROM filmSource WHERE film_id = ? AND Episode_id IS NULL`, [filmId]);
            if (sources.length) {
                const values = sources
                    .filter(s => s && s.source_url && s.resolution_id)
                    .map(s => [filmId, null, s.resolution_id, s.source_url]);
                if (values.length) {
                    await conn.query(
                        `INSERT INTO filmSource (film_id, Episode_id, Resolution_id, Source_url) VALUES ?`,
                        [values]
                    );
                }
            }
        }

        await conn.commit();
        if (conn.release) conn.release();
        res.json({ success: true, message: 'film updated', id: filmId });
    } catch (err) {
        if (conn) {
            try { await conn.rollback(); } catch { }
            if (conn.release) conn.release();
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deletefilm = (req, res) => {
    const id = req.params.id;
    film.delete(id, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Không tìm thấy phim!' });
        res.json({ success: true });
    });
};

exports.searchfilms = (req, res) => {
    const keyword = req.query.keyword;
    if (!keyword)
        return res.status(400).json({ success: false, error: 'Thiếu từ khóa tìm kiếm' });

    film.search(keyword, (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, data: result });
    });
};

exports.getHomefilms = (req, res) => {
    film.getHomeData((err, result) => {
        if (err) {
            console.error("❌ Lỗi truy vấn getHomeData:", err);
            return res.status(500).json({ success: false, error: err.message });
        }
        // 🔸 Chỉ lấy Top 10 phim mới nhất
        const topfilms = result.slice(0, 10);
        res.status(200).json({
            success: true,
            data: topfilms,
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