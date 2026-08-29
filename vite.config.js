import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import handler from './api/gerar-plano.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [
      react(),
      {
        name: 'api-serverless-dev-middleware',
        configureServer(server) {
          server.middlewares.use('/api/gerar-plano', async (req, res) => {
            if (req.method === 'POST') {
              let body = ''
              req.on('data', chunk => {
                body += chunk
              })
              req.on('end', async () => {
                try {
                  req.body = body ? JSON.parse(body) : {}
                } catch {
                  req.body = {}
                }
                const fakeRes = {
                  status(code) {
                    res.statusCode = code
                    return this
                  },
                  setHeader(k, v) {
                    res.setHeader(k, v)
                    return this
                  },
                  json(data) {
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify(data))
                  },
                  end() {
                    res.end()
                  }
                }
                try {
                  await handler(req, fakeRes)
                } catch (err) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: err.message }))
                }
              })
            } else if (req.method === 'OPTIONS') {
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
              res.statusCode = 200
              res.end()
            } else {
              res.statusCode = 405
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Method Not Allowed' }))
            }
          })
        }
      }
    ]
  }
})

