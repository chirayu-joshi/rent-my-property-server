const http = require('http');
const express = require('express');
const router = express.Router();
const ipstackApiUrl = require('../configs/default').ipstackApiUrl;
const ipstackApiKey = require('../configs/secret').ipstackApiKey;
const checkAuth = require('../middlewares/check-auth');

const Post = require('../models/Post');

// ipstack provides limited resources. It is risky to keep this route open.
// If resources are about to finish, use free provider: http://ip-api.com/json
// Similar protected route is 'ext'.
router.get('/position', (req, res, next) => {
  let ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  // ip = ip.slice(7);  // 127.0.0.1 will give error
  ip = '49.34.120.218';
  http
    .get(ipstackApiUrl + '/' + ip + '?access_key=' + ipstackApiKey + '&fields=country_name,country_code,latitude,longitude',
      resp => {
        let data = '';
        resp.on('data', chunk => {
          data += chunk;
        });
        resp.on('end', () => {
          let response = JSON.parse(data);
          res.status(200).json(response);
        });
      })
    .on('error', err => {
      res.status(500).json({
        error: err.message
      });
    });
});

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

// To get details about post from post id.
router.get('/posts/id/:id', (req, res, next) => {
  Post.findOne({ _id: req.params.id })
    .exec()
    .then(resp => {
      res.status(200).json({
        post: resp,
        message: 'Post found successfully'
      });
    })
    .catch(err => {
      res.status(404).json({
        error: err
      });
    });
});

router.post('/post/review', checkAuth, (req, res, next) => {
  Post
    .update(
      { _id: req.body.postId },
      {
        $push: {
          reviews: {
            stars: req.body.stars,
            from: req.userData.firstName + ' ' + req.userData.lastName,
            review: req.body.review
          }
        }
      }
    )
    .exec()
    .then(_ => {
      Post.findOne({ _id: req.body.postId }, 'reviews')
        .exec()
        .then(resp => {
          res.status(200).json({
            message: 'Review added successfully',
            updatedReviews: resp.reviews.reverse()
          });
        })
        .catch(err => {
          res.status(500).json({
            message: 'Review added successfully',
            error: err
          });
        });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
});

router.get('/post/reviews/:postId', (req, res, next) => {
  Post.findOne({ _id: req.params.postId }, 'reviews')
    .exec()
    .then(resp => {
      res.status(200).json({
        message: 'Reviews fetched successfully',
        reviews: resp.reviews.reverse()
      });
    })
    .catch(err => {
      res.status(404).json({
        error: err
      });
    });
});

module.exports = router;
