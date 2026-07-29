/**
 * Multi-Code Analytical Engine (The Root Cause Predictor)
 * Analyzes multiple DTCs to find correlations and predict the root cause.
 */

const llmService = require('./llm_service');

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

const WMI_MAP = {
    '1G': 'General Motors',
    '1F': 'Ford',
    '1C': 'Chrysler',
    '1H': 'Honda',
    'JHM': 'Honda',
    '1HG': 'Honda',
    'JH4': 'Honda',
    '1NX': 'Toyota',
    'JT2': 'Toyota',
    'JT3': 'Toyota',
    '4T1': 'Toyota',
    '5TD': 'Toyota',
    'WBA': 'BMW',
    '5UX': 'BMW',
    'WDC': 'Mercedes-Benz',
    'WDD': 'Mercedes-Benz',
    'WDB': 'Mercedes-Benz',
    'WAU': 'Audi',
    'TRU': 'Audi',
    'WP0': 'Porsche',
    'WVW': 'Volkswagen',
    '1VW': 'Volkswagen',
    'JN': 'Nissan',
    'KM8': 'Hyundai',
    'KMH': 'Hyundai',
    'KME': 'Hyundai',
    'KNA': 'Kia',
    'KNM': 'Kia',
    'VF1': 'Renault',
    'VF3': 'Peugeot',
    'SAL': 'Land Rover',
    'SAJ': 'Jaguar',
    'JM1': 'Mazda',
    'JM7': 'Mazda'
};

const YEAR_MAP = {
    '1': '2001', '2': '2002', '3': '2003', '4': '2004', '5': '2005', '6': '2006', '7': '2007', '8': '2008', '9': '2009',
    'A': '2010', 'B': '2011', 'C': '2012', 'D': '2013', 'E': '2014', 'F': '2015', 'G': '2016', 'H': '2017', 'J': '2018',
    'K': '2019', 'L': '2020', 'M': '2021', 'N': '2022', 'P': '2023', 'R': '2024', 'S': '2025', 'T': '2026'
};

const VDS_MAP = {
    'ZV4C': 'X5'
};

function decodeVIN(vin) {
    if (!vin || vin.length < 3) return { make: 'Unknown', vehicle_name: 'Unknown' };
    const wmi3 = vin.substring(0, 3).toUpperCase();
    const wmi2 = vin.substring(0, 2).toUpperCase();
    const make = WMI_MAP[wmi3] || WMI_MAP[wmi2] || 'Unknown';
    
    if (vin.length !== 17) {
        return { make, vehicle_name: make };
    }

    let model = '';
    for (let key in VDS_MAP) {
        if (vin.toUpperCase().includes(key)) {
            model = VDS_MAP[key];
            break;
        }
    }
    
    const yearChar = vin.substring(9, 10).toUpperCase(); // 10th char
    const year = YEAR_MAP[yearChar] || '';

    let vehicle_name = `${year} ${make} ${model}`.replace(/\s+/g, ' ').trim();
    if (vehicle_name === '') vehicle_name = 'Unknown';
    else if (vehicle_name === make) vehicle_name = make;
    
    return { make, vehicle_name };
}

async function decodeVINWithAPI(vin) {
    if (!vin || vin.length !== 17) {
        return decodeVIN(vin);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
        const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error("API response not OK");
        
        const data = await response.json();
        
        let make = '';
        let model = '';
        let year = '';
        
        if (data && data.Results) {
            for (const item of data.Results) {
                if (item.Variable === "Make") make = item.Value || '';
                if (item.Variable === "Model") model = item.Value || '';
                if (item.Variable === "Model Year") year = item.Value || '';
            }
        }
        
        if (!make || make === "null" || make === "Unknown" || make === "") throw new Error("Missing Make from API");
        
        // Sometimes the API returns "MAZDA" or "Mazda" we can capitalize properly if we want, but uppercase or as-is is fine.
        // Convert to title case for cleaner output
        const titleCase = (str) => str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        
        make = titleCase(make);
        if (model) model = titleCase(model);
        
        let vehicle_name = `${year} ${make} ${model}`.replace(/\s+/g, ' ').trim();
        
        return {
            make: make,
            model: model,
            year: year,
            vehicle_name: vehicle_name
        };
    } catch (error) {
        clearTimeout(timeoutId);
        console.warn(`[Diagnostic Engine] NHTSA API failed for VIN ${vin}:`, error.message, "- Falling back to local WMI parser.");
        return decodeVIN(vin);
    }
}

async function analyzeCodes({ dtcs: codes, vin, make, symptoms }) {
    console.log(`[Diagnostic Engine] Request Received - DTCs: ${codes.join(', ')}, VIN: ${vin || 'N/A'}, Make: ${make || 'N/A'}`);
    
    if (!codes || !Array.isArray(codes) || codes.length === 0) {
        return { root_cause: "Unknown", confidence: 0, is_manufacturer_specific: false, breakdown: "No codes provided or invalid format.", recommended_actions: [] };
    }

    const decodedInfo = await decodeVINWithAPI(vin);
    const decodedMake = make || decodedInfo.make;
    const vehicleName = decodedInfo.vehicle_name !== 'Unknown' ? decodedInfo.vehicle_name : (make || 'Unknown');
    const hasManufacturerSpecific = codes.some(code => /^[PCUB][123]\d{3}$/.test(code));

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

    if (recognizedCount === 0 || hasManufacturerSpecific || (symptoms && symptoms.trim().length > 0) || confidence < 50) {
        console.log(`[Diagnostic Engine] Routing to LLM Service. (Recognized: ${recognizedCount}, Manufacturer Specific: ${hasManufacturerSpecific}, Confidence: ${confidence})`);
        try {
            const aiResult = await llmService.analyzeWithAI({ dtcs: codes, vin, make: decodedMake, symptoms });
            aiResult.vehicle_make = decodedMake;
            aiResult.vehicle_name = vehicleName;
            return aiResult;
        } catch (error) {
            console.error("[Diagnostic Engine] LLM Service threw an error:", error);
            throw error; // Let the route handler catch it
        }
    }

    console.log(`[Diagnostic Engine] Routing to Local Rule Engine. (Confidence: ${confidence})`);
    return { 
        root_cause, 
        confidence, 
        is_manufacturer_specific: false, 
        breakdown, 
        recommended_actions: [], 
        vehicle_make: decodedMake,
        vehicle_name: vehicleName,
        diy_guide: {
            required_part: root_cause,
            difficulty_level: "Moderate (Intermediate)",
            required_tools: ["Basic Hand Tools", "OBD2 Scanner"],
            estimated_repair_time: "1 - 2 Hours",
            search_keywords: `${root_cause} replacement`
        }
    };
}

module.exports = { analyzeCodes, DTCDatabase };
