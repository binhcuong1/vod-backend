const removeDiacritics = require("diacritics").remove;
const badWords = require("./sensitive_words");

// ⭐ Lọc tiếng Việt có dấu bằng Unicode regex
function censorText(text = "") {
  let result = text;

  badWords.forEach(word => {
    const pattern = new RegExp(word, "giu");  // g = global, i = ignore-case, u = unicode
    result = result.replace(pattern, "***");
  });

  return result;
}

module.exports = censorText;


