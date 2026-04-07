import { assets } from '../assets/assets';

const HowItWorks = () => {
  return (
    <div id="how-it-works" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Titre */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Comment ça <span className="text-yellow-500">marche ?</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Une plateforme simple et intuitive pour gérer votre résidence de A à Z
          </p>
        </div>

        {/* Étapes pour le propriétaire */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          
          {/* Étape 1 - Inchangée */}
          <div className="relative">
            <div className="bg-yellow-50 rounded-2xl p-8 h-full border border-yellow-100">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Créez votre résidence
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Inscrivez-vous et configurez votre résidence : 
                nombre de blocs, d'étages et d'appartements.
              </p>
              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-sm font-mono text-gray-500">Exemple :</p>
                <p className="text-sm font-mono text-gray-800">5 blocs (A à E)</p>
                <p className="text-sm font-mono text-gray-800">Blocs A,B,C → 4 étages</p>
                <p className="text-sm font-mono text-gray-800">Blocs D,E → 3 étages</p>
                <p className="text-sm font-mono text-gray-800">4 appartements/étage</p>
              </div>
            </div>
          </div>

          {/* Étape 2 - Inchangée */}
          <div className="relative">
            <div className="bg-yellow-50 rounded-2xl p-8 h-full border border-yellow-100">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Gérez les occupants
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Pour chaque appartement, enregistrez les locataires : 
                nom, prénom, nombre de membres, date d'entrée.
              </p>
              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-sm font-mono text-gray-500">Appartement A11 :</p>
                <p className="text-sm font-mono text-gray-800">Famille Ben Mostfa</p>
                <p className="text-sm font-mono text-gray-800">4 personnes</p>
                <p className="text-sm font-mono text-gray-800">Entrée : 01/01/2024</p>
              </div>
            </div>
          </div>

          {/* Étape 3 - NOUVEAU : Dashboard complet */}
          <div className="relative">
            <div className="bg-yellow-50 rounded-2xl p-8 h-full border border-yellow-100">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Dashboard <span className="text-yellow-500">complet</span>
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Toutes les informations en un coup d'œil :
              </p>
              
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">✓</span>
                  <span className="text-gray-700"><span className="font-semibold">Paiements :</span> Qui a payé ? Qui doit ? Depuis combien de temps ?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">✓</span>
                  <span className="text-gray-700"><span className="font-semibold">Occupants :</span> Combien de personnes par appartement ?</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">✓</span>
                  <span className="text-gray-700"><span className="font-semibold">Échéances :</span> Dates d'entrée, de sortie, fins de bail</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">✓</span>
                  <span className="text-gray-700"><span className="font-semibold">Alertes :</span> Départs imminent, impayés, baux à renouveler</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 font-bold">✓</span>
                  <span className="text-gray-700"><span className="font-semibold">Statistiques :</span> Taux d'occupation, revenus mensuels</span>
                </li>
              </ul>

              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div className="border-l-4 border-green-500 pl-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="font-bold">A11</span>
                      <span className="text-green-600">✓ Payé</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Famille Ben Mostfa</span>
                      <span>4 pers.</span>
                    </div>
                    <div className="text-xs text-gray-500">Entrée: 01/01/2024</div>
                  </div>

                  <div className="border-l-4 border-red-500 pl-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="font-bold">B23</span>
                      <span className="text-red-600">⚠ 2 mois</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Famille Trabelsi</span>
                      <span>3 pers.</span>
                    </div>
                    <div className="text-xs text-gray-500">Entrée: 15/03/2023</div>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="font-bold">C34</span>
                      <span className="text-yellow-600">⟳ Départ bientôt</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Famille Gharbi</span>
                      <span>5 pers.</span>
                    </div>
                    <div className="text-xs text-gray-500">Sortie: 30/04/2024</div>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="font-bold">D12</span>
                      <span className="text-blue-600">Libre</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>À louer</span>
                      <span>-</span>
                    </div>
                    <div className="text-xs text-gray-500">Disponible immédiatement</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visualisation de la structure - Inchangée */}
        <div className="bg-gray-50 rounded-3xl p-8 md:p-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Une organisation <span className="text-yellow-500">claire et hiérarchique</span>
          </h3>
          
          <div className="grid md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="font-bold text-xl text-yellow-600 mb-2">Bloc A</div>
              <div className="text-sm text-gray-600">4 étages</div>
              <div className="text-sm text-gray-600">16 appartements</div>
              <div className="mt-3 text-xs bg-gray-100 p-2 rounded">
                <div>A11 • A12 • A13 • A14</div>
                <div>A21 • A22 • A23 • A24</div>
                <div>...</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="font-bold text-xl text-yellow-600 mb-2">Bloc B</div>
              <div className="text-sm text-gray-600">4 étages</div>
              <div className="text-sm text-gray-600">16 appartements</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="font-bold text-xl text-yellow-600 mb-2">Bloc C</div>
              <div className="text-sm text-gray-600">4 étages</div>
              <div className="text-sm text-gray-600">16 appartements</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="font-bold text-xl text-yellow-600 mb-2">Bloc D</div>
              <div className="text-sm text-gray-600">3 étages</div>
              <div className="text-sm text-gray-600">12 appartements</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="font-bold text-xl text-yellow-600 mb-2">Bloc E</div>
              <div className="text-sm text-gray-600">3 étages</div>
              <div className="text-sm text-gray-600">12 appartements</div>
            </div>
          </div>

          <div className="text-center text-gray-600">
            <p className="text-lg">
              <span className="font-bold">Total :</span> 5 blocs • 18 étages • 72 appartements
            </p>
          </div>
        </div>

        {/* Dashboard preview - LÉGÈREMENT AMÉLIORÉ */}
        <div className="mt-20 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Tout est visible sur votre <span className="text-yellow-500">dashboard</span>
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Un coup d'œil suffit pour tout savoir sur votre résidence
          </p>
          
          <div className="bg-gray-900 text-white rounded-2xl p-6 max-w-4xl mx-auto">
            {/* En-têtes */}
            <div className="grid grid-cols-5 gap-2 mb-4 pb-2 border-b border-gray-700 text-xs font-mono text-gray-400">
              <span>Appt</span>
              <span>Locataire</span>
              <span>Personnes</span>
              <span>Paiement</span>
              <span>Arrivé</span>
            </div>
            
            {/* Ligne 1 */}
            <div className="grid grid-cols-5 gap-2 mb-2 text-sm">
              <span className="text-yellow-500 font-mono">A11</span>
              <span className="font-mono">Ben Mostfa</span>
              <span className="font-mono">4</span>
              <span className="text-green-500 font-mono">✓</span>
              <span className="text-gray-400 font-mono">-</span>
            </div>
            
            {/* Ligne 2 */}
            <div className="grid grid-cols-5 gap-2 mb-2 text-sm">
              <span className="text-yellow-500 font-mono">B23</span>
              <span className="font-mono">Trabelsi</span>
              <span className="font-mono">3</span>
              <span className="text-red-500 font-mono">2 mois</span>
              <span className="text-gray-400 font-mono">-</span>
            </div>
            
            {/* Ligne 3 */}
            <div className="grid grid-cols-5 gap-2 mb-2 text-sm">
              <span className="text-yellow-500 font-mono">C34</span>
              <span className="font-mono">Gharbi</span>
              <span className="font-mono">5</span>
              <span className="text-green-500 font-mono">✓</span>
              <span className="text-yellow-500 font-mono">30/04</span>
            </div>
            
            {/* Ligne 4 */}
            <div className="grid grid-cols-5 gap-2 text-sm">
              <span className="text-yellow-500 font-mono">D12</span>
              <span className="font-mono text-blue-400">Libre</span>
              <span className="font-mono">-</span>
              <span className="font-mono">-</span>
              <span className="font-mono">-</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;