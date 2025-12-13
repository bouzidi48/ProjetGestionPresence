function requestLogger(req, res, next) {
    // Log des informations sur la requête
    console.log(`## requestLogger Middleware: 
        Method: ${req.method}
        URL: ${req.url}
        Body (POST):`, req.body, `
        Query:`, req.query, `
        Params:`, req.params);

    // Appel à next() pour continuer le traitement de la requête
    next();
    // Note: Si `next()` n'est pas appelé, la requête restera bloquée.
}

module.exports = requestLogger;