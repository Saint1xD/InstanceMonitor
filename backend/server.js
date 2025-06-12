const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

// Import the routes
const monitorRoutes = require('./routes/monitorRoutes');

const app = express();
const PORT = 8080;

// --- Middlewares ---
// Enable Cross-Origin Resource Sharing
app.use(cors());
// Parse incoming JSON requests
app.use(express.json());

// --- Routes ---
app.use('/api/InstanceMonitor', monitorRoutes);


// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
