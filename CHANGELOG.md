# Changelog

All notable changes to this project will be documented in this file.

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
