
# Vulntrack API Documentation

This document outlines the API endpoints and data schemas for the Vulntrack application. The base URL for all API endpoints is `/api/v1`.

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
    *   [UserProfileSettings](#userprofilesettings-model)
    *   [NotificationPreferences](#notificationpreferences-model)
    *   [PasswordChangeRequest](#passwordchangerequest-model)
    *   [TwoFactorAuthStatus](#twofactorauthstatus-model)
    *   [Notification](#notification-model)
    *   [ActivityLogEntry](#activitylogentry-model)
3.  [Device Endpoints](#device-endpoints)
4.  [Scan Endpoints](#scan-endpoints)
5.  [Report Endpoints](#report-endpoints)
6.  [AI Service Endpoints (Server Actions)](#ai-service-endpoints-server-actions)
7.  [Settings Endpoints](#settings-endpoints)
8.  [Notification Endpoints](#notification-endpoints)
9.  [Security Endpoints](#security-endpoints)

---

## 1. Authentication

(To be defined - e.g., JWT-based, API Keys. For now, assume endpoints are protected and require authentication unless specified otherwise.)

---

## 2. Data Models

These are the primary data structures used throughout the API. They correspond to the types defined in `src/types/index.ts` or are specific to API interactions.

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
    { "severity": "string ('critical' | 'high' | 'medium' | 'low' | 'informational')", "count": "number" }
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

### UserProfileSettings Model
Represents user profile settings that can be updated.
```json
{
  "name": "string",
  "email": "string (email format)",
  "avatarUrl": "string (url, optional)"
}
```

### NotificationPreferences Model
Represents user's notification preferences.
```json
{
  "emailNotifications": "boolean",
  "pushNotifications": "boolean",
  "notificationCategories": { // Optional, for fine-grained control
    "scanCompletion": "boolean",
    "criticalAlerts": "boolean",
    "reportReady": "boolean"
  }
}
```

### PasswordChangeRequest Model
Request body for changing password.
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

### TwoFactorAuthStatus Model
Status and details for 2FA.
```json
{
  "isEnabled": "boolean",
  "setupKey": "string (optional, for TOTP setup, only present if isEnabled is false and setup is initiated)",
  "qrCodeUri": "string (optional, data URI for QR code, only present if isEnabled is false and setup is initiated)",
  "recoveryCodes": ["string (optional, provided once upon enabling 2FA)"]
}
```

### Notification Model
Represents a single notification for a user.
```json
{
  "id": "string (uuid)",
  "type": "string ('scan_completed' | 'critical_alert' | 'report_ready' | 'system_update')",
  "title": "string",
  "message": "string",
  "isRead": "boolean",
  "link": "string (optional, e.g., to a specific device or report)",
  "createdAt": "string (ISO 8601 datetime)"
}
```

### ActivityLogEntry Model
Represents a single entry in the user's activity log.
```json
{
  "id": "string (uuid)",
  "timestamp": "string (ISO 8601 datetime)",
  "action": "string (e.g., 'user_login', 'device_view', 'scan_started')",
  "details": "string (Description of the activity)",
  "ipAddress": "string (optional)",
  "targetResourceId": "string (optional, e.g., deviceId, scanId)"
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
- **Purpose**: Get an organization-wide summary, typically used to populate the main dashboard.
- **Response**: `200 OK` - `OrganizationSummary`
- **Dashboard Usage**:
    - **Key Statistic Cards**:
        - `totalDevices`: Used for the "Total Devices" card's main value.
        - `activeDevices`: Used in the description of the "Total Devices" card.
        - `devicesWithCriticalVulnerabilities`: Used for the "Critical Vulnerabilities" card.
        - `totalVulnerabilities`: Used for the "Total Open Vulnerabilities" card.
        - `recentScansCount`: Used for the "Recent Scans (7d)" card.
        - `averageTimeToRemediate`: Used in the description of the "Recent Scans (7d)" card.
    - **Scan Activity Chart (Line Chart)**:
        - Uses the `scanActivity` array. Each object in this array contains:
            - `date`: string (YYYY-MM-DD) - The date of the scan activity.
            - `count`: number - The number of scans performed on that date.
    - **Vulnerability Severity Distribution Chart (Pie Chart)**:
        - Uses the `vulnerabilitySeverityDistribution` array. Each object in this array contains:
            - `severity`: string ('critical' | 'high' | 'medium' | 'low' | 'informational') - The severity level.
            - `count`: number - The count of open vulnerabilities for that severity level.

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

## 7. Settings Endpoints

Manage user-specific settings.

### `GET /settings/profile`
- **Purpose**: Get current user's profile settings.
- **Response**: `200 OK` - `UserProfileSettings`

### `PUT /settings/profile`
- **Purpose**: Update current user's profile settings.
- **Request Body**: `UserProfileSettings`
- **Response**: `200 OK` - `UserProfileSettings` (updated object)

### `GET /settings/notifications`
- **Purpose**: Get current user's notification preferences.
- **Response**: `200 OK` - `NotificationPreferences`

### `PUT /settings/notifications`
- **Purpose**: Update current user's notification preferences.
- **Request Body**: `NotificationPreferences`
- **Response**: `200 OK` - `NotificationPreferences` (updated object)

### `POST /settings/password`
- **Purpose**: Change current user's password.
- **Request Body**: `PasswordChangeRequest`
- **Response**: `200 OK`
  ```json
  {
    "message": "Password changed successfully."
  }
  ```
  or `400 Bad Request` if current password is incorrect or new password doesn't meet criteria.

### `GET /settings/2fa`
- **Purpose**: Get the status of Two-Factor Authentication for the current user.
- **Response**: `200 OK` - `TwoFactorAuthStatus`

### `POST /settings/2fa/enable`
- **Purpose**: Initiate the process to enable 2FA. May return a setup key and QR code.
- **Request Body**: (empty or may include 2FA method type if multiple are supported)
- **Response**: `200 OK` - `TwoFactorAuthStatus` (with `setupKey` and `qrCodeUri` if applicable)
  ```json
  // Example if TOTP is being set up
  {
    "isEnabled": false,
    "setupKey": "JBSWY3DPEHPK3PXP",
    "qrCodeUri": "data:image/png;base64,..."
  }
  ```

### `POST /settings/2fa/verify`
- **Purpose**: Verify the 2FA code provided by the user during setup or login.
- **Request Body**:
  ```json
  {
    "token": "string (e.g., 6-digit code from authenticator app)"
  }
  ```
- **Response**: `200 OK` (if token is valid)
  ```json
  {
    "message": "2FA verified successfully.",
    "recoveryCodes": ["string"] // If enabling, provide recovery codes
  }
  ```
  or `400 Bad Request` if token is invalid.

### `POST /settings/2fa/disable`
- **Purpose**: Disable 2FA for the current user. May require current password or 2FA code for confirmation.
- **Request Body**:
  ```json
  {
    "confirmationToken": "string (e.g., current password or a 2FA code)"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "message": "Two-Factor Authentication disabled successfully."
  }
  ```

---

## 8. Notification Endpoints

Manage user notifications.

### `GET /notifications`
- **Purpose**: List notifications for the current user.
- **Query Parameters**:
    - `page`: number (default: 1)
    - `limit`: number (default: 10)
    - `status`: string ('read' | 'unread' | 'all', default: 'unread')
- **Response**: `200 OK` - `PaginatedResponse<Notification>`

### `POST /notifications/{id}/read`
- **Purpose**: Mark a specific notification as read.
- **Path Parameters**:
    - `id`: string (Notification ID)
- **Response**: `200 OK` - `Notification` (the updated notification object)

### `POST /notifications/read-all`
- **Purpose**: Mark all unread notifications as read for the current user.
- **Response**: `200 OK`
  ```json
  {
    "message": "All notifications marked as read."
  }
  ```

### `DELETE /notifications/{id}`
- **Purpose**: Delete a specific notification.
- **Path Parameters**:
    - `id`: string (Notification ID)
- **Response**: `204 No Content` or `200 OK` with confirmation.

---

## 9. Security Endpoints

Endpoints related to user security and audit trails.

### `GET /security/activity-log`
- **Purpose**: Get the activity log for the current user.
- **Query Parameters**:
    - `page`: number (default: 1)
    - `limit`: number (default: 20)
    - `actionType`: string (filter by specific action, e.g., 'user_login')
    - `startDate`: string (ISO 8601 date)
    - `endDate`: string (ISO 8601 date)
- **Response**: `200 OK` - `PaginatedResponse<ActivityLogEntry>`

---
```