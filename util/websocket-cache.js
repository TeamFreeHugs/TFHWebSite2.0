var debug = require('debug')('TFH:Sockets');

function WebsocketCache() {}

var cache = {};

WebsocketCache.prototype.addWebsocketConnection = function(websocketConnection, pagePath) {
    if (pagePath.endsWith('/')) {
        pagePath = pagePath.substring(0, pagePath.length - 1);
    }
    if (typeof cache[pagePath] === 'undefined') {
        cache[pagePath] = [];
    }
    var index = cache[pagePath].length;
    cache[pagePath].push(websocketConnection);
    websocketConnection.on('close', function(reasonCode, description) {
        cache[pagePath].splice(index, 1);
        debug('WS Connection #' + index + ' closed. ');
    });
    debug('WS connection to ' + pagePath);
};

WebsocketCache.prototype.getWebsocketsForPage = function(pagePath) {
    if (typeof cache[pagePath] === 'undefined') {
        cache[pagePath] = [];
    }
    return cache[pagePath];
};

WebsocketCache.prototype.broadcastWebsocketMessageForPage = function(pagePath, payload) {
    if (typeof cache[pagePath] === 'undefined') {
        cache[pagePath] = [];
    }
    cache[pagePath].forEach(function(websocket) {
        websocket.send(JSON.stringify(payload));
    });
};

WebsocketCache.prototype.disconnectAllForPage = function(pagePath) {
    if (typeof cache[pagePath] === 'undefined') {
        cache[pagePath] = [];
    }
    cache[pagePath].forEach(function(websocket) {
        websocket.close();
        cache[pagePath].splice(cache[pagePath].indexOf(websocket), 1);
    });
};

module.exports = WebsocketCache;