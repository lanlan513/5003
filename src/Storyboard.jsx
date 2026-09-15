import React, { useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Film, GripVertical, Plus, RotateCcw, Timer, Trash, WandSparkles } from 'lucide-react'

const STORAGE_KEY = 'directors-lab-storyboard-v1'
const SIZES = ['远景', '全景', '中景', '近景', '特写']
const CAMERAS = ['平视 · 固定', '缓慢推近', '跟拍 · 手持', '俯拍', '仰拍', '过肩', '主观视角']
const SIZE_OPACITY = { '远景': 0.3, '全景': 0.45, '中景': 0.6, '近景': 0.8, '特写': 1 }

const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `shot-${Date.now()}-${Math.random().toString(16).slice(2)}`)
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

const PRESETS = [
  {
    id: 'door', type: 'action', text: '她推开门，停在原地。',
    shots: [
      { frame: '走廊尽头，门被推开一道缝，光从门缝切进来', action: '她的手停在门把上，没有立刻进去', size: '远景', camera: '平视 · 固定', duration: 3 },
      { frame: '门完全打开，她出现在门口，逆光成一个剪影', action: '迈步进屋，忽然停住', size: '全景', camera: '平视 · 固定', duration: 2.5 },
      { frame: '她的侧脸，目光落向画面外的某处', action: '呼吸停顿了半拍', size: '特写', camera: '缓慢推近', duration: 2 },
      { frame: '从她背后看去：空房间，桌上的茶还冒着热气', action: '她站着，一动不动', size: '中景', camera: '过肩', duration: 3 }
    ]
  },
  {
    id: 'stairs', type: 'action', text: '他转身，跑下楼梯。',
    shots: [
      { frame: '楼梯间全景，他推开安全门冲进来', action: '进门前先回头看了一眼楼上', size: '全景', camera: '平视 · 固定', duration: 2.5 },
      { frame: '他三步并作两步，手在栏杆上擦过', action: '急促地下楼，呼吸很乱', size: '中景', camera: '跟拍 · 手持', duration: 2 },
      { frame: '台阶上凌乱的脚步，鞋带散了', action: '脚步没有停', size: '特写', camera: '俯拍', duration: 1 },
      { frame: '楼底出口，他跑进雨里，身影迅速变小', action: '跑出画面，没有回头', size: '远景', camera: '平视 · 固定', duration: 3 }
    ]
  },
  {
    id: 'table', type: 'action', text: '两个人隔着桌子坐下。',
    shots: [
      { frame: '打烊后的餐厅，一张桌子，两把对着的椅子', action: '两个人先后走进画面', size: '远景', camera: '平视 · 固定', duration: 3 },
      { frame: '两人面对面坐下，桌面正好在画面正中', action: '同时坐下，谁也不先开口', size: '中景', camera: '平视 · 固定', duration: 3 },
      { frame: '他把手放上桌面，停了一下，又收回桌下', action: '手指在桌下敲了两下膝盖', size: '近景', camera: '平视 · 固定', duration: 2 },
      { frame: '两人之间的桌面：一杯水，从头到尾没人碰过', action: '没有人伸手', size: '特写', camera: '俯拍', duration: 2 }
    ]
  },
  {
    id: 'arrive', type: 'dialogue', text: '「你来了。」她说。',
    shots: [
      { frame: '她背对着门，听见开门声，没有回头', action: '继续擦手里的杯子', size: '中景', camera: '平视 · 固定', duration: 2.5 },
      { frame: '从她的肩后看去，门口的人站在光里', action: '对方停在门口，没有进来', size: '全景', camera: '过肩', duration: 2 },
      { frame: '她的脸，说「你来了」时几乎没有表情', action: '说完，才慢慢转过身', size: '特写', camera: '缓慢推近', duration: 2.5 }
    ]
  },
  {
    id: 'ending', type: 'dialogue', text: '「我们结束吧。」',
    shots: [
      { frame: '天台，两个人隔着几步远，城市的声音很远', action: '沉默持续了几秒钟', size: '远景', camera: '平视 · 固定', duration: 3 },
      { frame: '说话的人看着别处，不敢看对方', action: '低声说出「我们结束吧」', size: '近景', camera: '平视 · 固定', duration: 2.5 },
      { frame: '听的人扶着栏杆的手，一根一根松开', action: '没有说话', size: '特写', camera: '俯拍', duration: 2 },
      { frame: '两个人影，一个先离开，一个留在原地', action: '离开的人没有回头', size: '远景', camera: '平视 · 固定', duration: 3.5 }
    ]
  },
  {
    id: 'platform', type: 'dialogue', text: '「别回头，一直走。」',
    shots: [
      { frame: '深夜的站台，两个人，广播声从很远的地方来', action: '一个人把车票塞进对方手里', size: '中景', camera: '平视 · 固定', duration: 2.5 },
      { frame: '被塞票的人的眼睛，忍住了没有眨', action: '对方轻声说「别回头，一直走」', size: '特写', camera: '缓慢推近', duration: 2 },
      { frame: '列车进站，一个人上车，一个人留在站台', action: '上车的人始终没有回头', size: '远景', camera: '平视 · 固定', duration: 4 }
    ]
  }
]

