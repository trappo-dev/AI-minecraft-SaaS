import OpenAI from 'openai'

if (!process.env.OPENROUTER_API_KEY) {
  console.warn('[OpenRouter] OPENROUTER_API_KEY not set — AI generation will fail')
}

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY ?? 'missing',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    'X-Title': 'TrappolaGIoDev',
  },
})

// Primary free model: DeepSeek R1 (excellent for code generation)
export const AI_MODEL = 'openrouter/free'
// Fallback free model: Llama 3.3 70B (fast, high quality)
export const AI_MODEL_FALLBACK = 'meta-llama/llama-3.3-70b-instruct:free'

// ── Credits ─────────────────────────────────────────────────────
export const GENERATION_COSTS = {
  plugin: 5,
  config: 1,
} as const

export type GenerationType = keyof typeof GENERATION_COSTS

// ── Plugin System Prompt ─────────────────────────────────────────
export function getPluginSystemPrompt(
  mcVersion: string,
  api: string
): string {
  return `Sei un esperto sviluppatore Java di plugin Minecraft con anni di esperienza in ${api} per Minecraft ${mcVersion}.

REGOLE ASSOLUTE:
1. Genera SOLO codice Java completo, funzionante e production-ready
2. Usa sempre le API di ${api} correttamente per la versione ${mcVersion}
3. Includi TUTTI gli import necessari in cima al file
4. Crea un plugin.yml completo e corretto
5. Aggiungi commenti in italiano per spiegare il codice
6. Il codice deve compilare senza errori
7. Gestisci sempre le eccezioni appropriatamente
8. NON includere placeholder o TODO nel codice finale
9. Usa ChatColor per i messaggi colorati
10. Registra sempre i listener e i comandi correttamente in onEnable()

STRUTTURA OUTPUT:
Prima il file Java principale (con package e classe che estende JavaPlugin), poi il plugin.yml.
Separa i file con un commento: // ===== plugin.yml ===== 

FORMATO: Rispondi con SOLO codice, nessuna spiegazione prima o dopo il codice.`
}

// ── Config System Prompt ─────────────────────────────────────────
export function getConfigSystemPrompt(
  pluginName: string,
  mcVersion: string
): string {
  return `Sei un esperto amministratore di server Minecraft con profonda conoscenza di ${pluginName} per Minecraft ${mcVersion}.

REGOLE ASSOLUTE:
1. Genera SOLO la configurazione YAML completa e valida
2. Includi TUTTI i parametri importanti con valori ottimizzati
3. Aggiungi commenti in italiano (con #) per spiegare ogni sezione
4. La configurazione deve essere pronta all'uso senza modifiche
5. Usa la sintassi YAML corretta (indentazione con 2 spazi)
6. Includi esempi realistici dove appropriato (es. messaggi, mondi, comandi)
7. NON includere placeholder generici come "your_value_here"
8. Ottimizza i valori per le performance dove possibile

FORMATO: Rispondi con SOLO il contenuto YAML, nessuna spiegazione prima o dopo.`
}
