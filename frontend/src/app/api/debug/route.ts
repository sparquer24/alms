export const dynamic = 'force-static';

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ 
        message: "Debug cookies not available in static export build" 
    });
}
