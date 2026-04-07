// models/notificationModel.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['ajout', 'transfert', 'suppression', 'paiement', 'retard_paiement'],
    required: true
  },
  message: String,
  details: mongoose.Schema.Types.Mixed,
  read: { type: Boolean, default: false },
  date: String,
  time: String,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);