import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openrouter, AI_MODEL, AI_MODEL_FALLBACK } from '@/lib/openrouter'

export const runtime = 'nodejs'
export const maxDuration = 90

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const { currentCode, userRequest, mcVersion, api, type } = await request.json() as {
    currentCode: string
    userRequest: string
    mcVersion: string
    api?: string
    type: 'plugin' | 'config'
  }

  if (!currentCode || !userRequest) {
    return NextResponse.json({ error: 'Codice e richiesta necessari' }, { status: 400 })
  }

  const systemPrompt = type === 'plugin'
    ? `Sei un esperto sviluppatore Java di plugin Minecraft (${api ?? 'Spigot'} ${mcVersion}).
Ricevi il codice attuale del plugin e una richiesta di modifica.
REGOLE:
1. Restituisci SOLO il codice Java completo e modificato, nessuna spiegazione.
2. Mantieni la struttura del codice esistente, modifica solo ciò che viene richiesto.
3. Il codice deve compilare senza errori.
4. Se c'è un plugin.yml, mantienilo aggiornato.
5. Commenti in italiano.
FORMATO: codice Java completo, poi // ===== plugin.yml ===== seguito dal plugin.yml se presente.`
    : `Sei un esperto di configurazioni Minecraft.
Ricevi la configurazione YAML attuale e una richiesta di modifica.
REGOLE:
1. Restituisci SOLO il YAML completo e modificato, nessuna spiegazione.
2. Mantieni la struttura esistente, modifica solo ciò che viene richiesto.
3. Il YAML deve essere valido (indentazione 2 spazi).
4. Commenti in italiano.`

  const userMessage = `CODICE ATTUALE:\n\`\`\`\n${currentCode}\n\`\`\`\n\nRICHIESTA DI MODIFICA:\n${userRequest}`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const chatStream = await openrouter.chat.completions.create({
          model: AI_MODEL,
          stream: true,
          max_tokens: 4096,
          temperature: 0.2,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        })

        for await (const chunk of chatStream) {
          const content = chunk.choices[0]?.delta?.content ?? ''
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
          }
          if (chunk.choices[0]?.finish_reason) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          }
        }
      } catch (err) {
        // Try fallback model
        try {
          const fallbackStream = await openrouter.chat.completions.create({
            model: AI_MODEL_FALLBACK,
            stream: true,
            max_tokens: 4096,
            temperature: 0.2,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
          })
          for await (const chunk of fallbackStream) {
            const content = chunk.choices[0]?.delta?.content ?? ''
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
            }
            if (chunk.choices[0]?.finish_reason) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
            }
          }
        } catch (fallbackErr) {
          const errMsg = fallbackErr instanceof Error ? fallbackErr.message : 'Errore AI'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`))
        }
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
