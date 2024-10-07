const express = require('express');
const router = express.Router();
require('dotenv').config();
const https = require('https');

/**
 * @swagger
 * /{nom}:
 *   get:
 *     summary: Récupère la filmographie des séries d'un acteur par son nom
 *     description: "Cette route permet de récupérer la filmographie des séries d'un acteur en fonction de son nom en utilisant l'API moviesminidatabase."
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: "Le nom de l'acteur pour lequel récupérer la filmographie des séries."
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Succès de la requête, renvoie la filmographie des séries de l'acteur."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultat:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       imdb_id:
 *                         type: string
 *                         description: "ID IMDb de la série."
 *                       title:
 *                         type: string
 *                         description: "Titre de la série."
 *                       year:
 *                         type: string
 *                         description: "Année de sortie de la série."
 *       404:
 *         description: "Acteur non trouvé ou aucune série disponible."
 *       500:
 *         description: "Erreur lors de la communication avec l'API externe."
 */


router.get('/:name', async (req, res) => {
    const name = req.params.name;
    const encodedName = encodeURIComponent(name);

    const optionActorId = {
        method: 'GET',
        hostname: 'moviesminidatabase.p.rapidapi.com',
        path: `/actor/imdb_id_byName/${encodedName}/`,
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': process.env.HOST
        }
    };

    const getActorId = () => {
        return new Promise((resolve, reject) => {
            const externalReq = https.request(optionActorId, (externalRes) => {
                const chunks = [];
                externalRes.on('data', (chunk) => chunks.push(chunk));
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

    try {
        const actorId = await getActorId();

        let imdbId;
        if (actorId.results && actorId.results.length > 0) {
            imdbId = actorId.results[0].imdb_id;
        }

        if (!imdbId) {
            return res.status(404).send({ message: "Acteur non trouvé" });
        }

        console.log(`ID IMDb de l'acteur: ${imdbId}`);

        const optionSerieByActorId = {
            method: 'GET',
            hostname: 'moviesminidatabase.p.rapidapi.com',
            path: `/series/byActor/${imdbId}/`,
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': process.env.HOST
            }
        };

        const serieByActorId = () => {
            return new Promise((resolve, reject) => {
                const externalReq = https.request(optionSerieByActorId, (externalRes) => {
                    const chunks = [];
                    externalRes.on('data', (chunk) => chunks.push(chunk));
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

        const serieByActor = await serieByActorId();

        // Log de la réponse de l'API pour débogage
        console.log('Réponse série de l\'API:', serieByActor);

        const idSerie = [];
        const series = [];

        // Vérifie que serieByActor et serieByActor.results existent et sont un tableau
        if (serieByActor && Array.isArray(serieByActor.results)) {
            serieByActor.results.forEach((serieData) => {
                const serieDetails = serieData[0]; // Premier élément, contenant imdb_id et title
                idSerie.push(serieDetails.imdb_id); // Stocke l'ID IMDb dans le tableau
            });
        } else {
            console.error('Les résultats de la série sont introuvables ou non valides.');
            return res.status(404).send({ message: "Aucune série trouvée pour cet acteur." });
        }

        const getSerieById = (imdbId) => {
            const optionSerieById = {
                method: 'GET',
                hostname: 'moviesminidatabase.p.rapidapi.com',
                path: `/series/id/${imdbId}/`,
                headers: {
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                    'x-rapidapi-host': process.env.HOST
                }
            };

            return new Promise((resolve, reject) => {
                const externalReq = https.request(optionSerieById, (externalRes) => {
                    const chunks = [];
                    externalRes.on('data', (chunk) => chunks.push(chunk));
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

        for (let i = 0; i < idSerie.length; i++) {
            try {
                const serieDetails = await getSerieById(idSerie[i]);
                series.push(serieDetails); // Stocker chaque série récupérée
                console.log(serieDetails); // Affiche chaque série récupérée
            } catch (error) {
                console.error(`Erreur lors de la récupération de la série avec l'ID ${idSerie[i]}:`, error);
            }
        }

        console.log(series); // Affiche toutes les séries récupérées

        res.status(200).send({ resultat: series });

    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        res.status(500).send({ message: "Erreur lors de la récupération des données" });
    }
});

module.exports = router;
