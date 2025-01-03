const express = require('express');
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');

const registerRequests = require('./src/routes/register');
const authRequests = require('./src/routes/auth');
const forgotPasswordRequests = require('./src/routes/forgot-password');
const changePasswordRequests = require('./src/routes/change-password');
const profileRequests = require('./src/routes/profile');
const correspondencesRequests = require('./src/routes/correspondences');
const usersRequests = require('./src/routes/users');
const rolesRequests = require('./src/routes/roles');
const categoriesRequests = require('./src/routes/categories')

const countriesRequests = require('./src/routes/countries');
const departmentsRequests = require('./src/routes/departments');

const contactRequests = require('./src/routes/contact');

const avatarRequests = require('./src/routes/avatar');

const baseUrl = process.env.BASE_URL;
const port = baseUrl.split(':').pop();

const app = express();

app.use(cors({
    origin: process.env.API_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
}));

app.use(express.json());
app.disable('x-powered-by');
app.use(cors());
app.use(bodyParser.json());

app.use('', registerRequests);
app.use('', forgotPasswordRequests);
app.use('', changePasswordRequests);
app.use('', authRequests);
app.use('', profileRequests);
app.use('', correspondencesRequests);
app.use('', usersRequests);
app.use('', avatarRequests);

app.use('', rolesRequests);
app.use('', categoriesRequests);

app.use('/api', countriesRequests);
app.use('/api', departmentsRequests);

app.use('', contactRequests);

app.use((request, response) => {
    response.status(404).send('<h1>Error 404</h1>')  // Para todas las peticiones que no encuentra, se le coloca el 404, es importante dejar al final de todas las peticiones
});

app.listen(port, () => {
    console.log(`Servidor en ejecución en ${baseUrl}/`);
});