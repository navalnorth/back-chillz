const express = require('express');
const router = express.Router();
require('dotenv').config();
const connectToDb = require('../../../../Desktop/Workspace/quiz/back/db');

// Route POST pour ajouter un quiz

/** 
 * @swagger
 * /quiz/add:
 *   post:
 *     summary: Ajoute un nouveau quiz
 *     tags: 
 *       - Quiz
 *     description: Cette route permet d'ajouter un nouveau quiz avec ses questions dans la base de données.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Le nom du quiz
 *                 example: "Quiz sur la science"
 *               theme:
 *                 type: string
 *                 description: Le thème du quiz
 *                 example: "Science"
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                       description: Le texte de la question
 *                       example: "Quelle est la formule chimique de l'eau ?"
 *                     reponses:
 *                       type: array
 *                       description: Liste des réponses possibles
 *                       items:
 *                         type: string
 *                       example: ["H2O", "O2", "CO2"]
 *                     bonneReponse:
 *                       type: string
 *                       description: La bonne réponse parmi les réponses possibles
 *                       example: "H2O"
 *     responses:
 *       201:
 *         description: Quiz créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Quiz ajouté avec succès"
 *       400:
 *         description: Données manquantes ou invalides
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Données manquantes ou invalides"
 *       500:
 *         description: Erreur de connexion à la base de données ou autre erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur lors de l'ajout du quiz"
 */

router.post('/quiz/add', async (req, res) => {
    try {
        // Connexion à la base de données
        db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        }

        // Récupération des données de la requête
        const { nom, theme, questions } = req.body;

        // Vérification des données nécessaires
        if (!nom || !theme || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: 'Données manquantes ou invalides' });
        }

        // Insertion du quiz dans la table 'quiz'
        const sqlQuiz = 'INSERT INTO quiz (nom, theme) VALUES (?, ?)';
        const [quizResult] = await db.query(sqlQuiz, [nom, theme]); // Exécution de la requête SQL
        const quizId = quizResult.insertId; // Récupération de l'ID du quiz inséré

        // Préparation des requêtes d'insertion pour les questions
        const sqlQuestions = 'INSERT INTO question (question, reponses, bonne_reponse, id_quiz) VALUES (?, ?, ?, ?)';

        // Traitement des questions
        for (const question of questions) {
            // Filtrer les réponses pour supprimer les réponses vides ou nulles
            const filteredReponses = question.reponses.filter(reponse => reponse && reponse.trim() !== '');

            // Si après filtrage il n'y a plus de réponses, on continue avec l'itération suivante
            if (filteredReponses.length === 0) {
                continue;
            }

            // Convertir les réponses filtrées en JSON
            const reponsesJson = JSON.stringify(filteredReponses);

            // Insertion de la question avec les réponses sous forme de JSON
            await db.query(sqlQuestions, [question.question, reponsesJson, question.bonneReponse, quizId]);
        }

        return res.status(201).json({ message: 'Quiz ajouté avec succès' });

    } catch (error) {
        console.error('Erreur lors de l\'ajout du quiz:', error);
        return res.status(500).json({ message: 'Erreur lors de l\'ajout du quiz' });
    }
});


/** 
 * @swagger
 * /quiz:
 *   get:
 *     summary: Récupère tous les quiz
 *     tags:
 *       - Quiz
 *     description: Cette route retourne la liste complète des quiz.
 *     responses:
 *       200:
 *         description: Liste des quiz
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_quiz:
 *                     type: integer
 *                     example: 1
 *                   nom:
 *                     type: string
 *                     example: "Quiz sur la science"
 *                   theme:
 *                     type: string
 *                     example: "Science"
 *       500:
 *         description: Erreur de connexion à la base de données
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur lors de la récupération des quiz"
 */

router.get('/quiz', async (req, res) => {
    try {
        // Connexion à la base de données
        db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        }
        const [results] = await db.query('SELECT * FROM quiz');

        res.status(200).json(results); // Envoyer les résultats au client
    } catch (err) {
        res.status(500).send(err); // Gestion des erreurs
    }

});

/**
 * @swagger
 * /quiz/check/{username}:
 *   get:
 *     summary: Récupère la liste des quiz auxquels l'utilisateur n'a pas encore répondu
 *     description: Cette route récupère tous les quiz disponibles et filtre ceux auxquels l'utilisateur, identifié par son nom d'utilisateur, n'a pas encore répondu.
 *     tags: 
 *       - Quiz
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom d'utilisateur pour identifier l'utilisateur
 *     responses:
 *       200:
 *         description: Liste des quiz auxquels l'utilisateur n'a pas encore répondu
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_quiz:
 *                     type: integer
 *                     description: ID unique du quiz
 *                   title:
 *                     type: string
 *                     description: Titre du quiz
 *                   description:
 *                     type: string
 *                     description: Brève description du quiz
 *                   other_properties:
 *                     type: string
 *                     description: Autres propriétés du quiz
 *       404:
 *         description: Utilisateur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Utilisateur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erreur interne du serveur
 *                 error:
 *                   type: string
 *                   description: Détails de l'erreur
 */

