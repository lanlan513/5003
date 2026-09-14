import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowUpRight, BookOpen, Check, ChevronRight, Clapperboard, Film, Headphones, Layers3, Menu, RotateCcw, Sparkles, Volume2, X } from 'lucide-react'
import './styles.css'

const api = async (url, options) => {
  const r = await fetch(url, options)
  const payload = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(payload.error || `Request failed: ${r.status}`)
  return payload
}

function App() {
  const [modules, setModules] = useState([])
  const [progress, setProgress] = useState({ completed: 2, streak: 3 })
  const [active, setActive] = useState(null)
  const [answer, setAnswer] = useState(null)
  const [menu, setMenu] = useState(false)
  const [view, setView] = useState('lab')
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState([])
  useEffect(() => {
    Promise.all([api('/api/modules'), api('/api/progress'), api('/api/practice')])
      .then(([moduleData, progressData, practiceData]) => { setModules(moduleData); setProgress(progressData); setHistory(practiceData) })
      .catch(console.error)
  }, [])
  const activeModule = useMemo(() => modules.find(m => m.id === active), [modules, active])
  const openModule = (id) => { setActive(id); setAnswer(null); setView('lab'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const submit = async (choice) => {
    if (answer || submitting || !activeModule) return
    setSubmitting(true)
    setAnswer(choice)
    try {
      const result = await api('/api/practice', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ moduleId: activeModule.id, answer: choice.id, score: choice.score }) })
      setProgress(result.progress)
      setHistory(items => [{ moduleId: activeModule.id, answer: choice.id, score: choice.score, createdAt: new Date().toISOString() }, ...items])
    } catch (error) {
      setAnswer(null)
      console.error(error)
    } finally { setSubmitting(false) }
  }
  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" onClick={()=>setView('lab')}><span className="brand-mark"><Clapperboard size={16}/></span><span>导演学习实验室</span><em>DIRECTOR'S LAB</em></a>
      <nav className={menu ? 'nav open' : 'nav'}><button className={view==='lab'?'active':''} onClick={()=>{setView('lab');setMenu(false)}}>今日片场</button><button className={view==='archive'?'active':''} onClick={()=>{setView('archive');setMenu(false)}}>学习档案</button><button onClick={()=>{setView('lab');setMenu(false);setTimeout(()=>document.querySelector('#about')?.scrollIntoView({behavior:'smooth'}),0)}}>关于实验室</button></nav>
      <div className="top-actions"><span className="streak"><Sparkles size={14}/> {progress.streak} 天连续</span><button className="avatar">林</button><button className="menu-btn" onClick={()=>setMenu(!menu)}>{menu?<X size={20}/>:<Menu size={20}/>}</button></div>
    </header>
    {view === 'archive' ? <Archive progress={progress} modules={modules} history={history} /> : <>
      <section className="hero" id="top">
        <div className="hero-copy"><p className="eyebrow"><span className="dot"/> WEEK 02 · 场景实验</p><h1>一场戏，<br/><i>从哪里开始？</i></h1><p className="hero-lede">导演不是把答案拍出来的人。<br/>是决定观众<strong>先感受到什么</strong>的人。</p><button className="primary" onClick={()=>openModule('shot')}>进入今日片场 <ArrowUpRight size={17}/></button></div>
        <div className="hero-scene"><div className="scene-frame"><div className="scene-light"/><div className="scene-window"><span>23:47</span></div><div className="scene-person"><div className="head"/><div className="coat"/></div><div className="scene-counter"/><div className="scene-caption"><span>SCENE 08 / INT. CONVENIENCE STORE</span><span>TAKE 03</span></div></div><p className="frame-note">今晚的练习：让空间替角色说一句话。</p></div>
      </section>
      <section className="workspace" id="modules"><div className="section-intro"><div><p className="eyebrow">从一个决定开始</p><h2>拆解导演的选择</h2></div><p>同一个场景，没有唯一解。<br/>选择你的处理方式，看看它如何改变观众的感受。</p></div>
        <div className="module-grid">{modules.map((m,i)=><ModuleCard key={m.id} module={m} index={i} onClick={()=>openModule(m.id)} />)}</div>
      </section>
      <section className="quote-band" id="about"><div className="quote-mark">“</div><blockquote>电影不是被拍摄的，<br/><em>是被选择的。</em></blockquote><div className="quote-meta"><span>— 导演学习实验室</span><small>关于观看、判断与实践</small></div></section>
      <section className="continue"><div><p className="eyebrow">你的学习轨迹</p><h2>保持好奇，继续往前。</h2><p className="muted">每一次选择都会留在你的导演档案里。</p></div><div className="progress-card"><div className="progress-top"><span>本周进度</span><b>{Math.min(progress.completed, 8)} <small>/ 8 个练习</small></b></div><div className="progress-track"><span style={{width:`${Math.min(progress.completed/8*100,100)}%`}}/></div><div className="progress-foot"><span><Check size={14}/> {progress.completed} 已完成</span><span>下一个：场面调度 <ChevronRight size={14}/></span></div></div></section>
    </>}
    {activeModule && <PracticeModal module={activeModule} answer={answer} submitting={submitting} onSubmit={submit} onClose={()=>setActive(null)} />}
    <footer><span>导演学习实验室 / 2026</span><span>一所关于观看的学校</span></footer>
  </div>
}

