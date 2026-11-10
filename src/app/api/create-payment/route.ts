import { NextResponse } from 'next/server';
import { membershipPricing } from '@/lib/membership';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const period = (body.period === 'yearly' ? 'yearly' : 'monthly') as 'monthly' | 'yearly';
    const amount = membershipPricing[period]; // Safely typed
    const ZIINA_API_KEY = process.env.ZIINA_API_KEY;

    const response = await fetch('https://api-v2.ziina.com/api/payment_intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZIINA_API_KEY}`,
      },
      body: JSON.stringify({
        amount: amount * 100, // Ziina expects amounts in fils
        currency_code: membershipPricing.currency,
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://eat-right-2.onrender.com'}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://eat-right-2.onrender.com'}/cancel`,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
  }
}