/**
 * @fileOverview Tests unitaires pour l'API de recherche de films et de séries.
 * @module apiTest
 */

require('dotenv').config();
const request = require('supertest');
const express = require('express');
const connectToDb = require('../db.js');
const router = express.Router();
require('dotenv').config();
const https = require('https');

const app = express();

// Routes de l'API
const retrievegetMovieIdByTitle = require('../apiRequest/retrievegetMovieIdByTitle.js');
app.use('/api/search/film', retrievegetMovieIdByTitle);

const retrievegetSeriesIdByTitle = require('../apiRequest/retrievegetSeriesIdByTitle.js');
app.use('/api/search/serie', retrievegetSeriesIdByTitle);

const listGetGenre = require('../apiRequest/listGetGenre.js');
app.use('/api/search/genre', listGetGenre);

const listgetSeriesOrderByRatings = require('../apiRequest/listgetSeriesOrderByRatings.js');
app.use('/api/search/seriebyrating', listgetSeriesOrderByRatings);

const listgetFilmsOrderByRatings = require('../apiRequest/listgetFilmsOrderByRatings.js');
app.use('/api/search/filmbyrating', listgetFilmsOrderByRatings);

/**
 * @description Tests pour l'endpoint de recherche de films.
 */
describe('GET /api/search/film/:title', () => {
    it('Should get an array of movies', async () => {
        const film = 'scream';
        const response = await request(app).get(`/api/search/film/${film}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.results).toBeInstanceOf(Array);
        console.log(response.body); // Affiche la réponse dans la console
    });
});

/**
 * @description Tests pour l'endpoint de recherche de séries.
 */
describe('GET /api/search/serie/:title', () => {
    it('Should get an array of series', async () => {
        const series = 'walking';
        const response = await request(app).get(`/api/search/serie/${series}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.results).toBeInstanceOf(Array);
        console.log(response.body); // Affiche la réponse dans la console
    });
});

/**
 * @description Tests pour l'endpoint de récupération des genres.
 */
describe('GET /api/search/genre', () => {
    it('Should get an array of genres', async () => {
        const response = await request(app).get(`/api/search/genre/`);
        expect(response.statusCode).toBe(200);
        expect(response.body.results).toBeInstanceOf(Array);
        console.log(response.body); // Affiche la réponse dans la console
    });
});

/**
 * @description Tests pour l'endpoint de récupération des séries par note.
 */
describe('GET /api/search/seriebyrating', () => {
    it('Should get an array of series by rating', async () => {
        const response = await request(app).get(`/api/search/seriebyrating/`);
        expect(response.statusCode).toBe(200);
        expect(response.body.results).toBeInstanceOf(Array);
        console.log(response.body); // Affiche la réponse dans la console
    });
});

/**
 * @description Tests pour l'endpoint de récupération des films par note.
 */
describe('GET /api/search/filmbyrating', () => {
    it('Should get an array of films by rating', async () => {
        const response = await request(app).get(`/api/search/filmbyrating/`);
        expect(response.statusCode).toBe(200);
        expect(response.body.results).toBeInstanceOf(Array);
        console.log(response.body); // Affiche la réponse dans la console
    });
});