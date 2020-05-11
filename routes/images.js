const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

const mongoURI = require('../configs/secret').MONGODB_URI;
const conn = mongoose.createConnection(mongoURI, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

let gfs;

conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// To fetch an image with given filename.
// It is an open route, anyone can access it.
router.get('/:filename', (req, res, next) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({
        error: 'File not found error'
      });
    } else {
      if (file.contentType === 'image/jpg' || file.contentType === 'image/jpeg') {
        const readStream = gfs.createReadStream(file.filename);
        readStream.pipe(res);
      } else {
        res.status(404).json({
          error: 'Not an image'
        });
      }
    }
  });
});

// Post request must not be handled here openly. 
// User must be logged in to post an image.

module.exports = router;
