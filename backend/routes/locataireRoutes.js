import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getLocataires,
  addLocataires,
  updateLocataires,
  deleteLocataires,
  getLocatairesByAppartement
} from '../controllers/locataireController.js';

const router = express.Router();

// Toutes les routes sont protégées
router.use(protect);

// Routes principales
router.get('/', getLocataires);
router.post('/', addLocataires);
router.put('/:id', updateLocataires);
router.delete('/:id', deleteLocataires);

// Route pour récupérer les locataires d'un appartement spécifique
router.get('/appartement/:blocNom/:appartementNom', getLocatairesByAppartement);

export default router;