import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { savePremiumUser } from '@/lib/storage'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } else {
      event = JSON.parse(body)
    }
  } catch {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const email = session.customer_email || session.metadata?.userEmail
    if (email) {
      await savePremiumUser(email)
    }
  }

  return NextResponse.json({ received: true })
}
