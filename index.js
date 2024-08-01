import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import User from './models/user.js';
import Scores from './models/scores.js';

const app = express();

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', () => {
    console.log('Database Connected');
});

app.use(bodyParser.json({ extended: true, limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Correct CORS configuration
const corsOptions = {
    origin: 'https://humming-bee-frontend.vercel.app', // No trailing slash
    methods: ['GET', 'POST'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(cookieParser('thisisnotagoodsecret'));

const sessionOptions = {
    secret: 'thisisnotagoodsecret',
    name: 'session',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {
    res.send('heyyyyy');
});

app.post('/register', async (req, res) => {
    try {
        const { name, username, scores, email, password } = req.body;
        const user = new User({ name, username, scores, email });
        const registeredUser = await User.register(user, password);
        console.log("User registered: ", registeredUser);
        return res.json({ data: registeredUser, message: "Registration Successful", type: "success" });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ data: null, message: err.message, type: 'error' });
    }
});

app.get('/scores/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).populate('scores');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const scores = await Scores.find({ user: userId });

        return res.json({ data: scores, message: 'Scores fetched successfully', type: 'success' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ data: null, message: err.message, type: 'error' });
    }
});

app.post('/scores', async (req, res) => {
    try {
        const { author, data } = req.body;
        const user = await User.findById(author);
        if (!user) {
            return res.status(404).json({ data: null, message: 'User not found', type: 'error' });
        }
        const transformedData = Object.keys(data).map(parameter => ({
            parameter,
            value: data[parameter]
        }));
        const scores = new Scores({
            user: author,
            data: transformedData
        });
        await scores.save();
        user.scores = scores._id;
        await user.save();
        return res.json({ data: req.body, message: "Scores created successfully", type: "success" });
    } catch (err) {
        console.error(err); // Log the error for debugging
        return res.status(500).json({ data: null, message: err.message, type: "error" });
    }
});

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(400).json({ message: 'Invalid username or password', type: 'error' });
        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.json({ data: user, message: 'Logged in successfully', type: 'success' });
        });
    })(req, res, next);
});

app.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to log out', type: 'error' });
        }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to destroy session', type: 'error' });
            }
            res.clearCookie('session');
            return res.json({ message: 'Logged out successfully', type: 'success' });
        });
    });
});

app.get('/checkAuth', (req, res) => {
    if (req.isAuthenticated()) {
        return res.json({ authenticated: true, user: req.user });
    } else {
        return res.json({ authenticated: false });
    }
});

app.listen(4000, () => {
    console.log('Server running on port 4000');
});
