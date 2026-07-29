const API_BASE = 'http://localhost:3001/api';

export const analyzeDTCs = async (dtcs) => {
    const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dtcs })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze DTCs');
    }
    return response.json();
};

export const fetchMaintenanceLogs = async () => {
    const response = await fetch(`${API_BASE}/maintenance`);
    if (!response.ok) throw new Error('Failed to fetch logs');
    return response.json();
};

export const fetchFluidLeaks = async () => {
    const response = await fetch(`${API_BASE}/fluid-leaks`);
    if (!response.ok) throw new Error('Failed to fetch fluid leaks');
    return response.json();
};

export const addMaintenanceLog = async (logData) => {
    const response = await fetch(`${API_BASE}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add log');
    }
    return response.json();
};
