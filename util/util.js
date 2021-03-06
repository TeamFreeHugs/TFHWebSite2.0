var express = require('express');
var helmet = require('helmet');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongo = require('mongodb');
var minify = require('express-minify');
var minifyHTML = require('express-minify-html');
var url = require('url');
var csrf = require('csurf');
var handleError = require('./err');

var websocket = require('websocket');
const WebsocketServer = websocket.server;

var index = require('./../routes/index');
var users = require('./../routes/users');
var chat = require('./../routes/chat');
var math = require('./../routes/math');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var WebsocketCache = require('./websocket-cache');

var compression = require('compression');

var fs = require('fs');

var websocketCache = new WebsocketCache();

var MONGO_SERVER_PATH = 'mongodb://localhost:27017/TFHWebSite';

try {
    var sessionStorage = new MongoStore({
        url: MONGO_SERVER_PATH
    });
} catch (e) {
    throw e
    mongoConnectError();
}

const COOKIE_NAME = 'sessionID';

function enableRateLimiting(app) {
    app.enable('trust proxy');
}

function ensureReferrer(req, res, next) {
    (!req.headers['host'] || req.headers['host'] !== 'minecraft.eyeball.online') ? res.redirect('https://minecraft.eyeball.online' + req.url) : next();
}

function setupMiddleware(app, after) {
    app.use(helmet());
    app.use(helmet.referrerPolicy());
    app.use(helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ['data:', "'self'"],
            sandbox: ['allow-forms', 'allow-scripts'],
            styleSrc: ["'unsafe-inline'", "'self'"],
            reportUri: '/csp-report'
        }
    }));
    app.use(ensureReferrer);
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'pug');

    enableRateLimiting(app);
    app.use(minify());
    app.use(minifyHTML());
    app.use(require('stylus').middleware(path.join(__dirname, '../public')));
    app.use(express.static(path.join(__dirname, '../public')));
    app.use(compression({
        filter: function(req, res) {
            if (req.headers['x-no-compression']) return false;
            return req.method == 'POST';
        }
    }));
    var info = global.mongo.db.collection('info');
    info.findOne({
        type: 'sessionSecret'
    }, function(err, secret) {
        var sessionSecret;
        if (!!secret) {
            sessionSecret = secret.secret;
        } else {
            sessionSecret = require('crypto').randomBytes(32).toString();
            info.insert({
                type: 'sessionSecret',
                secret: sessionSecret
            });
        }

        app.use(session({
            secret: sessionSecret,
            store: sessionStorage,
            resave: true,
            saveUninitialized: true,
            name: COOKIE_NAME,
            httpOnly: true
        }));
        app.use(logger('dev'));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({
            extended: false
        }));
        app.use(cookieParser());
        after();
    });
}

function setupServer(app) {
    setupMiddleware(app, after);
    function after() {
        app.use('/', index);
        app.use('/users', users);
        app.use('/chat', chat);
	app.use('/math', math);
        app.use(function(req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });
        app.use(handleRequestError);
    }
}

function setupWebsocket(server) {
    var websocket = new WebsocketServer({
        httpServer: server,
        autoAcceptConnections: false
    });
    websocket.on('request', function(request) {
        var cookies = request.cookies;
        var wsConnection = request.accept(request.protocol, request.origin);
        cookies.forEach(function(cookie) {
            if (cookie.name === COOKIE_NAME) {
                sessionStorage.get(cookie.value.split(".")[0].split(":")[1], function(err, session) {
                    wsConnection.session = session;
                });
            }
        });
        var path = request.resourceURL.path;
        websocketCache.addWebsocketConnection(wsConnection, path);
    });
}

function mongoConnectError() {
    console.error('Could not connect to a MongoDB instance. Exiting');
    process.exit(2);
}

function setupMongo(cb) {
    var client = new mongo.MongoClient();
    client.connect(MONGO_SERVER_PATH, function(err, db) {
        if (err) {
            mongoConnectError();
        }
        global.mongo = {};
        global.mongo.db = db;
        global.mongo.users = db.collection('users');
        global.mongo.pendingItems = db.collection('pendingItems');
        global.mongo.chatRooms = db.collection('chatRooms');
        global.mongo.chatMessages = db.collection('chatMessages');
        cb();
    });
}

function handleRequestError(err, req, res, next) {
    err.status = err.status || 500
    res.status(err.status);
    var errShortCode = err.status.toString().substring(0, 1) + '00';
    console.log(errShortCode);
    res.render('errors/error' + errShortCode, {
        title: '',
        message: err.message,
        error: err,
        page: require('url').parse(req.url).path,
        user: req.session.user
    });
}

function requestExpectFields(fields, req, res, success, fail) {
    var foundFields = {};
    var hasErrored = false;
    fields.forEach(function(fieldName) {
        if (hasErrored) return;
        if (typeof req.body[fieldName] === 'undefined' || req.body[fieldName].trim() === '') {
            if (fail) fail();
            else {
                handleError(res, 'IncompletePayloadError', 'Expected field ' + fieldName + ' but did not get it.');
                hasErrored = true;
            }
            return;
        }
        foundFields[fieldName] = req.body[fieldName];
    });
    if (hasErrored) return;
    success(foundFields);
}

function readConfig(cb) {
    fs.readFile(process.cwd() + "/config.json", {
        encoding: "utf8"
    }, function(err, data) {
        cb(JSON.parse(data));
    });
}

module.exports.setup = function(app) {
    setupMongo(function() {
        setupServer(app);
    });
};

module.exports.handleError = handleError;
module.exports.setupWebsocket = setupWebsocket;
module.exports.websocketCache = websocketCache;
module.exports.requestExpectFields = requestExpectFields;
module.exports.sessionStorage = sessionStorage;
module.exports.COOKIE_NAME = COOKIE_NAME;
module.exports.readConfig = readConfig;
module.exports.clearChars = function(input) {
    return input.replace(/#/g, '').replace(/ /g, '-');
};
