var express = require('express');
var accounts = require('./accounts');
var router = express.Router();
var RateLimit = require('express-rate-limit');
var csrf = require('csurf');
var url = require('url');
var querystring = require('querystring');
var request = require('request');
var fs = require('fs');
var crypto = require('crypto');
var OAuthServer = require('../util/oauth');
var loginUtil = require('../util/loginutil');
var handleError = require('../util/err');
var util = require('../util/util');

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
            handleError(res, 'AlreadyExistsError', 'Could not sign up due to ' + method + ' being used.');
        } else {
            res.header('Content-Type', 'text/plain');
            res.status(204);
            res.end();
        }
    });
});

router.post('/postsignup', function(req, res) {
    res.redirect('/users/login?signup=true');
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
            handleError(res, 'InvalidAuthError', error);
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
        handleError(res, 'NotLoggedInError', 'You are not logged in.');
    } else {
        accounts.findUser(req.session.user, function(user) {
            delete req.session.user;
            if (user !== null) {
                res.cookie('sessionID', '', { expires: new Date() });
                res.end();
            } else {
                handleError(res, 'NoSuchUserError', 'There is no such user associated with your account.');
            }
        })
    }
});

router.get('/github-login-redir', function(req, res) {
    var state = crypto.randomBytes(16).toString('hex');
    var url = 'https://github.com/login/oauth/authorize?client_id=' + githubData.clientID + '&redirect_uri=https://minecraft.eyeball.online/users/github-login/&scope=user:email&state=' + state;
    OAuthServer.addState('github', state);
    res.redirect(url);
});

router.get('/google-login-redir', function(req, res) {
    var state = crypto.randomBytes(16).toString('hex');
    var url = 'https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=' + googleData.clientID + '&redirect_uri=https://minecraft.eyeball.online/users/google-login/&scope=profile email openid&state=' + state;
    OAuthServer.addState('google', state);
    res.redirect(url);
});

router.get('/github-login', function(req, res) {
    new OAuthServer(req, res, 'github',
    'https://github.com/login/oauth/access_token', githubData.clientID, githubData.clientSecret, 'https://minecraft.eyeball.online/users/github-login/', (accessToken) => {
        request({
             url: 'https://api.github.com/user?access_token=' + accessToken,
             headers: {
              'User-Agent': 'TFHWebsiteSignup'
             }
        }, function(err, resp, body) {
            var userData = JSON.parse(body);
            var userQuery = {$or: [{name: {$regex: new RegExp(userData.login, 'i')}}, {email: userData.email}]};
            mongo.users.findOne(userQuery, function(err, user) {
                if (user == null) { //Signup
                    user = {
                        name: userData.login,
                        searchName: util.clearChars(userData.login),
                        email: userData.email,
                        github: userData.name,
                        google: null
                    };
                    mongo.users.insertOne(user, err => {
                        req.session.user = user;
                        res.redirect('/');
                    });
                } else {
                    loginUtil.handleOAuthLogin(req, res, user, 'Github', userData.name);
                }
            });
        });
    });
});

router.get('/google-login', function(req, res) {
    new OAuthServer(req, res, 'google',
    'https://www.googleapis.com/oauth2/v4/token', googleData.clientID, googleData.clientSecret, 'https://minecraft.eyeball.online/users/google-login/', (accessToken) => {
        request('https://www.googleapis.com/plus/v1/people/me/openIdConnect?access_token=' + accessToken, function(err, resp, body) {
            var userData = JSON.parse(body);
            console.log(userData);
            var userQuery = {$or: [{name: {$regex: new RegExp(userData.name, 'i')}}, {email: userData.email}]};
            mongo.users.findOne(userQuery, (err, user) => {
                if (user == null) { //Signup
                    user = {
                        name: userData.name,
                        searchName: util.clearChars(userData.name),
                        email: userData.email,
                        google: userData.name,
                        github: null
                    }
                    mongo.users.insertOne(user, err => {
                        req.session.user = user;
                        res.redirect('/');
                    });
                } else {
                    loginUtil.handleOAuthLogin(req, res, user, 'Google', userData.name);
                }
            });
        });
    });
});

router.get('/linking-pending', function(req, res) {
    res.render('users/linking-pending', {
        title: 'Linking Pending'
    });
});

router.get('/linking-complete', function(req, res) {
    res.render('users/linking-complete', {
        title: 'Linking Complete'
    });
});

router.get('/confirm-linking', function(req, res) {
    var id = querystring.parse(url.parse(req.url).query).id;
    if (!id) {
        handleError(res, 'MissingFieldError', 'Invalid code.');
        return;
    }
    mongo.pendingItems.findOne({
        type: 'account_link',
        code: id
    }, function(err, code) {
        if (!code) {
            handleError(res, 'InvalidFieldError', 'Invalid code.');
            return;
        }
        var user = code.user;
        var set = {};
        set[code.service] = code.username;
        mongo.users.findOneAndUpdate(user, {$set: set}, function(err) {
            user[code.service] = code.username;
            req.session.user = user;
            res.redirect('/');
            mongo.pendingItems.remove(code);
        });
    });
});

router.get('/linking-error', function(req, res) {
    res.render('users/linking-error', {
        title: 'Linking Error'
    });
});

router.get('/signup-confirm', function(req, res) {
    var code = querystring.parse(url.parse(req.url).query).code;
    mongo.pendingItems.findOne({
        code: code,
        type: 'signup_confirm'
    }, function(err, confirm) {
        if (!confirm) {
            handleError(res, 'InvalidFieldError', 'No such code!');
            return;
        }
        var user = confirm.user;
        mongo.pendingItems.remove(confirm);
        mongo.users.findOneAndUpdate(user, {$set: {confirmed: true}}, function(err) {
            res.redirect('/users/login');
        });
    });
});

module.exports = router;
