const multer = require("multer");

// Store image in memory as a buffer
const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload;
