const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const mysql = require('mysql2')
console.log("changer d'écran")
require('dotenv').config();
const connectToDb = require('../db.js');
const jwt = require('jsonwebtoken');


router.get('/favoris/:id' , async (req, res) => {
    const db = await connectToDb()
    console.log("changer d'écran")
    if (!db) {return res.status(500).json({ message: 'Erreur de connexion à la base de données' })}

    const userId = req.params.id


    const [results] = await db.query("")

})