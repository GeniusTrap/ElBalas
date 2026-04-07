// routes/notificationRoutes.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationsPaginated,    
  deleteAllNotifications
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/paginated', getNotificationsPaginated);
router.post('/', createNotification);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/all', deleteAllNotifications);
router.delete('/:id', deleteNotification);


export default router;