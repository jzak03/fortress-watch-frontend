
# Fortress Watch API Documentation

This document outlines the API endpoints and data schemas for the Fortress Watch application. The base URL for all API endpoints is `/api/v1`.

## Table of Contents

1.  [Authentication](#authentication)
2.  [Data Models](#data-models)
    *   [Device](#device-model)
    *   [Scan](#scan-model)
    *   [ScanResult](#scanresult-model)
    *   [Vulnerability](#vulnerability-model)
    *   [OrganizationSummary](#organizationsummary-model)
    *   [CustomReportParams](#customreportparams-model)
    *   [CustomReportResponse](#customreportresponse-model)
    *   [PaginatedResponse](#paginatedresponse-model)
3.  [Device Endpoints](#device-endpoints)
4.  [Scan Endpoints](#scan-endpoints)
5.  [Report Endpoints](#report-endpoints)
6.  [AI Service Endpoints (Server Actions)](#ai-service-endpoints-server-actions)

---

## 1. Authentication

(To be defined - e.g., JWT-based, API Keys. For now, assume endpoints are protected and require authentication unless specified otherwise.)

---

## 2. Data Models

These are the primary data structures used throughout the API. They correspond to the types defined in `src/types/index.ts`.

### Device Model

Represents a firewall device.

```json
{
  "id": "string (uuid)",
  "name": "string",
  "brand": "string",
  "model": "string",
  "version": "string (firmware version)",
  "location": "string",
  "ipAddress": "string",
  "macAddress": "string",
  "os": "string",
  "osVersion": "string",
  "isActive": "boolean",
  "lastSeen": "string (ISO 8601 datetime)",
  "createdAt": "string (ISO 8601 datetime)",
  "updatedAt": "string (ISO 8601 datetime)",
  "tags": ["string"]
}
```

### Scan Model

Represents a scan performed on a device.

```json
{
  "id": "string (uuid)",
  "deviceId": "string (uuid)",
  "deviceName": "string",
  "scanType": "string ('full' | 'local' | 'web' | 'ai')",
  "status": "string ('pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled')",
  "startedAt": "string (ISO 8601 datetime, optional)",
  "completedAt": "string (ISO 8601 datetime, optional)",
  "summary": "string (optional, AI generated summary)",
  "aiAnalysis": { // Optional, present if AI enhancement was used
    "executiveSummary": "string",
    "prioritizedRecommendations": "string",
    "confidenceScore": "number (0-1)"
  },
  "results": [ // Optional, array of ScanResult objects
    // See ScanResult Model
  ],
  "vulnerabilitiesFound": "number",
  "createdAt": "string (ISO 8601 datetime)"
}
```

### ScanResult Model

Represents a single finding within a scan.

```json
{
  "id": "string (uuid)",
  "scanId": "string (uuid)",
  "vulnerabilityId": "string (uuid, optional, if mapped to a known vulnerability)",
  "finding": "string (Description of the finding)",
  "details": "string (More details about the finding, optional)",
  "severity": "string ('critical' | 'high' | 'medium' | 'low' | 'informational')",
  "status": "string ('open' | 'closed' | 'ignored')",
  "aiConfidenceScore": "number (0-1, optional, for AI-enhanced findings)",
  "aiSuggestedRemediation": "string (optional)",
  "createdAt": "string (ISO 8601 datetime)"
}
```

### Vulnerability Model

Represents a known vulnerability. (Primarily for reference, usually part of `ScanResult`)

```json
{
  "id": "string (uuid)",
  "cveId": "string (e.g., CVE-2023-12345, optional)",
  "name": "string",
  "description": "string",
  "severity": "string ('critical' | 'high' | 'medium' | 'low' | 'informational')",
  "cvssScore": "number (optional)",
  "remediation": "string (optional)",
  "affectedSoftware": "string (optional)",
  "references": ["string (url)"]
}
```

### OrganizationSummary Model

Summary data for the organization's security posture.

```json
{
  "totalDevices": "number",
  "activeDevices": "number",
  "devicesWithCriticalVulnerabilities": "number",
  "totalVulnerabilities": "number",
  "averageTimeToRemediate": "string (e.g., '7 days', optional)",
  "recentScansCount": "number",
  "scanActivity": [
    { "date": "string (YYYY-MM-DD)", "count": "number" }
  ],
  "vulnerabilitySeverityDistribution": [
    { "severity": "string", "count": "number" }
  ]
}
```

### CustomReportParams Model

Parameters for generating a custom report.

```json
{
  "report_type": "string (User-defined name for the report)",
  "filters": {
    "device_brands": ["string"],
    "severity_levels": ["string ('critical' | 'high' | 'medium' | 'low' | 'informational')"],
    "date_range": { // Optional
      "start": "string (ISO 8601 date, optional)",
      "end": "string (ISO 8601 date, optional)"
    }
  },
  "include_trends": "boolean",
  "format": "string ('pdf' | 'csv')"
}
```

### CustomReportResponse Model

Response after requesting a custom report.

```json
{
  "report_id": "string (uuid)",
  "status": "string ('queued' | 'generating' | 'completed' | 'failed')",
  "message": "string (optional)",
  "data": { // Optional, present if status is 'completed'
    "downloadLink": "string (url to download the report, optional)",
    "details": "any (report-specific data, optional)",
    "filtersApplied": { 
      "device_brands": ["string"],
      "severity_levels": ["string"],
      "date_range": { "start": "string", "end": "string" }
     },
    "trendsIncluded": "boolean",
    "trendSummary": "string (Textual summary of trends, present if trendsIncluded is true, e.g., 'Overall vulnerability count decreased by 15% ...')"
  },
  "generated_at": "string (ISO 8601 datetime)"
}
```

### PaginatedResponse Model

A generic wrapper for paginated list responses.

```json
{
  "data": "[T[] (array of items, e.g., Device[])]",
  "currentPage": "number",
  "totalPages": "number",
  "totalItems": "number",
  "itemsPerPage": "number"
}
```

---

## 3. Device Endpoints

### `GET /devices`
- **Purpose**: List all devices with filtering and pagination.
- **Query Parameters**:
    - `name`: string (filter by device name, case-insensitive, partial match)
    - `brand`: string (filter by brand)
    - `model`: string (filter by model, case-insensitive, partial match)
    - `version`: string (filter by firmware version)
    - `location`: string (filter by location)
    - `isActive`: boolean (filter by active status)
    - `page`: number (default: 1)
    - `limit`: number (default: 10, max: 100)
- **Response**: `200 OK` - `PaginatedResponse<Device>`

### `POST /devices`
- **Purpose**: Create a new device.
- **Request Body**: `Device` (excluding `id`, `lastSeen`, `createdAt`, `updatedAt`)
    ```json
    {
      "name": "string",
      "brand": "string",
      "model": "string",
      "version": "string",
      "location": "string",
      "ipAddress": "string",
      "macAddress": "string",
      "os": "string",
      "osVersion": "string",
      "isActive": "boolean",
      "tags": ["string"]
    }
    ```
- **Response**: `201 Created` - `Device` (the created device object)

### `GET /devices/{id}`
- **Purpose**: Get details of a single device.
- **Path Parameters**:
    - `id`: string (Device ID)
- **Response**: `200 OK` - `Device`
    - May include a list of recent scans associated with the device (e.g., `device.scans`).

### `PUT /devices/{id}`
- **Purpose**: Update an existing device.
- **Path Parameters**:
    - `id`: string (Device ID)
- **Request Body**: `Device` (all fields required for a full update, excluding read-only fields like `id`, `createdAt`)
- **Response**: `200 OK` - `Device` (the updated device object)

### `PATCH /devices/{id}`
- **Purpose**: Partially update an existing device (e.g., to change `isActive` status).
- **Path Parameters**:
    - `id`: string (Device ID)
- **Request Body**: Partial `Device` object.
    ```json
    // Example: Deactivating a device
    {
      "isActive": false
    }
    ```
- **Response**: `200 OK` - `Device` (the updated device object)

### `DELETE /devices/{id}`
- **Purpose**: Delete a device.
- **Path Parameters**:
    - `id`: string (Device ID)
- **Response**: `204 No Content` or `200 OK` with a confirmation message.
    ```json
    {
      "message": "Device deleted successfully."
    }
    ```

---

## 4. Scan Endpoints

### `POST /scans`
- **Purpose**: Trigger a new scan for a device.
- **Request Body**:
    ```json
    {
      "deviceId": "string (uuid)",
      "scanType": "string ('full' | 'local' | 'web' | 'ai')"
    }
    ```
- **Response**: `202 Accepted` - `Scan` (the initiated scan object, status typically 'pending' or 'in_progress')
    - The actual scan results will be available once the scan status is 'completed'. The client should poll the scan status or use WebSockets if available.

### `POST /scans/batch`
- **Purpose**: Trigger scans for multiple devices.
- **Request Body**:
    ```json
    {
      "deviceIds": ["string (uuid)"],
      "scanType": "string ('full' | 'local' | 'web' | 'ai')" // Scan type applies to all devices in batch
    }
    ```
- **Response**: `202 Accepted`
    ```json
    {
      "jobId": "string (uuid, for tracking the batch operation)",
      "message": "string (e.g., 'X scans initiated.')",
      "initiatedScans": [ // Optional: list of scan objects initiated
        // Scan Model
      ]
    }
    ```

### `GET /scans`
- **Purpose**: Get scan history with filtering and pagination. (Corresponds to `fetchScanHistory`)
- **Query Parameters**:
    - `deviceId`: string (filter by device ID)
    - `status`: string (`ScanStatus` or 'all')
    - `scanType`: string (`ScanType` or 'all')
    - `page`: number (default: 1)
    - `limit`: number (default: 10)
    - `startDate`: string (ISO 8601 date, filter scans completed on or after this date)
    - `endDate`: string (ISO 8601 date, filter scans completed on or before this date)
- **Response**: `200 OK` - `PaginatedResponse<Scan>`

### `GET /scans/{id}`
- **Purpose**: Get details of a specific scan.
- **Path Parameters**:
    - `id`: string (Scan ID)
- **Response**: `200 OK` - `Scan` (including `results` if completed)

---

## 5. Report Endpoints

### `GET /reports/organization/summary`
- **Purpose**: Get an organization-wide summary.
- **Response**: `200 OK` - `OrganizationSummary`

### `POST /reports/custom`
- **Purpose**: Generate a custom report.
- **Request Body**: `CustomReportParams`
- **Response**: `202 Accepted` or `200 OK` - `CustomReportResponse` (status may indicate 'queued' or 'generating')

---

## 6. AI Service Endpoints (Server Actions)

These endpoints are typically invoked as Server Actions in a Next.js application, rather than traditional REST API calls. The schemas represent the input and output of these server-side functions.

### `suggestRemediationSteps`
- **Purpose**: Get AI-suggested remediation steps for a vulnerability.
- **Input Schema** (`SuggestRemediationStepsInput`):
    ```json
    {
      "vulnerabilityDescription": "string",
      "deviceInformation": "string"
    }
    ```
- **Output Schema** (`AISuggestion` / `SuggestRemediationStepsOutput`):
    ```json
    {
      "remediationSteps": "string (Markdown formatted)",
      "confidenceScore": "number (0-1)"
    }
    ```

### `enhanceScanWithAi`
- **Purpose**: Enhance a scan report with AI analysis.
- **Input Schema** (`EnhanceScanWithAiInput`):
    ```json
    {
      "scanReport": "string (JSON string of scan results or relevant data)"
    }
    ```
- **Output Schema** (`AIEnhancement` / `EnhanceScanWithAiOutput`):
    ```json
    {
      "executiveSummary": "string",
      "prioritizedRecommendations": "string (Markdown formatted)",
      "confidenceScore": "number (0-1)"
    }
    ```

### `summarizeScanFindings`
- **Purpose**: Summarize scan findings using AI.
- **Input Schema** (`SummarizeScanFindingsInput`):
    ```json
    {
      "scanData": "string (JSON string of scan results or relevant data)"
    }
    ```
- **Output Schema** (`AISummary` / `SummarizeScanFindingsOutput`):
    ```json
    {
      "summary": "string (Markdown formatted)",
      "keyInsights": "string (Markdown formatted)",
      "confidenceScore": "number (0-1)"
    }
    ```

---

