import { NextResponse } from 'next/server';
import { calculateFrequentist, calculateBayesian } from './statistics';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const result = data.method === "frequentist" 
      ? calculateFrequentist(data)
      : calculateBayesian(data);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate test duration' },
      { status: 500 }
    );
  }
}