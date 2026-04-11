import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
    default: null
  },
  phone: {  
    type: String,
    required: false,
    trim: true
  },
  password: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin'
  },
  residenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Residence',
    default: null
  },
  termsAcceptedDate: {  
    type: Date,
    default: null
  },
  termsAccepted: {  
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationCode: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  subscription: {
    monthly: {
      type: Date,
      default: null
    },
    semester: {
      type: Date,
      default: null
    },
    annual: {
      type: Date,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.index(
  { createdAt: 1 }, 
  { 
    expireAfterSeconds: 600, 
    partialFilterExpression: { emailVerified: false } 
  }
);

const User = mongoose.model('User', userSchema);
export default User;