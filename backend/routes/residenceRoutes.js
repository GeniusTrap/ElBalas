import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getMyResidence,
  createResidence,
  updateResidence,
  deleteResidence,
  addBloc,
  removeBloc
} from '../controllers/residenceController.js';

const router = express.Router();

// Toutes les routes sont protégées
router.use(protect);

// Routes principales
router.get('/my-residence', getMyResidence);
router.post('/residence', createResidence);
router.put('/residence', updateResidence);
router.delete('/residence', deleteResidence);

// Routes pour les blocs
router.post('/bloc', addBloc);
router.delete('/bloc/:blocId', removeBloc);

export default router;