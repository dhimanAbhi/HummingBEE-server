import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  data: [
    {
      parameter: {
        type: String,
        required: true
      },
      value: {
        type: Number,
        required: true
      }
    }
  ],
  date: {
    type: Date,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const Scores = mongoose.model('Scores', scoreSchema);

export default Scores;
