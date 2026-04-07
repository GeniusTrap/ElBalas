import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import { backendUrl } from '../App';

const Dashboard = ({ residenceData }) => {
  const [locatairesData, setLocatairesData] = useState({});
  const [loading, setLoading] = useState(true);

  // Fonction pour récupérer les locataires
  const fetchLocataires = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${backendUrl}/api/locataires`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        // Organiser les locataires par appartement
        const locatairesParAppart = {};
        const appartementsOccupes = new Set(); // Pour compter les appartements occupés
        
        data.locataires.forEach(loc => {
          // Compter le nombre de locataires par appartement
          if (loc.type === 'famille') {
            locatairesParAppart[loc.appartementNom] = loc.nombreMembres;
          } else {
            locatairesParAppart[loc.appartementNom] = loc.nombreTotal;
          }
          // Marquer l'appartement comme occupé
          appartementsOccupes.add(loc.appartementNom);
        });
        
        setLocatairesData({
          counts: locatairesParAppart,
          occupiedAppartments: appartementsOccupes
        });
      }
    } catch (error) {
      console.error('Erreur chargement locataires:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  // Ne pas charger les locataires si on est en train de configurer (pas de résidence ou pas de blocs)
  if (residenceData && residenceData.blocs && residenceData.blocs.length > 0) {
    fetchLocataires();
  } else {
    setLoading(false); // Arrêter le chargement si pas de résidence
  }
}, [residenceData]);

  // Traitement des données des blocs
  const blocs = residenceData?.blocs?.length > 0 
    ? residenceData.blocs.map((bloc, index) => {
        // Récupérer tous les appartements de ce bloc
        const tousAppartements = bloc.appartementsParEtage?.flat() || [];
        
        // Compter les appartements occupés dans ce bloc
        const appartementsOccupesBloc = tousAppartements.filter(
          appartNom => locatairesData.occupiedAppartments?.has(appartNom)
        ).length;
        
        // Compter le nombre total de locataires dans ce bloc
        const locatairesBloc = tousAppartements.reduce((total, appartNom) => {
          return total + (locatairesData.counts?.[appartNom] || 0);
        }, 0);

        return {
          id: bloc.nom,
          nom: `Bloc ${bloc.nom}`,
          étages: bloc.etages,
          appartements: bloc.totalAppartements || tousAppartements.length,
          locataires: locatairesBloc,
          appartementsOccupes: appartementsOccupesBloc,
          couleur: 'bg-white'
        };
      })
    : [];

  const totalBlocs = blocs.length;
  const totalAppartements = blocs.reduce((acc, bloc) => acc + bloc.appartements, 0);
  const totalLocataires = blocs.reduce((acc, bloc) => acc + bloc.locataires, 0);
  const totalAppartementsOccupes = blocs.reduce((acc, bloc) => acc + bloc.appartementsOccupes, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center p-8 rounded-2xl flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div 
  className="min-h-screen bg-fixed bg-cover bg-center p-8 rounded-2xl"
  style={{ 
    backgroundImage: `url(${assets.Liege2})`,
    backgroundAttachment: 'fixed',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }}
>
      {blocs.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Aucune résidence configurée</h2>
            <p className="text-gray-600">
              Veuillez configurer votre résidence dans les paramètres.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Grille des blocs */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {blocs.map((bloc) => {
              const tauxOccupation = bloc.appartements > 0 
                ? Math.round((bloc.appartementsOccupes / bloc.appartements) * 100) 
                : 0;
              const appartementsLibres = bloc.appartements - bloc.appartementsOccupes;

              return (
                <div
                  key={bloc.id}
                  className={`${bloc.couleur} transform rotate-[-1deg] hover:rotate-0 hover:scale-105 transition-all duration-300 shadow-xl p-6 rounded-lg`}
                  style={{ boxShadow: '5px 5px 15px rgba(0,0,0,0.3)' }}
                >
                  <div className="flex justify-center -mt-8 mb-4">
                    <div className="w-6 h-6 bg-gray-400 rounded-full shadow-inner border-2 border-gray-500" />
                  </div>

                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{bloc.nom}</h2>
                    
                    <div className="space-y-2 text-gray-700">
                      <p className="flex justify-between border-b border-black border-opacity-20 pb-1">
                        <span>Étages</span>
                        <span className="font-bold">{bloc.étages}</span>
                      </p>
                      <p className="flex justify-between border-b border-black border-opacity-20 pb-1">
                        <span>Appartements</span>
                        <span className="font-bold">{bloc.appartements}</span>
                      </p>
                      <p className="flex justify-between border-b border-black border-opacity-20 pb-1">
                        <span>Locataires</span>
                        <span className="font-bold">{bloc.locataires}</span>
                      </p>
                      <p className="flex justify-between border-b border-black border-opacity-20 pb-1">
                        <span>Taux occup.</span>
                        <span className="font-bold">{tauxOccupation}%</span>
                      </p>
                    </div>

                    <div className="mt-4 text-xs text-gray-600 italic">
                      {appartementsLibres === 0 
                        ? 'Complet' 
                        : `${appartementsLibres} libre${appartementsLibres > 1 ? 's' : ''}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Statistiques globales */}
          {totalBlocs > 0 && (
            <div className="mt-12 flex justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-md transform rotate-1 hover:rotate-0 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-gray-800">
                    <span className="font-bold">Total :</span> {totalBlocs} blocs • {totalAppartements} appartements • {totalLocataires} locataires
                  </p>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Taux d'occupation global : {Math.round((totalAppartementsOccupes / totalAppartements) * 100)}% 
                  ({totalAppartements - totalAppartementsOccupes} libre{totalAppartements - totalAppartementsOccupes > 1 ? 's' : ''})
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;