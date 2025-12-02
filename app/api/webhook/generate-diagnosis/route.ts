import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { analyses, timestamp } = body

    console.log('[v0] Generating commercial diagnosis for', analyses.length, 'analyses')

    // Here you can add your webhook logic
    // For example: call an external API, process the data, generate reports, etc.
    
    // Calculate aggregate metrics
    const totalAnalyses = analyses.length
    const avgScore = analyses.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / totalAnalyses
    const avgFollowups = analyses.reduce((sum: number, a: any) => sum + a.qtd_followups, 0) / totalAnalyses
    
    const diagnosis = {
      userId: user.id,
      timestamp,
      totalAnalyses,
      averageScore: avgScore.toFixed(2),
      averageFollowups: avgFollowups.toFixed(2),
      summary: `Diagnóstico gerado com sucesso para ${totalAnalyses} análises.`,
    }

    // You can save this to your database or send to an external webhook
    // Example: await fetch('https://your-webhook-url.com', { method: 'POST', body: JSON.stringify(diagnosis) })

    return NextResponse.json({
      success: true,
      diagnosis,
      message: 'Diagnóstico comercial gerado com sucesso'
    })
  } catch (error) {
    console.error('[v0] Error in generate-diagnosis webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
