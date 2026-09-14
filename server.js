import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new DatabaseSync(path.join(__dirname, 'lab.db'))
db.exec(`CREATE TABLE IF NOT EXISTS progress (id INTEGER PRIMARY KEY, completed INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS practice (id INTEGER PRIMARY KEY AUTOINCREMENT, module_id TEXT NOT NULL, answer TEXT NOT NULL, score INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS completed_module (module_id TEXT PRIMARY KEY, completed_at TEXT NOT NULL);`)
const count = db.prepare('SELECT COUNT(*) as count FROM progress').get().count
if (!count) db.prepare('INSERT INTO progress (id, completed, streak, updated_at) VALUES (1, 2, 3, ?)').run(new Date().toISOString())
if (!db.prepare('SELECT COUNT(*) as count FROM completed_module').get().count) {
  const seededAt = new Date().toISOString()
  db.prepare('INSERT OR IGNORE INTO completed_module (module_id, completed_at) VALUES (?, ?)').run('shot', seededAt)
  db.prepare('INSERT OR IGNORE INTO completed_module (module_id, completed_at) VALUES (?, ?)').run('blocking', seededAt)
}

const modules = [
  { id:'shot', kicker:'01 · 镜头', title:'让观众先看见什么？', duration:'12 min', type:'scene', color:'ochre', prompt:'雨夜，女孩在便利店门口等一个没有出现的人。你会怎么开始这一场？', choices:[{id:'wide',label:'远景：把她放进空旷街道',detail:'孤独先于人物抵达。空间成为叙事的一部分。',score:3},{id:'close',label:'特写：先拍她握紧的手',detail:'从身体的微小动作建立悬念，让观众主动补全信息。',score:2},{id:'follow',label:'跟拍：从她身后穿过人群',detail:'把观众放在她的主观位置，等待感更具身体性。',score:2}]},
  { id:'blocking', kicker:'02 · 场面调度', title:'谁在画面里拥有主动权？', duration:'15 min', type:'scene', color:'blue', prompt:'两位合伙人在厨房对峙。一个想卖掉餐厅，另一个刚得知自己怀孕。', choices:[{id:'isolate',label:'让桌子隔开两人',detail:'静物变成关系的边界，距离制造无法说出口的事实。',score:3},{id:'orbit',label:'让镜头绕着他们移动',detail:'位置不断被交换，权力关系保持不稳定。',score:2},{id:'same',label:'让两人始终同框',detail:'不切断他们的连接，冲突在同一呼吸里发生。',score:2}]},
  { id:'sound', kicker:'03 · 声音', title:'当画面保持沉默', duration:'10 min', type:'scene', color:'rust', prompt:'葬礼结束后，父亲独自开车回家。你希望观众听见什么？', choices:[{id:'engine',label:'只留下引擎与雨刷',detail:'机械节奏替他说话，悲伤被压在日常动作下面。',score:3},{id:'memory',label:'让远处传来孩子的笑声',detail:'声音打破时间，记忆以不可靠的方式渗回当下。',score:2},{id:'music',label:'在最后一公里进入音乐',detail:'把情绪的门交给旋律，但也承担被音乐解释的风险。',score:2}]},
  { id:'edit', kicker:'04 · 剪辑', title:'在哪一个呼吸点切开？', duration:'14 min', type:'scene', color:'green', prompt:'女孩推开门，看见屋里已经坐满陌生人。她没有说话。', choices:[{id:'before',label:'在她看见之前切',detail:'让观众和她同时发现，惊讶属于共同的当下。',score:3},{id:'after',label:'停在她的反应上再切',detail:'先让观众读取她，再把信息延迟半拍。',score:2},{id:'object',label:'切到桌上多出的杯子',detail:'用物件代替解释，悬念从人物转移到证据。',score:2}]}
]

const app = express()
app.use(express.json())
app.get('/api/modules', (_, res) => res.json(modules))
app.get('/api/progress', (_, res) => res.json(db.prepare('SELECT completed, streak, updated_at as updatedAt FROM progress WHERE id=1').get()))
app.post('/api/progress', (req, res) => {
  const completed = Number(req.body.completed)
  const streak = Number(req.body.streak)
  if (!Number.isInteger(completed) || completed < 0 || completed > modules.length || !Number.isInteger(streak) || streak < 0) {
    return res.status(400).json({ error: 'completed must be an integer between 0 and 4, and streak must be a non-negative integer' })
  }
  db.prepare('UPDATE progress SET completed=?, streak=?, updated_at=? WHERE id=1').run(completed, streak, new Date().toISOString())
  res.json({ completed, streak })
})
app.post('/api/practice', (req, res) => {
  const { moduleId, answer, score } = req.body
  const module = modules.find(item => item.id === moduleId)
  const choice = module?.choices.find(item => item.id === answer)
  const numericScore = Number(score)
  if (!module || !choice || numericScore !== choice.score) {
    return res.status(400).json({ error: 'moduleId, answer and score do not match a valid practice choice' })
  }
  const now = new Date()
  const nowIso = now.toISOString()
  const current = db.prepare('SELECT streak, updated_at as updatedAt FROM progress WHERE id=1').get()
  const today = nowIso.slice(0, 10)
  const lastDay = current.updatedAt.slice(0, 10)
  const yesterday = new Date(now)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const nextStreak = lastDay === today ? current.streak : lastDay === yesterday.toISOString().slice(0, 10) ? current.streak + 1 : 1
  db.exec('BEGIN')
  try {
    db.prepare('INSERT INTO practice (module_id, answer, score, created_at) VALUES (?, ?, ?, ?)').run(moduleId, answer, numericScore, nowIso)
    db.prepare('INSERT OR IGNORE INTO completed_module (module_id, completed_at) VALUES (?, ?)').run(moduleId, nowIso)
    const completed = db.prepare('SELECT COUNT(*) as count FROM completed_module').get().count
    db.prepare('UPDATE progress SET completed=?, streak=?, updated_at=? WHERE id=1').run(completed, nextStreak, nowIso)
    db.exec('COMMIT')
    res.status(201).json({ ok: true, progress: { completed, streak: nextStreak } })
  } catch (error) {
    db.exec('ROLLBACK')
    res.status(500).json({ error: 'failed to save practice' })
  }
})
app.get('/api/practice', (_, res) => res.json(db.prepare('SELECT module_id as moduleId, answer, score, created_at as createdAt FROM practice ORDER BY id DESC LIMIT 20').all()))
app.use('/api', (_, res) => res.status(404).json({ error: 'API route not found' }))
app.use(express.static(path.join(__dirname, 'dist')))
app.use((_, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))
app.listen(3001, () => console.log('Director lab API listening on http://localhost:3001'))
