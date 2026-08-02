# Forward Proxy (SWG) Implementation Plan

## 1. Overview
This document outlines the plan to extend the Circuit Breaker Portal to include F5 Secure Web Gateway (SWG) functionalities, **specifically replacing existing Bluecoat proxy services**. The goal is to provide a comprehensive self-service interface for System Administrators to easily configure Forward Proxy, SSL Interception, User Management, and Security Policies.

## 2. Architecture & Navigation

### 2.1 New Portal Section
*   **Route**: Create a new route `/swg` (or integrated under `/security/swg`) to house all SWG-related configurations.
*   **Navigation**: Add "Secure Web Gateway" to the main navigation bar.
*   **Tabs**:
    1.  **Dashboard**: High-level metrics (Traffic, Blocked Requests, Threats).
    2.  **Proxy Configuration**: Listener and SSL settings.
    3.  **URL Filtering**: URL categories and block lists.
    4.  **Policies**: Security policy and rule management.

## 3. Feature Specifications

### 3.1 Basic Explicit Proxy Functionality
**Requirement**: Enable users to configure the explicit proxy listener and SSL interception settings.

*   **UI Components**:
    *   **Proxy Listener Config**:
        *   Input fields for **Proxy IP Address** (e.g., `10.1.10.51`) and **Port** (e.g., `8080`).
        *   Toggle for **Enable/Disable**.
    *   **SSL Interception Settings**:
        *   **CA Certificate Management**: Upload/View CA certificates used for signing intercepted traffic (Issuer: `localhost/localdomain` or corporate CA).
        *   **Bypass List**: Manage destination IPs/Domains that should *not* be intercepted (SSL Bypass).
        *   **UI**: Interface to manage `dg-ssl-bypass` Data Group.
        *   **SSLO Rule Configuration**:
            *   **Context**: Layer 2 SSLO Engine Policy.
            *   **Rule Name**: `ssl-bypass-test`.
            *   **Condition**: `Server Name (TLS ClientHello)` is `SubString` of `/Common/dg-ssl-bypass`.
            *   **SSL Proxy Action**: `Bypass`.
            *   **Action**: `Allow`.
    *   **Test Scenario (Item 1.5)**:
        *   **Pre-Check**: Access `https://microsoft.com` and verify the certificate is issued by the internal CA (e.g., `localhost.localdomain` / `MyCompany IT`), indicating active interception.
        *   **Action**: Add `microsoft.com` to the `dg-ssl-bypass` data group.
        *   **Post-Check**: Verify that subsequent access bypasses interception (Certificate matches the original vendor certificate, e.g., "Microsoft Azure RSA TLS Issuing CA 04").

*   **Verification (Test Items)**:
    *   Display connection status instructions (e.g., "Configure client browser proxy to <IP>:<Port>").
    *   Provide a "Test Connectivity" tool or guide (using `curl -vkx` as shown in screenshots).
    *   Validate SSL Interception by checking the certificate issuer on the client.

### 3.2 Web Filtering (URL Blocking)
**Requirement**: Allow blocking of specific URLs via Data Groups and Security Policies.

*   **UI Components**:
    *   **URL Block List Manager** (Data Group Management):
        *   Interface to manage the `dg-blocked-urls` Data Group.
        *   CRUD operations: Add, Remove, and Search URLs/Patterns.
        *   Bulk import/export capabilities for URL lists.
    *   **Security Policy Editor**:
        *   Visual editor for Layer 2 Policy (SSLO) / Per-Request Policy.
        *   **Rule Builder**:
            *   **Name**: e.g., `url-block`.
            *   **Condition**: `Server Name (TLS ClientHello)` matches/contains entries in `dg-blocked-urls`.
            *   **Action**: `Reject`, `Drop`, or `Allow`.
            *   **Logging**: Enable/Disable logging for this rule.
    *   **Policy Ordering**: Drag-and-drop interface to order rules (e.g., Block list before Allow list).
    *   **Test Scenario**:
        *   Add `f5.com` to `dg-blocked-urls`.
        *   Verify access to `https://f5.com` results in a "Access to this page is blocked" error page.

### 3.3 Advanced Security Functions (Based on Test Items 1.3 - 1.9)
**Requirement**: Support comprehensive traffic filtering and authentication.

