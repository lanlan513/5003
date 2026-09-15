import { useMemo, useState } from 'react'
import { Check, ChevronRight, Eye, Info, RotateCcw, Target, Trophy, X } from 'lucide-react'
import { AXIS_COPY, CHALLENGE_COUNT, VIEW, generateChallengeSet } from './axisData'

const BEST_KEY = 'directors-lab-axis-best-v1'
const loadBest = () => {
  try { return Number(localStorage.getItem(BEST_KEY)) || 0 } catch { return 0 }
}

// 单个人物在画面里的极简速写：头 + 肩，look 指向画面内侧（对方）
function Figure({ x, ground, short, look }) {
  return (
    <g>
      <circle cx={x} cy={ground - 15} r="5.4" fill="#e8e2d6" />
      <path d={`M ${x - 1.8 + look * 3.4} ${ground - 15.6} l ${look * 3} 0.8 l ${-look * 3} 0.8 Z`} fill="#22262a" />
      <path d={`M ${x - 6} ${ground - 6} L ${x + 6} ${ground - 6} L ${x + 4.6} ${ground} L ${x - 4.6} ${ground} Z`} fill="#e8e2d6" opacity=".92" />
      <text x={x} y={ground + 8} textAnchor="middle" fontSize="6.5" fill="rgba(232,226,214,.75)" fontFamily="DM Mono">{short}</text>
    </g>
  )
}

// 机位拍到的画面：复盘时把「谁在画面左、谁在右」画出来，和主机位 E 对照
function FrameMini({ camera, actors }) {
  const f = camera.frame
  return (
    <svg className="axis-frame" viewBox="0 0 100 56" aria-hidden="true">
      <rect width="100" height="56" fill="#22262a" />
      <line x1="0" y1="44" x2="100" y2="44" stroke="rgba(240,237,231,.16)" strokeWidth="1" />
      {f?.neutral ? (
        <>
          <circle cx="50" cy="20" r="6" fill="#e8e2d6" />
          <circle cx="47.6" cy="19.4" r=".9" fill="#22262a" />
          <circle cx="52.4" cy="19.4" r=".9" fill="#22262a" />
          <path d="M 43 28 L 57 28 L 55 44 L 45 44 Z" fill="#e8e2d6" opacity=".92" />
          <text x="50" y="52" textAnchor="middle" fontSize="6" fill="rgba(232,226,214,.75)" fontFamily="DM Mono">{actors.b.short} 正对镜头</text>
          <path d="M 0 56 L 6 34 Q 26 38 34 56 Z" fill="#0e1012" />
          <text x="12" y="49" fontSize="6" fill="rgba(232,226,214,.55)" fontFamily="DM Mono">{actors.a.short}肩</text>
        </>
      ) : (
        <>
          <Figure x={26} ground={44} short={actors[f?.left ?? 'a'].short} look={1} />
          <Figure x={74} ground={44} short={actors[f?.right ?? 'b'].short} look={-1} />
        </>
      )}
    </svg>
  )
}

