
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
            title: 'API quiz',
            version: '0.0.1',
            description: 'Je suis une super API',
            contact: {
                name: 'Tochska'
            },
            servers: [{ url: 'http://localhost:3000' }]
        }
    },
    apis: ['./apiRequest/*.js']
}

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

connectToDb();

const userRoutes = require('./routes/users')
// const profilRoutes = require('./routes/admin')

app.use('/api/users', userRoutes);
// app.use('/api/admin/', profilRoutes);


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


app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})