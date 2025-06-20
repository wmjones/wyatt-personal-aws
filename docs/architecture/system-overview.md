# System Architecture Overview

**Last Updated**: January 2025
**Architecture Type**: Hybrid Monorepo with Service-Oriented Deployment
**Status**: Production

## Executive Summary

The LTO Demand Planning system is a modern web application built on serverless architecture principles. It combines a Next.js frontend deployed on Vercel with AWS backend services, following a hybrid monorepo pattern that balances development velocity with operational flexibility.

## Architecture Overview

The system consists of two main applications within a single repository:

1. **LTO Demand Planning Application** - Interactive forecasting and data visualization platform
2. **Productivity Workflow System** - Automated task enrichment pipeline for Todoist integration

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js App (Vercel Edge Network)                   │   │
│  │  - Server-side rendering                             │   │
│  │  - API routes for data operations                    │   │
│  │  - Real-time interactive visualizations (D3.js)      │   │
│  └───────────────────┬──────────────────────────────────┘   │
└──────────────────────┴───────────────────────────────────────┘
                       │
                       ├─── API Routes ──── PostgreSQL (Neon)
                       │
                       └─── External APIs ─┐
                                          │
┌─────────────────────────────────────────┴────────────────────┐
│                    AWS Backend Services                       │
│                                                               │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ API Gateway │────│ Lambda Functions │──│   Cognito     │  │
│  │  (Legacy)   │    │  - Python       │  │ (User Auth)   │  │
│  └─────────────┘    │  - Visualization│  └───────────────┘  │
│                     │  - Data sync    │                      │
│                     └────────┬────────┘                      │
│                              │                               │
│  ┌───────────────────────────┴────────────────────────────┐ │
│  │              Data Storage & Processing                  │ │
│  │  ┌──────────┐  ┌──────────────────────┐ │ │
│  │  │  Athena  │  │  S3 Data Lake        │ │ │
│  │  │ (Queries)│  │  (Historical Data)   │ │ │
│  │  └──────────┘  └──────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Productivity Workflow System                   │ │
│  │  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  │ │
│  │  │ Step Functions│──│   Lambda    │──│ EventBridge  │  │ │
│  │  │ (Orchestration)  │ (Todoist,   │  │ (Scheduler)  │  │ │
│  │  └──────────────┘  │  ChatGPT,   │  └──────────────┘  │ │
│  │                    │  Notion)     │                     │ │
│  │                    └─────────────┘                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend Layer (Vercel)

The frontend is a modern Next.js 15 application featuring:

- **Server Components** for optimal performance
- **Edge Runtime** for global low-latency access
- **API Routes** handling data operations
- **Real-time Visualizations** using D3.js
- **Progressive Web App** capabilities
- **Dark Mode** support with theme persistence

### Data Layer

The system uses a hybrid data architecture:

- **Primary Database**: Neon PostgreSQL (serverless)
  - Forecast data and adjustments
  - User preferences and settings
  - Cached computation results
  - All application data

- **Analytics**: AWS Athena + S3
  - Large-scale historical data source
  - ETL pipeline to PostgreSQL
  - Complex analytical queries

### Authentication & Security

- **Identity Provider**: AWS Cognito
- **Token Management**: JWT with secure cookie storage
- **API Protection**: Route-level authentication middleware
- **Data Isolation**: User-specific data access controls

## Data Flow Patterns

### Forecast Data Flow
1. User requests forecast through UI
2. Next.js API route validates request
3. Query executes against PostgreSQL
4. Results cached for performance
5. Data transformed for visualization
6. Interactive charts rendered with D3.js

### Adjustment Workflow
1. User modifies forecast via drag-and-drop
2. Changes validated on client
3. API route persists to database
4. Audit trail maintained
5. Other users see updates in real-time

## Technology Stack

### Frontend Technologies
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Visualizations**: D3.js
- **State Management**: TanStack Query
- **Deployment**: Vercel Edge Network

### Backend Technologies
- **Compute**: AWS Lambda (Python/Node.js)
- **API**: Next.js API Routes + AWS API Gateway
- **Database**: Neon PostgreSQL
- **Authentication**: AWS Cognito
- **Infrastructure**: Terraform
- **Orchestration**: AWS Step Functions

### Development Tools
- **Version Control**: Git (GitHub)
- **CI/CD**: GitHub Actions
- **Infrastructure as Code**: Terraform Cloud
- **Monitoring**: Vercel Analytics
- **Testing**: Jest, Playwright

## Architecture Patterns

### Monorepo Benefits
- Shared code and types between services
- Atomic commits across frontend/backend
- Unified tooling and configuration
- Simplified dependency management

### Service Boundaries
- Clear separation between demand planning and productivity systems
- Independent deployment pipelines
- Isolated data stores per service
- Minimal inter-service dependencies

### Serverless Advantages
- No server management overhead
- Automatic scaling with demand
- Pay-per-use cost model
- Built-in high availability

## Deployment Model

### Environment Strategy
- **Development**: Feature branches with Neon branching
- **Staging**: Pre-production validation
- **Production**: Stable releases with monitoring

### Release Process
1. Feature development in isolated branches
2. Automated testing on pull requests
3. Preview deployments for validation
4. Merged to main for production release
5. Automatic rollback capabilities

## Future Architecture Considerations

### Planned Improvements
- Consolidate data layer to single database
- Migrate remaining Lambda functions to Edge Functions
- Implement comprehensive caching strategy
- Add real-time collaboration features

### Technical Debt
- Remove legacy DynamoDB dependencies
- Standardize all APIs to Next.js routes
- Eliminate AWS API Gateway
- Unify error handling patterns

## Related Documentation

- [Deployment Strategy](../deployment/vercel/strategy.md)
- [Database Architecture](../database/neon-setup.md)
- [Frontend Guidelines](../frontend/design-guidelines.md)
- [Testing Strategy](../testing/unit-testing.md)
