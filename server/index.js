require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const { analyzeCodes } = require('./dtc_analyzer');
const { validateDTCRequest, validateMaintenanceLog } = require('./validators');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// API: Multi-Code Analytical Engine
app.post('/api/analyze', validateDTCRequest, async (req, res) => {
    const { dtcs, vin, make, symptoms } = req.body; // dtcs sanitized by middleware
    try {
        const analysis = await analyzeCodes({ dtcs, vin, make, symptoms });
        res.json(analysis);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Maintenance Logs CRUD
app.get('/api/maintenance', (req, res) => {
    db.all(`SELECT * FROM maintenance_logs ORDER BY date_logged DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/maintenance', validateMaintenanceLog, (req, res) => {
    const { vehicle_id, repair_type, description, mileage, cost, severity, fluid_type } = req.body;

    if (repair_type === 'Fluid Leak') {
        const stmt = db.prepare(`INSERT INTO fluid_leaks (vehicle_id, fluid_type, severity) VALUES (?, ?, ?)`);
        stmt.run([vehicle_id, fluid_type || 'Unknown', severity || 'Low'], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, type: 'fluid_leak' });
        });
    } else {
        const stmt = db.prepare(`INSERT INTO maintenance_logs (vehicle_id, repair_type, description, mileage, cost) VALUES (?, ?, ?, ?, ?)`);
        stmt.run([vehicle_id, repair_type, description, mileage, cost || 0], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, type: 'maintenance_log' });
        });
    }
});

// API: Get Fluid Leaks specifically
app.get('/api/fluid-leaks', (req, res) => {
    db.all(`SELECT * FROM fluid_leaks ORDER BY date_logged DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`SmartOBD Server running on port ${PORT}`);
});