router.get('/quiz/check/:username', async (req, res) => {
    try {
        // Connexion à la base de données
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        }

        const username = req.params.username;

        // Récupération de l'ID de l'utilisateur
        const sqlRequest = 'SELECT id FROM users WHERE username = ?';
        const [results] = await db.query(sqlRequest, [username]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const userId = results[0].id;

        // Récupérer les id_quiz auxquels l'utilisateur a déjà répondu
        const sqlRequestFromUserResponse = 'SELECT id_quiz FROM reponseuser WHERE id_user = ?';
        const [resultsFromReponsesUser] = await db.query(sqlRequestFromUserResponse, [userId]);

        // Créer une liste d'ID des quiz auxquels l'utilisateur a déjà répondu
        const answeredQuizIds = resultsFromReponsesUser.map(row => row.id_quiz);

        // Récupérer tous les quiz disponibles
        const sqlRequestFromQuiz = 'SELECT * FROM quiz WHERE NOT dispo = 0';
        const [allQuizzes] = await db.query(sqlRequestFromQuiz);

        // Filtrer les quiz auxquels l'utilisateur n'a pas encore répondu
        const unansweredQuizzes = allQuizzes.filter(quiz => !answeredQuizIds.includes(quiz.id_quiz));

        // Si aucun quiz n'est trouvé
        if (unansweredQuizzes.length === 0) {
            return res.status(200).json({ message: 'L\'utilisateur a répondu à tous les quiz.' });
        }

        // Retourner la liste des quiz auxquels l'utilisateur n'a pas encore répondu
        res.status(200).json(unansweredQuizzes);

    } catch (err) {
        console.error('Erreur lors de la récupération des données :', err);
        res.status(500).send({ message: 'Erreur interne du serveur', error: err });
    }
});

router.get('/quiz/finish', async (req, res) => {
    try {
        // Connexion à la base de données
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        }

        const sqlRequestReponses = 'SELECT * FROM reponseuser';
        const [resultReponses] = await db.query(sqlRequestReponses);

        if (resultReponses.length === 0) {
            return res.status(404).json({ message: 'quiz non trouvé' });
        }

        const sqlRequestQuestion = 'SELECT * FROM question';
        const [resultQuestion] = await db.query(sqlRequestQuestion);

        const formattedResult = {
            reponses: resultReponses,
            question: resultQuestion
        }

        res.status(200).json(formattedResult);

    } catch (err) {
        console.error('Erreur lors de la récupération des données :', err);
        res.status(500).send({ message: 'Erreur interne du serveur', error: err });
    }
});

/** 
 * @swagger
 * /quiz/{id}:
 *   get:
 *     summary: Récupère un quiz par son ID
 *     tags:
 *       - Quiz
 *     description: Cette route permet de récupérer un quiz spécifique avec ses questions.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du quiz
 *     responses:
 *       200:
 *         description: Détails du quiz avec ses questions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_quiz:
 *                   type: integer
 *                   example: 1
 *                 nom:
 *                   type: string
 *                   example: "Quiz sur la science"
 *                 theme:
 *                   type: string
 *                   example: "Science"
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_question:
 *                         type: integer
 *                         example: 1
 *                       question:
 *                         type: string
 *                         example: "Quelle est la formule chimique de l'eau ?"
 *                       reponses:
 *                         type: string
 *                         description: Réponses possibles sous forme de JSON
 *                         example: '["H2O", "O2", "CO2"]'
 *                       bonne_reponse:
 *                         type: string
 *                         example: "H2O"
 *       500:
 *         description: Erreur de connexion à la base de données
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur lors de la récupération du quiz"
 */

router.delete('/quiz/:id', async (req, res) => {
    try {
        // Connexion à la base de données
        db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        }

        const id = req.params.id

        const sqlId = 'DELETE FROM quiz WHERE id_quiz = ?';

        const [result] = await db.query(sqlId, [id]); // Exécution de la requête SQL

        res.status(200).send({ message: `'ID numéro ${id} supprimé avec succes'` }); // Envoyer les résultats au client

    } catch (err) {
        res.status(500).send(err); // Gestion des erreurs
    }

});

/** 
 * @swagger
 * /quiz/{id}:
 *   delete:
 *     summary: Supprime un quiz par son ID
 *     tags:
 *       - Quiz
 *     description: Supprime un quiz spécifique par son ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du quiz à supprimer
 *     responses:
 *       200:
 *         description: Quiz supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ID numéro 1 supprimé avec succès"
 *       500:
 *         description: Erreur de connexion à la base de données
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur lors de la suppression du quiz"
 */

router.get('/quiz/:id', async (req, res) => {
    try {
        // Connexion à la base de données
        db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        }

        const id = req.params.id

        const sqlId = 'SELECT * FROM  quiz WHERE id_quiz = ?';
        const sqlQuestions = 'SELECT * FROM question WHERE id_quiz = ?'

        // Exécuter les requêtes
        const [quizResult] = await db.query(sqlId, [id]); // Obtenir les détails du quiz
        const [questionsResult] = await db.query(sqlQuestions, [id]); // Obtenir les questions du quiz

        // Associer les questions au quiz
        const quiz = {
            ...quizResult[0], // Assumer qu'il n'y a qu'un seul quiz correspondant
            questions: questionsResult
        };

        res.status(200).json(quiz); // Retourner le quiz avec ses questions

    } catch (err) {
        res.status(500).send(err); // Gestion des erreurs
    }
});


