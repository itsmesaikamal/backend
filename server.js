// server.js

const express = require('express');
const mongoose = require('mongoose');
const Registeruser = require('./model');
const Event = require('./Event'); // Ensure your Event model file is named correctly
const jwt = require('jsonwebtoken');
const middleware = require('./middleware');
const cors = require('cors');
const axios = require('axios'); // Import axios for weather API
const app = express();

// Connect to MongoDB
mongoose.connect("mongodb+srv://raminenisaikamal:Mongodb2002@cluster1.eqaqqwv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1", {})
  .then(() => console.log('DB Connection established'))
  .catch(err => console.error('DB Connection Error:', err));

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));

// Register route
app.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmpassword } = req.body;
    const exist = await Registeruser.findOne({ email });
    if (exist) {
      return res.status(400).send('User Already Exists');
    }
    if (password !== confirmpassword) {
      return res.status(400).send('Passwords do not match');
    }
    const newUser = new Registeruser({ username, email, password, confirmpassword });
    await newUser.save();
    res.status(201).send('Registered Successfully');
  } catch (err) {
    console.error('Error in /register:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const exist = await Registeruser.findOne({ email });
    if (!exist) {
      return res.status(400).send('User Not Found');
    }
    if (exist.password !== password) {
      return res.status(400).send('Invalid Credentials');
    }
    const payload = { user: { id: exist.id } };
    jwt.sign(payload, 'jwtSecret', { expiresIn: '7d' }, (err, token) => {
      if (err) {
        console.error('Error signing token:', err);
        throw err;
      }
      res.json({ token });
    });
  } catch (err) {
    console.error('Error in /login:', err);
    res.status(500).send('Server Error');
  }
});

// Profile route
app.get('/myprofile', middleware, async (req, res) => {
  try {
    const user = await Registeruser.findById(req.user.id);
    if (!user) {
      return res.status(404).send('User Not Found');
    }
    res.json(user);
  } catch (err) {
    console.error('Error in /myprofile:', err);
    res.status(500).send('Server Error');
  }
});

// Create an event
app.post('/create-event', middleware, async (req, res) => {
  try {
    const { name, date, location, description } = req.body;
    const newEvent = new Event({
      name,
      date,
      location,
      description,
      userId: req.user.id // Assuming you want to associate events with users
    });
    await newEvent.save();
    res.status(200).send('Event created successfully');
  } catch (err) {
    console.error('Error in /create-event:', err);
    res.status(500).send('Server Error');
  }
});

// View events
app.get('/view-events', middleware, async (req, res) => {
  try {
    console.log('Fetching all events'); // Log the request
    const events = await Event.find(); // Retrieve all events
    console.log('Events found:', events); // Log the events
    res.status(200).json(events);
  } catch (err) {
    console.error('Error in /view-events:', err);
    res.status(500).send('Server Error');
  }
});

// Update event route
app.put('/events/:id', middleware, async (req, res) => {
  try {
    const { name, date, location, description } = req.body;
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { name, date, location, description },
      { new: true }
    );
    if (!updatedEvent) {
      return res.status(404).send('Event Not Found');
    }
    res.json(updatedEvent);
  } catch (err) {
    console.error('Error in /events/:id:', err);
    res.status(500).send('Server Error');
  }
});

// Delete event route
app.delete('/events/:id', middleware, async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return res.status(404).send('Event Not Found');
    }
    res.status(204).send(); // No content to return
  } catch (err) {
    console.error('Error in /events/:id:', err);
    res.status(500).send('Server Error');
  }
});

// Weather API integration
app.get('/weather/:location', async (req, res) => {
  const { location } = req.params;
  const apiKey = '8bae07c02caa739b2ff5ac83d1ecfc69'; // Replace with your actual API key
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?appid=${apiKey}&q=${location}&units=metric`);
    res.json(response.data);
  } catch (err) {
    console.error('Weather API error:', err.message);
    res.status(500).send('Weather API Error');
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
