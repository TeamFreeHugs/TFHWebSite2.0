var express = require('express');
var accounts = require('./accounts');
var router = express.Router();
var RateLimit = require('express-rate-limit');
var csrf = require('csurf');
var url = require('url');
var querystring = require('querystring');
var request = require('request');
var fs = require('fs');

var githubData = JSON.parse(fs.readFileSync('./github-data.json'));
var googleData = JSON.parse(fs.readFileSync('./google-data.json'));

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
        csrf: token,
        githubClientID: githubData.clientID,
        googleClientID: googleData.clientID
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
        csrf: token,
        githubClientID: githubData.clientID,
        googleClientID: googleData.clientID
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

router.get('/github-login', function(req, res) {
    var query = url.parse(req.url).query;
    var code = querystring.parse(query).code;
    if (!code) {
        res.status(400);
        res.header('Content-Type', 'text/plain');
        res.end('No code!');
		return;
    }
    request.post({
        url: 'https://github.com/login/oauth/access_token',
        form: {
            client_id: githubData.clientID,
            client_secret: githubData.clientSecret,
            code: code
        }
    }, function(err, resp, body) {
        var accessToken = querystring.parse(body).access_token;
        request({
            url: 'https://api.github.com/user?access_token=' + accessToken,
            headers: {
                'User-Agent': 'TFHWebsiteSignup'
            }
        }, function(err, resp, body) {
            var userData = JSON.parse(body);
            var userQuery = {$or: [{name: {$regex: new RegExp(userData.login, 'i')}}, {email: userData.email}]};
            mongo.users.findOne(userQuery, function(err, user) {
                if (user == null) { //New User
                    mongo.users.insertOne({
                        name: userData.login,
                        searchName: util.clearChars(userData.login),
                        email: userData.email,
                        github: userData.name
                    }, function(err) {
                        req.session.user = user;
                        res.redirect('/');
                    });
                } else {
                    mongo.users.findOneAndUpdate(userQuery, {$set: {github: userData.name}}, function(err) {
                        req.session.user = user;
                        res.redirect('/');
                    });
                }
            });
        });
    });
});

router.get('/google-login', function(req, res) {
    var referer = req.headers.referer;
    var query = url.parse(req.url).query;
    var code = querystring.parse(query).code;
    if (!code) {
        res.status(400);
        res.header('Content-Type', 'text/plain');
        res.end('No code!');
		return;
    }
    request.post({
        url: 'https://www.googleapis.com/oauth2/v4/token',
        form: {
            code: code,
            client_id: googleData.clientID,
            client_secret: googleData.clientSecret,
            redirect_uri: 'https://minecraft.yeung.online/users/google-login/',
            grant_type: 'authorization_code'
        }
    }, function(err, resp, body) {
        var data = JSON.parse(body);
        var accessToken = data.access_token;
        request('https://www.googleapis.com/plus/v1/people/me/openIdConnect?access_token=' + accessToken, function(err, resp, body) {
            var userData = JSON.parse(body);
            var userQuery = {$or: [{name: {$regex: new RegExp(userData.name, 'i')}}, {email: userData.email}]};
            mongo.users.findOne(userQuery, function(err, user) {
                if (user == null) {
                    mongo.users.insertOne({
                        name: userData.name,
                        searchName: util.clearChars(userData.login),
                        email: userData.email,
                        google: userData.name
                    }, function(err) {
                        req.session.user = user;
                        res.redirect('/');
                    });
                } else {
                    mongo.users.findOneAndUpdate(userQuery, {$set: {google: userData.name}}, function(err) {
                        req.session.user = user;
                        res.redirect('/');
                    });
                }
            });
        });
    });
});

module.exports = router;
