const test = require('node:test');
const assert = require('node:assert');
const { analyzeCodes } = require('./dtc_analyzer');

test('DTC Analyzer - Vacuum Leak Scenario', (t) => {
    const result = analyzeCodes(['P0171', 'P0300']);
    assert.strictEqual(result.root_cause, 'Vacuum Leak');
    assert.ok(result.confidence > 70, 'Confidence should be high for exact match');
    assert.ok(result.breakdown.includes('unmetered air entering the engine'), 'Breakdown should explain vacuum leak');
});

test('DTC Analyzer - Evap Leak Scenario', (t) => {
    const result = analyzeCodes(['P0440', 'P0455']);
    assert.strictEqual(result.root_cause, 'Major EVAP System Leak');
    assert.ok(result.confidence > 70);
});

test('DTC Analyzer - Transmission Scenario', (t) => {
    const result = analyzeCodes(['P0700', 'P0730']);
    assert.strictEqual(result.root_cause, 'Transmission Internal Failure / Slippage');
    assert.ok(result.confidence > 70);
});

test('DTC Analyzer - Unrecognized Codes', (t) => {
    const result = analyzeCodes(['Z9999']);
    assert.strictEqual(result.root_cause, 'Unknown');
    assert.strictEqual(result.confidence, 0);
});

test('DTC Analyzer - Empty Array', (t) => {
    const result = analyzeCodes([]);
    assert.strictEqual(result.root_cause, 'Unknown');
    assert.strictEqual(result.confidence, 0);
});

test('DTC Analyzer - Null Input', (t) => {
    const result = analyzeCodes(null);
    assert.strictEqual(result.root_cause, 'Unknown');
});
