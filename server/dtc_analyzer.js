/**
 * Multi-Code Analytical Engine (The Root Cause Predictor)
 * Analyzes multiple DTCs to find correlations and predict the root cause.
 */

const DTCDatabase = {
    // Engine/Fuel/Air
    "P0171": { system: "Fuel", symptom: "System Too Lean (Bank 1)" },
    "P0172": { system: "Fuel", symptom: "System Too Rich (Bank 1)" },
    "P0300": { system: "Ignition", symptom: "Random/Multiple Cylinder Misfire Detected" },
    "P0301": { system: "Ignition", symptom: "Cylinder 1 Misfire Detected" },
    "P0302": { system: "Ignition", symptom: "Cylinder 2 Misfire Detected" },
    "P0133": { system: "Exhaust", symptom: "O2 Sensor Circuit Slow Response" },
    "P0420": { system: "Exhaust", symptom: "Catalyst System Efficiency Below Threshold" },
    "P0507": { system: "Idle", symptom: "Idle Air Control System RPM Higher Than Expected" },
    // EVAP
    "P0442": { system: "EVAP", symptom: "Evaporative Emission System Leak Detected (Small Leak)" },
    "P0455": { system: "EVAP", symptom: "Evaporative Emission System Leak Detected (Large Leak)" },
    "P0456": { system: "EVAP", symptom: "Evaporative Emission System Leak Detected (Very Small Leak)" },
    "P0440": { system: "EVAP", symptom: "Evaporative Emission System Malfunction" },
    // Transmission
    "P0700": { system: "Transmission", symptom: "Transmission Control System Malfunction" },
    "P0730": { system: "Transmission", symptom: "Incorrect Gear Ratio" },
    "P0894": { system: "Transmission", symptom: "Transmission Component Slipping" },
    "P0218": { system: "Transmission", symptom: "Transmission Fluid Over Temperature" },
    // ABS / Brakes
    "C0035": { system: "ABS", symptom: "Left Front Wheel Speed Sensor Circuit Malfunction" },
    "C0040": { system: "ABS", symptom: "Right Front Wheel Speed Sensor Circuit Malfunction" }
};

const RootCausePatterns = [
    {
        name: "Vacuum Leak",
        required_codes: ["P0171", "P0300"],
        confidence_boost: 40,
        description: "Multiple lean codes and misfires highly indicate unmetered air entering the engine, typically a vacuum leak."
    },
    {
        name: "Failing O2 Sensor",
        required_codes: ["P0133", "P0420"],
        confidence_boost: 35,
        description: "Slow O2 response combined with catalyst inefficiency points to a degraded upstream O2 sensor rather than a failed catalytic converter."
    },
    {
        name: "Major EVAP System Leak",
        required_codes: ["P0440", "P0455"],
        confidence_boost: 45,
        description: "General EVAP malfunction combined with a gross leak usually points to a loose/missing gas cap or a severed vapor hose."
    },
    {
        name: "Transmission Internal Failure / Slippage",
        required_codes: ["P0700", "P0730", "P0894"],
        confidence_boost: 50,
        description: "General TCM malfunction combined with slipping and incorrect gear ratios highly indicates severe internal transmission damage or critically low fluid."
    },
    {
        name: "Wheel Speed Sensor Wiring Harness",
        required_codes: ["C0035", "C0040"],
        confidence_boost: 45,
        description: "Simultaneous front wheel speed sensor failures often point to damage in the main ABS wiring harness rather than simultaneous individual sensor failures."
    }
];

function analyzeCodes(codes) {
    if (!codes || !Array.isArray(codes) || codes.length === 0) {
        return { root_cause: "Unknown", confidence: 0, breakdown: "No codes provided or invalid format." };
    }

    let confidence = 0;
    let root_cause = "Indeterminate";
    let breakdown = "Analyzing codes: " + codes.join(", ") + ".\n";
    
    let activePatterns = [];
    let recognizedCount = 0;

    codes.forEach(code => {
        if (DTCDatabase[code]) {
            recognizedCount++;
        }
    });

    if (recognizedCount === 0) {
        return { root_cause: "Unknown", confidence: 0, breakdown: "None of the provided codes were recognized in the SmartOBD Database." };
    }

    RootCausePatterns.forEach(pattern => {
        const matches = pattern.required_codes.filter(c => codes.includes(c));
        if (matches.length > 0) {
            let matchRatio = matches.length / pattern.required_codes.length;
            let currentConfidence = Math.round(matchRatio * pattern.confidence_boost);
            
            if (matches.length === pattern.required_codes.length) {
                currentConfidence += 20; // Bonus for exact match
            }
            
            if (currentConfidence > confidence) {
                confidence = currentConfidence;
                root_cause = pattern.name;
            }
            
            activePatterns.push(`- Matches ${matches.length} code(s) for ${pattern.name}. ${pattern.description}`);
        }
    });

    if (confidence === 0) {
        breakdown += "No clear correlated pattern found among the provided codes. Individual subsystem diagnosis required.";
    } else {
        breakdown += "Correlations found:\n" + activePatterns.join("\n");
        // Cap confidence at 95%
        confidence = Math.min(confidence + (codes.length * 5), 95);
    }

    return { root_cause, confidence, breakdown };
}

module.exports = { analyzeCodes, DTCDatabase };
