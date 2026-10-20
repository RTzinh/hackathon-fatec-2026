import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { Connect, Plugin } from 'vite'
import { handleAtaAssistantRequest } from './server/ata-assistant.js'
import { handleComplianceReviewRequest } from './server/compliance-review.js'

/**
 * Serve POST /api/ata-assistant e POST /api/compliance-review no `vite` e no `vite preview`, com a mesma
 * lógica das Vercel Functions. A chave é lida aqui, no processo do servidor, e não passa por
 * `import.meta.env` nem pelo bundle.
 */
function ataAssistantApi(env: Record<string, string>): Plugin {
  const config = { apiKey: env.OPENROUTER_API_KEY, model: env.OPENROUTER_MODEL }
  const ataMiddleware: Connect.NextHandleFunction = (req, res) => {
    void handleAtaAssistantRequest(req, res, config)
  }
  const complianceMiddleware: Connect.NextHandleFunction = (req, res) => {
    void handleComplianceReviewRequest(req, res, config)
  }
  return {
    name: 'integrae-ata-assistant',
    configureServer(server) {
      server.middlewares.use('/api/ata-assistant', ataMiddleware)
      server.middlewares.use('/api/compliance-review', complianceMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/ata-assistant', ataMiddleware)
      server.middlewares.use('/api/compliance-review', complianceMiddleware)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return { plugins: [react(), ataAssistantApi(env)] }
})
