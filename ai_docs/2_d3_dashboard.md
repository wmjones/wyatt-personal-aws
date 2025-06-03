# LTO Demand Planning - Hybrid Architecture Implementation

## Overview

LTO Demand Planning is an interactive forecasting and demand planning platform that allows businesses to optimize inventory and sales strategies for limited time offers and seasonal campaigns. In the hybrid architecture, the frontend is hosted on Vercel while the backend services remain on AWS, providing optimal performance and developer experience.

## Architecture Components

### Frontend (Vercel)

- **Next.js Application**: Server-side rendering and static generation
- **React Server Components**: Optimized server-side rendering with interactive D3.js visualizations
- **WebSocket Client**: Real-time collaboration features
- **API Client**: Secure communication with AWS backend
- **State Management**: Context API for application state

### Backend (AWS)

- **API Gateway**: HTTP and WebSocket endpoints
- **Lambda Functions**: Serverless compute for business logic
- **DynamoDB**: NoSQL database for data storage
- **Cognito**: User authentication and authorization
- **S3**: Data storage for exports and user uploads

## Implementation Details

### Frontend Architecture

#### Component Structure

```typescript
src/frontend/nextjs-app/
├── app/
│   ├── (dashboard)/
│   │   ├── visualizations/
│   │   │   ├── page.tsx              # Visualization list
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Individual visualization
│   │   │       └── edit/page.tsx     # Edit mode
│   │   └── layout.tsx                # Dashboard layout
│   ├── components/
│   │   ├── visualizations/
│   │   │   ├── D3Canvas.tsx          # D3.js wrapper
│   │   │   ├── NormalDistribution.tsx # Distribution chart
│   │   │   ├── ScatterPlot.tsx       # Scatter plot
│   │   │   └── Histogram.tsx         # Histogram
│   │   ├── controls/
│   │   │   ├── ParameterSlider.tsx   # Parameter controls
│   │   │   ├── ColorPicker.tsx       # Color selection
│   │   │   └── ExportButton.tsx      # Export functionality
│   │   └── collaboration/
│   │       ├── UserPresence.tsx      # Active users
│   │       ├── CursorTracker.tsx     # Live cursors
│   │       └── ChangeHistory.tsx     # Version history
│   └── services/
│       ├── api/
│       │   ├── visualizations.ts     # API calls
│       │   └── parameters.ts         # Parameter updates
│       └── websocket/
│           └── connection.ts         # WebSocket management
```

#### D3.js Integration

```typescript
// components/visualizations/D3Canvas.tsx
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface D3CanvasProps {
  data: any[];
  width: number;
  height: number;
  onParameterChange?: (params: any) => void;
}

export const D3Canvas: React.FC<D3CanvasProps> = ({
  data,
  width,
  height,
  onParameterChange,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Clear previous content
    svg.selectAll('*').remove();

    // Set dimensions
    svg.attr('width', width).attr('height', height);

    // Create visualization
    const g = svg.append('g');

    // Add interactive elements
    g.selectAll('.data-point')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', 5)
      .on('drag', handleDrag);

    function handleDrag(event: any, d: any) {
      d.x = event.x;
      d.y = event.y;
      d3.select(event.target)
        .attr('cx', d.x)
        .attr('cy', d.y);

      if (onParameterChange) {
        onParameterChange({ x: d.x, y: d.y });
      }
    }
  }, [data, width, height]);

  return <svg ref={svgRef} />;
};
```

#### API Client Service

```typescript
// services/api/visualizations.ts
import { apiClient } from './client';

export interface Visualization {
  id: string;
  userId: string;
  name: string;
  type: 'normal' | 'scatter' | 'histogram';
  parameters: {
    mean: number;
    stdDev: number;
    color: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const visualizationApi = {
  list: async (): Promise<Visualization[]> => {
    const response = await apiClient.get('/visualizations');
    return response.data;
  },

  get: async (id: string): Promise<Visualization> => {
    const response = await apiClient.get(`/visualizations/${id}`);
    return response.data;
  },

  create: async (data: Partial<Visualization>): Promise<Visualization> => {
    const response = await apiClient.post('/visualizations', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Visualization>): Promise<Visualization> => {
    const response = await apiClient.put(`/visualizations/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/visualizations/${id}`);
  },

  updateParameters: async (id: string, parameters: any): Promise<void> => {
    await apiClient.post(`/visualizations/${id}/parameters`, parameters);
  },
};
```

#### WebSocket Connection

