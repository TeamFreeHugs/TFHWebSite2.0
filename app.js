var express = require('express');
var util = require('./util/util');

var app = express();
util.setup(app);

module.exports = app;