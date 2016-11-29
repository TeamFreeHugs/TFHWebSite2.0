var express = require('express');
var accounts = require('./accounts');
var router = express.Router();

router.get('/', function(req, res) {
    res.render('chat/index', {
        title: 'Chat',
        user: req.session.user
    });
});

module.exports = router;
