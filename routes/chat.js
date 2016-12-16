var express = require('express');
var accounts = require('./accounts');
var router = express.Router();
var url = require('url');
var querystring = require('querystring');
var util = require('../util/util');
var handleError = require('../util/err');

router.get('/', function(req, res) {
    res.render('chat/index', {
        title: 'Chat',
        user: req.session.user
    });
});

router.get('/rooms', function(req, res) {
    var next = querystring.parse(url.parse(req.url).query).next || 0;
    var pageSize = 20;
    mongo.chatRooms.find({}).skip(next * pageSize).limit(pageSize).toArray(function(err, rooms) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(rooms));
    });
});

router.post('/add', function(req, res) {
    var user = req.session.user;
    if (!user) {
        handleError(res, 'NotLoggedInError', 'You are not logged in.');
        return;
    }
    util.requestExpectFields([
        'name', 'description'
    ], req, res, function(data) {
        mongo.chatRooms.findOne({name: data.name}, function(err, room) {
            if (room) {
                handleError(res, 'AlreadyExistsError', 'The room you are trying to create already exists');
                return;
            }
            mongo.chatRooms.stats(function(err, stats) {
                room = {
                    name: data.name,
                    description: data.description,
                    owners: [user.name],
                    id: stats.count
                };
                mongo.chatRooms.insert(room, function(err) {
                    res.status(204);
                    res.end();
                });
            });
        });
    });
});

router.get('/add', function(req, res) {
    var user = req.session.user;
    if (!user) {
        res.redirect('/users/login');
        return;
    }
    res.render('chat/add', {
        title: 'Add Chat Room',
        user: user
    });
});

module.exports = router;
