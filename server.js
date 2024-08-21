

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Environment variables (use .env file for local development)
// Ensure you set this environment variable in your hosting environment

mongoose.connect('mongodb+srv://sabareesh:sabari123@cluster0.0zhev.mongodb.net/?retryWrites=true&w=majority');

app.use(cors());
app.use(express.json());

const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  gender: String,
  lastLoginDate: Date,
  isAdmin: Boolean,
}));

app.post('/signup', async (req, res) => {
  try {
    const user = new User({ ...req.body, lastLoginDate: new Date(), isAdmin: false });
    await user.save();
    res.sendStatus(200);
  } catch (error) {
    console.error('Error signing up user:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || user.password !== req.body.password) {
      return res.sendStatus(401);
    }
    user.lastLoginDate = new Date();
    await user.save();
    res.json({ isAdmin: user.isAdmin });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.post('/profile', async (req, res) => {  // Changed from GET to POST
  try {
    const user = await User.findOne({ email: req.body.email });  // req.query.email changed to req.body.email
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

app.post('/admin-dashboard', async (req, res) => {  // Changed from GET to POST
  try {
    // Fetch user data from MongoDB
    const users = await User.find({});

    // Aggregate user count by month
    const aggregateData = await User.aggregate([
      {
        $group: {
          _id: { $month: "$lastLoginDate" }, // Assuming 'lastLoginDate' field for aggregation
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 } // Sort by month
      }
    ]);

    const chartLabels = aggregateData.map(item => {
      const date = new Date(2020, item._id - 1, 1); // Creating date for label
      return date.toLocaleString('default', { month: 'short' });
    });

    const chartData = aggregateData.map(item => item.count);

    res.json({ users, chartLabels, chartData });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ message: 'Failed to load dashboard data', error: error.message });
  }
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
