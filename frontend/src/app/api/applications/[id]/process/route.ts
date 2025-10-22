import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate required fields
    if (!body.actionType) {
      return NextResponse.json(
        { success: false, message: 'Action type is required' },
        { status: 400 }
      );
    }

    if (!body.remarks || body.remarks.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Remarks are required' },
        { status: 400 }
      );
    }

    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock successful processing
    const response = {
      success: true,
      message: `Application ${id} has been ${body.actionType} successfully`,
      data: {
        applicationId: id,
        actionType: body.actionType,
        remarks: body.remarks,
        forwardTo: body.forwardTo || null,
        processedAt: new Date().toISOString(),
        processedBy: 'current-user-id' // In real app, this would come from auth
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing application:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process application',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 