const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const mysql = require('mysql2')

const jwt = require('jsonwebtoken');

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Récupérer tous les utilisateurs
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
 *                   name:
 *                     type: string
 *                     example: toto
 *                   firstname:
 *                     type: string
 *                     example: dupont
 *                   role:
 *                     type: enum
 *                     example: admin
 *                   created_at:
 *                     type: timestamp
 *                     example: 2024-09-02T07:11:31.000Z
 *                      
 */
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
        if (err) { return res.status(500).send(err) }

        const filterUser = results.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            firstname: user.firstname,
            role: user.role,
            created_at: user.created_at
        }));

        res.status(200).json(filterUser);
    });
});




/**
 * @swagger
 * /register:
 *   post:
 *     summary: S'inscrire
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "Toto@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               name:
 *                 type: string
 *                 example: "Dupont"
 *               firstname:
 *                 type: string
 *                 example: "Jean"
 *               role:
 *                 type: string
 *                 example: "user"
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 24
 *                 email:
 *                   type: string
 *                   example: "Toto@example.com"
 *                 message:
 *                   type: string
 *                   example: "Utilisateur créé"
 */
router.post('/register', async (req, res) => {
    const { email, password, name, firstname, role } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)

    const sql = 'INSERT INTO users (email, password, name, firstname, role) VALUES (?, ?, ?, ?, ?)'
    db.query(sql, [email, hashedPassword, name, firstname, role], (err, result) => {
        if (err) { return res.status(500).send(err) }
        res.status(201).send({ message: 'Utilisateur créé' });
    })
})





/**
 * @swagger
 * /login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     description: Authentifie un utilisateur et génère un jeton JWT si les informations sont correctes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
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
 *                   example: Utilisateur connecté
 *                 token:
 *                   type: string
 *                   example: <JWT_TOKEN>
 *       401:
 *         description: Email ou mot de passe incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email ou mot de passe incorrect
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erreur de requête à la base de données
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) { return res.status(500).send(err) }

        if (results.length === 0) { return res.status(401).json({ message: 'Email ou mot de passe incorrect' }) }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) { return res.status(401).json({ message: 'Email ou mot de passe incorrect' }) }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        )

        res.status(200).json({ message: 'Utilisateur connecté', token: token });
    });
});


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, '31HDeuzef3C3RCcrcRCTgfeEFZfrgrz', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}





/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Récupère le profil de l'utilisateur
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
 *                   example: { "id": 1, "email": "user@example.com", "role": "user" }
 *       401:
 *         description: Non autorisé - Jeton manquant ou invalide
 *       403:
 *         description: Accès refusé - Jeton invalide ou expiré
 */
router.get('/profile', authenticateToken, (req, res) => {
    res.json({ message: 'Profil de l\'utilisateur', user: req.user });
});





module.exports = router