const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const mysql = require('mysql2')
require('dotenv').config();
const connectToDb = require('../db.js');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const validator = require('validator');

const twoFA = {}

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
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        }

        const { username, nom, prenom, age, email, mdp } = req.body;

        // Vérification des champs
        const champsRequis = ['username', 'nom', 'prenom', 'age', 'email', 'mdp'];
        for (const champ of champsRequis) {
            if (!req.body[champ]) {
                return res.status(400).json({ message: `Le champ ${champ} est manquant` });
            }
        }

        // Validation de la longueur du champ username
        if (username.length < 3) {
            return res.status(400).json({ message: "La longueur du username doit être égale ou supérieure à 3" });
        }

        // Validation du format du champ email
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Le format de l'email est invalide" });
        }

        // Vérification si l'email est déjà utilisé
        const emailCheck = 'SELECT * FROM users WHERE email = ?';
        const [emailCheckResult] = await db.query(emailCheck, [email]);
        if (emailCheckResult.length > 0) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        // Vérification si le username est déjà utilisé
        const usernameCheck = 'SELECT * FROM users WHERE username = ?';
        const [usernameCheckResult] = await db.query(usernameCheck, [username]);
        if (usernameCheckResult.length > 0) {
            return res.status(400).json({ message: "Ce username est déjà utilisé." });
        }

        // Validation de la longueur du mot de passe
        if (!validator.isLength(mdp, { min: 12 })) {
            return res.status(400).json({ message: "Le mot de passe doit contenir au moins 12 caractères." });
        }

        // Vérification des critères supplémentaires pour le mot de passe
        const hasUpperCase = /[A-Z]/.test(mdp);
        const hasLowerCase = /[a-z]/.test(mdp);
        const hasNumber = /\d/.test(mdp);
        const hasSpecialChar = /[^\w\s]/.test(mdp);

        if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
            return res.status(400).json({
                message: "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial."
            });
        }

        const hashedmdp = await bcrypt.hash(mdp, 10);

        const sql = 'INSERT INTO users (username, prenom, nom, age, email, mdp) VALUES (?, ?, ?, ?, ?, ?)';
        const [results] = await db.query(sql, [username, prenom, nom, age, email, hashedmdp]);
        res.status(201).json({ message: 'Utilisateur créé' });

    } catch (err) {
        console.error('Erreur lors de la création de l\'utilisateur :', err);
        res.status(500).send(err);
    }
});




/**
 * @swagger
 * /login:
 *   post:
 *     summary: Connexion d'un utilisateur
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
 *               mdp:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Code de vérification envoyé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Code de vérification envoyé. Veuillez vérifier votre email."
 *       401:
 *         description: Email ou mot de passe incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email ou mot de passe incorrect"
 *       500:
 *         description: Erreur lors de l'envoi de l'email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur lors de l'envoi de l'email."
 *                 error:
 *                   type: string
 *                   example: "Détails de l'erreur"
 */
router.post('/login', async (req, res) => {
    try {
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        }

        const { username, mdp } = req.body;

        // Validation des entrées
        if (!username || !mdp) {
            return res.status(400).json({ message: 'Nom d\'utilisateur et mot de passe sont requis.' });
        }

        // Validation de la longueur du champ username
        if (username.length < 3) {
            return res.status(400).json({ message: "La longueur du username doit être égale ou supérieure à 3" });
        }

        // Validation de la longueur et de la complexité du mot de passe
        if (!validator.isLength(mdp, { min: 12 })) {
            return res.status(400).json({ message: "Le mot de passe doit contenir au moins 12 caractères." });
        }

        const hasUpperCase = /[A-Z]/.test(mdp);
        const hasLowerCase = /[a-z]/.test(mdp);
        const hasNumber = /\d/.test(mdp);
        const hasSpecialChar = /[^\w\s]/.test(mdp);

        if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
            return res.status(400).json({
                message: "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial."
            });
        }

        // Vérification de l'utilisateur dans la base de données
        const sql = 'SELECT * FROM users WHERE username = ?';
        const [results] = await db.query(sql, [username]);

        if (results.length === 0) {
            return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(mdp, user.mdp);

        if (!isMatch) {
            return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }

        // Génération du code 2FA
        const code2FA = crypto.randomInt(100000, 999999); // ou utiliser randomBytes
        // Envisager d'utiliser une base de données ou Redis pour stocker le code 2FA

        twoFA[user.username] = { code: code2FA, expiresIn: Date.now() + 10 * 60 * 1000 };

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Votre code de vérification 2FA',
            html: `<div style="font-family: Arial, sans-serif; text-align: center;">
                    <h2 style="color: #ff0000;">Code d'authentification</h2>
                    <p style="font-size: 18px;">Voici votre code pour vous connecter à <strong>Chills</strong>:</p>
                    <div style="font-size: 24px; font-weight: bold; background-color: #f0f0f0; padding: 10px; display: inline-block;">
                    ${code2FA}
                    </div>
                    <p style="font-size: 14px; color: #ff0000;">Ce code est valable pendant 10 minutes.</p>
                    </div>`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Code de vérification envoyé. Veuillez vérifier votre email.' });

    } catch (err) {
        console.error('Erreur lors de l\'envoi de l\'email :', err);
        res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email.', error: err.message });
    }
});



/**
 * @swagger
 * /verify-2fa:
 *   post:
 *     summary: Vérifier le code 2FA
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
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Authentification réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Authentification réussie"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Code 2FA invalide ou expiré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Le code 2FA a expiré ou est invalide"
 *       500:
 *         description: Erreur serveur
 */
