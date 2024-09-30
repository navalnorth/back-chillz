const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
require('dotenv').config();
const connectToDb = require('../../../../Desktop/Workspace/quiz/back/db');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Récupère la liste des utilisateurs
 *     tags: 
 *       - Utilisateurs
 *     description: Récupère toutes les informations des utilisateurs dans la base de données.
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   username:
 *                     type: string
 *                     example: "johndoe"
 *                   name:
 *                     type: string
 *                     example: "Doe"
 *                   firstname:
 *                     type: string
 *                     example: "John"
 *                   role:
 *                     type: string
 *                     example: "admin"
 *       500:
 *         description: Erreur lors de la récupération des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur de connexion à la base de données"
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Crée un nouvel utilisateur
 *     tags: 
 *       - Utilisateurs
 *     description: Crée un nouvel utilisateur avec un mot de passe haché.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Le nom d'utilisateur
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 description: Le mot de passe de l'utilisateur
 *                 example: "password123"
 *               name:
 *                 type: string
 *                 description: Le nom de l'utilisateur
 *                 example: "Doe"
 *               firstname:
 *                 type: string
 *                 description: Le prénom de l'utilisateur
 *                 example: "John"
 *               role:
 *                 type: string
 *                 description: Le rôle de l'utilisateur
 *                 example: "user"
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
 *       500:
 *         description: Erreur lors de la création de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur lors de la création de l'utilisateur"
 */

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Authentifie un utilisateur
 *     tags: 
 *       - Utilisateurs
 *     description: Authentifie un utilisateur en vérifiant le nom d'utilisateur et le mot de passe, et renvoie un token JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Le nom d'utilisateur
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 description: Le mot de passe de l'utilisateur
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Le token JWT de l'utilisateur
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Nom d'utilisateur ou mot de passe incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mot de passe incorrect"
 *       500:
 *         description: Erreur serveur lors de la tentative de connexion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur serveur"
 */


router.get('/', async (req, res) => {
    try {
        const db = await connectToDb(); // Attendre que la connexion à la base de données soit établie

        if (!db) {
            return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        }

        const [results] = await db.query('SELECT * FROM users'); // Exécuter la requête SQL

        res.status(200).json(results); // Envoyer les résultats au client
    } catch (err) {
        res.status(500).send(err); // Gestion des erreurs
    }
});


router.post('/register', async (req, res) => {
    try {
        const db = await connectToDb(); // Se connecter à la base de données

        if (!db) {
            return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        }

        const { username, password, name, firstname, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10); // Hachage du mot de passe

        const sql = 'INSERT INTO users (username, password, name, firstname, role) VALUES (?, ?, ?, ?, ?)';

        const [results] = await db.query(sql, [username, hashedPassword, name, firstname, role]); // Exécution de la requête SQL

        res.status(201).json({ message: 'Utilisateur créé' }); // Réponse avec succès et l'ID de l'utilisateur créé
    } catch (err) {
        console.error('Erreur lors de la création de l\'utilisateur :', err);
        res.status(500).send(err); // Gestion des erreurs
    }
});


router.post('/login', async (req, res) => {
    try {
        const db = await connectToDb(); // Se connecter à la base de données

        if (!db) {
            return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        }

        const { username, password } = req.body;

        const sql = 'SELECT username, password, role FROM users WHERE username = ?';
        const [results] = await db.query(sql, [username]); // Utilisation de 'await' pour exécuter la requête SQL

        if (results.length === 0) {
            return res.status(401).send('Utilisateur non trouvé');
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password); // Comparaison du mot de passe avec bcrypt

        if (!match) {
            return res.status(401).send({ message: 'Mot de passe incorrect' });
        }

        // Créez le token JWT avec le nom d'utilisateur et le rôle
        const token = jwt.sign({
            username: user.username,
            role: user.role,
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

        // Authentification réussie
        return res.status(200).send({ token, user: { username: user.username, role: user.role } });

    } catch (err) {
        console.error('Erreur lors de la connexion de l\'utilisateur :', err);
        res.status(500).send({ message: 'Erreur serveur' }); // Gestion des erreurs
    }
});




module.exports = router;