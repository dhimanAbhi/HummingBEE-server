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
    scores: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Scores'
    }
});

userSchema.plugin(passportLocalMongoose)

const User = mongoose.model('User', userSchema);

export default User;
