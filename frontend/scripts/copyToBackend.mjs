import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const repoRoot = path.resolve(__dirname, '..') // frontend/
const distDir = path.join(repoRoot, 'dist')

const backendStaticDir = path.resolve(
  repoRoot,
  '..',
  'backend-java',
  'src',
  'main',
  'resources',
  'static'
)

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true })

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

if (!fs.existsSync(distDir)) {
  console.error(`dist folder not found: ${distDir}`)
  process.exit(1)
}

fs.rmSync(backendStaticDir, { recursive: true, force: true })
fs.mkdirSync(backendStaticDir, { recursive: true })

copyRecursive(distDir, backendStaticDir)
console.log(`Copied ${distDir} -> ${backendStaticDir}`)

