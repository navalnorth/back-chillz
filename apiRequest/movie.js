const express = require('express');
const router = express.Router();
require('dotenv').config();
const https = require('https');


router.get('/:film', async (req, res) => {
    try {
        const film = req.params.film;

        // Encodage de l'URL pour échapper les caractères spéciaux comme les espaces
        const encodedFilm = encodeURIComponent(film);

        const options = {
            method: 'GET',
            hostname: 'moviesminidatabase.p.rapidapi.com',
            port: null,
            path: `/movie/imdb_id/byTitle/${encodedFilm}/`,  // Utilisation du film encodé
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,  // Récupération de la clé depuis .env
                'x-rapidapi-host': 'moviesminidatabase.p.rapidapi.com'
            }
        };

        const externalReq = https.request(options, function (externalRes) {
            const chunks = [];

            externalRes.on('data', function (chunk) {
                chunks.push(chunk);
            });

            externalRes.on('end', function () {
                const body = Buffer.concat(chunks).toString();
                const jsonResponse = JSON.parse(body);

                console.log(jsonResponse);
                const result = []
                result.push(jsonResponse)
                // Retourner la réponse à l'utilisateur
                res.status(200).json(jsonResponse);
            });
        });

        externalReq.on('error', (error) => {
            console.error('Erreur lors de la requête API:', error);
            res.status(500).json({ message: 'Erreur lors de la communication avec l\'API externe' });
        });

        externalReq.end();

    } catch (err) {
        console.error('Erreur côté serveur:', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});


module.exports = router;

