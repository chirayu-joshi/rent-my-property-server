const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const mongoose = require('mongoose');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');

const Post = require('../models/Post');

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

router.post('/publish', (req, res, next) => {
  /* req.body =
    {
      propertyName: 'my home',
      propertyDescription: 'home sweet home',
      propertyArea: 123,
      propertyType: 'villa',
      guestCapacity: 2,
      rooms: 1,
      beds: 2,
      amenities: [ 'tv', 'wifi', 'ac', 'desk', 'heater' ],
      facilities: [ 'parking', 'washingMachine', 'kitchen', 'gym' ],
      location: { lat: ---lat---, lon: ---lon--- },
      address: {
        number: '---number---',
        street: '---street---',
        city: '---city---',
        state: '---state---',
        country: 'IN'
      },
      price: 50000,
      schedule: {
        checkIn: '2020-05-16T06:55:00.000Z',
        checkOut: '2020-05-31T06:55:00.000Z'
      },
      rules: [ 'pets', 'children' ],
      languages: [ 'english', 'hindi' ]
    }
  */
  /* req.userData =
    {
      userId: '---id---',
      firstName: 'chirayu',
      lastName: 'joshi',
      email: 'chirayu@gmail.com',
      iat: 1589436507,
      exp: 1589440107
    }
  */
  gfs.files
    .find({
      metadata: {
        uploaderId: req.userData.userId,
        temp: true
      }
    })
    .toArray((err, files) => {
      let imageIds = [];
      if (files && files.length !== 0) {
        files.forEach(file => {
          imageIds.push(file._id);
        });
      }
      const post = new Post({
        _id: new mongoose.Types.ObjectId(),
        uploaderId: req.userData.userId,
        propertyName: req.body.propertyName,
        propertyDescription: req.body.propertyDescription,
        propertyArea: req.body.propertyArea,
        propertyType: req.body.propertyType,
        guestCapacity: req.body.guestCapacity,
        rooms: req.body.rooms,
        beds: req.body.beds,
        amenities: req.body.amenities,
        facilities: req.body.facilities,
        imageIds: imageIds,
        location: req.body.location,
        address: req.body.address,
        price: req.body.price,
        schedule: req.body.schedule,
        rules: req.body.rules,
        languages: req.body.languages
      });
      post
        .save()
        .then(result => {
          console.log(result);
          // Change temp label of images to permanent.
          gfs.files
            .updateMany(
              { metadata: { uploaderId: req.userData.userId, temp: true } }, 
              { $set: { metadata: { uploaderId: req.userData.userId, temp: false } } });
          res.status(201).json({
            message: 'Post published'
          });
        })
        .catch(err => {
          console.log(err);
          res.status(500).json({
            error: err
          });
        });
    });
});

// For deleting images from girdfs.
router.delete('/discard', (req, res, next) => {
  gfs.files
    .find({
      metadata: {
        uploaderId: req.userData.userId,
        temp: true
      }
    })
    .toArray((err, files) => {
      if (files && files.length !== 0) {
        files.forEach(file => {
          gfs.remove({ _id: file._id, root: 'uploads' }, (err, gridStore) => {
            if (err) {
              console.log(err);
              return res.status(404).json({ error: err });
            }
          });
        });
        res.status(200).json({
          message: 'Discarded'
        });
      }
    });
});

module.exports = router;
