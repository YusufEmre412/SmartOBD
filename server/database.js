const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'smartobd.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeSchema();
    }
});

function initializeSchema() {
    db.serialize(() => {
        // Maintenance Log Table
        db.run(`
            CREATE TABLE IF NOT EXISTS maintenance_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehicle_id TEXT NOT NULL,
                repair_type TEXT NOT NULL,
                description TEXT,
                mileage INTEGER,
                date_logged DATETIME DEFAULT CURRENT_TIMESTAMP,
                cost REAL
            )
        `);

        // Fluid Leaks Tracking Table
        db.run(`
            CREATE TABLE IF NOT EXISTS fluid_leaks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vehicle_id TEXT NOT NULL,
                fluid_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                date_logged DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    });
}

module.exports = db;
