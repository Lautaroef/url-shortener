import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  
  try {
    // Call the backend API to get the redirect
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://url-shortener-eosin-eight.vercel.app/api'
      : 'http://localhost:3001/api';
    
    const response = await fetch(`${backendUrl}/${slug}`, {
      redirect: 'manual',
    });
    
    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get('location');
      if (location) {
        return NextResponse.redirect(location);
      }
    }
    
    // If not found, trigger Next.js 404 page
    return new NextResponse(null, { status: 404 });
  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}