import { NextRequest, NextResponse } from 'next/server';

/**
 * Athena API Route Handler
 *
 * This route acts as a proxy to the AWS Lambda function that executes Athena queries.
 * It enables the frontend to query forecast data stored in S3 and analyzed with Athena.
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();

    // Validate request
    if (!body || !body.action) {
      return NextResponse.json(
        { error: 'Invalid request. Action is required.' },
        { status: 400 }
      );
    }

    // Get AWS API Gateway URL from environment variable
    const awsApiGatewayUrl = process.env.AWS_API_GATEWAY_URL;

    if (!awsApiGatewayUrl) {
      return NextResponse.json(
        { error: 'AWS API Gateway URL not configured' },
        { status: 500 }
      );
    }

    // Create the request to AWS API Gateway
    const apiUrl = `${awsApiGatewayUrl}/api/data/athena/query`;

    // Forward the request to AWS API Gateway
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    // Handle errors
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Error executing Athena query' },
        { status: response.status }
      );
    }

    // Return the response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Athena API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
