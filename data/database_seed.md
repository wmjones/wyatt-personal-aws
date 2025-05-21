# High-Level Architecture: Next.js Web Application with Amazon Athena and S3 Integration

## 1. Overview

This document describes a high-level architecture for a web application that enables users to interact with and visualize data from Amazon S3 using Amazon Athena queries. The solution is built using Next.js deployed on Vercel with Neon PostgreSQL for application data.

## 2. Architecture Components

```
+-----------------------------------------------------+
|                   Client Browser                     |
+---------------------+-----------------------------+--+
                      |
                      | HTTPS
                      v
+---------------------+-----------------------------+
|                Vercel Platform                     |
|  +-------------------------------------------+    |
|  |          Next.js Application              |    |
|  |  +---------------+   +----------------+   |    |
|  |  | React UI/     |   | Server-Side    |   |    |
|  |  | Components    |   | Rendering      |   |    |
|  |  +---------------+   +----------------+   |    |
|  |  +---------------+   +----------------+   |    |
|  |  | Client-Side   |   | Next.js API    |   |    |
|  |  | Data Fetching |   | Routes         |   |    |
|  |  +---------------+   +----------------+   |    |
|  +-------------------------------------------+    |
+------------------------+------------------------+--+
                         |
                         | API Requests
                         v
+-----------------+     +--------------------+     +-------------------+
|                 |     |                    |     |                   |
| Neon PostgreSQL +<--->+ Amazon Athena      +<--->+ Amazon S3         |
| Database        |     | (Query Service)    |     | (Data Storage)    |
|                 |     |                    |     |                   |
| - Auth          |     | - SQL Queries      |     | - Data Lake       |
| - App Data      |     | - Data Processing  |     | - CSV/Parquet/    |
| - Metadata      |     | - Result Sets      |     |   JSON files      |
| - User Prefs    |     |                    |     |                   |
|                 |     |                    |     |                   |
+-----------------+     +--------------------+     +-------------------+
```

### 2.1 Frontend Layer
- **Next.js Application**: Provides the user interface for data visualization and interaction
- **Vercel Platform**: Hosts and deploys the Next.js application
- **React Components**: Interactive UI elements for data visualization
- **Data Fetching Layer**: Server-side and client-side data fetching mechanisms

### 2.2 Data Storage & Management
- **Neon PostgreSQL Database**: Serverless PostgreSQL database for:
  - User authentication and session management
  - Application configuration and metadata
  - Caching frequently accessed data
  - Storing visualization settings and user preferences

### 2.3 Data Integration & Processing
- **Amazon S3**: Simple storage service for raw data files (CSV, Parquet, JSON)
- **Amazon Athena**: Serverless query service to analyze data in S3 using standard SQL
- **AWS SDK/REST API**: Interface for querying Athena and retrieving results
- **API Layer**: RESTful API endpoints for data exchange

### 2.4 Authentication & Security
- **Next.js API Routes**: Secure API endpoints that proxy requests to AWS services
- **AWS IAM**: Manages access credentials and permissions to AWS resources
- **Authentication Flow**: User authentication and authorization

## 3. Data Flow

1. **User Request Flow**:
   - User accesses the Next.js web application hosted on Vercel
   - Authentication is verified against Neon PostgreSQL database
   - Application loads with authorized access level

2. **Data Request Flow**:
   - User initiates a data visualization or query request
   - Next.js server processes the request through API routes
   - Server securely connects to Amazon Athena using AWS SDK or REST API
   - SQL query is executed against data stored in S3
   - Results are processed, transformed, and sent back to the client
   - Client renders visualizations using React components

3. **Data Update Flow**:
   - New data is uploaded to Amazon S3 buckets (via ETL pipelines, batch uploads)
   - Athena schema is updated if necessary to reflect new data structure
   - Application can poll for updates or use AWS EventBridge for notifications
   - Visualization refreshes with latest data

## 4. Key Technical Patterns

### 4.1 Server-Side Rendering & API Routes
Next.js provides two powerful approaches for data fetching:

- **Server-Side Rendering (SSR)**: Pre-renders pages with data from Athena on the server, delivering fully populated pages to the client
- **API Routes**: Secure endpoints that act as a proxy between client and AWS services, protecting credentials and enabling controlled data access

### 4.2 Serverless Architecture
- **Vercel Edge Functions**: Process API requests close to users for lower latency
- **Neon's Serverless PostgreSQL**: Scales automatically with no infrastructure management
- **Amazon Athena**: Serverless query service that eliminates the need to manage clusters
- **Amazon S3**: Fully managed object storage with virtually unlimited scaling

### 4.3 Data Access Patterns
- **Read-heavy Operations**: Optimized for data visualization and analysis
- **Caching Strategy**: Frequently accessed or slow-changing data cached in Neon PostgreSQL
- **Athena Query Optimization**: Partitioned datasets, columnar formats (Parquet), and efficient query structure
- **Cost Management**: Optimized queries to minimize data scanned in S3

## 5. Scalability Considerations

- **Horizontal Scaling**: Vercel automatically scales based on traffic
- **Neon Auto-scaling**: PostgreSQL database scales up/down based on demand
- **Serverless Amazon Athena**: Scales automatically for concurrent queries with no provisioning required
- **S3 Unlimited Scaling**: No capacity planning needed for data storage
- **Query Optimization**: Large datasets are processed efficiently with:
  - Partitioning S3 data for faster queries
  - Using columnar formats like Parquet
  - Compressing data for reduced transfer costs
  - Implementing result set pagination

## 6. Security Considerations

- **AWS IAM**: Fine-grained access control for AWS resources
- **AWS Credentials Management**: Secure storage and rotation of AWS credentials
- **API Authorization**: All data requests authorized through Next.js API routes
- **Data Access Control**: Fine-grained access controls for different user roles
- **Encrypted Communications**: All data transfers secured via HTTPS/TLS
- **S3 Bucket Policies**: Restrictive access controls on S3 buckets

## 7. Implementation Approach

### 7.1 Phase 1: Foundation
- Set up Next.js application with Vercel deployment
- Configure Neon PostgreSQL for application data
- Implement user authentication
- Create basic UI components
- Set up S3 buckets with appropriate permissions

### 7.2 Phase 2: Integration
- Configure Amazon Athena tables for S3 data
- Implement AWS SDK integration in Next.js API routes
- Create data fetching services
- Build data transformation layer
- Develop core visualizations

### 7.3 Phase 3: Enhancement
- Add advanced visualizations
- Implement query optimizations
- Set up monitoring and alerting
- Add user customization features
- Implement cost optimization strategies

## 8. Technology Stack Summary

- **Frontend**: Next.js, React, TailwindCSS
- **Hosting/Deployment**: Vercel
- **Application Database**: Neon PostgreSQL
- **Data Storage**: Amazon S3
- **Query Service**: Amazon Athena
- **Integration**: AWS SDK for JavaScript, AWS REST API
- **Authentication**: NextAuth.js or custom auth system
- **Visualization**: Recharts, D3.js, or similar libraries

## 9. Data
Use the data in the csv `/workspaces/wyatt-personal-aws/data/forecast_data.csv` to seed this branches Neon database.
Write a script to upload the csv to the appropriate S3 bucket and setup Athena

## 10. Conclusion

This architecture provides a scalable, secure, and user-friendly solution for visualizing and interacting with data from Amazon S3 using Amazon Athena. By leveraging the serverless capabilities of Vercel, Neon, and AWS services, the solution offers a modern approach to data-driven web applications with minimal infrastructure management. The REST API approach to Athena provides a clean interface for querying data in S3, making this a simple, self-contained AWS-based solution.
