import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleAtaAssistantRequest } from '../server/ata-assistant.js'

/**
 * Vercel Function (runtime Node): POST /api/ata-assistant.
 * A chave vem de OPENROUTER_API_KEY, configurada só no painel da Vercel. Nunca chega ao navegador.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL
  await handleAtaAssistantRequest(req, res, {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL,
    referer: host ? `https://${host}` : undefined,
  })
}
