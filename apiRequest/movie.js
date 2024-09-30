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

                // Log pour vérifier la structure de la réponse
                console.log(jsonResponse);

                // Extraire l'ID IMDb du film
                let imdbId;
                if (jsonResponse.results && jsonResponse.results.length > 0) {
                    imdbId = jsonResponse.results[0].imdb_id; // Extraction de l'ID
                }

                if (imdbId) {
                    console.log(`ID IMDb du film: ${imdbId}`);
                    // Retourner l'ID et les informations du film
                    res.status(200).json({ imdb_id: imdbId, film: jsonResponse.results[0] });
                } else {
                    res.status(404).json({ message: "Film non trouvé" });
                }
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

