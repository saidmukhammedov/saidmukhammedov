const fs = require('fs')

const USER = 'saidmukhammedov'
const SINCE = '2025-10-18'
const WIDTH = 54

const info = [
  ['OS', 'Windows, macOS'],
  ['Uptime', null],
  ['Host', 'TUIT, Software Engineering'],
  ['Kernel', 'Full Stack Developer'],
  ['IDE', 'VS Code'],
  [],
  ['Languages.Programming', 'JavaScript, HTML, CSS'],
  ['Languages.Real', 'Uzbek, English, Russian'],
  [],
  ['Stack.Frontend', 'React, Tailwind'],
  ['Stack.Backend', 'Node.js, Express, NestJS'],
  ['Stack.Database', 'MongoDB, Mongoose'],
  [],
  ['Projects', 'chairly.uz, unitrack.uz'],
  ['Projects.More', 'unsent.uz, giftory.uz'],
  [],
  ['- Contact'],
  ['Email', 'akbaraliabduganievich@gmail.com'],
  ['LinkedIn', USER],
  ['GitHub', USER],
  [],
  ['- GitHub Stats'],
]

const themes = {
  dark: { bg: '#161b22', text: '#c9d1d9', key: '#ffa657', value: '#a5d6ff', dots: '#616e7f', num: '#3fb950' },
  light: { bg: '#f6f8fa', text: '#24292f', key: '#953800', value: '#0a3069', dots: '#c2cfde', num: '#1a7f37' },
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function uptime() {
  const s = new Date(SINCE), n = new Date()
  let y = n.getFullYear() - s.getFullYear(), m = n.getMonth() - s.getMonth(), d = n.getDate() - s.getDate()
  if (d < 0) { m--; d += new Date(n.getFullYear(), n.getMonth(), 0).getDate() }
  if (m < 0) { y--; m += 12 }
  const p = (v, w) => `${v} ${w}${v === 1 ? '' : 's'}`
  return [y && p(y, 'year'), p(m, 'month'), p(d, 'day')].filter(Boolean).join(', ')
}

async function gql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors))
  return json.data
}

async function stats() {
  if (!process.env.GITHUB_TOKEN) return { repos: 0, contributed: 0, stars: 0, followers: 0, commits: 0 }
  const { user } = await gql(`query($login:String!){user(login:$login){
    followers{totalCount}
    repositoriesContributedTo(contributionTypes:[COMMIT,PULL_REQUEST,REPOSITORY]){totalCount}
    repositories(first:100,ownerAffiliations:OWNER,privacy:PUBLIC){totalCount nodes{stargazerCount}}
    contributionsCollection{contributionYears}
  }}`, { login: USER })
  let commits = 0
  for (const year of user.contributionsCollection.contributionYears) {
    const { user: u } = await gql(`query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){
      contributionsCollection(from:$from,to:$to){totalCommitContributions restrictedContributionsCount}
    }}`, { login: USER, from: `${year}-01-01T00:00:00Z`, to: `${year}-12-31T23:59:59Z` })
    commits += u.contributionsCollection.totalCommitContributions + u.contributionsCollection.restrictedContributionsCount
  }
  return {
    repos: user.repositories.totalCount,
    contributed: user.repositoriesContributedTo.totalCount,
    stars: user.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0),
    followers: user.followers.totalCount,
    commits,
  }
}

function line(parts) {
  return parts.map(([cls, t]) => `<tspan class="${cls}">${esc(t)}</tspan>`).join('')
}

function row(key, value, width = WIDTH) {
  const dots = width - key.length - String(value).length - 5
  return [['text', '. '], ['key', key], ['text', ':'], ['dots', ` ${'.'.repeat(Math.max(dots, 1))} `], ['value', value]]
}

function pair(k1, v1, k2, v2) {
  const half = 30
  const left = row(k1, v1, half).map(p => p[0] === 'value' ? ['num', p[1]] : p)
  const right = row(k2, v2, WIDTH - half - 1).slice(1).map(p => p[0] === 'value' ? ['num', p[1]] : p)
  return [...left, ['text', ' | '], ...right]
}

function header(title) {
  return [['text', `${title} `], ['text', '-'.repeat(WIDTH - title.length - 1)]]
}

function render(theme, ascii, s) {
  const c = themes[theme]
  const lines = [[['key', 'akbarali'], ['text', '@'], ['key', USER], ['text', ` ${'-'.repeat(WIDTH - USER.length - 10)}`]]]
  for (const [k, v] of info) {
    if (!k) lines.push([])
    else if (k.startsWith('-')) lines.push(header(k))
    else lines.push(row(k, v ?? uptime()))
  }
  lines.push(pair('Repos', `${s.repos} {Contributed: ${s.contributed}}`, 'Stars', s.stars))
  lines.push(pair('Commits', s.commits, 'Followers', s.followers))

  const art = ascii.split('\n')
  const lh = 20
  const h = Math.max(art.length, lines.length) * lh + 40
  const artText = art.map((l, i) => `<tspan x="15" y="${30 + i * lh}">${esc(l)}</tspan>`).join('\n')
  const infoText = lines.map((p, i) => `<tspan x="420" y="${30 + i * lh}">${line(p)}</tspan>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" font-family="ConsolasFallback,Consolas,monospace" width="985" height="${h}" font-size="16px">
<style>
@font-face{src:local('Consolas'),local('Consolas Bold');font-family:'ConsolasFallback';font-display:swap;-webkit-size-adjust:109%;size-adjust:109%}
.key{fill:${c.key}}.value{fill:${c.value}}.dots{fill:${c.dots}}.num{fill:${c.num}}.text{fill:${c.text}}
text,tspan{white-space:pre}
</style>
<rect width="985" height="${h}" fill="${c.bg}" rx="15"/>
<text class="text" fill="${c.text}">
${artText}
</text>
<text fill="${c.text}">
${infoText}
</text>
</svg>
`
}

;(async () => {
  const ascii = fs.readFileSync('ascii.txt', 'utf8').replace(/\n+$/, '')
  const s = await stats()
  for (const t of Object.keys(themes)) fs.writeFileSync(`${t}_mode.svg`, render(t, ascii, s))
})()
