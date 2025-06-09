# Branching Strategy

**Last Updated**: January 6, 2025

## Branch Hierarchy

**main** → Production (protected, requires approval)
**dev** → Staging (protected, requires review)
**feature/*** → Development (unprotected)

## Flow Pattern

1. Create feature branch from dev
2. Develop and test locally
3. PR to dev → triggers staging deployment
4. Test in staging environment
5. PR from dev to main → triggers production deployment

## Neon Database Branches

Each Git branch gets a matching Neon PostgreSQL branch:
- main = production database
- dev = staging database
- feature/* = isolated test database

Feature branches and their databases are deleted after merge.
