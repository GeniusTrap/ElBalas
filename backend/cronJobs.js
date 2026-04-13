import Locataire from './models/locataireModel.js';

const resetPaiementsMensuels = async () => {
  try {
    
    const locataires = await Locataire.find({ 
      typeOccupation: 'location',
      actif: true 
    });
    
    
    let countReinitialises = 0;
    const aujourdhui = new Date();
    
    for (const locataire of locataires) {
      const dateArrivee = new Date(locataire.dateArrivee);
      
      const joursDepuisArrivee = Math.floor((aujourdhui - dateArrivee) / (1000 * 60 * 60 * 24));
      
      const numeroPeriode = Math.floor(joursDepuisArrivee / 30) + 1;
      
      const debutPeriode = new Date(dateArrivee);
      debutPeriode.setDate(debutPeriode.getDate() + ((numeroPeriode - 1) * 30));
      
      const dernierPaiement = locataire.dernierPaiement ? new Date(locataire.dernierPaiement) : null;
      const aPayePourCettePeriode = dernierPaiement && (dernierPaiement >= debutPeriode);
      
      const identifiant = locataire.type === 'famille' 
        ? `Famille ${locataire.nomFamille} (App ${locataire.appartementNom})`
        : `Individus (App ${locataire.appartementNom})`;
      
      
      if (!aPayePourCettePeriode && locataire.datePaiement !== null) {
        locataire.datePaiement = null;
        locataire.statutPaiement = 'non_paye';
        await locataire.save();
        countReinitialises++;
      } else if (aPayePourCettePeriode) {
        locataire.statutPaiement = 'paye';
        await locataire.save();
      } else {
      }
    }
    
    
  } catch (error) {
    console.error('❌ [CRON] Erreur lors de la réinitialisation:', error);
  }
};

export const verifierRetardsPaiement = async () => {
  try {
    
    const Locataire = (await import('./models/locataireModel.js')).default;
    const Notification = (await import('./models/notificationModel.js')).default;
    const User = (await import('./models/userModel.js')).default;
    
    // Récupérer tous les locataires actifs en location
    const locataires = await Locataire.find({ 
      typeOccupation: 'location',
      actif: true 
    });
    
    let notificationsCrees = 0;
    const maintenant = new Date();
    
    for (const locataire of locataires) {
      const dateArrivee = new Date(locataire.dateArrivee);
      dateArrivee.setHours(0, 0, 0, 0);
      
      const joursDepuisArrivee = Math.floor((maintenant - dateArrivee) / (1000 * 60 * 60 * 24));
      const periodeActuelle = Math.floor(joursDepuisArrivee / 30) + 1;
      
      const paiements = locataire.paiements || [];
      const periodesPayees = paiements.map(p => p.periode);
      
      
      for (let periode = 1; periode <= periodeActuelle; periode++) {
        const periodePayee = periodesPayees.includes(periode);
        
        const debutPeriode = new Date(dateArrivee);
        debutPeriode.setDate(debutPeriode.getDate() + ((periode - 1) * 30));
        debutPeriode.setHours(0, 0, 0, 0);
        
        const finPeriode = new Date(debutPeriode);
        finPeriode.setDate(finPeriode.getDate() + 30);
        finPeriode.setHours(23, 59, 59, 999);
        
        const estEnRetard = !periodePayee && (maintenant >= debutPeriode);
        
        
        if (estEnRetard) {
          const cleNotification = `retard_${locataire._id}_periode_${periode}`;
          const dejaNotifie = locataire.notificationsEnvoyees ? locataire.notificationsEnvoyees.includes(cleNotification) : false;
          
          
          if (!dejaNotifie) {
            const user = await User.findOne({ residenceId: locataire.residenceId });
            if (!user) {
              continue;
            }
            
            let message = '';
            if (locataire.type === 'famille') {
              message = `⏰ Paiement en retard - La famille ${locataire.nomFamille} de l'appartement ${locataire.appartementNom} doit payer`;
            } else {
              message = `⏰ Paiement en retard - Les résidents de l'appartement ${locataire.appartementNom} doivent payer`;
            }
            
            const notification = new Notification({
              userId: user._id,
              type: 'retard_paiement',
              message: message,
              details: {
                locataireId: locataire._id,
                type: locataire.type,
                nomFamille: locataire.nomFamille,
                appartement: locataire.appartementNom,
                bloc: locataire.blocNom,
                periode: periode,
                dateRetard: maintenant.toISOString(),
                estPaye: false
              },
              date: maintenant.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
              time: maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              read: false,
              timestamp: maintenant
            });
            
            await notification.save();
            notificationsCrees++;
            
            // Marquer comme notifié
            locataire.notificationsEnvoyees = [...(locataire.notificationsEnvoyees || []), cleNotification];
            await locataire.save();
          }
        }
      }
    }
    
    
  } catch (error) {
    console.error('❌ [RETARD] Erreur lors de la vérification:', error);
  }
};

export { resetPaiementsMensuels };