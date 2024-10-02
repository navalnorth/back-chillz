const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const mysql = require("mysql2");
require("dotenv").config();
const connectToDb = require("../db.js");
const jwt = require("jsonwebtoken");



router.post("/historique/:id", async (req, res) => {
    try {
      const db = await connectToDb();
      if (!db) { return res.status(500).json({ message: "Erreur de connexion à la base de données" })}
  
      const userId = req.params.id
      const { filmVu, id_filmAPI, loueAchat } = req.body
  
      const [dejaHistorique] = await db.query( 'SELECT * FROM historique WHERE id_user = ? AND filmVu = ? AND id_filmAPI = ? AND loueAchat = ?', [userId, filmVu, id_filmAPI, loueAchat] )
      if (dejaHistorique.length > 0) { return res.status(400).json({ message: "Le film est dèja dans votre historique."}) }
  
      await db.query( "INSERT INTO historique (id_user, filmVu, id_filmAPI, loueAchat) VALUES (?, ?, ?, ?)", [userId, filmVu, id_filmAPI, loueAchat])
  
      return res.status(201).json({ message: "Film ajouté a l'historique avec succès !"})
    } catch (err) {
      console.error("Erreur lors de l'ajout du film aux favoris :", err);
      return res.status(500).json({ message: "Erreur interne du serveur." });
    }
  });

  

router.get('/historiqueTout/:id', async (req, res) => {
    try {
        const db = await connectToDb()
        if (!db) { return res.status(500).json({ message: 'Erreur de connexion à la ase de données'})}
        
        const userId = req.params.id

        const [favoris] = await db.query("SELECT * FROM favori where id_user = ?", [userId])
        if (favoris.length === 0) {
            return res.status(404).json({ message: 'Aucun favori trouvé pour cet utilisateur.' })
        }

        return res.status(200).json({ favoris })
    } catch (err) {
        console.error("Erreur lors de l'ajout de la liste des favoris", err);
        return res.status(500).json({ message: "Erreur interne du serveur"})
    }
})



module.exports = router