---
"@scenarist/core": patch
---

Add signed release artifacts to GitHub Releases for OpenSSF Scorecard compliance

Package tarballs are now cryptographically signed with Sigstore/Cosign and uploaded to GitHub Releases alongside their signature bundles (.sig files). This satisfies the OpenSSF Scorecard "Signed-Releases" check.
