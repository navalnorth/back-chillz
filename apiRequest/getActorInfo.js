const express = require('express');
const https = require('https'); // Ne pas oublier d'importer 'https'
const router = express.Router();

router.get('/:imdbId', async (req, res) => {
    try {
        const imdbId = req.params.imdbId; // Directement obtenir l'ID IMDb depuis l'URL

        // Fonction pour obtenir les détails de l'acteur
        const getActorDetails = () => {
            const optionsActor = {
                method: 'GET',
                hostname: 'moviesminidatabase.p.rapidapi.com',
                port: null,
                path: `/actor/id/${imdbId}/`, // Utilisation directe de l'ID IMDb
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