function ModuleCard({module,index,onClick}) { const Icon = [Film, Layers3, Volume2, RotateCcw][index] || Film; return <button className={`module-card ${module.color}`} onClick={onClick}><div className="card-index">{module.kicker}</div><div className="card-icon"><Icon size={18}/></div><h3>{module.title}</h3><p>{module.prompt}</p><div className="card-footer"><span>{module.duration}</span><span className="enter">开始练习 <ArrowUpRight size={15}/></span></div></button> }

function PracticeModal({module,answer,onSubmit,onClose,submitting}) { return <div className="modal-backdrop"><div className="modal"><button className="close" onClick={onClose}><X size={18}/></button><div className="modal-head"><p className="eyebrow">{module.kicker} · 选择你的处理</p><h2>{module.title}</h2><p>{module.prompt}</p></div><div className="choices">{module.choices.map((c,i)=><button key={c.id} disabled={Boolean(answer)||submitting} className={`choice ${answer?.id===c.id?'selected':''} ${answer&&answer.id!==c.id?'muted-choice':''}`} onClick={()=>onSubmit(c)}><span className="choice-num">{String(i+1).padStart(2,'0')}</span><span><b>{c.label}</b>{answer?.id===c.id && <small>{c.detail}</small>}</span><ChevronRight size={17}/></button>)}</div>{answer && <div className="feedback"><Check size={16}/><span>记录完成。{answer.score===3?'这是一个有意识的导演决定。':'这个选择也成立，关键是你知道它带来的感受。'}</span></div>}<div className="modal-foot"><span><BookOpen size={14}/> 约 {module.duration}</span><span>每次选择都会写入你的档案</span></div></div></div> }

function Archive({progress,modules,history}) { return <main className="archive"><div className="archive-header"><div><p className="eyebrow">你的导演档案</p><h1>观看，记录，<i>再观看。</i></h1><p className="muted">这里保存你做过的每一个决定。</p></div><div className="archive-stat"><b>{progress.completed}</b><span>已完成练习</span></div></div><div className="archive-grid"><div className="timeline"><h3>最近的练习</h3>{history.length ? history.slice(0,8).map((entry,i)=>{ const m=modules.find(item=>item.id===entry.moduleId); return <div className="timeline-row" key={`${entry.moduleId}-${entry.createdAt}-${i}`}><span className="time-dot"/><div><b>{m?.title || entry.moduleId}</b><small>{m?.kicker || '练习'} · {new Date(entry.createdAt).toLocaleDateString('zh-CN')}</small></div><Check size={16}/></div> }) : <p className="muted">还没有练习记录，先去今天片场做一个选择。</p>}</div><div className="archive-note"><Headphones size={20}/><p>导演的工作，始于<br/><strong>认真地听。</strong></p><span>声音练习将在下一阶段开放</span></div></div></main> }

createRoot(document.getElementById('root')).render(<App />)
