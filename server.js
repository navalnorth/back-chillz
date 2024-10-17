const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const connectToDb = require('./db.js');
require('dotenv').config();
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');



const app = express();
app.use(bodyParser.json());

// Utiliser CORS pour toutes les routes
app.use(cors());

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API Chills',
            version: '0.0.1',
            description: 'API Chills est une interface pour accéder à des informations sur les films et les séries, permettant aux utilisateurs de rechercher par titre, genre et note. Cette API offre des fonctionnalités de recherche avancées pour améliorer l\'expérience utilisateur, en fournissant des données provenant de diverses sources de films et de séries.',
            contact: {
                name: 'Tochska',
            },
            servers: [{ url: 'http://localhost:3001/' }]
        }
    },
    apis: ['./apiRequest/*.js', './routes/*.js']
}

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

connectToDb();

const userRoutesHistorique = require('./routes/historique.js')
const userRoutesFavoris = require('./routes/favoris.js')
const userRoutesUsers = require('./routes/users')
app.use('/api/users', userRoutesUsers, userRoutesFavoris, userRoutesHistorique);

const retrievegetMovieIdByTitle = require('./apiRequest/retrievegetMovieIdByTitle.js');
app.use('/api/search/film', retrievegetMovieIdByTitle);

const retrievegetSeriesIdByTitle = require('./apiRequest/retrievegetSeriesIdByTitle.js');
app.use('/api/search/serie', retrievegetSeriesIdByTitle);

const listGetGenre = require('./apiRequest/listGetGenre.js');
app.use('/api/search/genre', listGetGenre);

const listgetSeriesOrderByRatings = require('./apiRequest/listgetSeriesOrderByRatings.js')
app.use('/api/search/seriebyrating', listgetSeriesOrderByRatings);

const listgetFilmsOrderByRatings = require('./apiRequest/listgetFilmsOrderByRatings.js')
app.use('/api/search/filmbyrating', listgetFilmsOrderByRatings);

const listFilmByActor = require('./apiRequest/listFilmByActor.js')
app.use('/api/search/filmbyactorname', listFilmByActor)

const listSerieByActor = require('./apiRequest/listSerieByActor.js')
app.use('/api/search/seriebyactorname', listSerieByActor)

const getActorInfo = require('./apiRequest/getActorInfo.js')
app.use('/api/search/actorDetail', getActorInfo)

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})