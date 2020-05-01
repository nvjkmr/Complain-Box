const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  er_no: {
  type: String,
  required: true
  }
});





const user = mongoose.model("complain_user", UserSchema);
module.exports = user;