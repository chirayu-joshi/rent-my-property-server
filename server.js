const http = require('http');
const app = require('./App');

const config = require('./configs/default');

const port = process.env.PORT || config.port;

const server = http.createServer(app);

server.listen(port);
console.log('Access server from http://127.0.0.1:' + port);
