const express = require('express');
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./src/services/auth')

const port = process.env.SERVER_PORT;

const app = express();
app.use(express.json());
app.disable('x-powered-by');
app.use(cors());
app.use(bodyParser.json());

app.use(cors({
    origin: process.env.NEXTJS_FRONTEND_CORS
}));

app.use('/backend/auth', authRoutes)

app.listen(port, () => {
    console.log(`Servidor en ejecución en http://localhost:${port}/`);
});