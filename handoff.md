# Project Handoff Document
**System Architecture & Implementation Guide: webOS Streaming Aggregator**
**Date:** July 5, 2026

## 1. Executive Summary
This document outlines the architecture and implementation strategy for a custom LG webOS application designed to aggregate streaming availability. The system utilizes a native Enact frontend deployed to the TV, supported by a localized Node.js backend proxy running in a Docker container. The core functionality bridges JustWatch catalog data with local webOS system queries to determine which installed services can play a requested title.

## 2. Architecture Overview
**The system consists of two primary components:**
* **Frontend (webOS):** An Enact-based UI responsible for user interaction, D-Pad navigation, system-level Luna bus queries (checking installed apps), and rendering results.
* **Backend (Node.js Docker Container):** A local RESTful API proxy handling GraphQL interactions with JustWatch, aggressive data caching, and CORS header management.

## 3. Frontend Implementation: Enact & webOS
The frontend will be built using the official **Enact Framework** (`@enact/cli`), utilizing the Sandstone UI library for native LG styling and the Spotlight module for spatial (D-Pad) navigation.

### 3.1. Querying Installed Applications
webOS restricts global application mapping. Instead, the app must query the installation status of specific Application IDs using the Luna Service Bus. In Enact, this is handled via `LS2Request`.

```javascript
import LS2Request from '@enact/webos/LS2Request';

const checkAppInstalled = (appId) => {
    return new Promise((resolve) => {
        new LS2Request().send({
            service: 'luna://com.webos.applicationManager',
            method: 'getAppLoadStatus',
            parameters: { appId: appId },
            onSuccess: (res) => resolve(res.exist),
            onFailure: () => resolve(false)
        });
    });
};

**Common webOS App IDs:**

* Netflix: `netflix`
* Amazon Prime Video: `amazon`
* Disney+: `com.disney.disneyplus-prod`
* Apple TV: `com.apple.appletv`
* **BBC iPlayer:** `bbc.iplayer`
* **NOW TV:** `nowtv`
* **Channel 4:** `channel4`
* **ITV (ITVX):** `itvx`

## 4. Backend Implementation: Node.js Proxy

To maintain a unified JavaScript stack, the backend will be a Node.js API (using Express or Fastify) containerized via Docker. It isolates the TV from complex GraphQL queries and rate limits.

### 4.1. JustWatch Data Retrieval

The backend will utilize an unofficial npm wrapper (such as `justwatch-api`) to query the JustWatch GraphQL endpoints. For example, a search payload mapping to a title like *"Back to the Future"* or *"Men in Black"* will be sanitized and passed to the JustWatch API, returning an array of provider IDs.

### 4.2. Core Requirements

* **CORS Configuration:** webOS apps run under a local `file://` protocol. The Node server MUST include `Access-Control-Allow-Origin: *` to prevent browser security blocks.
* **Caching Layer:** Implement an in-memory cache (e.g., `node-cache`) or a lightweight local SQLite store. Streaming catalogs are relatively static; caching responses for 24-48 hours prevents upstream rate-limiting.
* **Endpoint Design:** A simple GET endpoint (e.g., `/api/search?title=...`) that returns a standardized JSON payload of matched providers.

## 5. Deployment Strategy

**Local Infrastructure:** The backend is designed to run completely isolated on the local network. It can be spun up as a lightweight Docker container alongside existing local infrastructure, such as MQTT brokers or Home Assistant instances, ensuring ultra-low latency requests from the TV.

### 5.1. Docker Configuration

A standard `node:20-alpine` base image will suffice. Expose the API port (e.g., 3000) to the host network. Map a local volume if persisting the cache data to disk is preferred.

### 5.2. TV Deployment (Developer Mode)

The Enact compiled build (using `npm run pack` or `npm run pack-p`) will be pushed to the LG TV using the webOS Dev Manager CLI (`ares-install`). Ensure the TV is rooted or continuously running Developer Mode to prevent the app from expiring.
