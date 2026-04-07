import nodemailer from 'nodemailer';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';


const resetCodes = new Map(); // email -> { code, expires }

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Générer un code aléatoire à 6 chiffres
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationCode = async (email, name, userId) => {
  const verificationCode = generateCode();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  // Stocker le code en base de données
  await User.findByIdAndUpdate(userId, {
    emailVerificationCode: verificationCode,
    emailVerificationExpires: expires
  });
  
  await transporter.sendMail({
    from: `"EL BALAS" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Vérifiez votre compte EL BALAS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #eab308;">Bienvenue sur EL BALAS !</h2>
        <p>Bonjour ${name},</p>
        <p>Merci de vous être inscrit. Voici votre code de vérification :</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <h1 style="font-size: 48px; letter-spacing: 10px; color: #eab308; margin: 0;">${verificationCode}</h1>
        </div>
        <p>Ce code est valable <strong>10 minutes</strong>.</p>
        <p>Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">© 2026 EL BALAS. Tous droits réservés.</p>
      </div>
    `
  });
  
  return verificationCode;
};

// Demande de réinitialisation - ENVOI DU CODE
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Aucun compte associé à cet email' 
      });
    }

    // Générer un code à 6 chiffres
    const resetCode = generateCode();
    
    // Stocker le code avec expiration (10 minutes)
    resetCodes.set(email, {
      code: resetCode,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    // Envoyer l'email avec le code
    await transporter.sendMail({
      from: `"EL BALAS" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Code de réinitialisation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #eab308;">EL BALAS</h2>
          <p>Bonjour ${user.name},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>Voici votre code de vérification :</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <h1 style="font-size: 48px; letter-spacing: 10px; color: #eab308; margin: 0;">${resetCode}</h1>
          </div>
          <p>Ce code est valable 10 minutes.</p>
          <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">© 2026 EL BALAS. Tous droits réservés.</p>
        </div>
      `
    });

    res.json({ 
      success: true, 
      message: 'Code de vérification envoyé' 
    });

  } catch (error) {
    console.error('❌ Erreur forgot password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi du code' 
    });
  }
};

export const invalidateCode = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (resetCodes.has(email)) {
      resetCodes.delete(email);
      return res.json({ 
        success: true, 
        message: 'Code invalidé avec succès' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Aucun code à invalider' 
    });
    
  } catch (error) {
    console.error('❌ Erreur invalidation code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'invalidation du code' 
    });
  }
};

// Vérification du code
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Récupérer le code stocké
    const storedData = resetCodes.get(email);
    
    if (!storedData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucune demande de réinitialisation trouvée' 
      });
    }

    // Vérifier si le code a expiré
    if (Date.now() > storedData.expires) {
      resetCodes.delete(email);
      return res.status(400).json({ 
        success: false, 
        message: 'Code expiré' 
      });
    }

    // Vérifier si le code correspond
    if (storedData.code !== code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code incorrect' 
      });
    }

    // Code valide - on garde une trace pour la prochaine étape
    resetCodes.set(email, {
      ...storedData,
      verified: true
    });

    res.json({ 
      success: true, 
      message: 'Code valide' 
    });

  } catch (error) {
    console.error('❌ Erreur vérification code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la vérification' 
    });
  }
};

// Réinitialisation du mot de passe (après code vérifié)
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Vérifier que le code a été vérifié
    const storedData = resetCodes.get(email);
    if (!storedData || !storedData.verified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Veuillez d\'abord vérifier votre code' 
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour
    user.password = hashedPassword;
    await user.save();

    // Supprimer le code après utilisation
    resetCodes.delete(email);

    res.json({ 
      success: true, 
      message: 'Mot de passe réinitialisé avec succès' 
    });

  } catch (error) {
    console.error('❌ Erreur reset password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la réinitialisation' 
    });
  }
};