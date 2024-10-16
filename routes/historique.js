const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const mysql = require("mysql2");
require("dotenv").config();
const connectToDb = require("../db.js");
const jwt = require("jsonwebtoken");



/**
 * @swagger
 * /historique/{id}:
 *   post:
 *     summary: Ajouter un film à l'historique d'un utilisateur
 *     tags:
 *       - Historique
 *     description: Ajoute un film à l'historique d'un utilisateur si celui-ci n'est pas déjà présent.
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
 *               filmVu:
 *                 type: string
 *                 example: "Inception"
 *               id_filmAPI:
 *                 type: integer
 *                 example: 12345
 *               loueAchat:
 *                 type: string
 *                 example: "loué"
 *     responses:
 *       201:
 *         description: Film ajouté à l'historique avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Film ajouté à l'historique avec succès !"
 *       400:
 *         description: Film déjà présent dans l'historique
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Le film est déjà dans votre historique."
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
router.post("/historique/:id/", async (req, res) => {
  try {
    const db = await connectToDb();
    if (!db) {
      return res.status(500).json({ message: "Erreur de connexion à la base de données" })
    }

    const userId = parseInt(req.params.id)

    // Vérifier si l'id est bien un nombre entier positif
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ message: "L'ID utilisateur fourni est invalide." });
    }

    const { filmVu, id_filmAPI, loueAchat } = req.body

    const [dejaHistorique] = await db.query('SELECT * FROM historique WHERE id_user = ? AND filmVu = ? AND id_filmAPI = ? AND loueAchat = ?', [userId, filmVu, id_filmAPI, loueAchat])
    if (dejaHistorique.length > 0) {
      return res.status(400).json({ message: "Le film est dèja dans votre historique." })
    }

    await db.query("INSERT INTO historique (id_user, filmVu, id_filmAPI, loueAchat) VALUES (?, ?, ?, ?)", [userId, filmVu, id_filmAPI, loueAchat])

    return res.status(201).json({ message: "Film ajouté a l'historique avec succès !" })

  } catch (err) {
    console.error("Erreur lors de l'ajout du film aux historique :", err);

    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
});



/**
 * @swagger
 * /historiqueTout/{id}:
 *   get:
 *     summary: Récupérer l'historique des films d'un utilisateur
 *     tags:
 *       - Historique
 *     description: Récupère la liste des films que l'utilisateur a regardés.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de l'utilisateur
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste de l'historique récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 historique:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_user:
 *                         type: string
 *                         example: "1"
 *                       filmVu:
 *                         type: string
 *                         example: "Inception"
 *                       id_filmAPI:
 *                         type: integer
 *                         example: 12345
 *                       loueAchat:
 *                         type: string
 *                         example: "loué"
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
router.get('/historiqueTout/:id', async (req, res) => {
  try {
    const db = await connectToDb()
    if (!db) {
      return res.status(500).json({ message: 'Erreur de connexion à la ase de données' })
    }

    const userId = parseInt(req.params.id)

    // Vérifier si l'id est bien un nombre entier positif
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ message: "L'ID utilisateur fourni est invalide." });
    }

    const [historique] = await db.query("SELECT * FROM historique where id_user = ?", [userId])

    if (historique.length === 0) {
      return res.status(404).json({ message: 'Aucun film trouvé pour cet utilisateur.' })
    }

    return res.status(200).json({ historique })
  } catch (err) {
    console.error("Erreur lors de l'ajout de la liste des historique", err);
    return res.status(500).json({ message: "Erreur interne du serveur" })
  }
})



module.exports = router