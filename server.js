
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
    apis: ['./routes/*.js']
}

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

connectToDb();

// const userRoutes = require('./routes/users')
// const profilRoutes = require('./routes/admin')

// app.use('/api/users', userRoutes);
// app.use('/api/admin/', profilRoutes);

// const searchRoutes = require('./apiRequest/movie.js');
// app.use('/api/search/', searchRoutes)

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})