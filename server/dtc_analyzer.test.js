const test = require('node:test');
const assert = require('node:assert');
const dtcAnalyzer = require('./dtc_analyzer');
const llmService = require('./llm_service');

// Mock the LLM service
llmService.analyzeWithAI = async ({ dtcs, vin, make, symptoms }) => {
    return {
        root_cause: "Mocked LLM Response",
        confidence: 85,
        is_manufacturer_specific: true,
        breakdown: "Mocked breakdown",
        recommended_actions: ["Action 1"]
    };
};

test('DTC Analyzer - Vacuum Leak Scenario', async (t) => {
    const result = await dtcAnalyzer.analyzeCodes({ dtcs: ['P0171', 'P0300'] });
    assert.strictEqual(result.root_cause, 'Vacuum Leak');
    assert.ok(result.confidence >= 70, 'Confidence should be high for exact match');
    assert.ok(result.breakdown.includes('unmetered air entering the engine'), 'Breakdown should explain vacuum leak');
});

test('DTC Analyzer - Evap Leak Scenario', async (t) => {
    const result = await dtcAnalyzer.analyzeCodes({ dtcs: ['P0440', 'P0455'] });
    assert.strictEqual(result.root_cause, 'Major EVAP System Leak');
    assert.ok(result.confidence > 70);
});

test('DTC Analyzer - Transmission Scenario', async (t) => {
    // Providing all 3 codes for an exact match to exceed the 50% confidence threshold for local rules
    const result = await dtcAnalyzer.analyzeCodes({ dtcs: ['P0700', 'P0730', 'P0894'] });
    assert.strictEqual(result.root_cause, 'Transmission Internal Failure / Slippage');
    assert.ok(result.confidence > 70);
});

test('DTC Analyzer - Unrecognized Codes (Triggers LLM)', async (t) => {
    const result = await dtcAnalyzer.analyzeCodes({ dtcs: ['Z9999'] });
    assert.strictEqual(result.root_cause, 'Mocked LLM Response');
});

test('DTC Analyzer - Manufacturer Specific (Triggers LLM)', async (t) => {
    const result = await dtcAnalyzer.analyzeCodes({ dtcs: ['P1101'] });
    assert.strictEqual(result.root_cause, 'Mocked LLM Response');
});

test('DTC Analyzer - Empty Array', async (t) => {
    const result = await dtcAnalyzer.analyzeCodes({ dtcs: [] });
    assert.strictEqual(result.root_cause, 'Unknown');
    assert.strictEqual(result.confidence, 0);
});

test('DTC Analyzer - Null Input', async (t) => {
    const result = await dtcAnalyzer.analyzeCodes({ dtcs: null });
    assert.strictEqual(result.root_cause, 'Unknown');
});

test('DTC Analyzer - Valid VIN Decoding (Local Rule)', async (t) => {
    // 1HG = Honda
    const result = await dtcAnalyzer.analyzeCodes({ dtcs: ['P0171', 'P0300'], vin: '1HGCM82633A000000' });
    assert.strictEqual(result.vehicle_make, 'Honda');
});

test('DTC Analyzer - Valid VIN Decoding (LLM Fallback)', async (t) => {
    // WBA = BMW. Triggers LLM due to P1101
    const result = await dtcAnalyzer.analyzeCodes({ dtcs: ['P1101'], vin: 'WBA00000000000000' });
    assert.strictEqual(result.vehicle_make, 'BMW');
});

test('DTC Analyzer - Invalid / Malformed Input Fallback', async (t) => {
    // Missing 'dtcs' property entirely
    const result = await dtcAnalyzer.analyzeCodes({});
    assert.strictEqual(result.root_cause, 'Unknown');
});
