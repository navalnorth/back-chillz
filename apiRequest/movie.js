const express = require('express');
const router = express.Router();
require('dotenv').config();
const https = require('https');

router.get('/:film', async (req, res) => {
    try {
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
                'x-rapidapi-host': 'moviesminidatabase.p.rapidapi.com'
            }
        };

        const fetchFilm = () => {
            return new Promise((resolve, reject) => {
                const externalReq = https.request(optionsFilm, (externalRes) => {
                    const chunks = [];

                    externalRes.on('data', (chunk) => {
                        chunks.push(chunk);
                    });

                    externalRes.on('end', () => {
                        const body = Buffer.concat(chunks).toString();
                        const jsonResponse = JSON.parse(body);
                        resolve(jsonResponse);
                    });
                });

                externalReq.on('error', (error) => {
                    console.error('Erreur lors de la requête API:', error);
                    reject(new Error('Erreur lors de la communication avec l\'API externe'));
                });

                externalReq.end();
            });
        };

        const responseFilm = await fetchFilm();
        console.log(responseFilm);

        let imdbId;
        if (responseFilm.results && responseFilm.results.length > 0) {
            imdbId = responseFilm.results[0].imdb_id;
        }

        if (imdbId) {
            console.log(`ID IMDb du film: ${imdbId}`);

            // Requête pour obtenir les détails du film avec l'ID IMDb
            const optionsID = {
                method: 'GET',
                hostname: 'moviesminidatabase.p.rapidapi.com',
                port: null,
                path: `/movie/id/${imdbId}/`,
                headers: {
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                    'x-rapidapi-host': 'moviesminidatabase.p.rapidapi.com'
                }
            };

            const fetchID = () => {
                return new Promise((resolve, reject) => {
                    const externalReq = https.request(optionsID, (externalRes) => {
                        const chunks = [];

                        externalRes.on('data', (chunk) => {
                            chunks.push(chunk);
                        });

                        externalRes.on('end', () => {
                            const body = Buffer.concat(chunks).toString();
                            const jsonResponse = JSON.parse(body);
                            resolve(jsonResponse);
                        });
                    });

                    externalReq.on('error', (error) => {
                        console.error('Erreur lors de la requête API:', error);
                        reject(new Error('Erreur lors de la communication avec l\'API externe'));
                    });

                    externalReq.end();
                });
            };

            const responseId = await fetchID();
            console.log(responseId);

            // Nouvelle requête pour récupérer la distribution (cast) du film
            const optionsCast = {
                method: 'GET',
                hostname: 'moviesminidatabase.p.rapidapi.com',
                port: null,
                path: `/movie/id/${imdbId}/cast/`, // Updated path for movie cast
                headers: {
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                    'x-rapidapi-host': 'moviesminidatabase.p.rapidapi.com'
                }
            };

            const fetchCast = () => {
                return new Promise((resolve, reject) => {
                    const externalReq = https.request(optionsCast, (externalRes) => {
                        const chunks = [];

                        externalRes.on('data', (chunk) => {
                            chunks.push(chunk);
                        });

                        externalRes.on('end', () => {
                            const body = Buffer.concat(chunks).toString();
                            const jsonResponse = JSON.parse(body);
                            resolve(jsonResponse);
                        });
                    });

                    externalReq.on('error', (error) => {
                        console.error('Erreur lors de la requête API:', error);
                        reject(new Error('Erreur lors de la communication avec l\'API externe'));
                    });

                    externalReq.end();
                });
            };

            // Attendre la réponse pour la distribution du film
            const responseCast = await fetchCast();
            console.log(responseCast);

            // Retourner les informations complètes du film et la distribution
            res.status(200).json({
                imdb_id: imdbId,
                filmDetails: responseId,
                cast: responseCast // Ajouter la distribution à la réponse
            });
        } else {
            res.status(404).json({ message: "Film non trouvé" });
        }

    } catch (err) {
        console.error('Erreur côté serveur:', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

module.exports = router;
