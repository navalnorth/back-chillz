
require('dotenv').config();
const request = require('supertest');
const express = require('express');
const connectToDb = require('../db.js');
const router = express.Router();
require('dotenv').config();
const https = require('https');

const app = express();

const retrievegetMovieIdByTitle = require('../apiRequest/retrievegetMovieIdByTitle.js');
app.use('/api/search/film', retrievegetMovieIdByTitle);

const retrievegetSeriesIdByTitle = require('../apiRequest/retrievegetSeriesIdByTitle.js');
app.use('/api/search/serie', retrievegetSeriesIdByTitle);

const listGetGenre = require('../apiRequest/listGetGenre.js');
app.use('/api/search/genre', listGetGenre);

const listgetSeriesOrderByRatings = require('../apiRequest/listgetSeriesOrderByRatings.js')
app.use('/api/search/seriebyrating', listgetSeriesOrderByRatings);

const listgetFilmsOrderByRatings = require('../apiRequest/listgetFilmsOrderByRatings.js')
app.use('/api/search/filmbyrating', listgetFilmsOrderByRatings);


describe('GET /', () => {
    it('Should get an array of movies', async () => {
        const film = 'scream'
        const response = await request(app).get(`/api/search/film/${film}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.results).toBeInstanceOf(Array);
        console.log(response.body); // Ajoutez ceci pour voir la réponse

    });
});