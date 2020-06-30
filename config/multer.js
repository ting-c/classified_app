const multer = require("multer");
const Datauri = require("datauri/parser");

// avoid admin error when storing files in user's device
const storage = multer.memoryStorage(); 

// 'image' = field name for finding file
exports.multerUploads = multer({ storage }).single('image');

exports.datauri = new Datauri();
