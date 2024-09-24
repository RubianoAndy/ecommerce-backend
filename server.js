require('dotenv').config();
const express = require('express');
const cors = require('cors');

const port = process.env.SERVER_PORT;

const app = express();
app.use(express.json());
app.disable('x-powered-by');
app.use(cors());

app.use(cors({
    origin: process.env.NEXTJS_FRONTEND_CORS
}));

app.get('/', (req, res) => {
    res.send('¡Hola Mundo desde Express!');
});

app.listen(port, () => {
    console.log(`Servidor en ejecución en http://localhost:${port}/`);
});