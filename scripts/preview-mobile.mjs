import http from 'node:http'
import path from 'node:path'
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const webRoot = path.join(workspace, 'flutter_app/build/web')
const mobilePage = path.join(workspace, 'flutter_app/preview/mobile.html')
const port = Number(process.env.MOBILE_PREVIEW_PORT || 8451)
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.otf': 'font/otf' }

try { await stat(path.join(webRoot, 'index.html')) } catch {
  console.error('Compile o Flutter Web primeiro: dentro de flutter_app, execute flutter build web --release --no-web-resources-cdn.')
  process.exit(1)
}

http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    const isMobile = pathname === '/mobile' || pathname === '/mobile/'
    const file = isMobile ? mobilePage : path.resolve(webRoot, `.${pathname === '/' ? '/index.html' : pathname}`)
    if (!isMobile && !file.startsWith(webRoot + path.sep)) {
      response.writeHead(403).end(); return
    }
    const content = await readFile(file)
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
    response.end(content)
  } catch {
    response.writeHead(404).end('Arquivo não encontrado.')
  }
}).listen(port, '127.0.0.1', () => console.log(`Prévia celular: http://127.0.0.1:${port}/mobile`))
