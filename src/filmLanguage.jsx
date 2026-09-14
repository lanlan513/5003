import React, { useEffect, useMemo, useState } from 'react'
import { Aperture, Check, Clapperboard, PenLine, Quote, RotateCcw } from 'lucide-react'
import ConceptScene from './scenes.jsx'

const api = async (url, options) => {
  const r = await fetch(url, options)
  const payload = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(payload.error || `Request failed: ${r.status}`)
  return payload
}

export default function FilmLanguage() {
  const [concepts, setConcepts] = useState([])
  const [judgments, setJudgments] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [optionId, setOptionId] = useState(null)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([api('/api/film-language/concepts'), api('/api/film-language/judgments')])
      .then(([conceptData, judgmentData]) => {
        setConcepts(conceptData)
        setJudgments(judgmentData)
        setActiveId(conceptData[0]?.id ?? null)
      })
      .catch(console.error)
  }, [])

  const concept = useMemo(() => concepts.find(c => c.id === activeId), [concepts, activeId])
  const option = useMemo(() => concept?.options.find(o => o.id === optionId) ?? concept?.options[0], [concept, optionId])

  if (!concept || !option) return <main className="fl"><p className="fl-loading">课程加载中…</p></main>

  const selectConcept = (id) => {
    setActiveId(id); setOptionId(null); setNote(''); setSaved(null); setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const selectOption = (id) => {
    if (saved) return
    setOptionId(id); setError(null)
  }
  const submit = async () => {
    if (submitting || saved || !note.trim()) return
    setSubmitting(true); setError(null)
    try {
      const entry = await api('/api/film-language/judgments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptId: concept.id, optionId: option.id, note: note.trim() })
      })
      setSaved(entry)
      setJudgments(items => [entry, ...items])
    } catch (err) {
      setError(err.message)
    } finally { setSubmitting(false) }
  }

  return (
    <main className="fl">
      <header className="fl-header">
        <p className="eyebrow"><span className="dot" /> 电影语言基础 · FILM LANGUAGE 101</p>
        <h1>六个概念，<br /><i>六种看的方式。</i></h1>
        <p className="fl-lede">每个概念对应一场戏。点击不同的镜头方案，观察画面如何变化——<br />然后写下你的判断，再看看导演怎么想。</p>
      </header>

      <nav className="fl-tabs">
        {concepts.map(c => (
          <button key={c.id} className={c.id === concept.id ? 'active' : ''} onClick={() => selectConcept(c.id)}>
            <span>{String(c.order).padStart(2, '0')}</span>{c.name}
          </button>
        ))}
      </nav>

      <section className="fl-stage-row">
        <aside className="fl-brief">
          <p className="fl-concept-en">{concept.en}</p>
          <h2>{concept.name}</h2>
          <p className="fl-definition">{concept.definition}</p>
          <div className="fl-scene-card">
            <p className="fl-slugline"><Clapperboard size={12} /> {concept.scene.slugline}</p>
            <h3>《{concept.scene.title}》</h3>
            <p>{concept.scene.story}</p>
          </div>
        </aside>

        <div className="fl-lab">
          <div className="fl-frame">
            <ConceptScene conceptId={concept.id} visual={option.visual} />
            <div className="fl-frame-caption">
              <span>{concept.scene.slugline}</span>
              <span>{concept.name} · {option.label}</span>
            </div>
          </div>

          <div className="fl-options">
            {concept.options.map(o => (
              <button
                key={o.id}
                disabled={Boolean(saved)}
                className={`fl-option ${o.id === option.id ? 'selected' : ''} ${saved && o.id !== option.id ? 'dimmed' : ''}`}
                onClick={() => selectOption(o.id)}
              >
                <b>{o.label}</b>
                <small>{o.brief}</small>
              </button>
            ))}
          </div>

          <div className="fl-feeling">
            <Quote size={14} />
            <p><b>观看感受</b>{option.feeling}</p>
          </div>

          {!saved ? (
            <div className="fl-judge">
              <label><PenLine size={13} /> 记录你的判断 —— 为什么这样处理这场戏？</label>
              <textarea
                value={note}
                maxLength={500}
                placeholder={`例如：我选择「${option.label}」，因为……`}
                onChange={e => setNote(e.target.value)}
              />
              <div className="fl-judge-foot">
                <span className="fl-error">{error}</span>
                <button className="primary" disabled={!note.trim() || submitting} onClick={submit}>
                  {submitting ? '记录中…' : '记录我的判断'} <Check size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div className="fl-analysis" style={{ animation: 'fadeIn .5s ease' }}>
              <div className="fl-analysis-head">
                <span className="fl-saved"><Check size={14} /> 判断已记录</span>
                <button className="fl-redo" onClick={() => { setSaved(null); setNote(''); setOptionId(null) }}>
                  <RotateCcw size={13} /> 重新选择
                </button>
              </div>
              <blockquote className="fl-my-note">“{saved.note}”</blockquote>
              <div className="fl-director">
                <p className="fl-director-tag"><Aperture size={13} /> 导演分析</p>
                <p>{option.analysis}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="fl-history">
        <h3>我的判断记录 <span>{judgments.length} 条</span></h3>
        {judgments.length === 0 ? (
          <p className="muted">还没有记录。选择一个镜头方案，写下你的第一个导演判断。</p>
        ) : (
          <div className="fl-history-list">
            {judgments.slice(0, 6).map(j => {
              const c = concepts.find(item => item.id === j.conceptId)
              const o = c?.options.find(item => item.id === j.optionId)
              return (
                <div className="fl-history-row" key={j.id}>
                  <div>
                    <b>{c?.name ?? j.conceptId} · {o?.label ?? j.optionId}</b>
                    <small>《{c?.scene.title}》 · {new Date(j.createdAt).toLocaleDateString('zh-CN')}</small>
                  </div>
                  <p>“{j.note}”</p>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