// 自由输入的兜底拆解：对白按「关系 → 过肩 → 落点」，动作按「空间 → 主体 → 细节」
const buildShots = (text) => {
  const preset = PRESETS.find(p => p.text === text)
  const source = preset ? preset.shots
    : /[「」"“”：]|说|问|道/.test(text)
      ? [
          { frame: '先交代对话发生的空间，两个人物同框', action: text, size: '中景', camera: '平视 · 固定', duration: 3 },
          { frame: '从听话人的肩后，看说话的人', action: '台词在这里说出口', size: '近景', camera: '过肩', duration: 2.5 },
          { frame: '说话人的脸，台词落下的地方', action: '说完之后的半秒沉默', size: '特写', camera: '缓慢推近', duration: 2 }
        ]
      : [
          { frame: '先把空间交代清楚，人物在画面深处', action: text, size: '远景', camera: '平视 · 固定', duration: 3 },
          { frame: '镜头靠近，动作成为画面的主体', action: text, size: '中景', camera: '跟拍 · 手持', duration: 2.5 },
          { frame: '一个细节：手、眼神，或被碰过的物件', action: '动作留下的余韵', size: '特写', camera: '缓慢推近', duration: 1.5 }
        ]
  return source.map(s => ({ ...s, id: uid() }))
}

const cleanShot = (s) => {
  if (!s || typeof s.frame !== 'string' || typeof s.action !== 'string' || !SIZES.includes(s.size) || !CAMERAS.includes(s.camera) || !Number.isFinite(s.duration)) return null
  return { id: typeof s.id === 'string' ? s.id : uid(), frame: s.frame, action: s.action, size: s.size, camera: s.camera, duration: Math.min(15, Math.max(0.5, s.duration)) }
}

const load = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (parsed && Array.isArray(parsed.shots)) {
      return { input: typeof parsed.input === 'string' ? parsed.input : '', shots: parsed.shots.map(cleanShot).filter(Boolean) }
    }
  } catch { /* 忽略损坏的本地数据 */ }
  return { input: '', shots: [] }
}

