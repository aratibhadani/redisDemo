const redis = require('redis');

var client = redis.createClient({
    host: '127.0.0.1',
    port: 6379
});

module.exports = client;