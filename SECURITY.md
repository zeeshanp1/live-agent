# Security Policy

## Supported versions

Pendant MCP is a pre-1.0 prototype. Only the latest commit on `main` is supported.

## Reporting a vulnerability

Please report security or privacy issues **privately** using GitHub's
[private vulnerability reporting](https://github.com/zeeshanp1/live-agent/security/advisories/new)
rather than a public issue. Include steps to reproduce and the affected version or commit.

## Known limitations

These are documented design limits of the prototype, not vulnerabilities:

- Vault data in `localStorage` is **not encrypted**. Anyone with access to the browser profile can read it.
- Chromium's Web Speech API may send audio to the browser vendor's speech service.
- Web Bluetooth support is pairing-only; no pendant data is transferred yet.

Encrypted storage and fully offline speech recognition are on the [roadmap](README.md#7-roadmap).
