const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const mysql = require("mysql2");
require("dotenv").config();
const connectToDb = require("../db.js");
const jwt = require("jsonwebtoken");



/**
 * @swagger
 * /favoris/{id}:
 *   post:
 *     summary: Ajouter un film aux favoris d'un utilisateur
 *     tags:
 *       - Favoris
 *     description: Ajoute un film aux favoris d'un utilisateur si celui-ci n'est pas déjà présent.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de l'utilisateur
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_filmAPI:
 *                 type: integer
 *                 example: 12345
 *     responses:
 *       201:
 *         description: Film ajouté aux favoris avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Film ajouté aux favoris avec succès !"
 *       400:
 *         description: Film déjà présent dans les favoris
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Le film est dèja dans vos favoris."
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur interne du serveur."
 */
router.post("/favoris/:id", async (req, res) => {
  try {
    const db = await connectToDb();
    if (!db) { return res.status(500).json({ message: "Erreur de connexion à la base de données" })}

    const userId = req.params.id
    const { id_filmAPI } = req.body

    const [dejaFavori] = await db.query( 'SELECT * FROM favori WHERE id_user = ? AND id_filmAPI = ?', [userId, id_filmAPI] )
    if (dejaFavori.length > 0) { return res.status(400).json({ message: "Le film est dèja dans vos favoris."}) }

    await db.query( "INSERT INTO favori (id_user, id_filmAPI) VALUES (?, ?)", [userId, id_filmAPI])

    return res.status(201).json({ message: "Film ajouté aux favoris avec succès !"})
  } catch (err) {
    console.error("Erreur lors de l'ajout du film aux favoris :", err);
    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
});



/**
 * @swagger
 * /favorisTout/{id}:
 *   get:
 *     summary: Récupérer la liste des films favoris d'un utilisateur
 *     tags:
 *       - Favoris
 *     description: Récupère la liste des films que l'utilisateur a ajoutés à ses favoris.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de l'utilisateur
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des favoris récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favoris:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_user:
 *                         type: string
 *                         example: "1"
 *                       id_filmAPI:
 *                         type: integer
 *                         example: 12345
 *       404:
 *         description: Aucun film trouvé pour cet utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Aucun film trouvé pour cet utilisateur."
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur interne du serveur."
 */
router.get('/favorisTout/:id', async (req, res) => {
    try {
        const db = await connectToDb()
        if (!db) { return res.status(500).json({ message: 'Erreur de connexion à la ase de données'})}
        
        const userId = req.params.id

        const [favoris] = await db.query("SELECT * FROM favori where id_user = ?", [userId])
        if (favoris.length === 0) {
            return res.status(404).json({ message: 'Aucun film trouvé trouvé pour cet utilisateur.' })
        }

        return res.status(200).json({ favoris })
    } catch (err) {
        console.error("Erreur lors de l'ajout de la liste de favoris", err);
        return res.status(500).json({ message: "Erreur interne du serveur"})
    }
})



module.exports = router