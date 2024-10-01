const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const mysql = require('mysql2')
require('dotenv').config();
const connectToDb = require('../db');
const jwt = require('jsonwebtoken');



/**
 * @swagger
 * /register:
 *   post:
 *     summary: S'inscrire
 *     tags:
 *       - Authentification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "user123"
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               mdp:
 *                 type: string
 *                 example: "password123"
 *               nom:
 *                 type: string
 *                 example: "Dupont"
 *               prenom:
 *                 type: string
 *                 example: "Jean"
 *               telephone:
 *                 type: string
 *                 example: "0638494059"
 *               age:
 *                 type: integer
 *                 example: 23
 *               ville:
 *                 type: string
 *                 example: "Paris"
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur créé"
 *       400:
 *         description: Mauvaise requête
 *       500:
 *         description: Erreur serveur
 */
router.post('/register', async (req, res) => {
    try { 
        const db = await connectToDb()
        if (!db) { return res.status(500).json({ message: 'Erreur de connexion à la base de données' }) }

        const { username, nom, prenom, telephone, age, email, mdp, ville } = req.body;
        const hashedmdp = await bcrypt.hash(mdp, 10)

        const sql = 'INSERT INTO users (username, prenom, nom, telephone, age, email, ville, mdp ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

        const [results] = await db.query(sql, [username, prenom, nom, telephone, age, email, ville, hashedmdp ])
        res.status(201).json({ message: 'Utilisateur créé' })
    } catch (err) {
        console.error('Erreur lors de la création de l\'utilisateur :', err)
        res.status(500).send(err)
    }
})



/**
 * @swagger
 * /login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags:
 *       - Authentification
 *     description: Authentifie un utilisateur et génère un jeton JWT si les informations sont correctes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "user123"
 *               mdp:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Utilisateur connecté avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur connecté"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5..."
 *       401:
 *         description: Email ou mot de passe incorrect
 *       500:
 *         description: Erreur de connexion au serveur
 */
router.post('/login', async (req, res) => {
    try {
        const db = await connectToDb()
        if (!db) { return res.status(500).json({ message: 'Erreur de connexion à la base de données' }) }

        const { username, mdp } = req.body;

        const sql = 'SELECT * FROM users WHERE username = ?'
        const [results] = await db.query(sql, [username])
        if (results.length === 0) {return res.status(401).json({ message: 'Email ou mot de passe incorrect' })}

        const user = results[0];
        const isMatch = await bcrypt.compare(mdp, user.mdp);
        if (!isMatch) {return res.status(401).json({ message: 'Email ou mot de passe incorrect' })}

        // Générer le token JWT avec la clé secrète de l'environnement
        const token = jwt.sign(
            { username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        )

        res.status(200).json({ message: 'Utilisateur connecté', token: token });
    } catch (err) { res.status(500).json({ message: 'Erreur de connexion au serveur', error: err }) }
})


/**
 * @swagger
 * /users:
 *   get:
 *     summary: Récupérer tous les utilisateurs
 *     tags:
 *       - Utilisateurs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content: 
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 24
 *                   email:
 *                     type: string
 *                     example: "Toto@example.com"
 *                   username:
 *                     type: string
 *                     example: toto
 *                   nom:
 *                     type: string
 *                     example: Dupont
 *                   prenom:
 *                     type: string
 *                     example: Jean
 *                   telephone:
 *                     type: string
 *                     example: "0638494059"
 *                   age:
 *                     type: integer
 *                     example: 23
 *                   ville:
 *                     type: string
 *                     example: Paris
 *                   role:
 *                     type: string
 *                     example: "admin"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-09-02T07:11:31.000Z"
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/', async (req, res) => {
    try { 
        const db = await connectToDb()
        if (!db) { return res.status(500).json({ message: 'Erreur de connexion à la base de données' })}

        const [results] = await db.query('SELECT * FROM users')
        res.status(200).json(results)
    } catch (err) { res.status(500).send(err) }
});



/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Récupère le profil de l'utilisateur
 *     tags:
 *       - Utilisateurs
 *     description: Renvoie les informations du profil de l'utilisateur authentifié avec un jeton JWT.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Succès - Profil de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profil de l'utilisateur"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     username:
 *                       type: string
 *                       example: "user123"
 *                     role:
 *                       type: string
 *                       example: "user"
 *       401:
 *         description: Non autorisé - Jeton manquant ou invalide
 *       403:
 *         description: Accès refusé - Jeton invalide ou expiré
 */
router.get('/profile/:id', async (req, res) => {
    try {
        const db = await connectToDb()
        if (!db) { return res.status(500).json({ message: "Erreur à la base de données"})}

        const userId = req.params.id
        
        const [results] = await db.query(`SELECT username, prenom, nom, telephone, age, email, ville FROM users WHERE id_user = ?`, [userId])

        if (results.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé'})
        }

        res.status(200).json(results[0])
    } catch (err) {
        res.status(500).send(err)
    }
});




router.put('/profile/:id', async (req, res) => {
    try {
        const db = await connectToDb()
        if (!db) { return res.status(500).json({ message: "Erreur à la base de données"})}

        const userId = req.params.id
        const { username, prenom, nom, telephone, ville } = req.body
        
        const sql = (`UPDATE users SET username = ?, prenom = ?, nom = ?, telephone = ?, ville = ? WHERE id_user = ?`)
        const [results] = await db.query(sql, [username, prenom, nom, telephone, ville, userId])

        res.status(200).json({ message: 'Profil mis à jour !' })
    } catch (err) {
        res.status(500).send(err)
    }
});





module.exports = router