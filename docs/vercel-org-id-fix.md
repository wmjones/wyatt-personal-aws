# Fix for VERCEL_ORG_ID Error

## Issue
The GitHub Actions workflow is failing with:
```
Error: You specified `VERCEL_PROJECT_ID` but you forgot to specify `VERCEL_ORG_ID`. You need to specify both to deploy to a custom project.
```

## Root Cause
`VERCEL_ORG_ID` is not set in your GitHub repository settings.

## Solution

You need to add `VERCEL_ORG_ID` to your GitHub repository. You have two options:

### Option A: Add as Repository Variable (Recommended)
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click on the **Variables** tab
4. Click **New repository variable**
5. Add:
   - Name: `VERCEL_ORG_ID`
   - Value: Your Vercel Org ID (see below how to find it)

### Option B: Add as Repository Secret
1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click on the **Secrets** tab
4. Click **New repository secret**
5. Add:
   - Name: `VERCEL_ORG_ID`
   - Value: Your Vercel Org ID (see below how to find it)

## How to Find Your Vercel Org ID

### Method 1: Vercel CLI
```bash
vercel whoami
```

### Method 2: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your profile/team settings
3. Look for Team ID or Organization ID
4. It typically looks like: `team_xxxxxxxxxxxxxx`

### Method 3: From Project Settings
1. Go to your Vercel project
2. Navigate to **Settings** → **General**
3. Scroll down to find your Organization/Team ID

## After Adding the Variable/Secret

Once you've added `VERCEL_ORG_ID`, the workflow should proceed successfully. The workflow will then have both required variables:
- `VERCEL_ORG_ID`: Your organization/team ID
- `VERCEL_PROJECT_ID`: prj_sj2I3T7qsOqkJAFULlOoHtmiQIp0 (already set)

## Note
If you added it as a **secret**, update the workflow line 20 back to:
```yaml
VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
```

If you added it as a **variable** (recommended), keep it as:
```yaml
VERCEL_ORG_ID: ${{ vars.VERCEL_ORG_ID }}
```
