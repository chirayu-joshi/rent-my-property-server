const http = require('http');
const express = require('express');
const router = express.Router();
const mapQuestApiUrl = require('../configs/default').mapQuestApiUrl;
const mapQuestApiKey = require('../configs/secret').mapQuestApiKey;
const ipstackApiUrl = require('../configs/default').ipstackApiUrl;
const ipstackApiKey = require('../configs/secret').ipstackApiKey;

router.get('/mapQuest/:location', (req, res, next) => {
  http
    .get(mapQuestApiUrl + '/geocoding/v1/reverse?key=' + mapQuestApiKey + '&location=' + req.params.location, 
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

router.get('/ipstack', (req, res, next) => {
  let ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
  // ip = ip.slice(7);  // 127.0.0.1 will give error
  ip = '49.34.120.218';
  http
    .get(ipstackApiUrl + '/' + ip + '?access_key=' + ipstackApiKey + '&fields=country_code,region_name,city,latitude,longitude',
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

module.exports = router;
