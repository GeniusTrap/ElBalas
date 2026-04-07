import mongoose from 'mongoose';

const blocSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  etages: {
    type: Number,
    required: true
  },
  appartementsParEtage: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  appartementsAttendus: [Number],
  totalAppartements: {
    type: Number,
    required: true
  },
  position: {
  type: mongoose.Schema.Types.Mixed,  
  default: [0, 0, 0]
},
  hauteur: Number,
  largeur: Number,
  profondeur: Number
}, { timestamps: true });

const residenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  residenceName: {
    type: String,
    required: true
  },
  blocs: [blocSchema]
}, { timestamps: true });

const Residence = mongoose.model('Residence', residenceSchema);
export default Residence;