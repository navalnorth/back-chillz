const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const mysql = require('mysql2')
require('dotenv').config();
const connectToDb = require('../db.js');
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
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        )

        res.status(200).json({ message: 'Utilisateur connecté', token: token });
    } catch (err) { 
        console.error('Erreur lors de la connexion:', err)
        res.status(500).json({ message: 'Erreur de connexion au serveur', error: err }) 
    }
})



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
})



/**
 * @swagger
 * /profile/{id}:
 *   put:
 *     summary: Met à jour le profil d'un utilisateur
 *     tags:
 *       - Utilisateurs
 *     description: Met à jour les informations de profil d'un utilisateur basé sur l'ID fourni.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de l'utilisateur à mettre à jour
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Le nouveau nom d'utilisateur
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 description: Le nouvel e-mail de l'utilisateur
 *                 example: john.doe@example.com
 *               telephone:
 *                 type: string
 *                 description: Le nouveau numéro de téléphone de l'utilisateur
 *                 example: "+33123456789"
 *               ville:
 *                 type: string
 *                 description: La nouvelle ville de l'utilisateur
 *                 example: Paris
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profil mis à jour !"
 *       400:
 *         description: Requête invalide - Paramètres manquants ou incorrects
 *       500:
 *         description: Erreur interne du serveur ou base de données
 */
router.put('/profile/:id', async (req, res) => {
    try {
        const db = await connectToDb()
        if (!db) { return res.status(500).json({ message: "Erreur à la base de données"})}

        const userId = req.params.id
        const { username, email, telephone, ville } = req.body
        
        const sql = (`UPDATE users SET username = ?, email = ?, telephone = ? WHERE id_user = ?`)
        const [results] = await db.query(sql, [username, email, telephone, ville , userId])

        res.status(200).json({ message: 'Profil mis à jour !' })
    } catch (err) {
        res.status(500).send(err)
    }
});



/**
 * @swagger
 * /profile/mdp/{id}:
 *   put:
 *     summary: Met à jour le mot de passe de l'utilisateur
 *     tags:
 *       - Utilisateurs
 *     description: Permet à un utilisateur de mettre à jour son mot de passe en fournissant l'ancien et le nouveau mot de passe.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de l'utilisateur dont le mot de passe doit être mis à jour
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldmdp:
 *                 type: string
 *                 description: Ancien mot de passe de l'utilisateur
 *                 example: "ancienMotDePasse123"
 *               newmdp:
 *                 type: string
 *                 description: Nouveau mot de passe de l'utilisateur
 *                 example: "nouveauMotDePasse456"
 *     responses:
 *       200:
 *         description: Mot de passe mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mot de passe mis à jour avec succès"
 *       400:
 *         description: Ancien mot de passe incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ancien mot de passe incorrect !"
 *       404:
 *         description: Utilisateur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur non trouvé !"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur serveur"
 *                 error:
 *                   type: string
 */
router.put('/profile/mdp/:id', async (req, res) => {
    try {
        const db = await connectToDb()
        if (!db) { return res.status(500).json({ message: "Erreur à la base de données"})}

        const { oldmdp, newmdp } = req.body
        const userId = req.params.id

        const sql = `SELECT mdp FROM users WHERE id_user = ?`
        const [userResult] = await db.query(sql, [userId])

        if (userResult.length ===0) {
            return res.status(404).json({ messag: 'Utilisateur non trouvé !'})
        }

        const user = userResult[0]
        const isMatch = await bcrypt.compare(oldmdp, user.mdp)
        if (!isMatch) {
            return res.status(400).json({ message: 'Ancien mot de passe incorrect !'})
        }

        const hashedmdp = await bcrypt.hash(newmdp, 10)

        const updatesql = 'UPDATE users SET mdp = ? WHERE id_user = ?'
        await db.query(updatesql, [hashedmdp, userId]);
        
        res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (err) {
        console.error('Erreur lors de la mise à jour du mot de passe :', err);
        res.status(500).json({ message: 'Erreur serveur', error: err })
    }
})



/**
 * @swagger
 * /profile/supprimerCompte/{id}:
 *   delete:
 *     summary: Supprime le compte d'un utilisateur
 *     tags:
 *       - Utilisateurs
 *     description: Supprime le compte de l'utilisateur dont l'ID est fourni.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de l'utilisateur dont le compte doit être supprimé
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Compte supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Compte supprimé avec succès"
 *       404:
 *         description: Utilisateur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur non trouvé !"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur serveur"
 *                 error:
 *                   type: string
 */
router.delete('/profile/supprimerCompte/:id', async (req, res) => {
    try {
        const db = await connectToDb()
        if (!db) { return res.status(500).json({ message: "Erreur à la base de données"})}

        const userId = req.params.id

        const deleteSQL = 'DELETE FROM users WHERE id_user = ?'
        await db.query(deleteSQL, [userId])

        res.status(200).json({ message: 'Compte supprimé avec succès'})
    } catch (err) {
        console.error('Erreur lors de la suppression du compte :', err);
        res.status(500).json({ message: 'Erreur serveur', error: err });
    }
})




module.exports = router