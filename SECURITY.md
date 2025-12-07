# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

> **Note:** Scenarist is currently in pre-1.0 development. Once v1.0 is released, we will maintain security support for the latest minor version.

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**For security vulnerabilities, please use GitHub's private vulnerability reporting:**

1. Go to the [Security Advisories](https://github.com/citypaul/scenarist/security/advisories) page
2. Click "Report a vulnerability"
3. Fill out the form with details about the vulnerability

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

| Action                 | Timeline        |
| ---------------------- | --------------- |
| Initial acknowledgment | Within 48 hours |
| Status update          | Within 7 days   |
| Resolution target      | Within 90 days  |

We will work with you to understand and validate the issue, then develop and release a fix.

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
2. **Investigation**: We will investigate and validate the vulnerability
3. **Updates**: We will keep you informed of our progress
4. **Fix**: We will develop and test a fix
5. **Release**: We will release the fix and credit you (if desired)
6. **Disclosure**: We will coordinate public disclosure timing with you

## Security Features

Scenarist is designed with security in mind:

### Built-in Protections

- **ReDoS Protection**: All regex patterns are validated against ReDoS vulnerabilities using `redos-detector` at schema validation time (patterns with catastrophic backtracking potential are rejected)
- **Schema Validation**: Zod schemas validate all inputs at trust boundaries
- **Type Safety**: TypeScript strict mode enforced throughout the codebase
- **Immutable Data**: No data mutations - all operations use immutable patterns

### Production Safety

- **Tree-Shaking**: Test code is completely eliminated from production bundles via conditional exports
- **Environment Guards**: Scenarist middleware can be disabled in production via configuration
- **Zero Framework Dependencies in Core**: Hexagonal architecture ensures the core domain has no external dependencies

### Supply Chain Security

- **OIDC Trusted Publishing**: npm packages are published using OIDC tokens (no stored credentials)
- **npm Provenance**: npm packages include provenance attestation on npmjs.com
- **GitHub Attestations**: Build provenance attestations stored on GitHub, verifiable via CLI (see [Verifying Packages](#verifying-packages))
- **SBOM with Sigstore Signing**: Software Bill of Materials generated for each release, signed with Sigstore for tamper-evidence
- **Frozen Lockfile**: CI enforces `pnpm install --frozen-lockfile`
- **Dependency Auditing**: Automated vulnerability scanning in CI

### Verifying Packages

You can cryptographically verify that Scenarist packages were built from this repository using GitHub's attestation verification:

```bash
# Download a package and verify its attestation
npm pack @scenarist/core
gh attestation verify scenarist-core-*.tgz -R citypaul/scenarist
```

This verifies:

- The package was built in the official GitHub Actions workflow
- The source code matches the repository at the attested commit
- The build process was not tampered with

View all attestations at: https://github.com/citypaul/scenarist/attestations

## Scope

This security policy applies to the following packages:

- `@scenarist/core`
- `@scenarist/express-adapter`
- `@scenarist/nextjs-adapter`
- `@scenarist/playwright-helpers`
- `@scenarist/msw-adapter`

## Out of Scope

The following are **not** considered security vulnerabilities:

- Vulnerabilities in dependencies (report these to the upstream project)
- Issues in example applications (`apps/` directory)
- Issues that require physical access to the user's machine
- Social engineering attacks
- Denial of service through legitimate API usage

## Security Best Practices for Users

When using Scenarist:

1. **Disable in Production**: Always set `enabled: process.env.NODE_ENV !== 'production'`
2. **Use Environment Variables**: Never hardcode sensitive configuration
3. **Keep Updated**: Regularly update to the latest version for security patches
4. **Review Scenarios**: Ensure test scenarios don't contain real credentials or sensitive data

## Recognition

We appreciate security researchers who help keep Scenarist secure. With your permission, we will:

- Credit you in the security advisory
- Add your name to our Security Hall of Fame (coming soon)

Thank you for helping keep Scenarist and its users safe!