// 取景框速写：人形大小随景别变化，地平线随机位变化
function FrameSketch({ size, camera }) {
  const horizon = camera.includes('俯') ? 26 : camera.includes('仰') ? 72 : 52
  const figure = { '远景': [15, null], '全景': [32, null], '中景': [62, 104], '近景': [105, 140], '特写': [185, 215] }[size] || [32, null]
  const ground = figure[1] ?? horizon
  const h = figure[1] == null ? Math.min(figure[0], horizon - 8) : figure[0]
  const headR = h * 0.13
  const headCy = ground - h + headR
  const shoulderY = ground - h * 0.72
  const wide = size === '远景' || size === '全景' || size === '中景'
  return (
    <svg className="frame-sketch" viewBox="0 0 160 90" aria-hidden="true">
      <rect width="160" height="90" fill="#22262a" />
      {wide && <rect y={horizon} width="160" height={90 - horizon} fill="#1a1d20" />}
      {wide && <line x1="0" y1={horizon} x2="160" y2={horizon} stroke="rgba(240,237,231,.18)" strokeWidth="1" />}
      {size === '远景' && <rect x="18" y={horizon - 26} width="20" height="26" fill="none" stroke="rgba(240,237,231,.22)" strokeWidth="1" />}
      <circle cx="80" cy={headCy} r={headR} fill="#e8e2d6" opacity=".9" />
      <path d={`M ${80 - h * 0.17} ${shoulderY} L ${80 + h * 0.17} ${shoulderY} L ${80 + h * 0.13} ${ground} L ${80 - h * 0.13} ${ground} Z`} fill="#e8e2d6" opacity=".9" />
      {camera.includes('过肩') && <path d="M 0 90 L 0 42 Q 34 48 46 90 Z" fill="#0e1012" />}
      {camera.includes('主观') && <rect width="160" height="90" fill="none" stroke="rgba(0,0,0,.55)" strokeWidth="14" />}
    </svg>
  )
}

