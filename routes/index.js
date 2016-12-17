var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.render('index', {
        title: 'Home',
        user: req.session.user
    });
});

router.post('/csp-report', function(req, res) {
        console.log(req.body);
        res.end();
});

module.exports = router;
