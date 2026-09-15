// 轴线挑战 · 题目与答案的统一数据层
// 组件只读取这里生成的题目对象（人物位置、主机位、候选机位、正误、解释），
// 不在页面模板里做任何「是否越轴」的几何判断。

export const CHALLENGE_COUNT = 5

// 俯视图（SVG）坐标系，所有位置都在生成阶段计算好
export const VIEW = { w: 560, h: 440, cx: 280, cy: 220 }

export const AXIS_COPY = {
  eyebrow: 'AXIS LAB · 轴线挑战',
  title: ['轴线的这边，', '与那边。'],
  lede: '两个人物之间有一条看不见的线。主机位一旦确定，观众心里的「左右关系」就被建立起来——之后的每一个机位，都必须留在轴线的同一侧。',
  tips: [
    { t: '先找到轴线', d: '连接两个人物（或他们视线）的直线，就是这场戏的轴线。' },
    { t: '确认主机位在哪一侧', d: '第一个全景镜头决定了观众的地图：谁在画面左、谁在右。' },
    { t: '留在 180° 半圆内', d: '后续机位越过轴线，人物就会左右互换、视线对不上。' }
  ],
  prompt: '主机位 E 已经拍完。请选出所有与它保持连贯、不会让观众「迷路」的补拍机位。小心：有些机位构图看起来很稳，其实已经到了轴线的另一边。',
  takeaway: '判断顺序：先连起两个人找到轴线 → 确认主机位 E 在哪一侧 → 只选同一半圆内的机位（骑在轴线上的中性机位除外）。'
}

// 场景与人物只提供文案风味，位置全部随机生成
const SCENES = [
  { title: 'INT. 审讯室 · 夜', a: { role: '刑警', name: '老陈', short: '陈' }, b: { role: '嫌疑人', name: '阿哲', short: '哲' } },
  { title: 'INT. 餐厅 · 打烊后', a: { role: '店主', name: '林姐', short: '林' }, b: { role: '合伙人', name: '阿远', short: '远' } },
  { title: 'EXT. 雨夜站台', a: { role: '等车的人', name: '小夏', short: '夏' }, b: { role: '送行的人', name: '周正', short: '周' } },
  { title: 'EXT. 天台 · 黄昏', a: { role: '妹妹', name: '阿妍', short: '妍' }, b: { role: '姐姐', name: '老郭', short: '郭' } },
  { title: 'INT. 便利店门口', a: { role: '夜班店员', name: '小晚', short: '晚' }, b: { role: '养父', name: '老魏', short: '魏' } },
  { title: 'INT. 出租车内', a: { role: '司机', name: '老吴', short: '吴' }, b: { role: '乘客', name: '小李', short: '李' } },
  { title: 'EXT. 江边台阶 · 清晨', a: { role: '女儿', name: '宁宁', short: '宁' }, b: { role: '母亲', name: '玉兰', short: '兰' } }
]