// 俯视图：人物、主机位区域、候选机位；复盘后揭示轴线与 180° 安全半圆
function AxisMap({ challenge, phase, selected, onToggle }) {
  const { actors, establish, cameras, geometry } = challenge
  const tri = (c, size) => {
    const a = (c.angle || 0) * Math.PI / 180
    const f = { x: Math.cos(a), y: Math.sin(a) }
    const p = { x: -f.y, y: f.x }
    return [
      [c.x + f.x * size, c.y + f.y * size],
      [c.x - f.x * size * 0.72 + p.x * size * 0.78, c.y - f.y * size * 0.72 + p.y * size * 0.78],
      [c.x - f.x * size * 0.72 - p.x * size * 0.78, c.y - f.y * size * 0.72 - p.y * size * 0.78]
    ].map(pt => pt.map(n => Math.round(n * 10) / 10).join(',')).join(' ')
  }
  const camState = (c) => {
    if (phase === 'answer') return selected.includes(c.id) ? 'selected' : 'idle'
    if (c.neutral) return selected.includes(c.id) ? 'neutral-pick' : 'neutral'
    if (c.valid) return selected.includes(c.id) ? 'good-pick' : 'good-miss'
    return selected.includes(c.id) ? 'bad-pick' : 'bad-avoid'
  }
  const eA = establish.angle * Math.PI / 180
  const eF = { x: Math.cos(eA), y: Math.sin(eA) }
  const eP = { x: -eF.y, y: eF.x }
  const eBx = establish.x - eF.x * 9, eBy = establish.y - eF.y * 9
  return (
    <svg className="axis-stage" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label="人物与机位俯视图">
      <defs>
        <marker id="gaze-arrow" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 Z" fill="rgba(232,226,214,.85)" />
        </marker>
      </defs>

      {phase === 'review' && <polygon points={geometry.safeSide.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(115,150,120,.18)" />}

      {/* 主机位 E 的摄影机区域 */}
      <polygon points={establish.cone.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(217,178,106,.12)" stroke="rgba(217,178,106,.45)" strokeWidth="1" strokeDasharray="4 4" />

      {/* 轴线：答题时只是两人之间的隐线，复盘后延伸到画面边缘 */}
      {phase === 'review' && <line x1={geometry.axis[0].x} y1={geometry.axis[0].y} x2={geometry.axis[1].x} y2={geometry.axis[1].y} stroke="#d0775e" strokeWidth="1.4" strokeDasharray="7 5" />}
      <line x1={actors.a.x} y1={actors.a.y} x2={actors.b.x} y2={actors.b.y} stroke={phase === 'review' ? '#d0775e' : 'rgba(232,226,214,.3)'} strokeWidth={phase === 'review' ? 1.4 : 1} strokeDasharray={phase === 'review' ? '7 5' : '2 4'} />

      {/* 视线（对视方向） */}
      <line x1={geometry.gaze[0].x} y1={geometry.gaze[0].y} x2={geometry.gaze[1].x} y2={geometry.gaze[1].y} stroke="rgba(232,226,214,.85)" strokeWidth="1.2" markerStart="url(#gaze-arrow)" markerEnd="url(#gaze-arrow)" />

      {phase === 'review' && (
        <>
          <g transform={`translate(${geometry.sideLabel.x},${geometry.sideLabel.y})`}>
            <rect x="-66" y="-11" width="132" height="34" rx="2" fill="rgba(20,22,23,.72)" />
            <text x="0" y="2" textAnchor="middle" fontSize="9" fill="#9fc3a6" fontFamily="DM Mono">E 所在一侧</text>
            <text x="0" y="15" textAnchor="middle" fontSize="8" fill="rgba(159,195,166,.75)" fontFamily="DM Mono">180° 安全半圆</text>
          </g>
          <g transform={`translate(${2 * VIEW.cx - geometry.sideLabel.x},${2 * VIEW.cy - geometry.sideLabel.y})`}>
            <rect x="-58" y="-11" width="116" height="20" rx="2" fill="rgba(20,22,23,.72)" />
            <text x="0" y="3" textAnchor="middle" fontSize="8.5" fill="#d0775e" fontFamily="DM Mono">越轴区 · 方向翻转</text>
          </g>
        </>
      )}

      {/* 两个人物 */}
      {[actors.a, actors.b].map(p => (
        <g key={p.name}>
          <circle cx={p.x} cy={p.y} r="14" fill="#e8e2d6" />
          <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#22262a">{p.short}</text>
          <text x={p.x} y={p.y + 27} textAnchor="middle" fontSize="8" fill="rgba(232,226,214,.6)" fontFamily="DM Mono">{p.name} · {p.role}</text>
        </g>
      ))}

      {/* 主机位 E */}
      <g>
        <polygon points={`${establish.x + eF.x * 13},${establish.y + eF.y * 13} ${eBx + eP.x * 8},${eBy + eP.y * 8} ${eBx - eP.x * 8},${eBy - eP.y * 8}`} fill="#d9b26a" />
        <rect x={eBx - 4.5} y={eBy - 4.5} width="9" height="9" transform={`rotate(${establish.angle} ${eBx} ${eBy})`} fill="#d9b26a" />
        <text x={establish.x} y={establish.y + 26} textAnchor="middle" fontSize="8.5" fill="#d9b26a" fontFamily="DM Mono">已拍 · 主机位 E</text>
      </g>

      {/* 候选机位 */}
      {cameras.map(c => (
        <g key={c.id} className={`cam-marker cam-${camState(c)}`} onClick={() => phase === 'answer' && onToggle(c.id)} style={{ cursor: phase === 'answer' ? 'pointer' : 'default' }}>
          <circle cx={c.x} cy={c.y} r="17" fill="transparent" />
          <polygon points={tri(c, 9.5)} strokeWidth="1.6" />
          <text x={c.x} y={c.y + 3} textAnchor="middle" fontSize="8.5" fontWeight="600" fontFamily="DM Mono">{c.num}</text>
          <text x={c.x} y={c.y + 24} textAnchor="middle" fontSize="7.5" fontFamily="DM Mono">{c.shot}</text>
        </g>
      ))}
    </svg>
  )
}

const roundScore = (selected, challenge) => {
  const validPicked = challenge.answerIds.filter(id => selected.includes(id)).length
  const wrongPicked = selected.filter(id => !challenge.answerIds.includes(id)).length
  return Math.max(0, 25 * validPicked - 20 * wrongPicked)
}

export default function AxisChallenge() {
  const [set, setSet] = useState(() => generateChallengeSet())
  const [round, setRound] = useState(0)
  const [selected, setSelected] = useState([])
  const [phase, setPhase] = useState('answer')
  const [results, setResults] = useState([])
  const [best, setBest] = useState(loadBest)

  const challenge = set[round]
  const total = useMemo(() => results.reduce((s, r) => s + r.score, 0), [results])

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const submit = () => {
    const validPicked = challenge.answerIds.filter(id => selected.includes(id)).length
    const wrongPicked = selected.filter(id => !challenge.answerIds.includes(id)).length
    const exact = validPicked === challenge.answerIds.length && wrongPicked === 0
    const score = roundScore(selected, challenge)
    const next = [...results, { score, exact, validPicked, wrongPicked }]
    setResults(next)
    setPhase('review')
    if (round === set.length - 1) {
      const finalTotal = next.reduce((s, r) => s + r.score, 0)
      if (finalTotal > best) { setBest(finalTotal); try { localStorage.setItem(BEST_KEY, String(finalTotal)) } catch { /* 存储不可用时静默失败 */ } }
    }
  }
  const nextRound = () => {
    if (round === set.length - 1) { setPhase('done'); return }
    setRound(r => r + 1); setSelected([]); setPhase('answer')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const restart = () => {
    setSet(generateChallengeSet()); setRound(0); setSelected([]); setResults([]); setPhase('answer')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const last = results[round]

  return (
    <main className="axis-lab">
      <header className="sb-hero axis-hero">
        <p className="eyebrow"><span className="dot" /> {AXIS_COPY.eyebrow}</p>
        <h1>{AXIS_COPY.title[0]}<br /><i>{AXIS_COPY.title[1]}</i></h1>
        <p className="sb-lede">{AXIS_COPY.lede}</p>
      </header>

      <section className="axis-rules">
        {AXIS_COPY.tips.map((tip, i) => (
          <div className="axis-rule" key={tip.t}>
            <span className="axis-rule-num">{String(i + 1).padStart(2, '0')}</span>
            <div><b>{tip.t}</b><p>{tip.d}</p></div>
          </div>
        ))}
      </section>

      {phase !== 'done' ? (
        <section className="axis-game">
          <div className="axis-bar">
            <div>
              <p className="eyebrow">场景 {String(round + 1).padStart(2, '0')} / {String(set.length).padStart(2, '0')} · {challenge.scene.title}</p>
              <p className="axis-prompt">{AXIS_COPY.prompt}</p>
            </div>
            <div className="axis-bar-side">
              <span className="axis-best"><Trophy size={12} /> 最佳 {best}</span>
              <span className="axis-score">本轮累计 {total}</span>
            </div>
          </div>

          <div className="axis-map-wrap">
            <AxisMap challenge={challenge} phase={phase} selected={selected} onToggle={toggle} />
            <p className="axis-map-hint">{phase === 'answer'
              ? <>金色区域是主机位 E 已经拍到的范围；点击数字机位进行选择（多选）。{challenge.establish.frameNote}</>
              : <>虚线是把视线延长后得到的<strong>轴线</strong>；绿色一侧是 E 为观众建立的 <strong>180° 安全半圆</strong>，箭头是两个人物的对视方向。</>}</p>
          </div>

          <div className={`axis-cards ${phase === 'review' ? 'review' : ''}`}>
            {challenge.cameras.map(c => {
              const picked = selected.includes(c.id)
              const badge = phase === 'review'
                ? c.neutral
                  ? <span className={`axis-badge ${picked ? 'b-neutral' : 'b-neutral-off'}`}><Info size={11} /> {picked ? '中性机位 · 选对' : '中性机位 · 漏选'}</span>
                  : c.valid
                    ? <span className={`axis-badge ${picked ? 'b-good' : 'b-miss'}`}>{picked ? <><Check size={11} /> 选对</> : <><Eye size={11} /> 漏选</>}</span>
                    : <span className={`axis-badge ${picked ? 'b-bad' : 'b-avoid'}`}>{picked ? <><X size={11} /> 越轴误选</> : <><Check size={11} /> 已避开</>}</span>
                : null
              return (
                <button
                  key={c.id}
                  className={`axis-card ${phase === 'answer' ? (picked ? 'picked' : '') : `is-${c.valid ? (c.neutral ? 'neutral' : 'valid') : 'invalid'}`} ${phase === 'review' && picked ? 'was-picked' : ''}`}
                  onClick={() => phase === 'answer' && toggle(c.id)}
                  disabled={phase !== 'answer'}
                >
                  <div className="axis-card-top">
                    <span className="axis-cam-num">{String(c.num).padStart(2, '0')}</span>
                    {badge}
                  </div>
                  {phase === 'review' && <FrameMini camera={c} actors={challenge.actors} />}
                  <b>{c.shot}</b>
                  <p>{c.view}</p>
                  {phase === 'review' && (
                    <div className="axis-reason">
                      {!c.neutral && <span className={c.valid ? 'match-yes' : 'match-no'}>{c.valid ? '画面左右与 E 一致' : '画面左右与 E 相反'}</span>}
                      <p>{c.reason}</p>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {phase === 'answer' ? (
            <div className="axis-submit">
              <span>已选 <b>{selected.length}</b> 个机位（正确答案可能不止一个，骑轴的中性机位也算成立）</span>
              <button className="primary" onClick={submit} disabled={!selected.length}><Target size={15} /> 提交判断</button>
            </div>
          ) : (
            <div className={`axis-verdict ${last?.exact ? 'ok' : 'warn'}`}>
              <div>
                <p className="eyebrow">{last?.exact ? '空间关系保持住了' : '观众的地图被打乱了'}</p>
                <p className="axis-verdict-line">
                  {last?.exact
                    ? `全部 ${challenge.answerIds.length} 个合法机位都找到了。${AXIS_COPY.takeaway}`
                    : `选对 ${last?.validPicked} 个、误选越轴机位 ${last?.wrongPicked} 个。对照俯视图再看一遍：绿色半圆内的机位与 E 同侧，红色一侧的机位会把两人的左右关系翻转。`}
                </p>
              </div>
              <button className="primary" onClick={nextRound}>{round === set.length - 1 ? '查看成绩' : '下一场'} <ChevronRight size={15} /></button>
            </div>
          )}
        </section>
      ) : (
        <section className="axis-done">
          <p className="eyebrow"><span className="dot" /> {CHALLENGE_COUNT} 场结束</p>
          <h2>{total >= 420 ? '你守住了轴线。' : total >= 260 ? '大部分时候，观众没有迷路。' : '轴线还需要多看几遍。'}</h2>
          <div className="axis-final-score"><b>{total}</b><span> / {CHALLENGE_COUNT * 100} 分 · 历史最佳 {Math.max(best, total)}</span></div>
          <div className="axis-rounds">
            {results.map((r, i) => (
              <div key={i} className="axis-round-row">
                <span>场景 {String(i + 1).padStart(2, '0')}</span>
                <span className={r.exact ? 'match-yes' : 'match-no'}>{r.exact ? '全部判断正确' : `选对 ${r.validPicked} · 误选 ${r.wrongPicked}`}</span>
                <b>{r.score}</b>
              </div>
            ))}
          </div>
          <button className="primary" onClick={restart}><RotateCcw size={15} /> 重新随机生成一组</button>
        </section>
      )}
    </main>
  )
}
