const express = require('express');
const router = express.Router();
require('dotenv').config();
const https = require('https');

/**
 * @swagger
 * /:
 *   get:
 *     summary: Récupérer la liste des genres de films
 *     responses:
 *       200:
 *         description: Liste des genres récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Erreur lors de la communication avec l'API externe ou traitement de la requête
 */
router.get('/', (req, res) => {
    const option = {
        method: 'GET',
        hostname: 'moviesminidatabase.p.rapidapi.com',
        port: null,
        path: `/genres/`,
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': process.env.HOST
        }
    };

    const externalReq = https.request(option, (externalRes) => {
        const chunks = [];

        externalRes.on('data', (chunk) => {
            chunks.push(chunk);
        });

        externalRes.on('end', () => {
            try {
                const body = Buffer.concat(chunks).toString();
                const jsonResponse = JSON.parse(body);
                res.status(200).json(jsonResponse); // Send the response back to the client
            } catch (error) {
                console.error('Erreur lors de l\'analyse de la réponse:', error);
                res.status(500).json({ message: 'Erreur lors de l\'analyse de la réponse de l\'API.' });
            }
        });
    });

    externalReq.on('error', (error) => {
        console.error('Erreur lors de la requête API:', error);
        res.status(500).json({ message: 'Erreur lors de la communication avec l\'API externe' });
    });

    externalReq.end();
});


router.get('/:genre', (req, res) => {

    const genre = req.params.genre;
    const encodedNGenre = encodeURIComponent(genre);

    const option = {
        method: 'GET',
        hostname: 'moviesminidatabase.p.rapidapi.com',
        port: null,
        path: `/movie/byGen/${encodedNGenre}/`,
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': process.env.HOST
        }
    };

    const externalReq = https.request(option, (externalRes) => {
        const chunks = [];

        externalRes.on('data', (chunk) => {
            chunks.push(chunk);
        });

        externalRes.on('end', () => {
            try {
                const body = Buffer.concat(chunks).toString();
                const jsonResponse = JSON.parse(body);
                res.status(200).json(jsonResponse); // Send the response back to the client
            } catch (error) {
                console.error('Erreur lors de l\'analyse de la réponse:', error);
                res.status(500).json({ message: 'Erreur lors de l\'analyse de la réponse de l\'API.' });
            }
        });
    });

    externalReq.on('error', (error) => {
        console.error('Erreur lors de la requête API:', error);
        res.status(500).json({ message: 'Erreur lors de la communication avec l\'API externe' });
    });

    externalReq.end();
});


module.exports = router;