router.post('/verify-2fa', async (req, res) => {
    const { username, code } = req.body;

    // Vérifier si un code 2FA a été généré pour cet utilisateur
    const authInfo = twoFA[username];
    if (!authInfo || authInfo.expiresIn < Date.now()) {
        return res.status(401).json({ message: 'Le code 2FA a expiré ou est invalide' });
    }

    // Vérifier si le code 2FA est correct
    if (authInfo.code !== parseInt(code)) {
        return res.status(401).json({ message: 'Code 2FA incorrect' });
    }

    // Supprimer le code 2FA après utilisation
    delete twoFA[username];

    // Rechercher l'utilisateur dans la base de données pour générer le token
    const db = await connectToDb();
    const sql = 'SELECT * FROM users WHERE username = ?';
    const [results] = await db.query(sql, [username]);
    if (results.length === 0) {
        return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    const user = results[0];

    // Générer le token JWT avec la clé secrète de l'environnement
    const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Retourner le token JWT après authentification réussie
    res.status(200).json({ message: 'Authentification réussie', token: token });
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
        if (!db) {
            return res.status(500).json({ message: "Erreur à la base de données" })
        }

        const userId = parseInt(req.params.id);

        // Vérifier si l'id est bien un nombre entier positif
        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({ message: "L'ID utilisateur fourni est invalide." });
        }

        const [results] = await db.query(`SELECT username, prenom, nom, age, email FROM users WHERE id_user = ?`, [userId])

        if (results.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé !' })
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
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const userId = parseInt(req.params.id);

        // Vérifier si l'id est bien un nombre entier positif
        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({ message: "L'ID utilisateur fourni est invalide." });
        }

        const { username, email } = req.body;

        // Vérifier si les champs sont présents
        if (!username || !email) {
            return res.status(400).json({ message: "Le nom d'utilisateur ou l'email est manquant." });
        }

        // Vérification si l'email est déjà utilisé par un autre utilisateur
        const emailCheck = 'SELECT * FROM users WHERE email = ? AND id != ?';
        const [emailCheckResult] = await db.query(emailCheck, [email, userId]);
        if (emailCheckResult.length > 0) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        // Vérification si le username est déjà utilisé par un autre utilisateur
        const usernameCheck = 'SELECT * FROM users WHERE username = ? AND id != ?';
        const [usernameCheckResult] = await db.query(usernameCheck, [username, userId]);
        if (usernameCheckResult.length > 0) {
            return res.status(400).json({ message: "Ce nom d'utilisateur est déjà utilisé." });
        }

        // Requête SQL pour mettre à jour les informations
        const sql = 'UPDATE users SET username = ?, email = ? WHERE id = ?';
        await db.query(sql, [username, email, userId]);

        res.status(200).json({ message: 'Profil mis à jour avec succès !' });
    } catch (err) {
        console.error("Erreur lors de la mise à jour du profil :", err);
        res.status(500).json({ message: "Erreur lors de la mise à jour du profil.", error: err.message });
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
        if (!db) {
            return res.status(500).json({ message: "Erreur à la base de données" })
        }

        const userId = parseInt(req.params.id);

        // Vérifier si l'id est bien un nombre entier positif
        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({ message: "L'ID utilisateur fourni est invalide." });
        }

        const { oldmdp, newmdp } = req.body;

        // Vérification des champs manquants
        if (!oldmdp || !newmdp) {
            return res.status(400).json({ message: "L'ancien ou le nouveau mot de passe est manquant." });
        }

        // Récupération de l'utilisateur
        const sql = `SELECT mdp FROM users WHERE id = ?`;
        const [userResult] = await db.query(sql, [userId]);

        if (userResult.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé !' });
        }

        const user = userResult[0];

        // Vérification de l'ancien mot de passe
        const isMatch = await bcrypt.compare(oldmdp, user.mdp);
        if (!isMatch) {
            return res.status(400).json({ message: 'Ancien mot de passe incorrect !' });
        }

        // Validation du nouveau mot de passe
        if (!validator.isLength(newmdp, { min: 12 })) {
            return res.status(400).json({ message: "Le mot de passe doit contenir au moins 12 caractères." });
        }

        const hasUpperCase = /[A-Z]/.test(newmdp);
        const hasLowerCase = /[a-z]/.test(newmdp);
        const hasNumber = /\d/.test(newmdp);
        const hasSpecialChar = /[^\w\s]/.test(newmdp);

        if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
            return res.status(400).json({
                message: "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial."
            });
        }

        // Hachage du nouveau mot de passe
        const hashedmdp = await bcrypt.hash(newmdp, 10);

        // Mise à jour du mot de passe et de la date de modification (edited_at)
        const updatesql = 'UPDATE users SET mdp = ?, edited_at = NOW() WHERE id = ?';
        await db.query(updatesql, [hashedmdp, userId]);

        res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (err) {
        console.error('Erreur lors de la mise à jour du mot de passe :', err);
        res.status(500).json({ message: 'Erreur serveur', error: err });
    }
});




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
        if (!db) {
            return res.status(500).json({ message: "Erreur à la base de données" })
        }

        const userId = parseInt(req.params.id)

        // Vérifier si l'id est bien un nombre entier positif
        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({ message: "L'ID utilisateur fourni est invalide." });
        }

        const deleteSQL = 'DELETE FROM users WHERE id_user = ?'

        await db.query(deleteSQL, [userId])

        res.status(200).json({ message: 'Compte supprimé avec succès' })
    } catch (err) {

        console.error('Erreur lors de la suppression du compte :', err);
        res.status(500).json({ message: 'Erreur serveur', error: err });
    }
})



module.exports = router