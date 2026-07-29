const { DTCDatabase } = require('./dtc_analyzer');

function validateDTCRequest(req, res, next) {
    const { dtcs } = req.body;

    if (!dtcs) {
        return res.status(400).json({ error: "Missing 'dtcs' field in payload." });
    }

    if (!Array.isArray(dtcs)) {
        return res.status(400).json({ error: "Invalid input. 'dtcs' must be an array of strings." });
    }

    if (dtcs.length === 0) {
        return res.status(400).json({ error: "Empty array provided. Please supply at least one DTC." });
    }

    const sanitizedDtcs = [];
    for (let i = 0; i < dtcs.length; i++) {
        if (typeof dtcs[i] !== 'string') {
            return res.status(400).json({ error: `Invalid DTC at index ${i}. Must be a string.` });
        }
        
        const code = dtcs[i].trim().toUpperCase();
        // Allow codes like P0171, C0035, U1000, B0001
        if (!/^[PCUB]\d{4}$/.test(code)) {
            return res.status(400).json({ error: `Invalid DTC format '${code}'. Must be a 5-character string starting with P, C, U, or B followed by 4 digits.` });
        }
        sanitizedDtcs.push(code);
    }

    // Attach sanitized codes back to the request
    req.body.dtcs = sanitizedDtcs;
    next();
}

function validateMaintenanceLog(req, res, next) {
    const { vehicle_id, repair_type, severity, mileage } = req.body;

    if (!vehicle_id || !repair_type) {
        return res.status(400).json({ error: "Missing required fields: vehicle_id, repair_type." });
    }

    if (mileage && typeof mileage !== 'number') {
        return res.status(400).json({ error: "Mileage must be a number." });
    }

    next();
}

module.exports = { validateDTCRequest, validateMaintenanceLog };
