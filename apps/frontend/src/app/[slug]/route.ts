import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  
  try {
    // Call the backend API to get the redirect
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/${slug}`, {
      redirect: 'manual',
    });
    
    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get('location');
      if (location) {
        return NextResponse.redirect(location);
      }
    }
    
    // If not found, return 404
    return NextResponse.json(
      { error: 'Short URL not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}