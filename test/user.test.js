require('dotenv').config();
const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt')
const connectToDb = require('../db.js');
const router = express.Router();
require('dotenv').config();
const https = require('https');
const userRoutes = require('../routes/users.js')

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

jest.mock('../db.js'); // Mock de la connexion à la base de données
jest.mock('bcrypt'); // Mock de bcrypt



describe('POST /api/users/register', () => {
    it('should create a user', async () => {
        connectToDb.mockResolvedValue({ query: jest.fn().mockResolvedValue([{}]) });
        bcrypt.hash.mockResolvedValue('hashedpassword');

        const response = await request(app)
            .post('/api/users/register')
            .send({ username: 'test', nom: 'test', prenom: 'test', telephone: '0745734585',age: '23', ville: 'test', email: 'test@test.com', mdp: 'plaintextpassword' });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Utilisateur créé');
    });

    it('should return 500 on DB error', async () => {
        connectToDb.mockResolvedValue(null);

        const response = await request(app).post('/api/users/register').send({ username: 'test', nom: 'test', prenom: 'test', telephone: '0745734585',age: '23', ville: 'test', email: 'test@test.com' })

        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe('Erreur de connexion à la base de données');
    });
});



describe('POST /api/users/login', () => {
    it('should log in a user', async () => {
        const user = { id: 1, username: 'test', mdp: await bcrypt.hash('password', 10) };
        connectToDb.mockResolvedValue({ query: jest.fn().mockResolvedValue([[user]]) });
        bcrypt.compare.mockResolvedValue(true);

        const response = await request(app)
            .post('/api/users/login')
            .send({ username: 'test', mdp: 'password' });

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Utilisateur connecté');
        expect(response.body.token).toBeDefined();
    });

    it('should return 401 if user does not exist or password is incorrect', async () => {
        connectToDb.mockResolvedValue({ query: jest.fn().mockResolvedValue([[]]) });

        const response = await request(app)
            .post('/api/users/login')
            .send({ username: 'test', mdp: 'wrongpassword' });

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Email ou mot de passe incorrect');
    });

    it('should return 500 on DB error', async () => {
        connectToDb.mockResolvedValue(null); // Simule une connexion échouée à la DB
    
        const response = await request(app)
            .post('/api/users/login')
            .send({ username: 'test', mdp: 'password' });
    
        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe('Erreur de connexion à la base de données'); // Mettez à jour ce message
    });
});
