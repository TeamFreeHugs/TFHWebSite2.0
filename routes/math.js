var express = require('express');
var path = require('path');
var fs = require('fs');
var router = express.Router();

router.get('/', function(req, res) {
    res.render('math/index', {
        title: 'Math Projects',
        user: req.session.user
    });
});

router.post('/projects', function(req, res) {
    fs.readdir(path.join(__dirname, '../views/math/'), function(err, files) {	
	var projects = [];
	files.forEach(function(file) {
	    projects.push(path.parse(file).name);
	});
	projects.splice(projects.indexOf('index'), 1);
	res.status(200);
	res.set('Content-Type', 'text/plain');
	res.end(JSON.stringify(projects));
    });
});

router.get(/^\/.+\/?$/, function(req, res, next) {
    var projectName = req.url.match(/^\/(.+)\/?$/)[1];
    fs.stat(path.join(__dirname, '../views/math/' + projectName + '.pug'), function(err, stat) {
	if (err) {next(); return};
	res.render('math/'+ projectName, {
	    title: 'Math: ' + projectName,
	    user: req.session.user
        });
    });
});

module.exports = router;
