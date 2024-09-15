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
import Task from './models/task.js';
import Mood from './models/mood.js';
import CheckInOutTime from './models/checkInOut.js';

const app = express();

mongoose.connect("mongodb+srv://abhi2002dhi:nidhidhiman@cluster0.kp6ro.mongodb.net/hummingBee?retryWrites=true&w=majority&appName=Cluster0", {
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
    origin: 'https://humming-bee-frontend-6noc.vercel.app',
    // origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
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
    res.json({boy:'heyyyyy', girl:'shut up'});
});

app.post('/register', async (req, res) => {
    try {
        const { name, username, scores, email, password, role, team } = req.body;
        const user = new User({ name, username, scores, email, role, team });
        const registeredUser = await User.register(user, password);
        console.log("User registered: ", registeredUser);
        return res.json({ data: registeredUser, message: "Registration Successful", type: "success" });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ data: null, message: err.message, type: 'error' });
    }
});

app.get('/avgscores', async (req, res) => {
    try {

        const scores = await Scores.find().populate('user');

        return res.json({ data: scores, message: 'Scores fetched successfully', type: 'success' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ data: null, message: err.message, type: 'error' });
    }
})

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
        const { date, author, data } = req.body;
        const user = await User.findById(author);
        if (!user) {
            return res.status(404).json({ data: null, message: 'User not found', type: 'error' });
        }
        const transformedData = Object.keys(data).map(parameter => ({
            parameter,
            value: data[parameter]
        }));
        const scores = new Scores({
            date: date,
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

app.post('/logout', async (req, res) => {
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

app.get('/random', (req, res) => {
    if (req.isAuthenticated()) {
        return res.json({ authenticated: "abhishek", user: "dhiman"});
    } else {
        return res.json({ authenticated: false });
    }
});



app.get('/tasks/:index', async (req, res) => {
    try { 
        const { index } = req.params;
        
        // Fetch tasks where the user._id matches the provided index
        const tasks = await Task.find({ user: index }).populate('user');
        
        if (!tasks) {
            return res.status(404).json({ data: null, message: 'Tasks not found', type: 'error' });
        }
        
        return res.json(tasks);
    } catch (err) {
        return res.status(500).json({ data: null, message: err.message, type: 'error' });
    }
});

app.post('/tasks/createTask', async (req, res) => {
    try{
            const taskData = req.body
            const task = new Task({...taskData})
            const user = await User.findById(taskData.author)
            task.user = taskData.author;
            user.tasks.push(task)
            await task.save()    
            await user.save()
            return res.json({data:task, message:"Task created successfully", type:"success"})
        } 
    catch(err){
        return res.json({data:null, message:err.message, type:"error"})
    }
})


app.post('/tasks/completeTask', async (req, res) => {
    try {
        const { taskId } = req.body; // Assuming you're sending the task ID in the request body
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ data: null, message: "Task not found", type: "error" });
        }
        task.completed = !task.completed;
        await task.save();

        return res.json({ data: task, message: "Task updated successfully", type: "success" });
    } catch (err) {
        return res.status(500).json({ data: null, message: err.message, type: "error" });
    }
});



app.post('/tasks/deleteTask', async (req, res) => {
    try {
        const { task } = req.body;
        if (!task || !task._id) {
            return res.json({ data: null, message: "Task ID is required", type: "error" });
        }
        const deletedTask = await Task.findByIdAndDelete(task._id);
        if (!deletedTask) {
            return res.json({ data: null, message: "Task not found", type: "error" });
        }
        if (task.user && task.user._id) {
            await User.findByIdAndUpdate(task.user._id, { $pull: { tasks: task._id } });
        }
        return res.json({ data: deletedTask, message: "Task deleted successfully", type: "success" });
    } catch (err) {
        return res.json({ data: null, message: err.message, type: "error" });
    }
});

app.get('/getMood', async (req, res) => {
    try {
        const moods = await Mood.find().populate('user');

        return res.json({ data: moods, message: "Moods fetched successfully", type: "success" });
    } catch (err) {
        return res.json({ data: null, message: err.message, type: "error" });
    }
});


app.post('/mood', async (req, res) => {
    try {
        const moodData = req.body;

        const currentDate = new Date();
        const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

        let mood = await Mood.findOne({
            user: moodData.author,
            date: { $gte: startOfDay, $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000) } // from start of day to end of day
        });

        const user = await User.findById(moodData.author);

        if (!user) {
            return res.json({ data: null, message: "User not found", type: "error" });
        }

        if (mood) {
            mood.data = moodData.mood;
        } else {
            mood = new Mood({
                data: moodData.mood,
                date: startOfDay,  
                user: moodData.author
            });
            user.mood.push(mood);
        }
        await mood.save();
        await user.save();

        return res.json({ data: mood, message: "Performance updated successfully", type: "success" });
    } catch (err) {
        return res.json({ data: null, message: err.message, type: "error" });
    }
});



app.get('/getCheckInOut/:userId', async (req, res) => {
    try {
      const userId = req.params.userId; 
  
      const today = new Date();
      const todayDateOnly = new Date(today.setHours(0, 0, 0, 0));
  
      const user = await User.findById(userId).populate('checkInOutHistory');
  
      const checkInOutData = user.checkInOutHistory.find((record) => {
        const checkInDateOnly = new Date(record.checkIn).setHours(0, 0, 0, 0);
        return checkInDateOnly === todayDateOnly.getTime(); 
      });
  
      if (!checkInOutData) {
        return res.status(200).json({data:{
          checkIn: "",
          checkOut: "",
          user: userId
        }, message:"Got check-in-out successfully", type:"success"});
      }
  
      return res.status(200).json({data:checkInOutData, message:"Got check-in-out successfully", type: "success"});
    } catch (error) {
      console.error('Error fetching check-in/out data:', error);
      return res.status(500).json({
        message: "Internal Server Error",
        type: "error",
        error: error.message
      });
    }
  });
  

app.post('/setCheckInOut', async (req, res) => {
    try {
      const { user, checkIn, checkOut } = req.body;
      const userFetched = await User.findById(user);
      console.log(req.body)
 
      if (!userFetched) {
        return res.status(404).json({ message: "User not found", type: "error" });
      }
  
      const checkInDate = new Date(checkIn).setHours(0, 0, 0, 0);
  
      let existingRecord = await CheckInOutTime.findOne({
        user: user,
        checkIn: {
          $gte: new Date(checkInDate),
          $lt: new Date(checkInDate + 24 * 60 * 60 * 1000) 
        }
      });
  
      if (existingRecord) {
        existingRecord.checkIn = checkIn; 
        existingRecord.checkOut = checkOut; 
        await existingRecord.save();
  
        return res.json({
          data: existingRecord,
          message: "Check-in/out time updated successfully.",
          type: "success"
        });
      }
  
      const checkInOutRecord = new CheckInOutTime({
        checkIn,
        checkOut,
        user: user
      });
  
      await checkInOutRecord.save();
  
      userFetched.checkInOutHistory.push(checkInOutRecord._id);
      await userFetched.save();
  
      return res.json({
        data: checkInOutRecord,
        message: "Successfully Checked-In/Out",
        type: "success"
      });
    } catch (error) {
      console.error('Error setting check-in/out time:', error);
      return res.status(500).json({
        message: "Internal Server Error",
        type: "error",
        error: error.message
      });
    }
  });
  

  app.get('/getUserData', async (req, res) => {
    try {
      const users = await User.find().populate('checkInOutHistory').exec();
  
      res.status(200).json({data:users, type:"success"});
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


app.listen(4000, () => {
    console.log('Server running on port 4000');
});
