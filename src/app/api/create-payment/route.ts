// src/app/api/create-payment/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/firebase';

const LYGOS_API_KEY = process.env.LYGOS_API_KEY;
const LYGOS_API_BASE_URL = process.env.LYGOS_API_BASE_URL;
const APP_BASE_URL = process.env.APP_BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail } = await request.json();

    if (!userId || !userEmail) {
      return new NextResponse('User ID and email are required', { status: 400 });
    }

    const body = {
      amount: 1000, // Montant en cents, ex: 10.00$
      currency: 'usd',
      description: 'Abonnement NeoStud Premium (1 an)',
      customer_email: userEmail,
      metadata: {
        userId: userId,
      },
      success_url: `${APP_BASE_URL}/library?payment=success`,
      cancel_url: `${APP_BASE_URL}/subscribe?payment=cancelled`,
    };

    const response = await fetch(`${LYGOS_API_BASE_URL}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LYGOS_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const paymentSession = await response.json();

    if (!response.ok) {
        console.error('Lygos API Error:', paymentSession);
        throw new Error(paymentSession.error?.message || 'Failed to create payment session');
    }

    return NextResponse.json({ redirect_url: paymentSession.redirect_url });

  } catch (error) {
    console.error('Error creating payment session:', error);
    if (error instanceof Error) {
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
