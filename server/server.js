const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Test API
app.get('/', (req, res) => {
    res.send('API is running');
});

// Product Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/products', require('./routes/scoringRoutes'));

// Server Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});