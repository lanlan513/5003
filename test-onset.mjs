// 穷举状态机路径（纯函数引擎，无需起服务）：
// 验证每个节点可达、守卫拦截、崩溃闸门与结局画像符合预期
import { onsetGraph, advanceOnset, continueOnset, initialOnsetState } from './src/onsetMachine.js'

const actor = ['wait-reset', 'talk-reset', 'no-face']
const actorBranch = ['keep-noface', 'restore-face']
const noise = ['pay-quiet', 'embrace-noise', 'post-dub']
const weather = ['water-truck', 'after-rain', 'wet-zone']
const prop = ['find-replace', 'wear-damage', 'swap-ticket']
const time = ['overtime', 'cut-opening', 'merge-take']

// 在状态机里走一条指定路径；遇守卫拦截返回 blocked
const runPath2 = (choices) => {
  let run = { currentNode: onsetGraph.start, state: initialOnsetState(), path: [] }
  const trace = []
  let result = null
  run = { currentNode: continueOnset(run).currentNode, state: run.state, path: run.path }
  for (const choiceId of choices) {
    let advanced
    try { advanced = advanceOnset(run, choiceId) }
    catch (e) { return { blocked: e.message, at: choiceId, trace } }
    run = { currentNode: advanced.currentNode, state: advanced.state, path: advanced.path }
    result = advanced.result
    trace.push({ choiceId, state: advanced.state, node: advanced.currentNode })
  }
  return { ...run, result, trace }
}

const outcomes = {}
let total = 0, finished = 0, blockedRuns = 0
const nodesVisited = new Set()
const bad = []

for (const a of actor) {
  for (const ab of (a === 'no-face' ? actorBranch : [null])) {
    for (const n of noise) for (const w of weather) for (const p of prop) for (const t of time) {
      total++
      const path = [a, ...(ab ? [ab] : []), n, w, p, t]
      const r = runPath2(path)
      if (r.blocked) { blockedRuns++; continue }
      r.trace.forEach(s => nodesVisited.add(s.node))
      if (!r.result) { bad.push({ path, current: r.currentNode }); continue }
      finished++
      const key = `${r.result.kind}/${r.result.profileTitle}`
      outcomes[key] = (outcomes[key] || 0) + 1
    }
  }
}

console.log(`总路径 ${total} | 走完 ${finished} | 中途被守卫拦截 ${blockedRuns} | 未到终局 ${bad.length}`)
console.log('可达节点:', [...nodesVisited].sort().join(', '))
console.log('\n结局分布:')
for (const [k, v] of Object.entries(outcomes).sort()) console.log(`  ${k}: ${v}`)
if (bad.length) { console.log('\n异常路径:', JSON.stringify(bad.slice(0, 5), null, 1)); process.exit(1) }

// 结构完整性：所有 next 指向存在的节点；守卫引用的常量与效果字段合法
const ids = new Set(Object.keys(onsetGraph.nodes))
for (const [id, node] of Object.entries(onsetGraph.nodes)) {
  if (node.next && !ids.has(node.next)) throw new Error(`节点 ${id} 的 next 不存在: ${node.next}`)
  for (const c of node.choices || []) {
    if (!ids.has(c.next)) throw new Error(`选择 ${id}/${c.id} 的 next 不存在: ${c.next}`)
    if (!['protect', 'adapt'].includes(c.stance)) throw new Error(`选择 ${c.id} 缺少合法 stance`)
    for (const key of Object.keys(c.effects || {})) {
      if (!['time', 'morale', 'intent', 'craft', 'flags'].includes(key)) throw new Error(`选择 ${c.id} 有未知效果字段 ${key}`)
    }
  }
}
console.log('\n图结构校验通过：所有转移目标存在，stance/effects 合法')

// 代表性路径
const repr = [
  ['一路硬守 + 加钱续时（最极限坚持）', ['wait-reset', 'pay-quiet', 'water-truck', 'find-replace', 'overtime']],
  ['一路硬守，最后放弃开场', ['wait-reset', 'pay-quiet', 'water-truck', 'find-replace', 'cut-opening']],
  ['全适应·现场作者', ['no-face', 'keep-noface', 'embrace-noise', 'after-rain', 'wear-damage', 'merge-take']],
  ['全适应·廉价版', ['no-face', 'keep-noface', 'post-dub', 'wet-zone', 'swap-ticket', 'merge-take']],
  ['均衡路径', ['talk-reset', 'embrace-noise', 'after-rain', 'wear-damage', 'cut-opening']],
  ['先浪费后应变，被守卫拦腰', ['wait-reset', 'pay-quiet', 'water-truck', 'find-replace', 'overtime']]
]
for (const [name, path] of repr) {
  const r = runPath2(path)
  if (r.blocked) { console.log(`\n【${name}】被拦截（于 ${r.at}）: ${r.blocked}`); continue }
  console.log(`\n【${name}】`)
  r.trace.forEach((s, i) => console.log(`  ${i + 1}. ${path[i].padEnd(13)} 时间${String(s.state.time).padStart(3)} 士气${String(s.state.morale).padStart(3)} 意图${s.state.intent} 创造${s.state.craft}`))
  console.log(`  结局: ${r.result.kind} · ${r.result.profileTitle} | 守/改 = ${r.result.tallies.protect}/${r.result.tallies.adapt}`)
}

// 列出崩盘路径与被守卫拦截的具体组合
const collapses = []
const blocks = []
for (const a of actor) for (const ab of (a === 'no-face' ? actorBranch : [null])) {
  for (const n of noise) for (const w of weather) for (const p of prop) for (const t of time) {
    const path = [a, ...(ab ? [ab] : []), n, w, p, t]
    const r = runPath2(path)
    if (r.blocked) blocks.push([path.join(' → '), r.at, r.blocked])
    else if (r.result?.kind === 'collapse') collapses.push(path.join(' → '))
  }
}
console.log('\n崩盘路径:'); collapses.forEach(c => console.log('  ', c))
console.log('\n守卫拦截:'); blocks.forEach(([p, at]) => console.log('  拦于', at, ':', p))
