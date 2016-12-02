var express = require('express');
var accounts = require('./accounts');
var router = express.Router();
var RateLimit = require('express-rate-limit');
var csrf = require('csurf');

csrfInst = csrf({
    cookie: true,
    value: req => (req.body && req.body.csrf) || (req.query && req.query.csrf) || (req.headers['x-csrf-token']) || (req.headers['x-xsrf-token'])
});


var createAccountLimiter = new RateLimit({
    windowMs: 60*60*1000, // 1 hour window 
    delayAfter: 1, // begin slowing down responses after the first request 
    delayMs: 3*1000, // slow down subsequent responses by 3 seconds per request 
    max: 5, // start blocking after 5 requests
    message: "Too many accounts created from this IP, please try again after an hour"
});

var loginLimiter = new RateLimit({
    windowMs: 60*60*1000, // 1 hour window 
    delayAfter: 5, // begin slowing down responses after the first request 
    delayMs: 500, // slow down subsequent responses by 3 seconds per request 
    max: 20, // start blocking after 5 requests
    message: "Too many login attempts from this IP, please try again after an hour"
});

router.get('/signup', csrfInst, function(req, res) {
    if (req.session.user) {
        res.redirect('/');
        return;
    }
    var token = req.csrfToken();
    res.cookie("XSRF-TOKEN",req.csrfToken());
    res.locals.csrfToken = token;
    res.render('users/signup', {
        title: 'Signup',
        csrf: token
    });
});

router.post('/signup', createAccountLimiter, csrfInst, function(req, res) {
    if (req.session.user) {
        res.redirect('/');
        return;
    }
    accounts.signup(req.body, function(state, method) {
        if (state == 1) {
            res.status(400);
            res.header('Content-Type', 'application/json');
            res.send(JSON.stringify({
                reason: "Could not sign up due to " + method + " being used."
            }));
        } else {
            res.header('Content-Type', 'text/plain');
            res.status(204);
            res.end();
        }
    });
});

router.post('/postsignup', function(req, res) {
    res.redirect('/users/login');
});

router.get('/login', csrfInst, function(req, res) {
    if (req.session.user) {
        res.redirect('/');
        return;
    }
    var token = req.csrfToken();
    res.cookie("XSRF-TOKEN",req.csrfToken());
    res.render('users/login', {
        title: 'Login',
        csrf: token
    });
});

router.post('/login', loginLimiter, csrfInst, function(req, res) {
    if (req.session.user) {
        res.redirect('/');
        return;
    }
    accounts.login(req.body, function(state, error, user) {
        if (state == 1) {
            res.status(400);
            res.header('Content-Type', 'application/json');
            res.send(JSON.stringify({
                reason: error
            }));
        } else {
            req.session.user = user;
            res.status(204);
            res.header('Content-Type', 'text/plain');
            res.end();
        }
    });
});

router.post('/postlogin', function(req, res) {
    res.redirect('/');
});

router.post('/logout', function(req, res) {
    if (!req.session.user) {
        res.status(400);
        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify({
            error: 'Not logged in'
        }));
    } else {
        accounts.findUser(req.session.user, function(user) {
            if (user !== null) {
                delete req.session.user;
                res.cookie('sessionID', '', { expires: new Date() });
                res.end();
            } else {
                res.status(400);
                res.header('Content-Type', 'application/json');
                res.send(JSON.stringify({
                    error: 'No such user'
                }));
                res.end();
            }
        })
    }
});

module.exports = router;
