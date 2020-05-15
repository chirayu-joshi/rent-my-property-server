const express = require('express');
const router = express.Router();

const Post = require('../models/Post');

// To get location of all posts
router.get('/locations', (req, res, next) => {
  Post.find({}, 'location')
    .exec()
    .then(resp => {
      res.status(200).json({
        message: 'Location fetched',
        locations: resp
      });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
});

// To get location, price, name, propertyArea
router.get('/markers', (req, res, next) => {
  Post.find({}, 'propertyName propertyArea address.country imageIds location price')
    .exec()
    .then(resp => {
      res.status(200).json({
        message: 'Data fetched',
        markersData: resp
      });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      })
    });
});

// 'posts' route only returns basic details, 
// detailed information are returned by 'post' route.
router.get('/posts/:countryCode', (req, res, next) => {
  Post.find({ 'address.country': req.params.countryCode },
    'location address imageIds propertyName propertyDescription propertyArea propertyType guestCapacity price reviews')
    .exec()
    .then(resp => {
      res.status(200).json({
        posts: resp
      });
    })
    .catch(err => {
      res.status(404).json({
        error: err
      });
    });
});

module.exports = router;
