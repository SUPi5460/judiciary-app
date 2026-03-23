import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { stripe } from '@/lib/stripe'
import { badRequest, serverError } from '@/lib/api-error'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return badRequest('ログインが必要です')
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      }],
      customer_email: session.user.email,
      success_url: `${req.nextUrl.origin}/premium/success`,
      cancel_url: `${req.nextUrl.origin}/premium`,
      metadata: {
        userId: session.user.id ?? '',
        userEmail: session.user.email,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch {
    return serverError()
  }
}
