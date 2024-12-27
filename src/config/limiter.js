const rateLimit = require('express-rate-limit');

const limiter = (maxRequest, maxTimeRequest) => rateLimit({
    windowMs: maxTimeRequest * 60 * 1000,   // Tiempo máximo convertido en milisegundos
    max: maxRequest,                        // Cantidad de peticiones permitidas
    message: `Demasiadas solicitudes desde esta IP, por favor intente nuevamente en ${maxTimeRequest} minutos`,
});

module.exports = limiter;