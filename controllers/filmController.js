const film = require('../models/filmModel');
const db = require('../config/db');
const sql = typeof db.promise === 'function' ? db.promise() : db;

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
    if (!filmId) {
        return res.status(400).json({ success: false, message: 'Invalid film id' });
    }

    const body = req.body || {};
    const {
        film_name,
        is_series,
        info = {},
        genre_ids,
        cast,
        cast_ids,
        posters,
        sources
    } = body;


    let conn;
    const usePool = (typeof db.getConnection === 'function'); // true nếu dùng createPool

    try {
        // 1️⃣ Lấy connection
        if (usePool) {
            // Pool → dùng promise().getConnection() và SAU NÀY NHỚ release
            conn = await db.promise().getConnection();
        } else {
            // Single connection → dùng sql (PromiseConnection) và KHÔNG release
            conn = sql;
        }

        await conn.beginTransaction();

        // 2️⃣ film basic
        const basic = {};
        if (typeof film_name !== 'undefined') basic.Film_name = film_name;
        if (typeof is_series !== 'undefined') basic.is_series = !!is_series ? 1 : 0;

        if (Object.keys(basic).length) {
            await film.updateBasic(conn, filmId, basic);  // dùng conn.query(...) bên model
        }

        // 3️⃣ Film_info (map từ info → cột DB)
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
            film_status: 'film_status',
        };

        for (const k in map) {
            if (Object.prototype.hasOwnProperty.call(info, k)) {
                let v = info[k];
                // ép kiểu số cho mấy field numeric
                if (['release_year', 'duration', 'country_id', 'process_episode', 'total_episode'].includes(k)) {
                    v = (v !== null && v !== undefined && v !== '') ? Number(v) : null;
                }
                infoPatch[map[k]] = v ?? null;
            }
        }

        if (Object.keys(infoPatch).length > 0) {
            await film.upsertInfo(conn, filmId, infoPatch);  // bên model đã check empty giúp mình rồi
        }

        // 4️⃣ Genres (chỉ replace nếu FE gửi key genre_ids)
        if (Object.prototype.hasOwnProperty.call(body, 'genre_ids')) {
            const list = Array.isArray(genre_ids)
                ? genre_ids.map(Number).filter(n => !Number.isNaN(n))
                : [];
            await film.replaceGenres(conn, filmId, list);
        }

        // 5️⃣ Cast: hỗ trợ cả "cast" (đầy đủ thông tin) và "cast_ids" (chỉ id)
        if (
            Object.prototype.hasOwnProperty.call(body, 'cast') ||
            Object.prototype.hasOwnProperty.call(body, 'cast_ids')
        ) {
            let actors = [];

            if (Array.isArray(cast) && cast.length) {
                // Trường hợp payload gửi dạng [{ actor_id, character_name }]
                actors = cast
                    .map(a => ({
                        actor_id: Number(a.actor_id),
                        character_name: a.character_name ?? null,
                    }))
                    .filter(a => !Number.isNaN(a.actor_id));
            } else if (Array.isArray(cast_ids) && cast_ids.length) {
                // Trường hợp payload hiện tại: cast_ids: [4,3,2]
                actors = cast_ids
                    .map(id => ({
                        actor_id: Number(id),
                        character_name: null,   // chưa có UI nhập, để null
                    }))
                    .filter(a => !Number.isNaN(a.actor_id));
            }

            await film.replaceActors(conn, filmId, actors);
        }


        // 6️⃣ Posters (nếu FE gửi posters)
        if (Object.prototype.hasOwnProperty.call(body, 'posters') && Array.isArray(posters)) {
            await film.syncPosters(conn, filmId, posters);
        }

        // 7️⃣ Movie-level sources (Episode_id IS NULL)
        if (Object.prototype.hasOwnProperty.call(body, 'sources') && Array.isArray(sources)) {
            await conn.query(
                `DELETE FROM FilmSource WHERE Film_id = ? AND Episode_id IS NULL`,
                [filmId]
            );

            const values = sources
                .filter(s => s && s.source_url && s.resolution_id)
                .map(s => [filmId, null, Number(s.resolution_id), s.source_url]);

            if (values.length) {
                await conn.query(
                    `INSERT INTO FilmSource (Film_id, Episode_id, Resolution_id, Source_url) VALUES ?`,
                    [values]
                );
            }
        }

        await conn.commit();
        if (usePool && conn.release) conn.release();   // ❗ chỉ release khi là PoolConnection

        return res.json({ success: true, message: 'film updated', id: filmId });
    } catch (err) {
        console.error('updatefilm error:', err);
        if (conn) {
            try { await conn.rollback(); } catch (_) { }
            if (usePool && conn.release) conn.release(); // ❗ không release nếu không phải pool
        }
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
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

// Lấy chi tiết phim cho trang Detail FE
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

// Lấy danh sách phim đề xuất cùng quốc gia
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

// Helper: Lấy Episode_id đầu tiên của 1 phim (auto tạo nếu thiếu khi là phim lẻ)
async function ensureFirstEpisodeOfFilm(filmId) {
    const [rows] = await sql.query(`
    SELECT e.Episode_id
    FROM Season s
    JOIN Episode e ON e.Season_id = s.Season_id AND e.is_deleted = 0
    WHERE s.Film_id = ?
    ORDER BY e.Episode_number ASC, e.Episode_id ASC
    LIMIT 1
  `, [filmId]);

    if (rows.length) return rows[0].Episode_id;

    // nếu chưa có: tạo Season + Episode #1 (dành cho phim lẻ)
    const [sRes] = await sql.query(
        `INSERT INTO Season (Season_name, Film_id, is_deleted) VALUES ('Phần 1', ?, 0)`,
        [filmId]
    );
    const seasonId = sRes.insertId;

    const [eRes] = await sql.query(
        `INSERT INTO Episode (Episode_number, Season_id, is_deleted) VALUES (1, ?, 0)`,
        [seasonId]
    );
    return eRes.insertId;
}

exports.getFilmSources = async (req, res) => {
    try {
        const filmId = Number(req.params.filmId);
        const [[film]] = await sql.query(
            `SELECT is_series FROM Film WHERE Film_id=? AND is_deleted=0`,
            [filmId]
        );
        if (!film) return res.status(404).json({ success: false, message: 'Film not found' });

        // Với phim lẻ: xem sources của "tập đầu"
        const episodeId = await ensureFirstEpisodeOfFilm(filmId);
        const [rows] = await sql.query(`
      SELECT fs.Resolution_id, r.Resolution_type, fs.Source_url
      FROM FilmSource fs
      JOIN Resolution r ON r.Resolution_id = fs.Resolution_id
      WHERE fs.Film_id = ? AND fs.Episode_id = ?
      ORDER BY fs.Resolution_id
    `, [filmId, episodeId]);

        res.json({ success: true, film_id: filmId, episode_id: episodeId, data: rows });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

exports.updateFilmSources = async (req, res) => {
    try {
        const filmId = Number(req.params.filmId);
        // ⚠️ destructuring từ {} (không phải []), để tránh TypeError khi body = undefined
        const { sources = [] } = req.body || {};

        // Chỉ cho phim lẻ cập nhật ở đây (phim bộ → cập nhật theo từng tập)
        const [[film]] = await sql.query(
            `SELECT is_series FROM Film WHERE Film_id=? AND is_deleted=0`,
            [filmId]
        );
        if (!film) return res.status(404).json({ success: false, message: 'Film not found' });
        if (film.is_series) {
            return res.status(400).json({
                success: false,
                message: 'Series: update sources per episode at /api/episodes/:id/sources'
            });
        }

        // Bảo đảm có 1 tập đại diện
        const episodeId = await ensureFirstEpisodeOfFilm(filmId);

        // Replace toàn bộ sources (xóa + insert lại)
        await sql.query(
            `DELETE FROM FilmSource WHERE Film_id=? AND Episode_id=?`,
            [filmId, episodeId]
        );

        const values = (Array.isArray(sources) ? sources : [])
            .filter(s => s && s.resolution_id && s.source_url)
            .map(s => [filmId, episodeId, Number(s.resolution_id), s.source_url]);

        if (values.length) {
            // Nếu môi trường bạn không hỗ trợ "VALUES ?" bulk,
            // thay thế bằng vòng lặp insert từng dòng (ghi bên dưới).
            await sql.query(
                `INSERT INTO FilmSource (Film_id, Episode_id, Resolution_id, Source_url) VALUES ?`,
                [values]
            );
        }

        res.json({ success: true, film_id: filmId, episode_id: episodeId, count: values.length });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};