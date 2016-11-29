var express = require('express');
var accounts = require('./accounts');
var router = express.Router();

router.get('/signup', function(req, res) {
    if (req.session.user) {
        res.redirect('/');
        return;
    }
    res.render('users/signup', {
        title: 'Signup'
    });
});

router.post('/signup', function(req, res) {
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

router.get('/login', function(req, res) {
    if (req.session.user) {
        res.redirect('/');
        return;
    }
    res.render('users/login', {
        title: 'Login'
    });
});

router.post('/login', function(req, res) {
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
