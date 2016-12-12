var querystring = require('querystring');
var url = require('url');
var request = require('request');

var states = {};

function ensureExists(name) {
    if (!states[name]) states[name] = [];
    return states[name];
}

function checkstate(service, state) {
    var arr = ensureExists(service);
    if (arr.indexOf(state) == -1) return false;
    arr.splice(arr.indexOf(state), 1);
    return true;
}

function OAuthServer(req, res, service, tokenExchangeURL, clientID, clientSecret, redirectURI, success, fail) {
    var query = querystring.parse(url.parse(req.url).query);
    var loginCode = query.code;
    var state = query.state;
    if (checkstate(service, state)) {
        request.post({
            url: tokenExchangeURL,
            form: {
                client_id: clientID,
                client_secret: clientSecret,
                code: loginCode,
                redirect_uri: redirectURI,
                grant_type: 'authorization_code'
            }
        }, function(err, resp, body) {
            var accessToken;
            try {
                accessToken = JSON.parse(body).access_token;
            } catch (e) {
                accessToken = querystring.parse(body).access_token;
            }
            success(accessToken);
        });
    } else {
        res.status(400);
        res.header('Content-Type', 'text/plain');
        res.end('Invalid session! Please try logging in from the main site, and not from other sites.');
    }
}

OAuthServer.addState = function(service, state) {
    ensureExists(service).push(state);
}

module.exports = OAuthServer;
