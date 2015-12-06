'use strict';

var express = require('express');
var app = express();
var port = process.env.PORT || 1337;

app.use(express.static(__dirname + '/', {etag: false}));
try {
    app.listen(port);
    console.log('server started on http://localhost:1337/');
} catch (e) {
    console.log('could not start server on 1337 port', e);
}