export default function Storyboard() {
  const [persisted] = useState(load)
  const [input, setInput] = useState(persisted.input)
  const [draft, setDraft] = useState(persisted.input)
  const [shots, setShots] = useState(persisted.shots)
  const [draggingId, setDraggingId] = useState(null)
  const [dropBeforeId, setDropBeforeId] = useState(null)
  const [flashId, setFlashId] = useState(null)
  const dragId = useRef(null)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ input, shots })) } catch { /* 存储不可用时静默失败 */ }
  }, [input, shots])

  const generate = (text) => {
    const value = text.trim()
    if (!value) return
    setInput(value)
    setShots(buildShots(value))
    setTimeout(() => document.querySelector('.sb-board')?.scrollIntoView({ behavior: 'smooth' }), 60)
  }
  const updateShot = (id, patch) => setShots(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)))
  const removeShot = (id) => setShots(prev => prev.filter(s => s.id !== id))
  const addShot = () => setShots(prev => [...prev, { id: uid(), frame: '', action: '', size: '中景', camera: '平视 · 固定', duration: 2 }])
  const reset = () => { setShots([]); setInput(''); setDraft(''); try { localStorage.removeItem(STORAGE_KEY) } catch {} }
  const move = (id, dir) => setShots(prev => {
    const i = prev.findIndex(s => s.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= prev.length) return prev
    const next = [...prev]
    const [moved] = next.splice(i, 1)
    next.splice(j, 0, moved)
    return next
  })

  const clearDrag = () => { dragId.current = null; setDraggingId(null); setDropBeforeId(null) }
  const onDragStart = (e, id) => {
    dragId.current = id
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    try {
      const card = e.currentTarget.closest('.shot-card')
      if (card) e.dataTransfer.setDragImage(card, 24, 24)
    } catch { /* 某些浏览器不支持自定义拖拽图像 */ }
  }
  const onCardDragOver = (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (dragId.current && dragId.current !== id) setDropBeforeId(id)
  }
  const insertBefore = (fromId, toId) => setShots(prev => {
    if (!fromId || fromId === toId) return prev
    const from = prev.findIndex(s => s.id === fromId)
    const to = prev.findIndex(s => s.id === toId)
    if (from < 0 || to < 0) return prev
    const next = [...prev]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    return next
  })
  const onCardDrop = (e, id) => { e.preventDefault(); e.stopPropagation(); insertBefore(dragId.current, id); clearDrag() }
  const onGridDragOver = (e) => { e.preventDefault(); setDropBeforeId(null) }
  const onGridDrop = (e) => {
    e.preventDefault()
    const fromId = dragId.current
    if (fromId) setShots(prev => {
      const from = prev.findIndex(s => s.id === fromId)
      if (from < 0 || from === prev.length - 1) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.push(moved)
      return next
    })
    clearDrag()
  }

  const jumpTo = (id) => {
    document.getElementById(`card-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setFlashId(id)
    setTimeout(() => setFlashId(null), 1200)
  }

  const total = shots.reduce((sum, s) => sum + s.duration, 0)
  const avg = shots.length ? total / shots.length : 0
  const pace = !shots.length ? '' : avg <= 2 ? '紧凑' : avg <= 3.2 ? '均衡' : '舒缓'

  return (
    <main className="storyboard">
      <header className="sb-hero">
        <p className="eyebrow"><span className="dot" /> STORYBOARD LAB · 分镜卡片生成器</p>
        <h1>把一句话，<br /><i>拆成一场戏。</i></h1>
        <p className="sb-lede">分镜是在拍摄之前，把抽象的文字翻译成具体画面的过程。<br />输入一个动作或一句对白，生成镜头卡，再用你自己的顺序讲这个故事。</p>
      </header>

      <section className="sb-input-grid">
        <div className="sb-panel">
          <p className="eyebrow">第一步 · 写一句话</p>
          <span className="preset-label">一个动作</span>
          <div className="chips">
            {PRESETS.filter(p => p.type === 'action').map(p => (
              <button key={p.id} className="chip" onClick={() => { setDraft(p.text); generate(p.text) }}>{p.text}</button>
            ))}
          </div>
          <span className="preset-label">一句对白</span>
          <div className="chips">
            {PRESETS.filter(p => p.type === 'dialogue').map(p => (
              <button key={p.id} className="chip" onClick={() => { setDraft(p.text); generate(p.text) }}>{p.text}</button>
            ))}
          </div>
          <textarea
            className="sb-textarea"
            placeholder="或者写下你自己的一句话：一个动作，或一句对白……"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate(draft) }}
          />
          <button className="primary sb-generate" onClick={() => generate(draft)} disabled={!draft.trim()}>
            生成镜头卡 <WandSparkles size={15} />
          </button>
        </div>
        <div className="sb-steps-panel">
          <p className="eyebrow">生成器会做什么</p>
          <ol className="sb-steps">
            <li><b>读你的一句话</b><span>一个动作，或一句对白——就像剧本里的一行。</span></li>
            <li><b>拆成具体镜头</b><span>画面内容、人物动作、景别、机位、时长，一项一项定下来。</span></li>
            <li><b>交给你排序</b><span>拖动卡片改变顺序，在时间轴上看整场戏的节奏。</span></li>
          </ol>
          <p className="sb-note">分镜，就是在拍摄之前，<br />把抽象的文字<i>翻译</i>成具体的画面。</p>
        </div>
      </section>

      {shots.length === 0 ? (
        <section className="sb-empty">
          <Film size={22} />
          <p>你的分镜板还是空的。</p>
          <span>从上面选一句话，或写下你自己的——生成器会把它拆成一组镜头卡。</span>
        </section>
      ) : (
        <>
          <section className="sb-board">
            <div className="sb-board-head">
              <div>
                <p className="eyebrow">分镜板 · 共 {shots.length} 个镜头</p>
                <p className="sb-source">“{input}”</p>
              </div>
              <div className="sb-board-actions">
                <span className="save-note"><Check size={12} /> 已自动保存 · 刷新不丢失</span>
                <button className="ghost-btn" onClick={reset}><RotateCcw size={13} /> 清空重来</button>
              </div>
            </div>
            <div className="shot-grid" onDragOver={onGridDragOver} onDrop={onGridDrop}>
              {shots.map((shot, i) => (
                <article
                  key={shot.id}
                  id={`card-${shot.id}`}
                  className={`shot-card${draggingId === shot.id ? ' dragging' : ''}${dropBeforeId === shot.id ? ' drop-before' : ''}${flashId === shot.id ? ' flash' : ''}`}
                  onDragOver={e => onCardDragOver(e, shot.id)}
                  onDrop={e => onCardDrop(e, shot.id)}
                >
                  <div className="shot-top">
                    <span className="shot-num">SHOT {String(i + 1).padStart(2, '0')}</span>
                    <span className="shot-top-actions">
                      <button className="icon-btn drag-handle" draggable onDragStart={e => onDragStart(e, shot.id)} onDragEnd={clearDrag} title="拖动排序" aria-label="拖动排序"><GripVertical size={15} /></button>
                      <button className="icon-btn" onClick={() => removeShot(shot.id)} title="删除镜头" aria-label="删除镜头"><Trash size={14} /></button>
                    </span>
                  </div>
                  <FrameSketch size={shot.size} camera={shot.camera} />
                  <label className="shot-field">
                    <span>画面内容</span>
                    <textarea rows={2} value={shot.frame} placeholder="这个镜头里，观众看到什么？" onChange={e => updateShot(shot.id, { frame: e.target.value })} />
                  </label>
                  <label className="shot-field">
                    <span>人物动作</span>
                    <textarea rows={1} value={shot.action} placeholder="人物在做什么？" onChange={e => updateShot(shot.id, { action: e.target.value })} />
                  </label>
                  <div className="shot-meta">
                    <label className="shot-field">
                      <span>景别</span>
                      <select value={shot.size} onChange={e => updateShot(shot.id, { size: e.target.value })}>{SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    </label>
                    <label className="shot-field">
                      <span>机位</span>
                      <select value={shot.camera} onChange={e => updateShot(shot.id, { camera: e.target.value })}>{CAMERAS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    </label>
                  </div>
                  <div className="shot-foot">
                    <div className="stepper">
                      <button onClick={() => updateShot(shot.id, { duration: Math.max(0.5, shot.duration - 0.5) })} disabled={shot.duration <= 0.5} aria-label="减少时长">−</button>
                      <span><Timer size={11} /> {fmt(shot.duration)}s</span>
                      <button onClick={() => updateShot(shot.id, { duration: Math.min(15, shot.duration + 0.5) })} disabled={shot.duration >= 15} aria-label="增加时长">＋</button>
                    </div>
                    <div className="move-btns">
                      <button onClick={() => move(shot.id, -1)} disabled={i === 0} aria-label="前移"><ChevronLeft size={14} /></button>
                      <button onClick={() => move(shot.id, 1)} disabled={i === shots.length - 1} aria-label="后移"><ChevronRight size={14} /></button>
                    </div>
                  </div>
                </article>
              ))}
              <button className="add-card" onClick={addShot}><Plus size={16} /> 加一张空白镜头卡</button>
            </div>
          </section>

          <section className="sb-timeline">
            <div className="tl-head">
              <p className="eyebrow">时间轴 · 整场戏的节奏</p>
              <div className="tl-stats">
                <span>总时长 <b>{fmt(total)}s</b></span>
                <span>{shots.length} 个镜头</span>
                <span>平均 <b>{fmt(avg)}s</b> / 镜头</span>
                <span>节奏 <b>{pace}</b></span>
              </div>
            </div>
            <div className="tl-track">
              {shots.map((s, i) => (
                <button
                  key={s.id}
                  className="tl-block"
                  style={{ flexGrow: s.duration, background: `rgba(208,119,94,${SIZE_OPACITY[s.size] || 0.5})` }}
                  onClick={() => jumpTo(s.id)}
                  title={`SHOT ${String(i + 1).padStart(2, '0')} · ${s.size} · ${s.camera} · ${s.frame || '（未填写画面）'}`}
                >
                  <b>{String(i + 1).padStart(2, '0')}</b>
                  <span>{fmt(s.duration)}s</span>
                </button>
              ))}
            </div>
            <div className="tl-foot">
              <div className="tl-legend">
                {SIZES.map(s => <span key={s}><i style={{ background: `rgba(208,119,94,${SIZE_OPACITY[s]})` }} />{s}</span>)}
              </div>
              <p className="tl-tip">颜色越深，景别越近。同样的镜头，顺序不同，故事就不同——试着把特写拖到第一个。</p>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
