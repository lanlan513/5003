import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowUpRight, ArrowLeft, BookOpen, Check, ChevronRight, Clapperboard, Clock3, Compass, Eye, FileText, Film, FolderOpen, Headphones, Layers3, Lightbulb, Menu, Pencil, PenLine, RotateCcw, Save, Sparkles, Users, Volume2, X, Zap } from 'lucide-react'
import './styles.css'

const api = async (url, options) => {
  const r = await fetch(url, options)
  const payload = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(payload.error || `Request failed: ${r.status}`)
  return payload
}

const fmtDate = (iso) => new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })

function App() {
  const [modules, setModules] = useState([])
  const [progress, setProgress] = useState({ completed: 2, streak: 3 })
  const [active, setActive] = useState(null)
  const [answer, setAnswer] = useState(null)
  const [menu, setMenu] = useState(false)
  const [view, setView] = useState('lab')
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState([])
  // { projectId?: number, nonce: number } —— 从档案里点开某个创作时携带 projectId
  const [benchRequest, setBenchRequest] = useState(null)
  useEffect(() => {
    Promise.all([api('/api/modules'), api('/api/progress'), api('/api/practice')])
      .then(([moduleData, progressData, practiceData]) => { setModules(moduleData); setProgress(progressData); setHistory(practiceData) })
      .catch(console.error)
  }, [])
  const activeModule = useMemo(() => modules.find(m => m.id === active), [modules, active])
  const openModule = (id) => { setActive(id); setAnswer(null); setView('lab'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const enterWorkbench = (projectId = null) => { setBenchRequest({ projectId, nonce: Date.now() }); setView('workbench'); setMenu(false); window.scrollTo({ top: 0 }) }
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
      <nav className={menu ? 'nav open' : 'nav'}><button className={view==='lab'?'active':''} onClick={()=>{setView('lab');setMenu(false)}}>今日片场</button><button className={view==='workbench'?'active':''} onClick={()=>enterWorkbench()}>导演工作台</button><button className={view==='archive'?'active':''} onClick={()=>{setView('archive');setMenu(false)}}>学习档案</button><button onClick={()=>{setView('lab');setMenu(false);setTimeout(()=>document.querySelector('#about')?.scrollIntoView({behavior:'smooth'}),0)}}>关于实验室</button></nav>
      <div className="top-actions"><span className="streak"><Sparkles size={14}/> {progress.streak} 天连续</span><button className="avatar">林</button><button className="menu-btn" onClick={()=>setMenu(!menu)}>{menu?<X size={20}/>:<Menu size={20}/>}</button></div>
    </header>
    {view === 'archive' ? <Archive progress={progress} modules={modules} history={history} onOpenWorkbench={enterWorkbench} />
     : view === 'workbench' ? <Workbench request={benchRequest} onBack={()=>setView('lab')} />
     : <>
      <section className="hero" id="top">
        <div className="hero-copy"><p className="eyebrow"><span className="dot"/> WEEK 02 · 场景实验</p><h1>一场戏，<br/><i>从哪里开始？</i></h1><p className="hero-lede">导演不是把答案拍出来的人。<br/>是决定观众<strong>先感受到什么</strong>的人。</p><button className="primary" onClick={()=>openModule('shot')}>进入今日片场 <ArrowUpRight size={17}/></button></div>
        <div className="hero-scene"><div className="scene-frame"><div className="scene-light"/><div className="scene-window"><span>23:47</span></div><div className="scene-person"><div className="head"/><div className="coat"/></div><div className="scene-counter"/><div className="scene-caption"><span>SCENE 08 / INT. CONVENIENCE STORE</span><span>TAKE 03</span></div></div><p className="frame-note">今晚的练习：让空间替角色说一句话。</p></div>
      </section>
      <section className="workspace" id="modules"><div className="section-intro"><div><p className="eyebrow">从一个决定开始</p><h2>拆解导演的选择</h2></div><p>同一个场景，没有唯一解。<br/>选择你的处理方式，看看它如何改变观众的感受。</p></div>
        <div className="module-grid">{modules.map((m,i)=><ModuleCard key={m.id} module={m} index={i} onClick={()=>openModule(m.id)} />)}</div>
      </section>
      <WorkbenchIntro onStart={()=>enterWorkbench()} />
      <section className="quote-band" id="about"><div className="quote-mark">“</div><blockquote>电影不是被拍摄的，<br/><em>是被选择的。</em></blockquote><div className="quote-meta"><span>— 导演学习实验室</span><small>关于观看、判断与实践</small></div></section>
      <section className="continue"><div><p className="eyebrow">你的学习轨迹</p><h2>保持好奇，继续往前。</h2><p className="muted">每一次选择都会留在你的导演档案里。</p></div><div className="progress-card"><div className="progress-top"><span>本周进度</span><b>{Math.min(progress.completed, 8)} <small>/ 8 个练习</small></b></div><div className="progress-track"><span style={{width:`${Math.min(progress.completed/8*100,100)}%`}}/></div><div className="progress-foot"><span><Check size={14}/> {progress.completed} 已完成</span><span>下一个：场面调度 <ChevronRight size={14}/></span></div></div></section>
    </>}
    {activeModule && <PracticeModal module={activeModule} answer={answer} submitting={submitting} onSubmit={submit} onClose={()=>setActive(null)} />}
    <footer><span>导演学习实验室 / 2026</span><span>一所关于观看的学校</span></footer>
  </div>
}

function ModuleCard({module,index,onClick}) { const Icon = [Film, Layers3, Volume2, RotateCcw][index] || Film; return <button className={`module-card ${module.color}`} onClick={onClick}><div className="card-index">{module.kicker}</div><div className="card-icon"><Icon size={18}/></div><h3>{module.title}</h3><p>{module.prompt}</p><div className="card-footer"><span>{module.duration}</span><span className="enter">开始练习 <ArrowUpRight size={15}/></span></div></button> }

function PracticeModal({module,answer,onSubmit,onClose,submitting}) { return <div className="modal-backdrop"><div className="modal"><button className="close" onClick={onClose}><X size={18}/></button><div className="modal-head"><p className="eyebrow">{module.kicker} · 选择你的处理</p><h2>{module.title}</h2><p>{module.prompt}</p></div><div className="choices">{module.choices.map((c,i)=><button key={c.id} disabled={Boolean(answer)||submitting} className={`choice ${answer?.id===c.id?'selected':''} ${answer&&answer.id!==c.id?'muted-choice':''}`} onClick={()=>onSubmit(c)}><span className="choice-num">{String(i+1).padStart(2,'0')}</span><span><b>{c.label}</b>{answer?.id===c.id && <small>{c.detail}</small>}</span><ChevronRight size={17}/></button>)}</div>{answer && <div className="feedback"><Check size={16}/><span>记录完成。{answer.score===3?'这是一个有意识的导演决定。':'这个选择也成立，关键是你知道它带来的感受。'}</span></div>}<div className="modal-foot"><span><BookOpen size={14}/> 约 {module.duration}</span><span>每次选择都会写入你的档案</span></div></div></div> }

/* ---------------- 从主题到场景 · 导演工作台 ---------------- */

const THEME_SEEDS = ['一次没有说出口的告别', '大城市里的孤独', '两代人之间的沉默', '撒谎之后的十分钟', '久别重逢', '被拆开的家', '一次失败的表演', '不敢兑现的承诺']
const STEP_ICONS = [Lightbulb, Users, Zap, Eye]

function WorkbenchIntro({onStart}) {
  return <section className="wb-intro">
    <div className="wb-intro-copy">
      <p className="eyebrow"><span className="dot"/> 导演工作台 · 从主题到场景</p>
      <h2>先别急着开机。<br/><i>主题、人物、冲突，先于镜头。</i></h2>
      <p className="muted">输入一个简单主题，工作台会陪你一步步走到一张具体的场景卡。<br/>每一步只有引导问题和少量参考案例——答案必须是你自己的。</p>
      <button className="ghost" onClick={onStart}><Compass size={15}/> 从一个主题开始</button>
    </div>
    <ol className="wb-chain" aria-label="创作流程">
      <li><span>01</span><i><Lightbulb size={15}/></i><div><b>核心表达</b><small>你对主题真正的看法</small></div><ChevronRight size={14}/></li>
      <li><span>02</span><i><Users size={15}/></i><div><b>人物关系</b><small>谁来承担这个表达</small></div><ChevronRight size={14}/></li>
      <li><span>03</span><i><Zap size={15}/></i><div><b>冲突时刻</b><small>非发生不可的那一刻</small></div><ChevronRight size={14}/></li>
      <li><span>04</span><i><Eye size={15}/></i><div><b>场景目标</b><small>观众将经历什么</small></div></li>
    </ol>
  </section>
}

function Workbench({request, onBack}) {
  const [steps, setSteps] = useState([])
  const [projects, setProjects] = useState([])
  const [project, setProject] = useState(null)
  const [mode, setMode] = useState('home')          // home | wizard | brief
  const [stepIndex, setStepIndex] = useState(0)
  const [drafts, setDrafts] = useState({})
  const [themeInput, setThemeInput] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingTheme, setEditingTheme] = useState(false)
  const [themeDraft, setThemeDraft] = useState('')
  const [showRefs, setShowRefs] = useState(false)

  useEffect(() => { api('/api/workbench/steps').then(setSteps).catch(console.error) }, [])
  const refreshList = () => api('/api/workbench/projects').then(setProjects).catch(console.error)
  useEffect(() => { refreshList() }, [])

  const savedMap = useMemo(() => Object.fromEntries((project?.steps || []).map(s => [s.stepId, s.content])), [project])
  const currentStep = steps[stepIndex]

  // 外部请求（导航/档案）进入某个项目
  useEffect(() => {
    if (!request) return
    if (request.projectId) openProject(request.projectId)
    else { setMode('home'); setProject(null) }
    window.scrollTo({ top: 0 })
  }, [request])

  // 切换步骤时重置草稿、折叠参考案例
  useEffect(() => {
    if (mode !== 'wizard' || !currentStep) return
    const saved = savedMap[currentStep.id]
    setDrafts(saved || Object.fromEntries(currentStep.fields.map(f => [f.id, ''])))
    setShowRefs(false)
    setError('')
  }, [mode, stepIndex, project?.id])

  const createProject = async () => {
    const theme = themeInput.trim()
    if (theme.length < 2) { setError('先写下一个再简单不过的主题，哪怕只有两个字。'); return }
    setBusy(true); setError('')
    try {
      const created = await api('/api/workbench/projects', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ theme }) })
      setProject(created)
      setStepIndex(0)
      setMode('wizard')
      await refreshList()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const openProject = async (id) => {
    try {
      let stepDefs = steps
      if (!stepDefs.length) stepDefs = await api('/api/workbench/steps').then(data => { setSteps(data); return data })
      const data = await api(`/api/workbench/projects/${id}`)
      setProject(data)
      setMode(data.status === 'completed' ? 'brief' : 'wizard')
      const next = data.steps.length ? Math.max(...data.steps.map(s => stepDefs.findIndex(x => x.id === s.stepId))) + 1 : 0
      setStepIndex(Math.min(next, stepDefs.length - 1))
    } catch (e) { setError(e.message) }
  }

  const goStep = (i) => { setStepIndex(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const saveStep = async (advance) => {
    if (!currentStep || !project) return
    setBusy(true); setError('')
    try {
      const updated = await api(`/api/workbench/projects/${project.id}/steps/${currentStep.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content: drafts }) })
      setProject(updated)
      if (advance) {
        if (stepIndex < steps.length - 1) goStep(stepIndex + 1)
        else await finishProject(updated)
      }
      await refreshList()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const finishProject = async (latest) => {
    const data = latest || project
    setBusy(true); setError('')
    try {
      const completed = await api(`/api/workbench/projects/${data.id}/complete`, { method:'POST' })
      setProject(completed); setMode('brief')
      await refreshList()
      window.scrollTo({ top: 0 })
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const saveTheme = async () => {
    const theme = themeDraft.trim()
    if (theme.length < 2) { setError('主题至少需要两个字。'); return }
    setBusy(true); setError('')
    try {
      const updated = await api(`/api/workbench/projects/${project.id}/theme`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ theme }) })
      setProject(updated); setEditingTheme(false)
      await refreshList()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const backHome = () => { setMode('home'); setProject(null); setEditingTheme(false); window.scrollTo({ top: 0 }) }

  if (!steps.length) return <main className="wb"><p className="muted">正在铺工作台……</p></main>

  return <main className="wb">
    {mode === 'home' && <>
      <div className="wb-head">
        <button className="wb-back" onClick={onBack}><ArrowLeft size={14}/> 返回今日片场</button>
        <p className="eyebrow"><span className="dot"/> 从主题到场景</p>
        <h1>导演工作台</h1>
        <p className="wb-lede">学习一部作品，不必从拍摄开始。<br/>从一个模糊主题出发，逐步逼近<i>核心表达、人物关系、冲突</i>与<i>观看体验</i>——<br/>最后你会得到一张属于自己的场景卡，并能回看自己走过的每一步。</p>
      </div>

      <div className="wb-start">
        <div>
          <p className="wb-step-kicker"><span>00</span> 从一个简单的主题开始</p>
          <h2>此刻，你想拍点什么？</h2>
          <p className="muted">不用准确，不用完整。一个词、一个画面、一种说不清楚的感觉，都可以。</p>
          <div className="wb-input-row">
            <input value={themeInput} maxLength={60} placeholder="例如：告别、异乡人、一顿没吃完的饭……" onChange={e=>{setThemeInput(e.target.value);setError('')}} onKeyDown={e=>e.key==='Enter'&&createProject()} />
            <button className="primary" disabled={busy} onClick={createProject}><PenLine size={15}/> 开始创作</button>
          </div>
          <div className="wb-seeds">{THEME_SEEDS.map(seed => <button key={seed} className="seed" onClick={()=>setThemeInput(seed)}>{seed}</button>)}</div>
          {error && <p className="wb-error" role="alert">{error}</p>}
        </div>
        <aside className="wb-rules">
          <h3><Lightbulb size={15}/> 工作台的三条规则</h3>
          <p><b>每一步只回答一个问题</b>，不追求一步到位。</p>
          <p><b>参考案例只负责启发</b>，不会替你写下任何答案。</p>
          <p><b>整个过程都会被保存</b>，完成后可以回看想法如何生长。</p>
        </aside>
      </div>

      <div className="wb-projects">
        <div className="wb-projects-head"><h2>进行中的创作</h2><span className="muted"><Clock3 size={12}/> 随时回来，从上次停下的那一步继续</span></div>
        {projects.length ? projects.map(p => <button key={p.id} className={`wb-project-row ${p.status}`} onClick={()=>openProject(p.id)}>
          <span className="wb-row-index">No.{String(p.id).padStart(2,'0')}</span>
          <span className="wb-row-main"><b>{p.theme}</b><small>{p.status==='completed' ? `已于 ${fmtDate(p.completedAt)} 形成场景卡` : `已完成 ${p.savedSteps.length}/4 步 · 最近编辑 ${fmtDate(p.updatedAt)}`}{p.status!=='completed' && p.savedSteps.length>0 && steps[p.savedSteps.length] ? <> · 下一步：{steps[p.savedSteps.length].title}</> : null}</small></span>
          <span className={`wb-row-badge ${p.status}`}>{p.status==='completed' ? <><Check size={12}/> 场景卡</> : <><FileText size={12}/> {p.savedSteps.length}/4</>}</span>
          <ChevronRight size={16}/>
        </button>) : <div className="wb-empty"><FolderOpen size={20}/><p>还没有创作。从上面输入一个主题，开始第一次从主题走向场景的旅程。</p></div>}
      </div>
    </>}

    {mode === 'wizard' && project && currentStep && <Wizard
      project={project} steps={steps} stepIndex={stepIndex} savedMap={savedMap} drafts={drafts}
      setDrafts={setDrafts} error={error} busy={busy} showRefs={showRefs}
      editingTheme={editingTheme} themeDraft={themeDraft}
      onToggleRefs={()=>setShowRefs(v=>!v)} onGoStep={goStep} onSave={()=>saveStep(false)}
      onAdvance={()=>saveStep(true)} onEditTheme={()=>{setThemeDraft(project.theme);setEditingTheme(true)}}
      onCancelTheme={()=>setEditingTheme(false)} onThemeDraft={setThemeDraft} onSaveTheme={saveTheme}
      onHome={backHome} isLast={stepIndex===steps.length-1}
    />}

    {mode === 'brief' && project && <Brief project={project} steps={steps} onReopenStep={i=>{setMode('wizard');goStep(i)}} onHome={backHome} />}
  </main>
}

function Wizard({project,steps,stepIndex,savedMap,drafts,setDrafts,error,busy,showRefs,editingTheme,themeDraft,onToggleRefs,onGoStep,onSave,onAdvance,onEditTheme,onCancelTheme,onThemeDraft,onSaveTheme,onHome,isLast}) {
  const step = steps[stepIndex]
  const Icon = STEP_ICONS[stepIndex] || Lightbulb
  return <>
    <div className="wz-head">
      <button className="wb-back" onClick={onHome}><ArrowLeft size={14}/> 全部创作</button>
      <div className="wz-theme-line">
        <span className="wz-theme-label">创作主题</span>
        <h1>{project.theme}</h1>
        <button className="wz-theme-edit" onClick={onEditTheme}><Pencil size={12}/> 修改主题</button>
      </div>
      {editingTheme && <div className="wz-theme-editbar">
        <input value={themeDraft} maxLength={60} onChange={e=>onThemeDraft(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onSaveTheme()} />
        <button className="primary small" disabled={busy} onClick={onSaveTheme}>保存</button>
        <button className="link-btn" onClick={onCancelTheme}>取消</button>
      </div>}
      <ol className="wz-rail">
        {steps.map((s,i)=>{
          const StepIcon = STEP_ICONS[i]
          const saved = Boolean(savedMap[s.id])
          return <li key={s.id}>
            <button className={i===stepIndex?'current':''} onClick={()=>onGoStep(i)}>
              <span className={`wz-rail-dot ${saved?'saved':''}`}>{saved ? <Check size={12}/> : <StepIcon size={13}/>}</span>
              <span className="wz-rail-text"><small>{s.kicker}</small><b>{s.title}</b></span>
            </button>
            {i < steps.length-1 && <span className="wz-rail-line"/>}
          </li>
        })}
      </ol>
    </div>

    <div className="wz-body">
      <div className="wz-panel">
        <p className="wb-step-kicker"><span>{String(stepIndex+1).padStart(2,'0')}</span> {step.kicker.split('·')[1]?.trim()}</p>
        <h2><Icon size={22}/> {step.title}</h2>
        <p className="wz-hint">{step.hint}</p>

        <div className="wz-questions">
          <h3><Lightbulb size={14}/> 先问自己几个问题</h3>
          <ul>{step.questions.map(q => <li key={q}>{q}</li>)}</ul>
        </div>

        <div className="wz-fields">
          {step.fields.map(f => <label className="wz-field" key={f.id}>
            <span>{f.label}</span>
            <textarea rows={3} maxLength={2000} placeholder={f.placeholder} value={drafts[f.id]||''} onChange={e=>setDrafts(d=>({...d,[f.id]:e.target.value}))}/>
          </label>)}
        </div>
        {error && <p className="wb-error" role="alert">{error}</p>}

        <div className="wz-actions">
          <button className="ghost" disabled={busy} onClick={onSave}><Save size={14}/> 保存这一步</button>
          <button className="primary" disabled={busy} onClick={onAdvance}>{isLast ? '形成我的场景卡' : '保存并进入下一步'} <ChevronRight size={15}/></button>
        </div>
        {stepIndex > 0 && <button className="link-btn wz-prev" onClick={()=>onGoStep(stepIndex-1)}>回到上一步</button>}
      </div>

      <aside className={`wz-refs ${showRefs?'open':''}`}>
        <button className="wz-refs-toggle" onClick={onToggleRefs}><BookOpen size={14}/> {showRefs ? '收起参考案例' : '卡住了？看看 3 个参考案例'} <ChevronRight size={13} className="wz-refs-chev"/></button>
        {showRefs && <div className="wz-refs-body">
          <p className="wz-refs-note">它们只展示“别人怎么做”，不会填进你的答案——你自己的写法才是这一步的目的。</p>
          {step.references.map((r,i) => <article key={r.title} className="ref-card"><span>{String(i+1).padStart(2,'0')}</span><h4>{r.title}</h4><p>{r.note}</p></article>)}
        </div>}
      </aside>
    </div>
  </>
}

function Brief({project,steps,onReopenStep,onHome}) {
  const contents = Object.fromEntries(project.steps.map(s => [s.stepId, s.content]))
  return <div className="brief">
    <button className="wb-back" onClick={onHome}><ArrowLeft size={14}/> 全部创作</button>
    <div className="brief-head">
      <p className="eyebrow"><span className="dot"/> 场景卡完成</p>
      <h1>《{project.theme}》<br/><i>的一场戏，成形了。</i></h1>
      <p className="muted">从一个模糊主题到这张卡，你走过的每一步都保留在下面。</p>
    </div>

    <div className="brief-chain">
      {steps.map((s,i)=>{
        const Icon = STEP_ICONS[i]
        return <div className="brief-chain-node" key={s.id}>
          <span className="brief-chain-dot"><Icon size={13}/></span>
          <b>{['核心表达','人物关系','冲突时刻','场景目标'][i]}</b>
          {i < steps.length-1 && <span className="brief-chain-line"/>}
        </div>
      })}
    </div>

    <section className="scene-card">
      <p className="scene-card-kicker">SCENE CARD / 最终场景目标</p>
      <h2>{contents.scene?.place}</h2>
      <p className="scene-card-arc">{contents.scene?.arc}</p>
      <div className="scene-card-grid">
        <div><small>观众带走什么</small><p>{contents.scene?.leaving}</p></div>
        <div><small>核心表达</small><p>{contents.expression?.statement}</p></div>
        <div><small>人物</small><p>{contents.characters?.who}</p></div>
        <div><small>冲突</small><p>{contents.conflict?.stakes}</p></div>
      </div>
    </section>

    <section className="evolution">
      <div className="evolution-head">
        <div><p className="eyebrow">回看你的创作过程</p><h2>一个想法是怎样长成场景的</h2></div>
        <p className="muted">每一格都是当时亲手写下的，按创作顺序排列。</p>
      </div>
      <div className="evolution-list">
        {steps.map((s,i)=>{
          const Icon = STEP_ICONS[i]
          const c = contents[s.id] || {}
          return <article key={s.id} className="evolution-step">
            <div className="evolution-meta"><span className="evolution-icon"><Icon size={14}/></span><div><small>{s.kicker}</small><h3>{s.title}</h3></div></div>
            <div className="evolution-fields">{s.fields.map(f => <div key={f.id} className="evolution-field"><span>{f.label}</span><p>{c[f.id]}</p></div>)}</div>
            <button className="link-btn" onClick={()=>onReopenStep(i)}>回看并修改这一步 <Pencil size={11}/></button>
          </article>
        })}
      </div>
    </section>
  </div>
}

function Archive({progress,modules,history,onOpenWorkbench}) {
  const [projects, setProjects] = useState([])
  useEffect(() => { api('/api/workbench/projects').then(setProjects).catch(console.error) }, [])
  return <main className="archive">
    <div className="archive-header"><div><p className="eyebrow">你的导演档案</p><h1>观看，记录，<i>再观看。</i></h1><p className="muted">这里保存你做过的每一个决定。</p></div><div className="archive-stat"><b>{progress.completed}</b><span>已完成练习</span></div></div>
    <div className="archive-grid"><div className="timeline"><h3>最近的练习</h3>{history.length ? history.slice(0,8).map((entry,i)=>{ const m=modules.find(item=>item.id===entry.moduleId); return <div className="timeline-row" key={`${entry.moduleId}-${entry.createdAt}-${i}`}><span className="time-dot"/><div><b>{m?.title || entry.moduleId}</b><small>{m?.kicker || '练习'} · {new Date(entry.createdAt).toLocaleDateString('zh-CN')}</small></div><Check size={16}/></div> }) : <p className="muted">还没有练习记录，先去今天片场做一个选择。</p>}</div><div className="archive-note"><Headphones size={20}/><p>导演的工作，始于<br/><strong>认真地听。</strong></p><span>声音练习将在下一阶段开放</span></div></div>
    <div className="archive-creations">
      <div className="archive-creations-head"><h3>从主题到场景 · 创作过程记录</h3><button className="link-btn" onClick={()=>onOpenWorkbench(null)}>前往工作台 <ChevronRight size={13}/></button></div>
      {projects.length ? projects.map(p => <button key={p.id} className="wb-project-row archive-row" onClick={()=>onOpenWorkbench(p.id)}>
        <span className="wb-row-index">No.{String(p.id).padStart(2,'0')}</span>
        <span className="wb-row-main"><b>{p.theme}</b><small>{p.status==='completed' ? `场景卡 · ${fmtDate(p.completedAt)}` : `进行中 · ${p.savedSteps.length}/4 步`} · {p.preview.expression || '尚未写下核心表达'}</small></span>
        <span className={`wb-row-badge ${p.status}`}>{p.status==='completed' ? <><Check size={12}/> 已成形</> : <><FileText size={12}/> {p.savedSteps.length}/4</>}</span>
        <ChevronRight size={16}/>
      </button>) : <p className="muted">还没有创作记录。在导演工作台输入一个主题，整个思考过程会留在这里。</p>}
    </div>
  </main>
}

createRoot(document.getElementById('root')).render(<App />)
