---
name: Expo DevTools startup warning
description: A non-blocking Linux library warning can appear when Expo starts React Native DevTools.
---

Expo may print an “unknown error while installing React Native DevTools” message when the container lacks `libglib-2.0.so.0`; Metro and the Expo QR/web server can still start normally.

**Why:** This is an environment limitation of the optional DevTools binary, not an app bundle or Metro failure.

**How to apply:** Confirm that Metro prints the QR code and web URL and that the workflow remains running before treating this warning as a startup blocker.