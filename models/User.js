const mongoose = require('mongoose');
const configs = require('../configs/default');

const userSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: configs.email_regex
  },
  password: { type: String, required: true }
});

module.exports = mongoose.model('Users', userSchema);