```typescript
// services/websocket/connection.ts
import { config } from '@/config/environment';

export class WebSocketConnection {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private handlers: Map<string, Set<Function>> = new Map();

  async connect(token: string) {
    const wsUrl = `${config.api.websocketUrl}?token=${token}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.emit(message.type, message.payload);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('disconnected');
      this.scheduleReconnect(token);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  private scheduleReconnect(token: string) {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect(token);
    }, 5000);
  }

  on(event: string, handler: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: Function) {
    this.handlers.get(event)?.delete(handler);
  }

  private emit(event: string, data?: any) {
    this.handlers.get(event)?.forEach(handler => handler(data));
  }

  send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.ws?.close();
  }
}
```

### Backend Implementation

#### API Gateway Configuration

```yaml
# serverless.yml or terraform configuration
Resources:
  ApiGateway:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: ${self:service}-${self:provider.stage}
      ProtocolType: HTTP
      CorsConfiguration:
        AllowOrigins:
          - https://app.vercel.app
          - https://preview-*.vercel.app
          - http://localhost:3000
        AllowMethods:
          - GET
          - POST
          - PUT
          - DELETE
          - OPTIONS
        AllowHeaders:
          - Content-Type
          - Authorization
        ExposeHeaders:
          - x-request-id
        MaxAge: 86400
```

#### Lambda Functions

```python
# lambda/visualization/get_all.py
import boto3
import json
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.logging import correlation_paths
from utils.auth import get_user_id
from utils.cors import add_cors_headers

logger = Logger()
tracer = Tracer()

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Visualizations')

@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
def handler(event, context):
    try:
        # Get user ID from JWT token
        user_id = get_user_id(event)

        # Query visualizations for user
        response = table.query(
            KeyConditionExpression='userId = :userId',
            ExpressionAttributeValues={
                ':userId': user_id
            }
        )

        visualizations = response.get('Items', [])

        return add_cors_headers({
            'statusCode': 200,
            'body': json.dumps(visualizations)
        }, event.get('headers', {}).get('origin'))

    except Exception as e:
        logger.error(f"Error fetching visualizations: {str(e)}")
        return add_cors_headers({
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }, event.get('headers', {}).get('origin'))
```

```python
# lambda/visualization/update_parameters.py
import boto3
import json
import time
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from utils.auth import get_user_id
from utils.cors import add_cors_headers
from utils.websocket import broadcast_update

logger = Logger()
tracer = Tracer()
metrics = Metrics()

dynamodb = boto3.resource('dynamodb')
visualizations_table = dynamodb.Table('Visualizations')
history_table = dynamodb.Table('ParameterHistory')

@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def handler(event, context):
    try:
        # Parse request
        visualization_id = event['pathParameters']['id']
        user_id = get_user_id(event)
        body = json.loads(event['body'])
        parameters = body['parameters']

        # Update visualization
        response = visualizations_table.update_item(
            Key={
                'id': visualization_id,
                'userId': user_id
            },
            UpdateExpression='SET parameters = :params, updatedAt = :now',
            ExpressionAttributeValues={
                ':params': parameters,
                ':now': int(time.time())
            },
            ReturnValues='ALL_NEW'
        )

        # Save to history
        history_table.put_item(
            Item={
                'visualizationId': visualization_id,
                'timestamp': int(time.time()),
                'userId': user_id,
                'parameters': parameters,
                'action': 'update'
            }
        )

        # Broadcast update via WebSocket
        await broadcast_update(visualization_id, {
            'type': 'parameter_update',
            'visualizationId': visualization_id,
            'parameters': parameters,
            'userId': user_id
        })

        # Add metric
        metrics.add_metric(name="ParameterUpdate", unit=MetricUnit.Count, value=1)

        return add_cors_headers({
            'statusCode': 200,
            'body': json.dumps(response['Attributes'])
        }, event.get('headers', {}).get('origin'))

    except Exception as e:
        logger.error(f"Error updating parameters: {str(e)}")
        return add_cors_headers({
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }, event.get('headers', {}).get('origin'))
```

#### WebSocket Handler

```python
# lambda/websocket/connect.py
import boto3
import json
from aws_lambda_powertools import Logger

logger = Logger()

dynamodb = boto3.resource('dynamodb')
connections_table = dynamodb.Table('WebSocketConnections')

