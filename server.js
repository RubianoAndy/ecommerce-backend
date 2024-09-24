require('dotenv').config();
const express = require('express');

const app = express();

const port = process.env.SERVER_PORT;

app.get('/', (req, res) => {
    res.send('¡Hola Mundo desde Express!');
});

app.listen(port, () => {
    console.log(`Servidor en ejecución en http://localhost:${port}/`);
});