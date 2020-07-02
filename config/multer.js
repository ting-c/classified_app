const multer = require("multer");
const Datauri = require("datauri/parser");

// avoid admin error when storing files in user's device
const storage = multer.memoryStorage(); 

// store uploaded images in memory
// takes in array of 'image' files with max count of 3
// 'image' = field name for finding file
exports.multerUploads = multer({ storage }).array('image', 3);

exports.datauri = new Datauri();
