const express = require('express');
const router = express.Router();
require('dotenv').config();
const https = require('https');

router.get('/:film', (req, res) => {
    const film = req.params.film;

    // Encodage de l'URL pour échapper les caractères spéciaux comme les espaces
    const encodedFilm = encodeURIComponent(film);

    const optionsFilm = {
        method: 'GET',
        hostname: 'moviesminidatabase.p.rapidapi.com',
        port: null,
        path: `/movie/imdb_id/byTitle/${encodedFilm}/`,
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': process.env.HOST
        }
    };

    const externalReq = https.request(optionsFilm, (externalRes) => {
        const chunks = [];

        externalRes.on('data', (chunk) => {
            chunks.push(chunk);
        });

        externalRes.on('end', () => {
            const body = Buffer.concat(chunks).toString();
            const jsonResponse = JSON.parse(body);
            res.status(200).json(jsonResponse); // Send the response back to the client
        });
    });

    externalReq.on('error', (error) => {
        console.error('Erreur lors de la requête API:', error);
        res.status(500).json({ message: 'Erreur lors de la communication avec l\'API externe' });
    });

    externalReq.end();
});

module.exports = router;
