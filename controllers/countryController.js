const country = require('../models/countryModel');

exports.getCountry = (req, res) => {
    country.getAll((err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ success: true, data: result });
    });
};

exports.getCountryByID = (req, res) => {
    const id = req.params.id;
    country.getByID(id, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (!result) return res.status(404).json({ error: 'Không tìm thấy bản ghi!' });
        res.json({ success: true, data: result });
    });
};

exports.createCountry = (req, res) => {
    const country_name = req.body;
    if (!country_name)
        return res.status(400).json({ error: 'country_name là bắt buộc' });
    country.create(country_name, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.status(201).json({ success: true, id: result.insertId });
    });
};

exports.updateCountry = (req, res) => {
    const id = req.params.id;
    const data = req.body;
    country.update(id, data, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Không tìm thấy bản ghi!' });
        res.json({ success: true });
    });
};

exports.deleteCountry = (req, res) => {
    const id = req.params.id;
    country.delete(id, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Không tìm thấy bản ghi!' });
        res.json({ success: true });
    });
};

exports.searchCountries = (req, res) => {
    const keyword = req.query.keyword;
    if (!keyword)
        return res.status(400).json({ success: false, error: 'Thiếu từ khóa tìm kiếm' });

    country.search(keyword, (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, data: result });
    });
};
