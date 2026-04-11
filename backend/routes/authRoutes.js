import express from 'express';
import { register, login, verifyToken, deleteAccount, updateProfile, forceRefresh, sendEmailVerificationCode, verifyEmailCode, resendVerificationCode, deleteUnverifiedAccount, checkUnverifiedAccount} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import Residence from '../models/residenceModel.js';
import { forgotPassword, resetPassword, verifyResetCode, invalidateCode } from '../controllers/emailController.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';


const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-code', verifyResetCode);
router.post('/invalidate-code', invalidateCode);

router.post('/send-verification-code', sendEmailVerificationCode);
router.post('/verify-email-code', verifyEmailCode);
router.post('/resend-verification-code', resendVerificationCode);
router.post('/check-unverified-account', checkUnverifiedAccount);


router.get('/verify', protect, verifyToken);
router.put('/update-profile', protect, updateProfile);

router.post('/change-password', protect, async (req, res) => {
  try {

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);


    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Mot de passe actuel incorrect' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Mot de passe modifié avec succès' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors du changement de mot de passe' 
    });
  }
});

router.post('/accept-terms', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    
    user.termsAcceptedDate = new Date();
    user.termsAccepted = true;
    
    await user.save();

    
    res.json({
      success: true,
      message: 'Conditions acceptées',
      termsAcceptedDate: user.termsAcceptedDate
    });
    
  } catch (error) {
    console.error('❌ Erreur acceptation termes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'acceptation des conditions'
    });
  }
});

router.delete('/delete-account', protect, deleteAccount);
router.delete('/delete-unverified-account', deleteUnverifiedAccount);
router.get('/force-refresh', protect, forceRefresh);

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: true 
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // ✅ Ajouter un paramètre pour indiquer que c'est un nouvel utilisateur Google
    const isNewUser = req.user.termsAccepted === false;
    
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}&isNewUser=${isNewUser}`);
  }
);

export default router;