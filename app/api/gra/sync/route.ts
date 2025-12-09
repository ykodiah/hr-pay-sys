import { NextRequest, NextResponse } from 'next/server';
import { graApiService } from '@/lib/gra-api';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, action } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'API key is required' 
        },
        { status: 400 }
      );
    }

    // Set the API key
    graApiService.setApiKey(apiKey);

    switch (action) {
      case 'test_connection':
        const isConnected = await graApiService.testConnection();
        return NextResponse.json({
          success: isConnected,
          message: isConnected ? 'Connected to GRA API' : 'Failed to connect to GRA API',
          data: { isConnected }
        });

      case 'sync_reliefs':
        const syncResult = await graApiService.syncTaxReliefs();
        return NextResponse.json(syncResult);

      case 'get_comprehensive_reliefs':
        const comprehensiveReliefs = await graApiService.getComprehensiveTaxReliefs();
        return NextResponse.json({
          success: true,
          data: {
            taxReliefs: comprehensiveReliefs,
            taxRates: []
          },
          lastSync: new Date().toISOString(),
          totalReliefs: comprehensiveReliefs.length,
          totalRates: 0
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action specified' 
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GRA API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const syncStatus = graApiService.getSyncStatus();
    return NextResponse.json({
      success: true,
      data: syncStatus
    });
  } catch (error) {
    console.error('GRA Status Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
