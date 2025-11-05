const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  ruolo: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  tema: {
    type: String,
    enum: ['light', 'dark', 'green', 'purple'],
    default: 'light'
  },

  // Nuovi campi per collezioni distinte
  mostriPosseduti: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lattina',
      default: []
    }
  ],

  variantiPossedute: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variante',
      default: []
    }
  ]

}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.verificaPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
