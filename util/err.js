function handleError(res, reason, message) {
    res.status(400);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        error: reason,
        message: message
    }));
    res.end();
}

module.exports = handleError;
