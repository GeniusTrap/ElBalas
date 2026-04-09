import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Notification from '../models/notificationModel.js';
import Residence from '../models/residenceModel.js';
import Locataire from '../models/locataireModel.js';
import nodemailer from 'nodemailer';
import dns from 'dns';
import { promisify } from 'util';
const resolveMx = promisify(dns.resolveMx);


const validateEmailDomain = async (email) => {
  try {
    const domain = email.split('@')[1];
    if (!domain) return false;
    
    const mxRecords = await resolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch (error) {
    console.error('Erreur validation domaine:', error);
    return false;
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      // Si l'utilisateur a déjà vérifié son email → bloquer
      if (existingUser.emailVerified === true) {
        return res.status(400).json({ 
          success: false, 
          message: 'Un compte avec cet email existe déjà' 
        });
      }
      
      // Si l'utilisateur existe mais n'a PAS vérifié son email → supprimer l'ancien
      await User.findByIdAndDelete(existingUser._id);
    }

    const isValidDomain = await validateEmailDomain(email);
    if (!isValidDomain) {
      return res.status(400).json({ 
        success: false, 
        message: "L'adresse email n'est pas valide ou le domaine n'existe pas. Veuillez utiliser une adresse email réelle." 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'admin',
      emailVerified: false, // Explicitement non vérifié
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        termsAccepted: newUser.termsAccepted,
        termsAcceptedDate: newUser.termsAcceptedDate
      }
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création du compte' 
    });
  }
};

// Connexion
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        termsAccepted: user.termsAccepted,
        termsAcceptedDate: user.termsAcceptedDate,
        subscription: user.subscription
      }
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la connexion' 
    });
  }
};

// Vérifier le token
export const verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }


    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        termsAcceptedDate: user.termsAcceptedDate,
        termsAccepted: user.termsAccepted,
        subscription: user.subscription
      }
    });

  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la vérification' 
    });
  }
};


export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const residence = await Residence.findOne({ userId: userId });
    
    if (residence) {
      await Locataire.deleteMany({ residenceId: residence._id });

      await residence.deleteOne();
    }

    await Notification.deleteMany({ userId: userId });

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Compte, résidence, locataires et notifications supprimés avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression compte:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du compte'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
};

export const forceRefresh = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('-password');
    
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        termsAcceptedDate: user.termsAcceptedDate,
        termsAccepted: user.termsAccepted,
        subscription: user.subscription
      }
    });
    
    
  } catch (error) {
    console.error('❌ [SERVER] Erreur force refresh:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur: ' + error.message 
    });
  }
};

// À ajouter dans authController.js

// Envoi du code de vérification email après inscription
export const sendEmailVerificationCode = async (req, res) => {
  try {
    const { email, name, userId } = req.body;
    
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Mettre à jour l'utilisateur avec le code
    await User.findByIdAndUpdate(userId, {
      emailVerificationCode: verificationCode,
      emailVerificationExpires: expires
    });
    
    // Configurer le transporteur email (utilise ta config existante)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
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
    
    res.json({ 
      success: true, 
      message: 'Code de vérification envoyé' 
    });
    
  } catch (error) {
    console.error('❌ Erreur envoi code vérification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi du code' 
    });
  }
};

// Vérification du code email
export const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    // Vérifier si le code existe
    if (!user.emailVerificationCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucun code de vérification trouvé. Veuillez vous réinscrire.' 
      });
    }
    
    // Vérifier si le code a expiré
    if (user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le code a expiré. Veuillez vous réinscrire.' 
      });
    }
    
    // Vérifier si le code correspond
    if (user.emailVerificationCode !== code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code incorrect' 
      });
    }
    
    // Mettre à jour le statut de vérification
    user.emailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Email vérifié avec succès' 
    });
    
  } catch (error) {
    console.error('❌ Erreur vérification code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la vérification' 
    });
  }
};

// Renvoyer le code de vérification
export const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email déjà vérifié' 
      });
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (user.createdAt < tenMinutesAgo) {
      // Le compte est trop vieux et non vérifié, le supprimer
      await User.findByIdAndDelete(user._id);
      return res.status(400).json({ 
        success: false, 
        message: 'Délai dépassé. Veuillez vous réinscrire.' 
      });
    }
    
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = expires;
    await user.save();
    
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    await transporter.sendMail({
      from: `"EL BALAS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Nouveau code de vérification EL BALAS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #eab308;">EL BALAS</h2>
          <p>Bonjour ${user.name},</p>
          <p>Voici votre nouveau code de vérification :</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <h1 style="font-size: 48px; letter-spacing: 10px; color: #eab308; margin: 0;">${verificationCode}</h1>
          </div>
          <p>Ce code est valable <strong>10 minutes</strong>.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">© 2026 EL BALAS. Tous droits réservés.</p>
        </div>
      `
    });
    
    res.json({ 
      success: true, 
      message: 'Nouveau code envoyé' 
    });
    
  } catch (error) {
    console.error('❌ Erreur renvoi code:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi du code' 
    });
  }
};

export const deleteUnverifiedAccount = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email requis' 
      });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    // Vérifier si l'utilisateur a déjà vérifié son email
    if (user.emailVerified === true) {
      return res.status(400).json({ 
        success: false, 
        message: 'Impossible de supprimer un compte déjà vérifié' 
      });
    }
    
    // Supprimer l'utilisateur
    await User.findByIdAndDelete(user._id);
    
    
    res.json({ 
      success: true, 
      message: 'Compte non vérifié supprimé avec succès' 
    });
    
  } catch (error) {
    console.error('❌ Erreur suppression compte non vérifié:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression du compte' 
    });
  }
};

export const checkUnverifiedAccount = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.json({ exists: false });
    }
    
    // Si l'utilisateur existe mais n'est pas vérifié
    if (!user.emailVerified) {
      return res.json({ exists: true, verified: false });
    }
    
    return res.json({ exists: true, verified: true });
    
  } catch (error) {
    console.error('❌ Erreur vérification compte:', error);
    res.status(500).json({ exists: false, error: error.message });
  }
};