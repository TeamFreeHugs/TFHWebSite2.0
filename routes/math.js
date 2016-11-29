var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();

router.get('/', function(req, res) {
    res.render('math/index', {
        title: 'TFH Math Projects',
        user: req.session.user
    });
});

router.get(/^\/.+\/?$/, function(req, res, next) {
    var projectName = req.url.match(/^\/(.+)\/?$/)[1];
    fs.stat(path.join(__dirname, '../views/math/' + projectName + '.pug'), function(err, stat) {
	if (err) {next(); return};
	console.log(projectName);
	res.render('math/'+ projectName, {
	    title: 'TFH ' + projectName,
	    user: req.session.user
        });
    });
});

module.exports = router;
