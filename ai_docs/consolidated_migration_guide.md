# Hybrid Architecture Implementation Guide: Next.js on Vercel with AWS Backend

## Executive Summary

This document outlines the implementation strategy for a hybrid architecture that leverages Vercel for frontend hosting while maintaining AWS infrastructure for backend services. This approach combines the best of both platforms: Vercel's excellent frontend developer experience and deployment capabilities with the control and flexibility of existing AWS infrastructure. The hybrid approach reduces operational complexity while preserving infrastructure investments and avoiding costly data migrations.

## Architecture Overview

### Current Architecture (Maintained)
- **Backend**: AWS Lambda functions with API Gateway
- **Database**: Amazon DynamoDB
- **Authentication**: AWS Cognito
- **Real-time**: WebSocket API with DynamoDB Streams
- **Infrastructure**: Terraform-managed AWS resources

### Frontend Migration Target
- **Frontend**: Next.js 14 with App Router on Vercel
- **Deployment**: Vercel platform with automatic deployments
- **CDN**: Vercel's edge network
- **API Integration**: Secure connection to AWS backend
- **Environment**: Configuration for AWS endpoints

### Key Benefits
- **Developer Experience**: Improved frontend tooling and deployment
- **Cost Optimization**: Leverage Vercel's efficient frontend hosting
- **Infrastructure Preservation**: Maintain proven AWS backend
- **Flexible Deployment**: Independent frontend/backend releases

## Pre-Implementation Requirements

### Manual Setup Tasks

#### 1. Vercel Account Setup
1. Sign up at [vercel.com](https://vercel.com)
2. Import repository: `wyatt-personal-aws`
3. Configure project:
   - Framework: Next.js
   - Root Directory: `src/frontend/nextjs-app`
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### 2. AWS Infrastructure Updates
1. Configure API Gateway CORS settings
2. Update Lambda function allowed origins
3. Ensure Cognito supports cross-origin requests
4. Review security group settings

#### 3. Environment Variables
Configure in Vercel dashboard:
```
# AWS API Configuration
NEXT_PUBLIC_AWS_API_ENDPOINT=https://your-api-gateway.execute-api.region.amazonaws.com
NEXT_PUBLIC_AWS_WEBSOCKET_ENDPOINT=wss://your-websocket.execute-api.region.amazonaws.com
NEXT_PUBLIC_AWS_REGION=us-east-1

# AWS Cognito
NEXT_PUBLIC_USER_POOL_ID=[from AWS]
NEXT_PUBLIC_USER_POOL_CLIENT_ID=[from AWS]

# External APIs (if frontend needs them)
TODOIST_API_KEY=[your key]
OPENAI_API_KEY=[your key]
NOTION_API_KEY=[your key]
```

## Implementation Phases

### Phase 1: Frontend Foundation (Week 1)

#### Tasks
1. **Create Next.js Project Structure**
   - Initialize Next.js 14 with TypeScript
   - Configure App Router
   - Set up ESLint and Prettier
   - Install dependencies
   - Create project structure

2. **Configure Tailwind CSS**
   - Set up design tokens
   - Configure responsive breakpoints
   - Implement dark mode support
   - Create utility classes

3. **Set Up Vercel Deployment**
   - Configure vercel.json
   - Set up preview deployments
   - Configure environment variables
   - Link to GitHub repository

4. **AWS Integration Configuration**
   - Create API client service
   - Configure axios/fetch interceptors
   - Set up error handling
   - Implement request retry logic

### Phase 2: AWS Backend Preparation (Week 2)

#### Tasks
5. **Configure CORS in API Gateway**
   - Add Vercel domain to allowed origins
   - Configure preflight responses
   - Set appropriate headers
   - Test cross-origin requests

6. **Update Lambda Functions**
   - Add CORS headers to responses
   - Validate origin requests
   - Update error responses
   - Test with Vercel preview URLs

7. **Secure WebSocket Configuration**
   - Update connection handlers
   - Add origin validation
   - Configure message routing
   - Test real-time features

### Phase 3: Authentication Integration (Week 3)

#### Tasks
8. **Cognito Integration with Next.js**
   - Install AWS Amplify or custom SDK
   - Configure authentication provider
   - Create auth context/hooks
   - Implement token management

9. **Protected Routes Implementation**
   - Create middleware for auth checks
   - Implement route protection
   - Add token refresh logic
   - Handle authentication errors

10. **User Management Pages**
    - Create login page
    - Build signup flow
    - Add password reset
    - Implement profile management

### Phase 4: Core UI Migration (Weeks 4-5)

#### Tasks
11. **Static Page Migration**
    - Convert homepage to Next.js
    - Migrate about page
    - Update layout components
    - Implement navigation

12. **Component Library Creation**
    - Build reusable UI components
    - Create form components
    - Implement modal system
    - Add loading states

13. **Dashboard Layout**
    - Create dashboard structure
    - Implement sidebar navigation
    - Add header components
    - Configure responsive design

### Phase 5: Data Integration (Weeks 6-7)

#### Tasks
14. **API Client Implementation**
    - Create service layer
    - Implement data fetching hooks
    - Add caching strategy
    - Handle loading states

15. **Visualization Data Flow**
    - Connect to visualization endpoints
    - Implement parameter fetching
    - Create update mechanisms
    - Add optimistic updates

16. **Error Handling**
    - Create error boundaries
    - Implement fallback UI
    - Add retry mechanisms
    - Log errors appropriately

### Phase 6: D3.js Migration (Weeks 8-9)

#### Tasks
17. **D3 Component Architecture**
    - Create visualization wrapper
    - Implement resize handling
    - Add SVG rendering
    - Handle dynamic updates

18. **Interactive Features**
    - Implement drag interactions
    - Add zoom/pan functionality
    - Create tooltip system
    - Handle parameter updates

19. **Performance Optimization**
    - Implement virtual scrolling
    - Add lazy loading
    - Optimize render cycles
    - Cache calculations

### Phase 7: Real-time Features (Weeks 10-11)

#### Tasks
20. **WebSocket Client Implementation**
    - Create WebSocket service
    - Implement connection management
    - Add message handlers
    - Handle reconnection

21. **Real-time Updates**
    - Connect to WebSocket API
    - Implement state synchronization
    - Add conflict resolution
    - Test multi-user scenarios

22. **Collaboration Features**
    - Show active users
    - Display live cursors
    - Implement presence system
    - Add activity indicators

### Phase 8: Productivity Integration (Week 12)

#### Tasks
23. **External API Connections**
    - Implement Todoist integration
    - Add ChatGPT processing
    - Connect Notion sync
    - Create unified interface

24. **Workflow Monitoring**
    - Display Step Function status
    - Show task progress
    - Add execution history
    - Implement retry controls

### Phase 9: Performance & Polish (Week 13)

#### Tasks
25. **Performance Optimization**
    - Implement code splitting
    - Add route prefetching
    - Optimize bundle size
    - Configure CDN caching

26. **Monitoring Setup**
    - Add error tracking
    - Implement analytics
    - Create performance monitoring
    - Set up alerting

### Phase 10: Production Deployment (Week 14)

#### Migration Steps
1. **Final Testing**
   - End-to-end testing
   - Performance validation
   - Security audit
   - Load testing

2. **Production Configuration**
   - Set production environment
   - Configure custom domain
   - Update DNS settings
   - Enable monitoring

3. **Go-Live Process**
   - Deploy to production
   - Monitor metrics
   - Address issues
   - Document process

### Phase 11: Post-Migration (Week 15)

#### Tasks
1. **Optimization**
   - Review performance metrics
   - Optimize slow endpoints
   - Reduce bundle sizes
   - Improve caching

2. **Documentation**
   - Update README files
   - Create deployment guides
   - Document API integration
   - Record best practices

## Technical Implementation Details

### Frontend API Service
```typescript
// services/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AWS_API_ENDPOINT,
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### CORS Configuration in AWS
```javascript
// Lambda function response
export const handler = async (event) => {
  const origin = event.headers.origin;
  const allowedOrigins = [
    'https://your-app.vercel.app',
    'https://preview-*.vercel.app',
    'http://localhost:3000'
  ];

  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };

  // Your existing logic here

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(responseData)
  };
};
```

### WebSocket Integration
```typescript
// services/websocket/client.ts
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;

  connect() {
    const wsUrl = process.env.NEXT_PUBLIC_AWS_WEBSOCKET_ENDPOINT;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onclose = () => {
      this.handleReconnect();
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts < 5) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, Math.pow(2, this.reconnectAttempts) * 1000);
    }
  }

  sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
