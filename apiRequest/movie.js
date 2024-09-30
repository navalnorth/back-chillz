const express = require('express');
const router = express.Router();
require('dotenv').config();
const connectToDb = require('../db');

const http = require('https');


router.get('/search/:film', async (req, res) => {
    try {

        const film = req.params.film;

        const options = {
            method: 'GET',
            hostname: 'moviesminidatabase.p.rapidapi.com',
            port: null,
            path: `/movie/imdb_id/byTitle/${film}/`,
            headers: {
                'x-rapidapi-key': '4b1e857466mshc87f9e8bc157972p184376jsn043ac2c26541',
                'x-rapidapi-host': 'moviesminidatabase.p.rapidapi.com'
            }
        };
        
        const req = http.request(options, function (res) {
            const chunks = [];
        
            res.on('data', function (chunk) {
                chunks.push(chunk);
            });
        
            res.on('end', function () {
                const body = Buffer.concat(chunks);
                console.log(body.toString());
            });
        });
        
        req.end();

        res.status(200).json(quiz); // Retourner le quiz avec ses questions

    } catch (err) {
        res.status(500).send(err); // Gestion des erreurs
    }
});