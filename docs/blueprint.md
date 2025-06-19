# **App Name**: Fortress Watch

## Core Features:

- Device List: Display paginated list of devices with filters for name, brand, model, version, location, and active status, using the `GET /api/v1/devices/` endpoint.
- Device Details: Display detailed information for a selected device using the `GET /api/v1/devices/{id}` endpoint, including device properties and related scans.
- Vulnerability Scanning: Allow triggering full, local, web, and AI-powered vulnerability scans using `POST` endpoints and display the scan results.
- Bulk Scan: Enable bulk scanning of devices by selecting multiple device IDs and using the `POST /api/v1/vulnerabilities/scan/devices/batch` endpoint, then display the results in a table.
- Scan History: Show historical scan data from the `GET /api/v1/reports/scans` endpoint, filterable by device, status and scan type.
- Organization Dashboard: Presents overall statistics and key data insights at the organization level, using the `/api/v1/reports/organization/summary` endpoint, with a clear data visualizations.
- AI-Enhanced Scans: Offer multiple scan variations including 'web' scan which uses web search and AI filtering and 'ai' scan which leverages the Gemini AI's knowledge. Confidence scores help the user understand the LLM's assessments. A tool to choose different scanning levels (full, local, AI or web) depending on the required confidence score and comprehensiveness.

## Style Guidelines:

- Primary color: Strong blue (#3B82F6) to communicate trust.
- Background color: Light gray (#F9FAFB) to create a clean, professional feel.
- Accent color: A calming green (#84CC16) to highlight key actions and successes.
- Body and headline font: 'Inter' (sans-serif) to give a modern, machined, objective feel.
- Use clear, simple icons to represent different device types, scan statuses, and report options.
- Implement a clean, grid-based layout to ensure all components are well-organized and easy to locate.
- Use subtle transitions and loading animations to enhance user experience without being intrusive.