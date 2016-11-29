var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.render('index', {
        title: 'Home',
        user: req.session.user
    });
});

module.exports = router;
