const rateLimit = require('express-rate-limit');

const limiter = (maxRequest, maxTimeRequest) => rateLimit({
    windowMs: maxTimeRequest * 60 * 1000,   // 15 minutes
    max: maxRequest,                     // Cantidad de peticiones permitidas
    message: 'Demasiadas solicitudes desde esta IP, por favor intente nuevamente en 15 minutos',
});

module.exports = limiter;