// server.js
const { createServer } = require('http')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || (dev ? 'localhost' : '0.0.0.0')
const port = process.env.PORT || 3001

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Enhanced logging function
function logToFile(type, message, error = null) {
  const timestamp = new Date().toISOString()
  const logFile = path.join(logsDir, `${type}.log`)
  const logMessage = error
    ? `[${timestamp}] ${message}\n${error.stack || error}\n\n`
    : `[${timestamp}] ${message}\n`

  fs.appendFileSync(logFile, logMessage)

  // Also log to console
  if (error) {
    console.error(`[${timestamp}] ${message}`, error)
  } else {
    console.log(`[${timestamp}] ${message}`)
  }
}

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

logToFile('server', `Starting server in ${dev ? 'development' : 'production'} mode`)
logToFile('server', `Node version: ${process.version}`)
logToFile('server', `Environment: ${JSON.stringify({
  NODE_ENV: process.env.NODE_ENV,
  PORT: port,
  HOSTNAME: hostname
})}`)

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Log API requests
      if (req.url.startsWith('/api/')) {
        logToFile('api', `${req.method} ${req.url}`)
      }

      // Handle proxy headers from Nginx/Apache
      // Extract first value if header contains multiple values (e.g., "https, https")
      const forwardedProto = req.headers['x-forwarded-proto']
      const protocol = forwardedProto
        ? forwardedProto.split(',')[0].trim()
        : (req.connection.encrypted ? 'https' : 'http')

      const forwardedHost = req.headers['x-forwarded-host']
      const host = forwardedHost
        ? forwardedHost.split(',')[0].trim()
        : req.headers.host

      // Use WHATWG URL API instead of url.parse()
      const parsedUrl = new URL(req.url, `${protocol}://${host}`)
      await handle(req, res, parsedUrl)
    } catch (err) {
      logToFile('error', `Error handling ${req.method} ${req.url}`, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, hostname, (err) => {
    if (err) {
      logToFile('error', 'Failed to start server', err)
      throw err
    }
    logToFile('server', `Server ready on http://${hostname}:${port}`)
  })
}).catch((err) => {
  logToFile('error', 'Failed to prepare Next.js app', err)
  process.exit(1)
})
