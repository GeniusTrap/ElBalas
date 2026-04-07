// controllers/notificationController.js
import Notification from '../models/notificationModel.js';

// Récupérer les notifications de l'utilisateur
export const getNotifications = async (req, res) => {
  try {
    
    const count = await Notification.countDocuments({ userId: req.user.id });

    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(50);

    
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications'
    });
  }
};

export const createNotification = async (req, res) => {
  try {
    
    
    // Créer la nouvelle notification
    const notification = new Notification({
      userId: req.user.id,
      ...req.body
    });

    
    await notification.save();
    
    // 🔥 NETTOYAGE AUTOMATIQUE : Garder seulement les 50 plus récentes
    const userId = req.user.id;
    const limit = 50;
    
    // Récupérer les IDs des 50 notifications les plus récentes
    const recentNotifications = await Notification.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('_id');
    
    const recentIds = recentNotifications.map(n => n._id);
    
    // Supprimer les notifications plus anciennes
    const deletedCount = await Notification.deleteMany({
      userId,
      _id: { $nin: recentIds }
    });
    
    if (deletedCount > 0) {
    }
    
    res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('❌ Erreur createNotification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la notification'
    });
  }
};

// Marquer une notification comme lue
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }
    
    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('❌ Erreur markAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
};

export const getNotificationsPaginated = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments({ userId: req.user.id });
    const maxTotal = Math.min(total, 50);
    
    res.json({
      success: true,
      notifications,
      total: maxTotal,
      page: parseInt(page),
      totalPages: Math.ceil(maxTotal / limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications'
    });
  }
};

// Nettoyer les anciennes notifications (garder seulement les 50 plus récentes)
export const cleanupOldNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = 50;
    
    const recentNotifications = await Notification.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('_id');
    
    const recentIds = recentNotifications.map(n => n._id);
    
    const result = await Notification.deleteMany({
      userId,
      _id: { $nin: recentIds }
    });
    
    
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Notifications nettoyées, gardé les ${limit} plus récentes`
    });
  } catch (error) {
    console.error('❌ Erreur cleanupOldNotifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage'
    });
  }
};

// Supprimer toutes les notifications (pour le bouton "Tout effacer")
export const deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ userId: req.user.id });
    
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: 'Toutes les notifications ont été supprimées'
    });
  } catch (error) {
    console.error('❌ Erreur deleteAllNotifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
};

// Marquer toutes les notifications comme lues
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    
    res.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues'
    });
  } catch (error) {
    console.error('❌ Erreur markAllAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
};

// Supprimer une notification - VERSION CORRIGÉE
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    
    // Chercher d'abord la notification
    const found = await Notification.findOne({ _id: id, userId: req.user.id });
    
    if (!found) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    
    // ✅ CORRECTION ICI : "Notification" avec majuscule !
    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });
    

    
    res.json({
      success: true,
      message: 'Notification supprimée'
    });
    
  } catch (error) {
    console.error('❌ [BACKEND] Erreur deleteNotification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
};