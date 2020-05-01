const mongoose = require("mongoose");

const ComplainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true
  },
  er_no: {
  type: String,
  required: true
  },
  complain_topic: {
  type: String,
  required: true
  },
  complain: {
  type: String,
  required: true
  },
  status: {                            
    type: Number,                    // will contain 1 for pending , 2 for active , 3 for resolved
    required: true
  },
  updates: {
    type: Array                      // will contain array of objects [{"commenting_user_id":commenting_user_id,"comment":comment}]
  },
  stars: {
    type: Number                     // will contain the number of stars awarded by the complaining user at the time of feedback
  },
  feedback: {
    type: String                     // any feedback or suggestions 
  },
  start_date: {
    type: Date
  },
  end_date: {
    type: Date
  }
});


const complain = mongoose.model("complain_complain", ComplainSchema);
module.exports = complain;