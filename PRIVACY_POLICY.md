# Privacy Policy

**SpeshTV**
Last updated: November 14, 2026

## Overview

SpeshTV is an independent Roku client for your configured media servers. The app does not require a SpeshTV-operated service. Playback and optional integrations communicate with your configured servers and the third-party sources described below.

## Data Collection

### Data We Do NOT Collect

- We do not collect personal information
- We do not track your usage or behavior
- We do not serve advertisements
- We do not share any data with third parties
- We do not use analytics services (e.g., Google Analytics, Firebase)

### Data Stored Locally on Your Device

SpeshTV stores the following data locally on your device only:

- **Server addresses** — The URLs of Jellyfin servers you connect to
- **Authentication tokens** — Used to maintain your session with your Jellyfin server
- **User preferences** — Display, playback, and customization settings
- **Cached images** — Temporarily cached artwork for performance

This data never leaves your device except when communicating directly with your Jellyfin server.

### Crash Reports (Optional)

SpeshTV can send crash reports to **your own Jellyfin server** when the app encounters an error. This feature:

- Is **opt-in** and can be disabled in Settings > Telemetry
- Sends crash data **only to your own server**, never to us or any third party
- May include: stack traces, app version, device model, operating system version, and optionally system logs
- May include media identifiers, titles, request paths, playback events, and errors. Logs are scrubbed for credentials, but you should review a report before sharing it publicly.

### Network Communication

Depending on the features you use, SpeshTV communicates with:

- **Your Jellyfin server(s)** — To stream media, authenticate, and sync settings
- **Your Seerr server** (if configured) — To browse and request media
- **GitHub API** (libre/sideloaded builds only) — To check for app updates
- **Artwork, trailer, and metadata sources** — Images and trailers may be downloaded from third-party URLs supplied by your server or optional integrations. Trailer lookup may contact YouTube or a server-side trailer helper. These services receive ordinary network request information, including your network address.

SpeshTV supports cleartext (HTTP) connections because many self-hosted Jellyfin servers run on local networks without HTTPS. No data is sent to any SpeshTV-operated servers.

### Voice Search

SpeshTV may request microphone access for voice search functionality on supported platforms. Audio is processed by the device's speech recognizer and is not recorded, stored, or transmitted by SpeshTV.

## Data Security

All sensitive data (authentication tokens, server credentials) is stored in the app's private storage on your device, protected by platform security mechanisms and app sandboxing where available. SpeshTV supports HTTPS connections to your servers for encrypted communication.

## Children's Privacy

SpeshTV is not directed at children under the age of 13. We do not knowingly collect any information from children.

## Third-Party Services

SpeshTV does not add a third-party analytics or advertising service. Optional artwork, trailer, metadata, and request integrations are subject to their respective providers' policies.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted to this page with an updated revision date.

## Contact

If you have questions about this privacy policy, you can open an issue on our GitHub repository:
https://github.com/daodere1/Roku/issues

## Open Source

SpeshTV is open-source software. You can review the complete source code to verify our privacy practices:
https://github.com/daodere1/Roku
