import express from "express";
import cors from "cors";
import 'dotenv/config';
import connectDB from "./config/db.js";
import authRoutes from './routes/authRoutes.js';
import residenceRoutes from './routes/residenceRoutes.js';
import locataireRoutes from './routes/locataireRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paiementRoutes from './routes/paiementRoutes.js';
import './cronJobs.js';
import session from 'express-session';
import passport from 'passport';
import configurePassport from './config/passport.js';


const app = express();
const port = process.env.PORT || 4000;

connectDB().then(() => {
    console.log("✅ MongoDB Connected - EL BALAS");
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175',
    'https://elbalas.vercel.app',
    'https://elbalas-admin.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

configurePassport();
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Routes
app.use('/api/notifications', notificationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/residence", residenceRoutes);
app.use("/api/locataires", locataireRoutes);

app.use('/api/paiements', paiementRoutes);

// Route de test
app.get("/", (req, res) => {
    res.json({ 
        message: "🚀 EL BALAS API Working",
        version: "1.0.0"
    });
});

app.listen(port, () => {
    console.log(`✅ Server started on PORT: ${port}`);
});