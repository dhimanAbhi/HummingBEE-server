import mongoose from 'mongoose';

const checkInOutSchema = new mongoose.Schema({
  checkIn: {
    type: Date,
  },
  checkOut: {
    type: Date,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const CheckInOutTime = mongoose.model('CheckInOutTime', checkInOutSchema);

export default CheckInOutTime;
