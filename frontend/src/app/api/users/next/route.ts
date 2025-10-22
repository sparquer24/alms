import { NextResponse } from 'next/server';

// Mock user data with specific police ranks
const mockUsers = [
  { id: '1', name: 'DCP Rajesh Kumar', role: 'dcp', designation: 'Deputy Commissioner of Police' },
  { id: '2', name: 'ACP Priya Sharma', role: 'acp', designation: 'Assistant Commissioner of Police' },
  { id: '3', name: 'ACP Amit Patel', role: 'acp', designation: 'Assistant Commissioner of Police' },
  { id: '4', name: 'SHO Ramesh Singh', role: 'sho', designation: 'Station House Officer' },
  { id: '5', name: 'SHO Meera Devi', role: 'sho', designation: 'Station House Officer' },
  { id: '6', name: 'DCP Sanjay Verma', role: 'dcp', designation: 'Deputy Commissioner of Police' },
  { id: '7', name: 'ACP Deepak Gupta', role: 'acp', designation: 'Assistant Commissioner of Police' },
  { id: '8', name: 'SHO Vikram Malhotra', role: 'sho', designation: 'Station House Officer' },
];

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({
      success: true,
      users: mockUsers,
      message: 'Users fetched successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch users',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 