/** 
 * @swagger
 * /quiz/update:
 *   put:
 *     summary: Met à jour les champs 'dispo' pour plusieurs quiz
 *     tags:
 *       - Quiz
 *     description: Met à jour le champ 'dispo' (disponible ou non) pour un ensemble de quiz donnés.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 id_quiz:
 *                   type: integer
 *                   description: L'ID du quiz à mettre à jour
 *                   example: 1
 *                 dispo:
 *                   type: integer
 *                   description: Statut de disponibilité du quiz (0 ou 1)
 *                   example: 1
 *     responses:
 *       200:
 *         description: Données mises à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Données mises à jour avec succès"
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Les données doivent être un tableau"
 *       500:
 *         description: Erreur serveur ou de connexion à la base de données
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur lors de la mise à jour du quiz"
 */


router.put('/quiz/update', async (req, res) => {
    try {
        // Connexion à la base de données
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        }

        // Récupération des données de la requête
        const data = req.body;

        // Vérification que les données reçues sont bien un tableau
        if (!Array.isArray(data)) {
            return res.status(400).json({ message: 'Les données doivent être un tableau' });
        }

        const sqlUpdate = 'UPDATE quiz SET dispo = ? WHERE id_quiz = ?';

        // Mise à jour de chaque entrée dans la base de données
        const updatePromises = data.map(item => {
            // Vérification que chaque élément a bien les propriétés id_quiz et dispo
            if (item.id_quiz == null || (item.dispo !== 0 && item.dispo !== 1)) {
                return Promise.reject(new Error('Données invalides'));
            }
            // Exécution de la requête pour chaque élément
            return db.query(sqlUpdate, [item.dispo, item.id_quiz]);
        });

        // Attendre que toutes les mises à jour soient effectuées
        await Promise.all(updatePromises);

        // Réponse de succès
        return res.status(200).json({ message: 'Données mises à jour avec succès' });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du quiz:', error);
        return res.status(500).json({ message: 'Erreur lors de la mise à jour du quiz' });
    }
});

/**
 * @swagger
 * /quiz/dispo/all:
 *   get:
 *     summary: Retrieve all available quizzes
 *     description: Fetches all quizzes where the "dispo" field is set to 1, indicating the quiz is available.
 *     tags:
 *       - Quizzes
 *     responses:
 *       200:
 *         description: A list of available quizzes.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The quiz ID.
 *                     example: 1
 *                   title:
 *                     type: string
 *                     description: The title of the quiz.
 *                     example: General Knowledge Quiz
 *                   dispo:
 *                     type: integer
 *                     description: Indicates if the quiz is available (1) or not (0).
 *                     example: 1
 *       404:
 *         description: No available quizzes found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Aucun quiz disponible trouvé
 *       500:
 *         description: Server error or database connection issue.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Erreur serveur
 *                 error:
 *                   type: string
 *                   example: Error details
 */


router.get('/quiz/dispo/all', async (req, res) => {
    try {
        // Connexion à la base de données
        const db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        }

        // Requête pour récupérer les quiz dont dispo = 1
        const [results] = await db.query('SELECT * FROM quiz WHERE dispo = 1');

        // Vérifier si des résultats existent
        if (results.length === 0) {
            return res.status(404).json({ message: 'Aucun quiz disponible trouvé' });
        }

        // Envoyer les résultats au client
        res.status(200).json(results);
    } catch (err) {
        console.error('Erreur lors de la récupération des quiz :', err);
        res.status(500).json({ message: 'Erreur serveur', error: err });
    }
});


router.post('/quiz/submit/', async (req, res) => {
    try {
        // Connexion à la base de données
        db = await connectToDb();
        if (!db) {
            return res.status(500).json({ message: 'Erreur de connexion à la base de données' });
        }

        const { reponses, username, quizId } = req.body;

        // Valider les données reçues
        if (!Array.isArray(reponses) || typeof username !== 'string' || typeof quizId !== 'string') {
            return res.status(400).json({ message: 'Données invalides' });
        }
        // Récupérer l'ID de l'utilisateur à partir du username
        const sqlUser = 'SELECT id FROM users WHERE username = ?';
        const [userRows] = await db.query(sqlUser, [username]);

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const idUser = userRows[0].id;
        // Préparation de la requête d'insertion dans la table reponseUser
        const sqlInsertReponses = 'INSERT INTO reponseUser (id_user, id_quiz, reponses) VALUES (?, ?, ?)';
        await db.query(sqlInsertReponses, [idUser, quizId, JSON.stringify(reponses)]);

        res.status(201).json({ message: 'Réponses enregistrées avec succès' });

    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des réponses :', error);
        res.status(500).json({ message: 'Erreur lors de l\'enregistrement des réponses' });
    }
});


module.exports = router;
