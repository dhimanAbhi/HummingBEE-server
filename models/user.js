import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ['Employee', 'HR'],
        required: true,
    },
    team: {
        type: String,
        enum: ['Development', 'Design', 'Management', 'Team'],
        required: true,
    },
    scores: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scores',
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    }],
    mood: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mood',
    }],
    checkInOutHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CheckInOutTime',
    }]
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

export default User;
