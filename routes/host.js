const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const mongoose = require('mongoose');
const GridFsStorage = require('multer-gridfs-storage');
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

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads',
          metadata: {
            uploaderId: req.userData.userId,
            temp: true
          }
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

router.post('/step1', (req, res, next) => {
  res.status(200).json({
    body: req.body,
    message: 'req received successfully'
  });
});

router.post('/step2/propertyImage', upload.array('file', 20), (req, res, next) => {
  res.status(200).json({
    message: "Images saved successfully. "
  });
});

// This route provides filenames.
// Conditions: userId, temp=true
router.get('/step2/propertyImage', (req, res, next) => {
  gfs.files
    .find({
      metadata: {
        uploaderId: req.userData.userId,
        temp: true
      }
    })
    .toArray((err, files) => {
      if (!files || files.length === 0) {
        return res.status(404).json({
          error: 'No file exist'
        });
      }
      return res.json(files);
    });
});

// Implement delete route for deleting 
// images from girdfs if user discard changes.

module.exports = router;
