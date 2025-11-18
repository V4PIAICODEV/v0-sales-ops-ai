import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('[v0] Proxying diagnosis request to n8n webhook')

    const response = await fetch(
      'https://enablement-n8n-sales-ops-ai.uyk8ty.easypanel.host/webhook/diagnosticoComercial',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] Webhook error:', errorText)
      return NextResponse.json(
        { error: 'Failed to generate diagnosis', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[v0] Diagnosis generated successfully')

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Error proxying diagnosis request:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
