import mongoose from 'mongoose';

const moodSchema = new mongoose.Schema({
  data: {
    type: String,
    enum: ['LOW', 'MODERATE', 'OPTIMUM', 'TOO MUCH', 'HIGH'], 
    required: true
  },
  date: {
    type: Date,
    default: Date.now, 
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  }
});

const Mood = mongoose.model('Mood', moodSchema);

export default Mood;
