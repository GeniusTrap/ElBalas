import Locataire from '../models/locataireModel.js';
import Residence from '../models/residenceModel.js';

// Récupérer tous les locataires d'une résidence
export const getLocataires = async (req, res) => {
  try {
    const residence = await Residence.findOne({ userId: req.user.id });
    if (!residence) {
      return res.status(404).json({ 
        success: false, 
        message: 'Résidence non trouvée' 
      });
    }

    const locataires = await Locataire.find({ residenceId: residence._id });
    
    res.json({
      success: true,
      locataires
    });
  } catch (error) {
    console.error('❌ Erreur récupération locataires:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des locataires' 
    });
  }
};

export const addLocataires = async (req, res) => {
  try {
    const { 
      blocNom, 
      appartementNom, 
      type, 
      nomFamille, 
      nombreMembres, 
      telephoneFamille, 
      membres,
      dateArrivee,
      datePaiement,
      typeOccupation,
      // statutPaiement ← ON IGNORE CE QUE LE FRONTEND ENVOIE
    } = req.body;


    // Vérifier que la résidence existe
    const residence = await Residence.findOne({ userId: req.user.id });
    if (!residence) {
      return res.status(404).json({ 
        success: false, 
        message: 'Résidence non trouvée' 
      });
    }

    // Vérifier que l'appartement existe
    const bloc = residence.blocs.find(b => b.nom === blocNom);
    if (!bloc) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bloc non trouvé' 
      });
    }

    const appartementExiste = bloc.appartementsParEtage.some(etage => 
      etage.includes(appartementNom)
    );
    
    if (!appartementExiste) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appartement non trouvé' 
      });
    }

    // Créer les nouveaux locataires - SANS statutPaiement
    const newLocataire = new Locataire({
      residenceId: residence._id,
      blocNom,
      appartementNom,
      type,
      ...(type === 'famille' && { 
        nomFamille, 
        nombreMembres, 
        telephoneFamille 
      }),
      ...(type === 'individus' && { membres }),
      dateArrivee: dateArrivee || new Date(),
      datePaiement: datePaiement || null,
      dernierPaiement: datePaiement || null,
      typeOccupation: typeOccupation || 'location',
      // ✅ PAS DE statutPaiement ICI
    });

    // ✅ AJOUTER LE PAIEMENT DANS LE TABLEAU paiements SI datePaiement EST RENSEIGNÉ
    if (datePaiement) {
      const maintenant = new Date();
      maintenant.setHours(0, 0, 0, 0);
      const dateArriveeLoc = new Date(dateArrivee || new Date());
      dateArriveeLoc.setHours(0, 0, 0, 0);
      const joursDepuisArrivee = Math.max(0, Math.floor((maintenant - dateArriveeLoc) / (1000 * 60 * 60 * 24)));
      const periodeActuelle = Math.max(1, Math.floor(joursDepuisArrivee / 30) + 1);
      
      newLocataire.paiements = [{
        periode: periodeActuelle,
        datePaiement: datePaiement,
        estPaye: true
      }];
    }

    // ✅ RECALCULER statutPaiement EN FONCTION DES PAIEMENTS
    const maintenant = new Date();
    maintenant.setHours(0, 0, 0, 0);
    const dateArriveeLoc = new Date(newLocataire.dateArrivee);
    dateArriveeLoc.setHours(0, 0, 0, 0);
    const joursDepuisArrivee = Math.max(0, Math.floor((maintenant - dateArriveeLoc) / (1000 * 60 * 60 * 24)));
    const periodeActuelle = Math.max(1, Math.floor(joursDepuisArrivee / 30) + 1);
    
    const paiements = newLocataire.paiements || [];
    const periodesPayees = paiements.map(p => p.periode);
    
    let toutesPeriodesPayees = true;
    for (let periode = 1; periode <= periodeActuelle; periode++) {
      if (!periodesPayees.includes(periode)) {
        toutesPeriodesPayees = false;
        break;
      }
    }
    
    newLocataire.statutPaiement = toutesPeriodesPayees ? 'paye' : 'non_paye';

    await newLocataire.save();

    res.status(201).json({
      success: true,
      message: 'Locataires ajoutés avec succès',
      locataire: newLocataire
    });

  } catch (error) {
    console.error('❌ Erreur ajout locataires:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'ajout des locataires' 
    });
  }
};

// Mettre à jour des locataires
export const updateLocataires = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;


    const locataire = await Locataire.findById(id);
    if (!locataire) {
      return res.status(404).json({ 
        success: false, 
        message: 'Locataires non trouvés' 
      });
    }


    const residence = await Residence.findOne({ userId: req.user.id });
    if (!residence || locataire.residenceId.toString() !== residence._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    if (updates.datePaiement) {
      updates.dernierPaiement = updates.datePaiement;
    }

    delete updates.statutPaiement;

    Object.assign(locataire, updates);

    const maintenant = new Date();
    maintenant.setHours(0, 0, 0, 0);
    const dateArriveeLoc = new Date(locataire.dateArrivee);
    dateArriveeLoc.setHours(0, 0, 0, 0);
    const joursDepuisArrivee = Math.max(0, Math.floor((maintenant - dateArriveeLoc) / (1000 * 60 * 60 * 24)));
    const periodeActuelle = Math.max(1, Math.floor(joursDepuisArrivee / 30) + 1);
    
    const paiements = locataire.paiements || [];
    const periodesPayees = paiements.map(p => p.periode);
    
    
    let toutesPeriodesPayees = true;
    for (let periode = 1; periode <= periodeActuelle; periode++) {
      const estPayee = periodesPayees.includes(periode);
      if (!estPayee) {
        toutesPeriodesPayees = false;
      }
    }
    
    const nouveauStatut = toutesPeriodesPayees ? 'paye' : 'non_paye';
    
    locataire.statutPaiement = nouveauStatut;

    await locataire.save();


    res.json({
      success: true,
      message: 'Locataires mis à jour avec succès',
      locataire
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour locataires:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour des locataires' 
    });
  }
};

// Supprimer des locataires
export const deleteLocataires = async (req, res) => {
  try {
    const { id } = req.params;

    const locataire = await Locataire.findById(id);
    if (!locataire) {
      return res.status(404).json({ 
        success: false, 
        message: 'Locataires non trouvés' 
      });
    }

    // Vérifier que le locataire appartient à la résidence de l'utilisateur
    const residence = await Residence.findOne({ userId: req.user.id });
    if (!residence || locataire.residenceId.toString() !== residence._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    await locataire.deleteOne();

    res.json({
      success: true,
      message: 'Locataires supprimés avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression locataires:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression des locataires' 
    });
  }
};

// Récupérer les locataires par appartement
export const getLocatairesByAppartement = async (req, res) => {
  try {
    const { blocNom, appartementNom } = req.params;


    const residence = await Residence.findOne({ userId: req.user.id });
    if (!residence) {
      return res.status(404).json({ 
        success: false, 
        message: 'Résidence non trouvée' 
      });
    }

    const locataires = await Locataire.find({
      residenceId: residence._id,
      blocNom,
      appartementNom,
      actif: true
    });


    res.json({
      success: true,
      locataires
    });

  } catch (error) {
    console.error('❌ Erreur récupération locataires:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des locataires' 
    });
  }
};