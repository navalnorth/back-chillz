const mysql = require('mysql2/promise'); // Utilisation de 'mysql2/promise' pour les requêtes asynchrones
require('dotenv').config();

let db = null; // Initialisation de la variable pour la connexion

const connectToDb = async () => {
    const timeStamp = new Date();
    const timeOnly = timeStamp.toLocaleTimeString(); // Format par défaut


    if (db) {
        console.log(timeOnly, 'Already connected to the database');
        return db;
    }

    try {
        db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD, // Ajout du mot de passe si nécessaire
        });

        console.log(timeOnly, 'Connected to database.');
        return db;
    } catch (error) {
        console.error(timeOnly, 'Database connection failed: ', error);
        db = null;
        return null;
    }
};

module.exports = connectToDb;
