# Vercel DATABASE_URL Configuration Research

## Executive Summary

After researching multiple approaches for setting DATABASE_URL in Vercel for branch-specific preview deployments, I recommend using the **Vercel CLI with the `--git-branch` flag** approach. This method is simpler, more reliable, and has native support since Vercel CLI v28.9.0.

## Comparison of Approaches

### 1. Current Feature Branch Implementation (Recommended) ✅

**Method**: `vercel env add DATABASE_URL production --git-branch="branch-name"`

```yaml
# In GitHub Actions workflow
vercel env add DATABASE_URL production --git-branch="${{ steps.branch_name.outputs.current_branch }}" <<< "${{ steps.create_neon_branch.outputs.db_url_with_pooler }}" --token=${{ secrets.VERCEL_TOKEN }}
```

**Pros**:
- Native support for branch-specific environment variables
- Variables persist at runtime for the specific branch
- Overrides general preview environment variables
- Simple CLI command, no complex API calls needed
- Well-documented and officially supported

**Cons**:
- Requires Vercel CLI v28.9.0 or later
- Potential race conditions between env var setting and deployment

### 2. Dev Branch Implementation (Not Recommended) ❌

**Method**: Remove and add env vars for ALL preview environments

```yaml
# In GitHub Actions workflow
vercel env rm DATABASE_URL preview --yes --token=${{ secrets.VERCEL_TOKEN }} || true
echo "${{ steps.create_neon_branch.outputs.db_url_with_pooler }}" | vercel env add DATABASE_URL preview --token=${{ secrets.VERCEL_TOKEN }}
```

**Pros**:
- Simple to implement
- Works with older Vercel CLI versions

**Cons**:
- Affects ALL preview deployments, not branch-specific
- Can cause conflicts when multiple branches deploy simultaneously
- Last deployment wins - overwrites DATABASE_URL for all preview environments
- Not suitable for multiple concurrent feature branches

### 3. Vercel SDK/API Approach (Alternative) ⚡

**Method**: Use Vercel REST API or SDK with gitBranch parameter

```javascript
// Using Vercel SDK
const result = await vercel.projects.createProjectEnv({
  idOrName: projectId,
  requestBody: {
    key: "DATABASE_URL",
    value: databaseUrl,
    type: "encrypted",
    target: ["preview"],
    gitBranch: branchName
  }
});

// Using REST API
curl -X POST \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "DATABASE_URL",
    "value": "'$DATABASE_URL'",
    "type": "encrypted",
    "target": ["preview"],
    "gitBranch": "'$BRANCH_NAME'"
  }' \
  "https://api.vercel.com/v10/projects/$PROJECT_ID/env"
```

**Pros**:
- Programmatic control
- Can be integrated into custom tooling
- Supports all environment variable options

**Cons**:
- More complex implementation
- Requires additional dependencies (SDK) or manual API handling
- Need to handle authentication and error responses

## Key Findings

1. **Branch-Specific Support**: The `--git-branch` flag in Vercel CLI (v28.9.0+) enables true branch-specific environment variables
2. **Override Behavior**: Branch-specific env vars override general preview env vars
3. **Runtime Availability**: Environment variables must be set before deployment to be available at runtime
4. **Race Conditions**: There can be timing issues between setting env vars and deployment triggering
5. **Cleanup**: Branch-specific env vars should be cleaned up when branches are deleted

## Recommendations

### Immediate Action
1. **Keep the current feature branch implementation** - it's the best approach
2. Update documentation to specify Vercel CLI v28.9.0+ requirement
3. Add retry logic to handle potential race conditions

### Implementation Details

```yaml
# Recommended implementation with retry logic
- name: Set Environment Variables for Preview Deployments
  if: steps.branch_name.outputs.current_branch != 'dev' && steps.branch_name.outputs.current_branch != 'main'
  working-directory: src/frontend/nextjs-app
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
  run: |
    echo "Setting environment variables for preview deployment..."

    # Retry logic for race conditions
    for i in {1..3}; do
      if vercel env add DATABASE_URL production --git-branch="${{ steps.branch_name.outputs.current_branch }}" <<< "${{ steps.create_neon_branch.outputs.db_url_with_pooler }}" --token=${{ secrets.VERCEL_TOKEN }}; then
        echo "✅ DATABASE_URL set successfully"
        break
      else
        echo "⚠️ Attempt $i failed, retrying..."
        sleep 5
      fi
    done

    # Set additional env vars
    vercel env add DATABASE_URL_UNPOOLED production --git-branch="${{ steps.branch_name.outputs.current_branch }}" <<< "${{ steps.create_neon_branch.outputs.db_url }}" --token=${{ secrets.VERCEL_TOKEN }} || true
    vercel env add DEPLOYMENT_BRANCH production --git-branch="${{ steps.branch_name.outputs.current_branch }}" <<< "${{ steps.branch_name.outputs.current_branch }}" --token=${{ secrets.VERCEL_TOKEN }} || true
```

### Future Enhancements

1. **Cleanup Workflow**: Create a separate workflow to remove env vars when branches are deleted
2. **Monitoring**: Add health checks to verify database connectivity
3. **Documentation**: Create troubleshooting guide for common issues
4. **Validation**: Add pre-deployment checks to ensure DATABASE_URL is set

## Testing Checklist

- [ ] Verify branch-specific DATABASE_URL is set correctly
- [ ] Test multiple concurrent branch deployments
- [ ] Confirm env vars persist across redeployments
- [ ] Validate database connectivity in preview deployments
- [ ] Test cleanup when branches are deleted
- [ ] Verify main/dev branches use production DATABASE_URL
- [ ] Check Vercel dashboard shows branch-specific env vars

## Conclusion

The current feature branch implementation using `vercel env add` with the `--git-branch` flag is the optimal solution. It provides true branch isolation, is officially supported, and integrates well with GitHub Actions workflows. The dev branch approach should be updated to match this implementation for consistency.
