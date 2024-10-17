const express = require('express');
const https = require('https'); // Ne pas oublier d'importer 'https'
const router = express.Router();

router.get('/:name', async (req, res) => {
    try {
        const name = req.params.name;

        // Encodage de l'URL
        const encodedName = encodeURIComponent(name);

        // Option pour la première requête (pour obtenir l'ID IMDb de l'acteur)
        const optionActorId = {
            method: 'GET',
            hostname: 'moviesminidatabase.p.rapidapi.com',
            port: null,
            path: `/actor/imdb_id_byName/${encodedName}/`,
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': process.env.HOST
            }
        };

        // Fonction pour obtenir l'ID IMDb de l'acteur
        const getActorId = () => {
            return new Promise((resolve, reject) => {
                const externalReq = https.request(optionActorId, (externalRes) => {
                    const chunks = [];

                    externalRes.on('data', (chunk) => {
                        chunks.push(chunk);
                    });

                    externalRes.on('end', () => {
                        try {
                            const body = Buffer.concat(chunks).toString();
                            const jsonResponse = JSON.parse(body);
                            resolve(jsonResponse);
                        } catch (error) {
                            reject(new Error('Erreur lors de l\'analyse JSON de la réponse de l\'API acteur.'));
                        }
                    });
                });

                externalReq.on('error', (error) => {
                    console.error('Erreur lors de la requête API pour l\'acteur:', error);
                    reject(new Error('Erreur lors de la communication avec l\'API externe pour l\'acteur'));
                });

                externalReq.end();
            });
        };

        const actorId = await getActorId(); // Obtenir l'ID de l'acteur
        console.log(actorId);

        let imdbId;
        if (actorId.results && actorId.results.length > 0) {
            imdbId = actorId.results[0].imdb_id;
        }

        if (!imdbId) {
            return res.status(404).send({ message: 'Acteur non trouvé.' });
        }

        console.log(`ID IMDb de l'acteur: ${imdbId}`);

        // Fonction pour obtenir les détails de l'acteur
        const getActorDetails = () => {
            const optionsActor = {
                method: 'GET',
                hostname: 'moviesminidatabase.p.rapidapi.com',
                port: null,
                path: `/actor/id/${imdbId}/`,
                headers: {
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY, // Utiliser la clé d'API depuis les variables d'environnement
                    'x-rapidapi-host': process.env.HOST
                }
            };

            return new Promise((resolve, reject) => {
                const externalReq = https.request(optionsActor, (externalRes) => {
                    const chunks = [];

                    externalRes.on('data', (chunk) => {
                        chunks.push(chunk);
                    });

                    externalRes.on('end', () => {
                        try {
                            const body = Buffer.concat(chunks).toString();
                            const jsonResponse = JSON.parse(body);
                            resolve(jsonResponse);
                        } catch (error) {
                            reject(new Error('Erreur lors de l\'analyse JSON de la réponse de l\'API acteur.'));
                        }
                    });
                });

                externalReq.on('error', (error) => {
                    console.error('Erreur lors de la requête API pour les détails de l\'acteur:', error);
                    reject(new Error('Erreur lors de la communication avec l\'API externe pour les détails de l\'acteur'));
                });

                externalReq.end();
            });
        };

        const actorDetail = await getActorDetails(); // Obtenir les détails de l'acteur

        console.log(actorDetail);

        // Envoyer la réponse finale au client
        res.status(200).json(actorDetail);

    } catch (error) {
        console.error('Erreur lors du traitement de la requête:', error);
        res.status(500).send({ message: 'Erreur lors du traitement de la requête.' });
    }
});

module.exports = router;
