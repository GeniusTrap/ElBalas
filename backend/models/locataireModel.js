import mongoose from 'mongoose';

const membreSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    min: 0,
    max: 120
  },
  telephone: {  
    type: String,
    required: false,
    trim: true
  }
}, { _id: true });

const locataireSchema = new mongoose.Schema({
  residenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Residence',
    required: true
  },
  blocNom: {
    type: String,
    required: true
  },
  appartementNom: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['famille', 'individus'],
    required: true
  },
  
  nomFamille: {
    type: String,
    required: function() { return this.type === 'famille'; }
  },
  nombreMembres: {  
    type: Number,
    required: function() { return this.type === 'famille'; },
    min: 1,
    default: 1
  },
  telephoneFamille: {  
    type: String,
    required: false,
    trim: true
  },
  
  membres: [membreSchema],  
  
  nombreTotal: {
    type: Number,
    required: true,
    default: 1
  },
  dateArrivee: {
    type: Date,
    default: Date.now
  },
  paiements: [{
  periode: Number,        
  datePaiement: Date,
  montant: Number,
  estPaye: Boolean
}],
  datePaiement: {
    type: Date,
    default: null
  },

  dernierPaiement: {
    type: Date,
    default: null
  },
  statutPaiement: {
    type: String,
    enum: ['paye', 'non_paye'],
    default: 'non_paye'
  },
  typeOccupation: {
    type: String,
    enum: ['location', 'achat'],
    default: 'location'
  },
  actif: {
    type: Boolean,
    default: true
  },
  residenceId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Residence',
  required: true
},
notificationsEnvoyees: [String],
}, { timestamps: true });

locataireSchema.pre('save', function(next) {
  if (this.type === 'famille') {
    this.nombreTotal = this.nombreMembres;
  } else {
    this.nombreTotal = this.membres?.length || 0;
  }
  next();
});

const Locataire = mongoose.model('Locataire', locataireSchema);
export default Locataire;