# NPM Token Setup Guide

This guide documents the steps to configure the `NPM_TOKEN` secret required for automated npm publishing via GitHub Actions.

## Prerequisites

- Access to the npm account that will own the `@scenarist/*` packages
- Admin access to the GitHub repository

## Step 1: Generate npm Automation Token

1. Go to [npmjs.com](https://www.npmjs.com/) and log in
2. Click your profile icon (top right) → **Access Tokens**
3. Click **Generate New Token** → **Classic Token**
4. Select **Automation** token type
   - **Important**: Choose "Automation" not "Publish" - Automation tokens work with CI/CD and don't require 2FA
5. Give the token a descriptive name (e.g., `scenarist-github-actions`)
6. Copy the token immediately (it won't be shown again)

## Step 2: Add Token to GitHub Repository Secrets

1. Go to the GitHub repository: https://github.com/citypaul/scenarist
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Set:
   - **Name**: `NPM_TOKEN`
   - **Secret**: Paste the token from Step 1
5. Click **Add secret**

## Step 3: Verify Configuration

After completing the above steps, verify the setup:

1. **Check secret exists**: Settings → Secrets and variables → Actions → Repository secrets
   - `NPM_TOKEN` should appear in the list (value hidden)

2. **Test with dry-run** (after Workstream B completes):
   ```bash
   # In a GitHub Actions workflow or locally with the token:
   pnpm --filter @scenarist/express-adapter exec npm publish --dry-run
   ```

## Security Notes

- **Never commit the token** to the repository
- **Automation tokens** are recommended because:
  - They don't require 2FA during publish
  - They can be scoped to specific packages (if using granular tokens)
  - They can be revoked without affecting your main account access
- **Token rotation**: Consider rotating the token periodically (e.g., annually)

## Troubleshooting

### "402 Payment Required" error
- The packages need `"publishConfig": { "access": "public" }` in their package.json
- This is handled by Workstream B issues

### "403 Forbidden" error
- Token may lack publish permissions
- Ensure token type is "Automation" or "Publish"
- Verify you're logged into the correct npm account

### "404 Not Found" error
- Package name may already be taken on npm
- Check package naming in package.json files

## Related Issues

- #157: Configure NPM_TOKEN secret (this document)
- #147, #148, #149: Package metadata (Workstream B)
- #154: Release workflow that uses NPM_TOKEN
