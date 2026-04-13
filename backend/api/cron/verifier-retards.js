import { verifierRetardsPaiement } from '../../cronJobs.js';

export default async function handler(req, res) {
  try {
    await verifierRetardsPaiement();
    res.status(200).json({ success: true, message: 'Vérification effectuée' });
  } catch (error) {
    console.error('❌ Erreur cron:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}