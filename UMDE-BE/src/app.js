require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const express = require('express');
const cors = require('cors');

const tripsRouter = require('./routes/trips');
const zonesRouter = require('./routes/zones');
const summaryRouter = require('./routes/summary');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/trips', tripsRouter);
app.use('/api/zones', zonesRouter);
app.use('/api/summary', summaryRouter);

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Handling 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`UMDE API is running on port ${PORT}`);
});