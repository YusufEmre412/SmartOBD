# SmartOBD - Hybrid Diagnostic Engine

SmartOBD is a vehicle diagnostic and maintenance tracking application powered by a hybrid root-cause analysis engine. It combines a local rules-based algorithm with an AI-assisted diagnostic fallback to handle complex, low-confidence, or manufacturer-specific trouble codes.

## Features
- **Local Rule Engine**: Quickly identifies common correlations (e.g., Vacuum Leaks, EVAP issues) using a local pattern database.
- **AI Fallback (Hybrid Routing)**: Automatically delegates to Google Gemini AI for complex, manufacturer-specific (`P1XXX`, `P2XXX`), or unrecognized codes.
- **VIN Decoding**: Automatically detects the vehicle make from standard World Manufacturer Identifiers (WMI).
- **Maintenance Tracking**: Tracks fluid leaks and general vehicle repair logs.

## Configuration & Getting Started

### 1. Setup the Backend API
1. Navigate to the `server/` directory:
   ```bash
   cd server
   npm install
   ```
2. Configure your AI Key:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and replace `your_api_key_here` with your actual Google Gemini API Key.
3. Start the backend server (runs on port 3001 by default):
   ```bash
   npm start
   ```

### 2. Setup the Frontend
1. Navigate to the `client/` directory:
   ```bash
   cd client
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Hybrid Analysis Workflow
1. The user enters DTCs (e.g., P0171, P0300), an optional VIN, and optional Symptoms in the frontend UI.
2. The payload is sent to the backend `/api/analyze` endpoint.
3. The backend extracts the WMI from the VIN to determine the vehicle make (`decodeVIN`).
4. The local rule engine processes the codes. 
5. If the codes include manufacturer-specific prefixes, if the local confidence score is below 50%, or if explicit symptoms were provided, the backend forwards the request to the `llm_service`.
6. The AI agent acts as a master mechanic, analyzing the codes in the context of the symptoms and vehicle make, returning a strictly formatted JSON response.
7. The result is pushed back to the client. If AI was used, the UI displays an "AI-Assisted Analysis" badge alongside an actionable list of recommended diagnostic steps.

## Testing
Run the backend unit tests to verify the local rule engine and hybrid routing:
```bash
cd server
npm test
```
