const history = require('../models/historyModel');

// Lấy tất cả
exports.getHistories = (req, res) => {
  history.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

// Lấy theo ID
exports.getHistoryByID = (req, res) => {
  const id = req.params.id;
  history.getByID(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result) return res.status(404).json({ error: 'Không tìm thấy lịch sử!' });
    res.json({ success: true, data: result });
  });
};

// Lấy theo Profile
exports.getHistoriesByProfile = (req, res) => {
  const profileId = req.params.profileId;
  history.getByProfile(profileId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

// Upsert progress (insert nếu chưa có, update nếu đã tồn tại)
exports.upsertProgress = (req, res) => {
  const { profile_id, film_id, episode_id, position_seconds = 0, duration_seconds = 0 } = req.body;

  if (!profile_id || !film_id) {
   
    return res.status(400).json({ error: 'profile_id và film_id là bắt buộc' });
  }
  // Bỏ qua nếu người xem chưa xem đủ 5 giây
  if (position_seconds < 5) {
    return res.json({
      success: false,
      message: "Không lưu vì người dùng chưa xem đủ thời lượng tối thiểu (5s).",
    });
  }

  //  Gọi model thực hiện upsert
  history.upsertProgress(
    { profile_id, film_id, episode_id, position_seconds, duration_seconds },
    (err, result) => {
      if (err) {
        console.error("[API] Lỗi khi upsert progress:", err);
        return res.status(500).json({ error: err });
      }

      if (result.upserted) {
        return res.status(201).json({
          success: true,
          message: 'Đã tạo lịch sử xem mới',
          id: result.insertId,
        });
      }
      return res.json({ success: true, message: 'Đã cập nhật tiến độ xem' });
    }
  );
};


// Cập nhật theo History_id (tùy ý các trường)
exports.updateHistory = (req, res) => {
  const id = req.params.id;
  const data = {};
  if (req.body.position_seconds !== undefined) data.position_seconds = req.body.position_seconds;
  if (req.body.duration_seconds !== undefined) data.duration_seconds = req.body.duration_seconds;
  if (req.body.profile_id !== undefined) data.Profile_id = req.body.profile_id;
  if (req.body.film_id !== undefined) data.Film_id = req.body.film_id;
  if (req.body.episode_id !== undefined) data.Episode_id = req.body.episode_id;

  if (Object.keys(data).length === 0)
    return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });

  history.updateById(id, data, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy lịch sử!' });
    res.json({ success: true, message: 'Cập nhật thành công' });
  });
};

// Xóa mềm theo ID
exports.deleteHistory = (req, res) => {
  const id = req.params.id;
  history.deleteById(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy lịch sử để xóa' });
    res.json({ success: true, message: 'Đã xóa lịch sử' });
  });
};

// Xóa mềm toàn bộ lịch sử của 1 profile
exports.clearHistoryByProfile = (req, res) => {
  const profileId = req.params.profileId;
  history.clearByProfile(profileId, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, message: 'Đã xóa toàn bộ lịch sử của profile' });
  });
};

// 🔹 Lấy danh sách "xem tiếp"
exports.getContinueWatching = (req, res) => {
  const profileId = req.params.profileId;
  history.getContinueWatching(profileId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};