const TAU = Math.PI * 2
const mulberry32 = (seed) => () => {
  let t = seed += 0x6D2B79F5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const rand = (rng, min, max) => min + (max - min) * rng()
const shuffle = (rng, arr) => {
  const next = [...arr]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

const sub = (p, q) => ({ x: p.x - q.x, y: p.y - q.y })
const dot = (p, q) => p.x * q.x + p.y * q.y
const norm = (p) => {
  const l = Math.hypot(p.x, p.y) || 1
  return { x: p.x / l, y: p.y / l }
}
const r1 = (n) => Math.round(n * 10) / 10
const ptStr = (pts) => pts.map(p => `${r1(p.x)},${r1(p.y)}`).join(' ')

// 线段与视图矩形求交（Liang–Barsky），用于把轴线延长到画面边缘
function clipSegment(p0, p1) {
  const dx = p1.x - p0.x, dy = p1.y - p0.y
  let t0 = 0, t1 = 1
  const checks = [[-dx, p0.x], [dx, VIEW.w - p0.x], [-dy, p0.y], [dy, VIEW.h - p0.y]]
  for (const [p, q] of checks) {
    if (p === 0) { if (q < 0) return null; continue }
    const t = q / p
    if (p < 0) { if (t > t1) return null; if (t > t0) t0 = t }
    else { if (t < t0) return null; if (t < t1) t1 = t }
  }
  return [{ x: p0.x + t0 * dx, y: p0.y + t0 * dy }, { x: p0.x + t1 * dx, y: p0.y + t1 * dy }]
}

// 半平面裁剪：保留 dot(p - A, N) >= 0 的一侧，用于画出 180° 安全半圆
function clipHalfPlane(poly, A, N) {
  const inside = p => dot(sub(p, A), N) >= -0.001
  const inter = (S, E) => {
    const ds = dot(sub(S, A), N), de = dot(sub(E, A), N)
    const t = ds / (ds - de)
    return { x: S.x + (E.x - S.x) * t, y: S.y + (E.y - S.y) * t }
  }
  const out = []
  for (let i = 0; i < poly.length; i++) {
    const S = poly[i], E = poly[(i + 1) % poly.length]
    const sin = inside(S), ein = inside(E)
    if (sin && ein) out.push(E)
    else if (sin && !ein) out.push(inter(S, E))
    else if (!sin && ein) { out.push(inter(S, E)); out.push(E) }
  }
  return out
}

function buildChallenge(seed, scene) {
  const rng = mulberry32(seed)
  const { cx, cy } = VIEW

  // —— 随机生成两个人物的位置 ——
  const d = rand(rng, 100, 116)
  const theta = rand(rng, 0, TAU)
  const u = { x: Math.cos(theta), y: Math.sin(theta) } // A → B
  const n = { x: -u.y, y: u.x }
  const A = { x: cx - d / 2 * u.x, y: cy - d / 2 * u.y, role: scene.a.role, name: scene.a.name, short: scene.a.short }
  const B = { x: cx + d / 2 * u.x, y: cy + d / 2 * u.y, role: scene.b.role, name: scene.b.name, short: scene.b.short }

  // —— 随机决定主机位所在的一侧（摄影机区域）——
  const side = rng() < 0.5 ? 1 : -1
  const N = { x: side * n.x, y: side * n.y }
  const R = rand(rng, 144, 156)
  const at = (gammaDeg, r = R) => {
    const g = gammaDeg * Math.PI / 180
    return { x: cx + r * (Math.cos(g) * u.x + Math.sin(g) * N.x), y: cy + r * (Math.cos(g) * u.y + Math.sin(g) * N.y) }
  }
  const face = P => norm({ x: cx - P.x, y: cy - P.y })
  const angleOf = f => Math.atan2(f.y, f.x) * 180 / Math.PI

  // 从机位 P 看，谁在画面左；骑轴时两人重合在视线方向，返回 null（中性机位）
  const frameOf = (P) => {
    const f = face(P)
    const rv = { x: f.y, y: -f.x }
    const da = (A.x - P.x) * rv.x + (A.y - P.y) * rv.y
    const db = (B.x - P.x) * rv.x + (B.y - P.y) * rv.y
    if (Math.abs(da - db) < 1e-6) return null
    return da < db ? { left: 'a', right: 'b' } : { left: 'b', right: 'a' }
  }
  const coneOf = (P, f) => {
    const perp = { x: -f.y, y: f.x }
    const L = 208, w = 58
    return [
      P,
      { x: r1(P.x + f.x * L + perp.x * w), y: r1(P.y + f.y * L + perp.y * w) },
      { x: r1(P.x + f.x * L - perp.x * w), y: r1(P.y + f.y * L - perp.y * w) }
    ]
  }

  // 主机位 E：gamma 以 u 为 0°、朝 N 方向增大，(0°,180°) 即安全半圆
  const ePos = at(rand(rng, 64, 96))
  const eFrame = frameOf(ePos)
  const eF = face(ePos)
  const establish = {
    id: 'E', x: r1(ePos.x), y: r1(ePos.y), angle: r1(angleOf(eF)),
    cone: coneOf(ePos, eF).map(p => ({ x: r1(p.x), y: r1(p.y) })),
    frame: eFrame,
    frameNote: `在主机位 E 的画面里，${scene[eFrame.left].name}在左、${scene[eFrame.right].name}在右。`
  }

  // —— 候选机位：正确机位 + 「构图合理但已越轴」的镜像干扰项 ——
  const specs = [
    { key: 'master', gamma: rand(rng, 62, 84), r: R + rand(rng, -6, 6), shot: '全景 · 双人', view: '两位人物侧面同框', valid: true },
    { key: 'otsB', gamma: rand(rng, 19, 29), r: R + rand(rng, -4, 8), shot: '过肩镜头', view: `从 ${B.name} 身后看向 ${A.name}`, valid: true },
    { key: 'otsA', gamma: rand(rng, 151, 161), r: R + rand(rng, -4, 8), shot: '过肩镜头', view: `从 ${A.name} 身后看向 ${B.name}`, valid: true },
    { key: 'otsBx', gamma: rand(rng, 331, 341), r: R + rand(rng, -4, 8), shot: '过肩镜头', view: `从 ${B.name} 身后看向 ${A.name}`, valid: false },
    { key: 'masterx', gamma: rand(rng, 276, 298), r: R + rand(rng, -6, 6), shot: '中景 · 双人', view: '两人居中同框，构图均衡', valid: false },
    { key: 'neutral', gamma: 180, r: R + 4, shot: '过肩 · 骑轴', view: `紧贴 ${A.name} 身后，正对 ${B.name}`, valid: true, neutral: true },
    { key: 'otsAx', gamma: rand(rng, 199, 209), r: R + rand(rng, -4, 8), shot: '过肩镜头', view: `从 ${A.name} 身后看向 ${B.name}`, valid: false }
  ]

  const reasonFor = (spec, frame) => {
    if (spec.neutral) {
      return `机位骑在轴线上：${B.name}正对镜头，画面里没有左右关系，所以它本身不会让方向翻转，可以与 E 相接。这就是「中性机位」——也常被借用来安全地换到轴线另一侧，但换边之后必须重新建立轴线。`
    }
    const L = scene[frame.left].name, Rr = scene[frame.right].name
    if (spec.valid) {
      return spec.shot.includes('过肩')
        ? `机位贴着人物肩膀，但仍在 E 所在的半圆内。过肩之后 ${L}在左、${Rr}在右，视线方向与 E 一致，观众脑子里的地图仍然成立。`
        : `和 E 同处轴线的一侧：${L}在左、${Rr}在右，视线方向与全景完全一致，可以直接相接。`
    }
    return spec.shot.includes('过肩')
      ? `和正确的过肩机位几乎对称，构图看起来一模一样，但它已经越过轴线：${L}与${Rr}左右互换，肩膀出现在画面另一侧，视线也接不上——紧接 E 会让观众瞬间「迷路」。`
      : `双人构图看起来很稳，但机位在轴线另一侧：${L}在左、${Rr}在右，与 E 正好相反。紧接 E 的全景，两人就像悄悄换了座位。`
  }

  const cameras = shuffle(rng, specs).map((spec, i) => {
    const P = at(spec.gamma, spec.r)
    const f = face(P)
    const frame = frameOf(P)
    return {
      id: `cam-${spec.key}`,
      num: i + 1,
      x: r1(P.x), y: r1(P.y),
      angle: r1(angleOf(f)),
      cone: coneOf(P, f),
      shot: spec.shot,
      view: spec.view,
      valid: spec.valid,
      neutral: Boolean(spec.neutral),
      frame: spec.neutral ? { neutral: true, front: 'b', foreground: 'a' } : frame,
      reason: reasonFor(spec, frame)
    }
  })

  // —— 复盘用的几何信息：视线、整条轴线、安全半圆 ——
  const gaze = [{ x: r1(A.x + 17 * u.x), y: r1(A.y + 17 * u.y) }, { x: r1(B.x - 17 * u.x), y: r1(B.y - 17 * u.y) }]
  const axis = clipSegment({ x: A.x - 900 * u.x, y: A.y - 900 * u.y }, { x: A.x + 900 * u.x, y: A.y + 900 * u.y })
    .map(p => ({ x: r1(p.x), y: r1(p.y) }))
  const safeSide = clipHalfPlane(
    [{ x: 0, y: 0 }, { x: VIEW.w, y: 0 }, { x: VIEW.w, y: VIEW.h }, { x: 0, y: VIEW.h }],
    A, N
  ).map(p => ({ x: r1(p.x), y: r1(p.y) }))
  const sideLabel = { x: r1(cx + 92 * N.x), y: r1(cy + 70 * N.y) }

  return {
    id: `axis-${seed}`,
    scene: { title: scene.title },
    actors: { a: A, b: B },
    establish,
    cameras,
    answerIds: cameras.filter(c => c.valid).map(c => c.id),
    geometry: { gaze, axis, safeSide, sideLabel }
  }
}

// 一场游戏：场景不重复，每场独立随机种子
export function generateChallengeSet(count = CHALLENGE_COUNT) {
  const seed = (Math.random() * 0xffffffff) >>> 0
  const rng = mulberry32(seed)
  return shuffle(rng, SCENES).slice(0, count).map((scene, i) => buildChallenge((seed + i * 7919) >>> 0, scene))
}
