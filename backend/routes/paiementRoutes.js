import express from 'express';
import axios from 'axios';
import { protect } from '../middleware/auth.js';
import User from '../models/userModel.js';

const router = express.Router();

const getDHMADConfig = () => {
  const isSandbox = process.env.DHMAD_MODE === 'sandbox';
  return {
    baseURL: isSandbox ? process.env.DHMAD_SANDBOX_URL : process.env.DHMAD_LIVE_URL,
    apiKey: isSandbox ? process.env.DHMAD_API_KEY_SANDBOX : process.env.DHMAD_API_KEY_LIVE
  };
};

router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const { amount, plan, clientInfo } = req.body;
    const user = await User.findById(req.user.id);
    
    console.log('💳 [DHMAD] Création session:', { amount, plan, clientInfo });
    
    const config = getDHMADConfig();
    
    const escrowData = {
      title: `Abonnement ${plan} - EL BALAS`,
      amount: amount,
      buyerEmail: clientInfo.email,
      mode: 'instant',
      developerFeePercentage: 0
    };
    
    console.log('📝 [DHMAD] Création escrow:', escrowData);
    
    const escrowResponse = await axios.post(
      `${config.baseURL}/escrows`,
      escrowData,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ [DHMAD] Escrow créé:', escrowResponse.data);
    
    const escrowId = escrowResponse.data.escrow.id;
    
    const checkoutData = {
  action: 'accept_pay',
  targetUserEmail: clientInfo.email,
  redirectUrl: `${process.env.FRONTEND_URL}/paiement/succes?plan=${plan}&amount=${amount}&escrow_id=${escrowId}`,
  metadata: {
    plan: plan,
    amount: amount.toString(),
    buyerEmail: clientInfo.email
  }
};
    
    console.log('🔗 [DHMAD] Création checkout session pour escrow:', escrowId);
    console.log('📦 [DHMAD] Données envoyées à DHMAD:', JSON.stringify(checkoutData, null, 2));
    
    const checkoutResponse = await axios.post(
      `${config.baseURL}/escrows/${escrowId}/sessions`,
      checkoutData,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ [DHMAD] Checkout session créé:', checkoutResponse.data);
    
    const paymentUrl = checkoutResponse.data.url || checkoutResponse.data.checkout_url;
    
    if (paymentUrl) {
      return res.json({
        success: true,
        payment_url: paymentUrl,
        session_id: checkoutResponse.data.id,
        escrow_id: escrowId
      });
    } else {
      throw new Error('Pas de payment_url');
    }
    
  } catch (error) {
    console.error('❌ [DHMAD] Erreur détaillée:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    
    // Rediriger vers annulation en cas d'erreur
    const errorMessage = error.response?.data?.message || error.message;
    
    res.json({
      success: false,
      payment_url: `${process.env.FRONTEND_URL}/paiement/annule?error=${encodeURIComponent(errorMessage)}`
    });
  }
});

router.post('/webhook', express.json({ type: 'application/json' }), async (req, res) => {
  try {
    const event = req.body;
    console.log('📡 [WEBHOOK] Reçu:', JSON.stringify(event, null, 2));
    
    // 🔥 Quand l'escrow est payé, activer l'abonnement
    if (event.type === 'escrow.status.updated' && event.data?.escrow?.status === 'paid') {
      const escrowData = event.data.escrow;
      
      // Récupérer l'email depuis les métadonnées (qui sont dans checkoutResponse)
      // Pour l'instant, on ne peut pas car les métadonnées ne sont pas dans le webhook
      // Solution alternative : récupérer via l'API DHMAD
      
      console.log(`💰 Paiement reçu pour escrow ${escrowData.id}`);
      console.log(`👤 Buyer ID: ${escrowData.buyer?._id}`);
      
      // On va récupérer les détails de l'escrow via l'API pour avoir l'email
      const config = getDHMADConfig();
      const escrowDetails = await axios.get(
        `${config.baseURL}/escrows/${escrowData.id}`,
        {
          headers: { 'Authorization': `Bearer ${config.apiKey}` }
        }
      );
      
      const buyerEmail = escrowDetails.data.escrow.buyerEmail || escrowDetails.data.escrow.buyer?.email;
      const title = escrowData.title;
      
      let plan = 'monthly';
      if (title?.includes('semester')) plan = 'semester';
      if (title?.includes('annual')) plan = 'annual';
      
      console.log(`💰 Buyer email: ${buyerEmail}, plan: ${plan}`);
      
      // Trouver l'utilisateur par email
      const user = await User.findOne({ email: buyerEmail });
      if (user) {
        const maintenant = new Date();
        let dateFin = new Date(maintenant);
        
        switch(plan) {
          case 'monthly':
            dateFin.setMonth(dateFin.getMonth() + 1);
            user.subscription.monthly = dateFin;
            user.subscription.semester = null;
            user.subscription.annual = null;
            break;
          case 'semester':
            dateFin.setMonth(dateFin.getMonth() + 6);
            user.subscription.semester = dateFin;
            user.subscription.monthly = null;
            user.subscription.annual = null;
            break;
          case 'annual':
            dateFin.setFullYear(dateFin.getFullYear() + 1);
            user.subscription.annual = dateFin;
            user.subscription.monthly = null;
            user.subscription.semester = null;
            break;
        }
        
        await user.save();
        console.log('✅ Abonnement activé via webhook pour:', buyerEmail);
        try {
          await axios.post(
            `${config.baseURL}/escrows/${escrowData.id}/deliver`,
            {},
            { headers: { 'Authorization': `Bearer ${config.apiKey}` } }
          );
          console.log('✅ Livraison automatique effectuée, fonds libérés');
        } catch (deliverError) {
          console.error('❌ Erreur livraison:', deliverError.response?.data);
        }
      } else {
        console.log('❌ Utilisateur non trouvé:', buyerEmail);
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('❌ Erreur webhook:', error);
    res.status(500).json({ error: 'Webhook error' });
  }
});

router.post('/activate-subscription', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    const maintenant = new Date();
    let dateFin = new Date(maintenant);
    
    switch(plan) {
      case 'monthly':
        dateFin.setMonth(dateFin.getMonth() + 1);
        user.subscription.monthly = dateFin;
        user.subscription.semester = null;
        user.subscription.annual = null;
        break;
      case 'semester':
        dateFin.setMonth(dateFin.getMonth() + 6);
        user.subscription.semester = dateFin;
        user.subscription.monthly = null;
        user.subscription.annual = null;
        break;
      case 'annual':
        dateFin.setFullYear(dateFin.getFullYear() + 1);
        user.subscription.annual = dateFin;
        user.subscription.monthly = null;
        user.subscription.semester = null;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Plan invalide'
        });
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: `Abonnement ${plan} activé avec succès`,
      subscription: user.subscription
    });
    
  } catch (error) {
    console.error('❌ Erreur activation abonnement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation'
    });
  }
});

router.get('/check-session/:sessionId', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (sessionId && sessionId.startsWith('test_')) {
      return res.json({
        success: true,
        status: 'completed'
      });
    }
    
    const config = getDHMADConfig();
    
    const response = await axios.get(
      `${config.baseURL}/escrows/${sessionId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      }
    );
    
    const status = response.data.escrow.status;
    const isPaid = status === 'paid' || status === 'completed';
    
    res.json({
      success: true,
      status: isPaid ? 'completed' : 'pending'
    });
    
  } catch (error) {
    console.error('❌ Erreur vérification session:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification'
    });
  }
});

export default router;