```

## Security Considerations

### Frontend Security
1. **API Key Management**
   - Never expose AWS credentials
   - Use environment variables
   - Implement server-side API calls for sensitive operations

2. **CORS Configuration**
   - Whitelist specific domains
   - Validate origins in Lambda
   - Use proper headers

3. **Authentication**
   - Implement token refresh
   - Secure token storage
   - Handle expired sessions

### Backend Security
1. **API Gateway**
   - Enable request validation
   - Implement rate limiting
   - Use API keys where appropriate

2. **Lambda Functions**
   - Validate all inputs
   - Implement proper error handling
   - Log security events

## Monitoring and Observability

### Frontend Monitoring
1. **Vercel Analytics**
   - Page load performance
   - Core Web Vitals
   - Error tracking

2. **Custom Metrics**
   - API response times
   - WebSocket connection status
   - User interactions

### Backend Monitoring
1. **CloudWatch**
   - Lambda execution metrics
   - API Gateway requests
   - DynamoDB operations

2. **Alerts**
   - Error rate thresholds
   - Latency spikes
   - Failed authentications

## Cost Optimization

### Frontend Costs
- Vercel: $0-20/month (hobby or pro tier)
- Domain: Existing or included
- Analytics: Included with Vercel

### Backend Costs (Unchanged)
- API Gateway: $25-50/month
- Lambda: $10-30/month
- DynamoDB: $150-300/month
- Cognito: $0-15/month

### Total Monthly Cost
- Hybrid approach: $185-415/month
- Compared to full migration: Saves migration costs and risks

## Rollback Strategy

### Frontend Rollback
1. Vercel automatic rollback to previous deployment
2. Git revert and redeploy
3. Environment variable updates

### Backend Rollback
1. Revert CORS configurations
2. Update Lambda functions
3. Restore previous API Gateway settings

## Success Criteria

### Performance Metrics
- Time to First Byte: <200ms
- First Contentful Paint: <1.5s
- API Response Time: <300ms
- WebSocket Latency: <100ms

### User Experience
- Seamless authentication flow
- Responsive visualizations
- Real-time updates working
- No regression in features

### Operational Metrics
- Deployment success rate: >95%
- Error rate: <1%
- Availability: >99.9%

## Conclusion

The hybrid architecture approach provides the best balance between modern frontend development practices and proven backend infrastructure. By leveraging Vercel for frontend hosting while maintaining AWS backend services, we achieve improved developer experience, better performance, and cost optimization without the risks and expenses of a full migration.</content>
