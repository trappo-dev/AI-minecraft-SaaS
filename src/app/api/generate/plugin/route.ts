import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import {
  openrouter,
  AI_MODEL,
  GENERATION_COSTS,
  getPluginSystemPrompt,
} from '@/lib/openrouter'

export const runtime = 'nodejs'
export const maxDuration = 120

function getAdminClient() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const { prompt, pluginName, mcVersion, api } = await request.json() as {
    prompt: string
    pluginName: string
    mcVersion: string
    api: string
  }

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Descrizione richiesta' }, { status: 400 })
  }

  const db = getAdminClient()
  const cost = GENERATION_COSTS.plugin

  // ── Check credits ────────────────────────────────────────────────
  const { data: creditsRow } = await db
    .from('credits')
    .select('available_credits')
    .eq('user_id', user.id)
    .single()

  const { data: userProfile } = await db
    .from('users')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const isUnlimited = userProfile?.subscription_status === 'ultra'
  const currentCredits = creditsRow?.available_credits ?? 0

  if (!isUnlimited && currentCredits < cost) {
    return NextResponse.json(
      {
        error: `Crediti insufficienti. Hai ${currentCredits} crediti ma ne servono ${cost} per generare un plugin.`,
      },
      { status: 402 }
    )
  }

  // ── Build the user message ───────────────────────────────────────
  const userMessage = [
    `Nome Plugin: ${pluginName || 'Plugin Personalizzato'}`,
    `Versione Minecraft: ${mcVersion}`,
    `API: ${api}`,
    ``,
    `Descrizione richiesta:`,
    prompt,
  ].join('\n')

  // ── Stream from OpenRouter ───────────────────────────────────────
  const encoder = new TextEncoder()
  let fullOutput = ''
  let generationId: string | null = null

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const chatStream = await openrouter.chat.completions.create({
          model: AI_MODEL,
          stream: true,
          max_tokens: 4096,
          temperature: 0.3,
          messages: [
            { role: 'system', content: getPluginSystemPrompt(mcVersion, api) },
            { role: 'user', content: userMessage },
          ],
        })

        for await (const chunk of chatStream) {
          const content = chunk.choices[0]?.delta?.content ?? ''
          if (content) {
            fullOutput += content
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            )
          }

          if (chunk.choices[0]?.finish_reason) {
            // ── Deduct credits & save generation ──────────────────
            const [, saveResult] = await Promise.all([
              isUnlimited
                ? Promise.resolve()
                : db
                  .from('credits')
                  .update({ available_credits: currentCredits - cost })
                  .eq('user_id', user.id),
              db
                .from('generations')
                .insert({
                  user_id: user.id,
                  type: 'plugin',
                  prompt: prompt.slice(0, 500),
                  output: fullOutput.slice(0, 10000),
                  credits_used: cost,
                  metadata: { pluginName, mcVersion, api },
                })
                .select('id')
                .single(),
            ])

            generationId = saveResult.data?.id ?? null

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  done: true,
                  creditsUsed: cost,
                  newBalance: isUnlimited ? null : currentCredits - cost,
                  generationId,
                })}\n\n`
              )
            )
          }
        }
      } catch (error: unknown) {
        const errMsg =
          error instanceof Error ? error.message : 'Errore AI sconosciuto'
        console.error('[GENERATE_PLUGIN]', error)
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: errMsg })}\n\n`
          )
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