*   **Authentication**:
    *   **NTLM Configuration**: Settings to enable NTLM user authentication for internet access (Item 1.4).
    *   **Verification**: 
        *   **Non-Domain-Joined**: Ensure PCs receive a browser login prompt (Username/Password).
        *   **Domain-Joined**: Ensure PCs access the internet *without* login challenges (Seamless SSO).
    *   **Session Monitoring**:
        *   **Requirement**: Display "Active Sessions" table including Session ID, User (e.g., `user01`), Client IP, and Virtual Server.
*   **Traffic Filtering Criteria**:
        *   Extend Policy Editor conditions to support:
            *   **User ID (Item 1.6)**:
                *   **Description**: Verify user-id based filtering.
                *   **Configuration**:
                    *   Manage `dg_deny_users` data group.
                    *   Ensure `dg_deny_users` is empty before testing.
                *   **Test Scenario**:
                    *   Login with `user01` on a domain-joined PC.
                    *   Verify seamless internet access without login challenges.
                    *   Check "Active Sessions" in SWG to confirm `user01` session is active.
            *   **Source IP** (Item 1.7).
            *   **Full URI** (Item 1.8).
            *   **URL Categories** (e.g., Gambling, Social Networking) (Item 1.9).
*   **Layered Policies (Item 1.3)**:
    *   **Concept**: Distinguish between Layer 2 (SSLO) and Layer 3 (SWG) policies.
    *   **Test Scenario**:
        *   **Layer 2 (SSLO)**: Configure a rule to block `f5.com` at the SSLO interception stage.
        *   **Layer 3 (SWG)**: Configure a per-request policy to block `facebook.com` (Category: Social Web).
        *   **Verification**: Confirm both are blocked, validating that traffic passes through both policy layers correctly.

### 3.4 SWG Operations (Based on Test Items 2.1 - 2.3)
**Requirement**: Operational capabilities for reporting and forwarding.

*   **Reporting**:
    *   Dashboard views for SWG visibility (Item 2.1).
    *   External monitoring configuration (Syslog/Splunk export) (Item 2.3).
*   **Conditional Forwarding**:
    *   Configuration for Next-Hop proxies or L3 routers based on conditions (Item 2.2).

## 4. Technical Implementation

### 4.1 Data Model Updates (`src/lib/types.ts`)
Extend the type definitions to support SWG structures.

```typescript
// SWG Specific Types

export interface SWGConfig {
  proxyListener: ProxyListener;
  sslConfig: SSLConfig;
  urlFiltering: URLFilteringConfig;
  policies: SecurityPolicy[];
}

export interface ProxyListener {
  ip: string;
  port: number;
  enabled: boolean;
  vlan: string[]; // e.g., vlan30, vlan40
}

export interface SSLConfig {
  caCert: string; // Reference to CA Cert
  intercept: boolean;
  bypassList: string[];
}

export interface URLFilteringConfig {
  blockedDataGroup: string; // e.g., 'dg-blocked-urls'
  blockedUrls: string[];
}

export interface SecurityPolicy {
  id: string;
  name: string;
  rules: PolicyRule[];
}

export interface PolicyRule {
  id: string;
  name: string; // e.g., 'url-block'
  condition: {
    type: 'TLS_ClientHello' | 'HTTP_URI' | 'Category';
    operator: 'equals' | 'contains' | 'substring';
    value: string; // e.g., '/Common/dg-blocked-urls'
  };
  action: 'allow' | 'reject' | 'intercept';
  enabled: boolean;
}
```

### 4.2 Store Management (`src/lib/stores/swgStore.ts`)
Create a new Svelte store to manage SWG state.

*   `swgStore`: Holds the current configuration for Proxy, URL Lists, and Policies.
*   `swgActions`:
    *   `updateProxyListener(config)`
    *   `addBlockedUrl(url)`
    *   `removeBlockedUrl(url)`
    *   `addPolicyRule(rule)`
    *   `reorderRules(indices)`

### 4.3 UI Implementation Steps
1.  **Scaffold `/swg` Route**: Create directory structure `src/routes/swg`.
2.  **Create Components**:
    *   `src/lib/components/swg/ProxyConfig.svelte`
    *   `src/lib/components/swg/URLListManager.svelte`
    *   `src/lib/components/swg/PolicyEditor.svelte`
3.  **Integrate Mock Data**: Populate `swgStore` with initial mock data reflecting the screenshots (e.g., active proxy on `10.1.10.51`, empty block list).

## 5. Future Integration
*   **AS3 / F5 Automation**: Map the internal data models to F5 AS3 declarations or imperative iControl REST calls to configure the actual BIG-IP devices.
*   **Reporting**: Integrate SWG reporting logs into the `analytics` or `logs` portal sections.
