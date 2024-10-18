const express = require('express');
const router = express.Router();
require('dotenv').config();
const https = require('https');

router.get('/:imdbId', async (req, res) => {
    try {
        const imdbId = req.params.imdbId;

        const optionsCast = {
            method: 'GET',
            hostname: 'moviesminidatabase.p.rapidapi.com',
            port: null,
            path: `/movie/id/${imdbId}/cast/`,
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': 'moviesminidatabase.p.rapidapi.com'
            }
        };

        // Fonction pour récupérer les informations de la distribution (cast)
        const fetchCast = () => {
            return new Promise((resolve, reject) => {
                const externalReq = https.request(optionsCast, (externalRes) => {
                    const chunks = [];
                    externalRes.on('data', (chunk) => chunks.push(chunk));
                    externalRes.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString())));
                });

                externalReq.on('error', (error) => reject(new Error('Erreur lors de la communication avec l\'API externe')));
                externalReq.end();
            });
        };

        const responseCast = await fetchCast();

        // Détails des acteurs
        const castDetails = [];

        if (responseCast && responseCast.results && Array.isArray(responseCast.results.roles)) {
            // Filtrer pour ne garder que les acteurs
            const actorRoles = responseCast.results.roles
                .filter(role => role.role !== 'Director' && role.role !== 'Writer') // Exclure Director et Writer
                .slice(0, 10); // Limite à 10 acteurs

            for (const role of actorRoles) {
                const actorId = role.actor.imdb_id;

                // Récupération des détails de l'acteur
                const actorDetails = await fetchActorDetails(actorId);
                castDetails.push({
                    name: actorDetails.name,
                    image: actorDetails.image_url
                });
            }
        }

        res.status(200).json({
            imdb_id: imdbId,
            cast: castDetails
        });
    } catch (err) {
        console.error('Erreur côté serveur:', err);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Fonction pour récupérer les détails d'un acteur
const fetchActorDetails = (actorId) => {
    return new Promise((resolve, reject) => {
        const optionsActor = {
            method: 'GET',
            hostname: 'moviesminidatabase.p.rapidapi.com',
            port: null,
            path: `/actor/id/${actorId}/`,
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': 'moviesminidatabase.p.rapidapi.com'
            }
        };

        const externalReq = https.request(optionsActor, (externalRes) => {
            const chunks = [];
            externalRes.on('data', (chunk) => chunks.push(chunk));
            externalRes.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString()).results));
        });

        externalReq.on('error', (error) => reject(new Error('Erreur lors de la communication avec l\'API externe')));
        externalReq.end();
    });
};

module.exports = router;
