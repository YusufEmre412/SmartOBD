# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - Dynamic NHTSA VIN API Integration & Smart Query Sanitizer

### Added:
- API-based VIN decoding using the NHTSA Vehicle API for dynamic global Make/Model/Year resolution, with a robust 3-second timeout and local WMI fallback.
- Sleek Vehicle Identification Badge UI (e.g. "2016 Mercedes-Benz E-Class") that proudly displays the dynamically decoded vehicle at the top of the diagnostic results.
- Smart eBay & YouTube search query sanitizer that automatically strips redundant brand strings and zero-result parenthetical OEM parameters to ensure perfectly optimized part matching.

## [1.2.0] - DIY Garage Companion & Context-Aware DTC Refinements

### Added:
- DIY Garage & Part Sourcing feature with eBay/YouTube dynamic links.
- Tool matrix and difficulty ratings for DIY repair recommendations.
- Updated LLM context-awareness to provide explicit warnings for manufacturer-specific codes when VIN/Make are missing.

## [1.1.0] - Hybrid Diagnostic Engine & Groq AI Integration

### Added:
- Integrated Groq SDK with `llama-3.3-70b-versatile` model for ultra-fast, free-tier diagnostic analysis.
- Enforced structured JSON output matching frontend diagnostic schema.
- Added US-built BMW VIN support (`5UX` WMI mapping) to `dtc_analyzer.js`.

### Fixed & Improved:
- Fixed DTC routing regex to correctly intercept manufacturer-specific codes across all chassis systems (`P1-P3`, `B1-B3`, `C1-C3`, `U1-U3`).
- Improved VIN input handling to dynamically filter out invalid characters (I, O, Q) on keypress.
- Enhanced graceful fallback handling and terminal error logging for API failures.

## [1.0.0] - Initial Release
### Added
- Core Engine setup for SmartOBD.
- Multi-Code Analytical Engine (DTC Analyzer).
- Maintenance Logs and Fluid Leaks CRUD API.
- DTC Analysis Dashboard in the frontend.
