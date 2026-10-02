# Railway infrastructure

This directory owns Touch Grass resources in the Personal Projects workspace. See [deployment documentation](../docs/deployment.md) for the project link, release flow, and secrets.

Application pushes deploy through the native GitHub connection. Infrastructure changes require `railway config plan` followed by an explicitly reviewed `railway config apply`. Secret values use `preserve()` and must never be pasted into this directory.