@logger.inject_lambda_context
def handler(event, context):
    try:
        connection_id = event['requestContext']['connectionId']

        # Extract user information from query string
        query_params = event.get('queryStringParameters', {})
        token = query_params.get('token')

        # Validate token and get user ID
        user_id = validate_token(token)

        # Store connection
        connections_table.put_item(
            Item={
                'connectionId': connection_id,
                'userId': user_id,
                'connectedAt': int(time.time()),
                'ttl': int(time.time()) + 86400  # 24 hour TTL
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Connected'})
        }

    except Exception as e:
        logger.error(f"Connection error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Connection failed'})
        }
```

### DynamoDB Schema

#### Visualizations Table

```python
{
    'TableName': 'Visualizations',
    'KeySchema': [
        {'AttributeName': 'id', 'KeyType': 'HASH'},
        {'AttributeName': 'userId', 'KeyType': 'RANGE'}
    ],
    'AttributeDefinitions': [
        {'AttributeName': 'id', 'AttributeType': 'S'},
        {'AttributeName': 'userId', 'AttributeType': 'S'}
    ],
    'BillingMode': 'PAY_PER_REQUEST',
    'StreamSpecification': {
        'StreamEnabled': True,
        'StreamViewType': 'NEW_AND_OLD_IMAGES'
    }
}
```

#### Parameter History Table

```python
{
    'TableName': 'ParameterHistory',
    'KeySchema': [
        {'AttributeName': 'visualizationId', 'KeyType': 'HASH'},
        {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
    ],
    'AttributeDefinitions': [
        {'AttributeName': 'visualizationId', 'AttributeType': 'S'},
        {'AttributeName': 'timestamp', 'AttributeType': 'N'}
    ],
    'BillingMode': 'PAY_PER_REQUEST'
}
```

#### WebSocket Connections Table

```python
{
    'TableName': 'WebSocketConnections',
    'KeySchema': [
        {'AttributeName': 'connectionId', 'KeyType': 'HASH'}
    ],
    'AttributeDefinitions': [
        {'AttributeName': 'connectionId', 'AttributeType': 'S'}
    ],
    'BillingMode': 'PAY_PER_REQUEST',
    'TimeToLiveSpecification': {
        'AttributeName': 'ttl',
        'Enabled': True
    },
    'GlobalSecondaryIndexes': [
        {
            'IndexName': 'userId-index',
            'KeySchema': [
                {'AttributeName': 'userId', 'KeyType': 'HASH'}
            ],
            'Projection': {'ProjectionType': 'ALL'}
        }
    ]
}
```

## Feature Implementation

### Real-time Collaboration

1. **User Presence**
   - Track active users per visualization
   - Display user avatars/initials
   - Show connection status

2. **Live Cursors**
   - Broadcast cursor positions
   - Display other users' cursors
   - Smooth cursor animations

3. **Parameter Updates**
   - Instant parameter synchronization
   - Conflict resolution for simultaneous edits
   - Update notifications

### Interactive Visualizations

1. **Drag-and-Drop**
   - Adjust parameters by dragging
   - Visual feedback during drag
   - Snap-to-grid functionality

2. **Zoom and Pan**
   - Mouse wheel zoom
   - Click and drag panning
   - Reset view button

3. **Export Options**
   - PNG/SVG export
   - Data export (CSV/JSON)
   - Share links

### Performance Optimizations

1. **Data Loading**
   - Lazy loading for large datasets
   - Progressive rendering
   - Request caching

2. **Rendering**
   - Canvas fallback for large datasets
   - Debounced updates
   - Virtual scrolling

3. **WebSocket**
   - Message batching
   - Compression
   - Automatic reconnection

## Security Considerations

### Frontend Security

1. **Input Validation**
   - Sanitize user inputs
   - Validate parameter ranges
   - Prevent XSS attacks

2. **Authentication**
   - JWT token validation
   - Secure token storage
   - Automatic token refresh

3. **API Security**
   - HTTPS only
   - Request signing
   - Rate limiting

### Backend Security

1. **Authorization**
   - User-level data isolation
   - Role-based access control
   - Resource permissions

2. **Data Protection**
   - Encryption at rest
   - Encryption in transit
   - Audit logging

3. **WebSocket Security**
   - Connection authentication
   - Message validation
   - Connection rate limiting

## Monitoring and Analytics

### Frontend Metrics

```typescript
// utils/analytics.ts
import { Analytics } from '@vercel/analytics/react';

export const trackEvent = (name: string, properties?: any) => {
  // Vercel Analytics
  if (window.analytics) {
    window.analytics.track(name, properties);
  }

  // Custom metrics
  console.log('Event:', name, properties);
};

// Usage in components
trackEvent('visualization_created', {
  type: 'normal_distribution',
  parameters: { mean: 0, stdDev: 1 }
});
```

### Backend Metrics

```python
# utils/metrics.py
from aws_lambda_powertools import Metrics
from aws_lambda_powertools.metrics import MetricUnit

metrics = Metrics()

def track_visualization_event(event_type, visualization_id, user_id):
    metrics.add_metric(
        name=f"Visualization{event_type}",
        unit=MetricUnit.Count,
        value=1
    )

    metrics.add_metadata(
        key="visualizationId",
        value=visualization_id
    )

    metrics.add_metadata(
        key="userId",
        value=user_id
    )
```

## Future Enhancements

### Planned Features

1. **Advanced Visualizations**
   - 3D charts
   - Network graphs
   - Time series animations

2. **Collaboration Tools**
   - Comments and annotations
   - Version control
   - Change requests

3. **Machine Learning**
   - Automatic insights
   - Anomaly detection
   - Predictive analytics

4. **Mobile Support**
   - Responsive design improvements
   - Touch interactions
   - Native app development

### Architecture Evolution

1. **Edge Computing**
   - Vercel Edge Functions
   - Regional data caching
   - Reduced latency

2. **GraphQL API**
   - Efficient data fetching
   - Real-time subscriptions
   - Better mobile support

3. **Microservices**
   - Service decomposition
   - Independent scaling
   - Technology diversity

## Conclusion

The D3 Dashboard implementation in the hybrid architecture provides a robust, scalable platform for interactive data visualization. By leveraging Vercel's frontend capabilities and AWS's backend services, we achieve optimal performance, developer experience, and user satisfaction while maintaining cost efficiency.</content>
