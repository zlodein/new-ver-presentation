import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

/** Публичный адрес сайта (юридический текст и ссылки в документе) */
const SITE = 'https://e-presentation.ru'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mdPath = path.join(__dirname, '../uploads/user_agreement-1.md')
let t = fs.readFileSync(mdPath, 'utf8')

const start = t.indexOf('**ПОЛЬЗОВАТЕЛЬСКОЕ')
const upd = t.indexOf('Дата последнего обновления')
if (start === -1 || upd === -1) {
  console.error('Markers not found', { start, upd })
  process.exit(1)
}
t = t.slice(start, upd)

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inlineBold(s) {
  return s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

/** Убирает типичные экранирования из исходного .md (1\. → 1., privacy\_policy → privacy_policy) */
function stripMdEscapes(s) {
  return s.replace(/\\([._])/g, '$1')
}

const lines = t.split(/\r?\n/)
const out = []
let inUl = false

for (const line of lines) {
  const L = stripMdEscapes(line.trim())
  if (!L) {
    if (inUl) {
      out.push('</ul>')
      inUl = false
    }
    continue
  }
  if (L.startsWith('**') && L.endsWith('**') && L.length > 4) {
    if (inUl) {
      out.push('</ul>')
      inUl = false
    }
    out.push(`<p><strong>${esc(L.slice(2, -2))}</strong></p>`)
    continue
  }
  if (L.startsWith('- ') || L.startsWith('\\- ')) {
    if (!inUl) {
      out.push('<ul>')
      inUl = true
    }
    const txt = L.replace(/^\\?- /, '')
    out.push(`<li>${inlineBold(esc(txt))}</li>`)
    continue
  }
  if (inUl) {
    out.push('</ul>')
    inUl = false
  }
  out.push(`<p>${inlineBold(esc(L))}</p>`)
}
if (inUl) out.push('</ul>')

let html = out.join('\n')

/** На случай экранирований внутри уже собранного HTML */
html = stripMdEscapes(html)

/** На случай, если в исходнике снова попадёт старый домен */
html = html
  .replace(/https:\/\/slide\.estate\/user(?:\\_)?agreement/g, `${SITE}/terms`)
  .replace(/https:\/\/slide\.estate\/privacy(?:\\_)?policy/g, `${SITE}/privacy`)
  .replace(/https:\/\/slide\.estate\/tariff/g, `${SITE}/tariffs`)
  .replace(/https:\/\/slide\.estate/g, SITE)
  .replace(/refund@slide\.estate/g, 'info@e-presentation.ru')
  .replace(/inbox@slide\.estate/g, 'info@e-presentation.ru')

html = html.replace(
  /^<p><strong>ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ<\/strong><\/p>\s*/m,
  '',
)

const dest = path.join(__dirname, '../src/views/Legal/userAgreementBody.html')
fs.writeFileSync(dest, `<div class="ua-doc">\n${html}\n</div>`, 'utf8')
console.log('Wrote', dest, 'bytes', Buffer.byteLength(html), 'site', SITE)
