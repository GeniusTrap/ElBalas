import Residence from '../models/residenceModel.js';

// Récupérer la résidence de l'utilisateur connecté
export const getMyResidence = async (req, res) => {
  try {
    const residence = await Residence.findOne({ userId: req.user.id });
    
    res.json({
      success: true,
      residence: residence || null
    });
  } catch (error) {
    console.error('❌ Erreur récupération résidence:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération de la résidence' 
    });
  }
};

export const createResidence = async (req, res) => {
  try {
    
    const { residenceName, blocs } = req.body;
    
    const existingResidence = await Residence.findOne({ userId: req.user.id });
    
    if (existingResidence) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vous avez déjà une résidence configurée' 
      });
    }
    
    const newResidence = new Residence({
      userId: req.user.id,
      residenceName,
      blocs
    });
    
    await newResidence.save();

    const User = (await import('../models/userModel.js')).default;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, 
      { residenceId: newResidence._id },
      { new: true }  
    );
    console.log('✅ [createResidence] Utilisateur mis à jour:', {
      id: updatedUser?._id,
      email: updatedUser?.email,
      residenceId: updatedUser?.residenceId
    });
    
    res.status(201).json({
      success: true,
      message: 'Résidence créée avec succès',
      residence: newResidence
    });
    
  } catch (error) {
    console.error('❌ [createResidence] Erreur:', error);
    console.error('❌ [createResidence] Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la création de la résidence' 
    });
  }
};

// Mettre à jour une résidence existante
export const updateResidence = async (req, res) => {
  try {
    const { residenceName, blocs } = req.body;
    
    const residence = await Residence.findOne({ userId: req.user.id });
    
    if (!residence) {
      return res.status(404).json({ 
        success: false, 
        message: 'Résidence non trouvée' 
      });
    }
    
    // Mise à jour des champs
    residence.residenceName = residenceName || residence.residenceName;
    residence.blocs = blocs || residence.blocs;
    residence.updatedAt = Date.now();
    
    await residence.save();
    
    res.json({
      success: true,
      message: 'Résidence mise à jour avec succès',
      residence
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour résidence:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour de la résidence' 
    });
  }
};

// Supprimer une résidence
export const deleteResidence = async (req, res) => {
  try {
    const residence = await Residence.findOne({ userId: req.user.id });
    
    if (!residence) {
      return res.status(404).json({ 
        success: false, 
        message: 'Résidence non trouvée' 
      });
    }
    
    await residence.deleteOne();
    
    res.json({
      success: true,
      message: 'Résidence supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression résidence:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression de la résidence' 
    });
  }
};

// Ajouter un bloc à la résidence
export const addBloc = async (req, res) => {
  try {
    const { bloc } = req.body;
    
    const residence = await Residence.findOne({ userId: req.user.id });
    
    if (!residence) {
      return res.status(404).json({ 
        success: false, 
        message: 'Résidence non trouvée' 
      });
    }
    
    residence.blocs.push(bloc);
    residence.updatedAt = Date.now();
    
    await residence.save();
    
    res.json({
      success: true,
      message: 'Bloc ajouté avec succès',
      residence
    });
  } catch (error) {
    console.error('❌ Erreur ajout bloc:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'ajout du bloc' 
    });
  }
};

// Supprimer un bloc
export const removeBloc = async (req, res) => {
  try {
    const { blocId } = req.params;
    
    const residence = await Residence.findOne({ userId: req.user.id });
    
    if (!residence) {
      return res.status(404).json({ 
        success: false, 
        message: 'Résidence non trouvée' 
      });
    }
    
    residence.blocs = residence.blocs.filter(bloc => bloc._id.toString() !== blocId);
    residence.updatedAt = Date.now();
    
    await residence.save();
    
    res.json({
      success: true,
      message: 'Bloc supprimé avec succès',
      residence
    });
  } catch (error) {
    console.error('❌ Erreur suppression bloc:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression du bloc' 
    });
  }
};