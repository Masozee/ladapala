// server.js
const { createServer } = require('http')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || (dev ? 'localhost' : '0.0.0.0')
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Handle proxy headers from cPanel/Apache
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
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
