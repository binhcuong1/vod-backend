const watchListItem = require('../models/watchListItemModel');


exports.getAllItems = (req, res) => {
  watchListItem.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};


exports.getItemsByWatchList = (req, res) => {
  const watchListId = req.params.watchListId;
  watchListItem.getByWatchList(watchListId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};


exports.addItem = (req, res) => {
  const { watchlist_id, film_id } = req.body;
  if (!watchlist_id || !film_id)
    return res.status(400).json({ error: 'watchlist_id và film_id là bắt buộc' });

  watchListItem.add({ watchlist_id, film_id }, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Phim đã có trong danh sách này' });
      return res.status(500).json({ error: err });
    }
    res.status(201).json({ success: true, message: 'Đã thêm phim vào danh sách' });
  });
};


exports.removeItem = (req, res) => {
  const { watchlist_id, film_id } = req.params;
  watchListItem.remove(watchlist_id, film_id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy phim trong danh sách' });
    res.json({ success: true, message: 'Đã xóa phim khỏi danh sách' });
  });
};

