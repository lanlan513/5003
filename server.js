import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new DatabaseSync(path.join(__dirname, 'lab.db'))
db.exec(`CREATE TABLE IF NOT EXISTS progress (id INTEGER PRIMARY KEY, completed INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS practice (id INTEGER PRIMARY KEY AUTOINCREMENT, module_id TEXT NOT NULL, answer TEXT NOT NULL, score INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS completed_module (module_id TEXT PRIMARY KEY, completed_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS director_project (id INTEGER PRIMARY KEY AUTOINCREMENT, theme TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, completed_at TEXT);
CREATE TABLE IF NOT EXISTS director_step (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL, step_id TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(project_id, step_id));`)
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

// 「从主题到场景」导演工作台：只提供引导问题与参考案例，答案全部由用户写下
const directorSteps = [
  {
    id: 'expression',
    index: 0,
    kicker: '第一步 · 核心表达',
    title: '把主题，变成一句话的表达',
    hint: '主题还只是一团模糊的兴趣。导演工作的第一步，是决定你对它真正的看法——不是拍什么，而是为什么非拍不可。',
    questions: [
      '关于这个主题，你真正想说的是什么？试着压成一句话。',
      '你希望观众离开时，心里留下的是一个问题，还是一种感受？',
      '同样是这个主题，你最不想拍成什么样？'
    ],
    references: [
      { title: '《寄生虫》', note: '“气味”把“阶层”变成一个无法回避、却又说不出口的具体表达。' },
      { title: '《海边的曼彻斯特》', note: '它不替观众治愈，只表达：有些伤口不会过去。' },
      { title: '《东京物语》', note: '用安静的日常，说出“家庭终将离散”这一句重话。' }
    ],
    fields: [
      { id: 'statement', label: '你的核心表达（一句话）', placeholder: '例如：关于“告别”，我想说的是……', min: 4 },
      { id: 'why', label: '为什么非拍它不可？', placeholder: '这个主题在你自己生活里的来处……', min: 4 }
    ]
  },
  {
    id: 'characters',
    index: 1,
    kicker: '第二步 · 人物关系',
    title: '让两个人，承担这个表达',
    hint: '抽象的表达需要活的人来承担。先找到一对关系——主题将通过他们之间的距离、交换与误解被看见。',
    questions: [
      '哪两个人之间的关系，最能逼出你的核心表达？',
      '他们各自最想要的东西，为什么彼此冲突？',
      '谁有求于谁？这一刻，谁掌握主动权？'
    ],
    references: [
      { title: '《菊次郎的夏天》', note: '粗野大叔与孤僻男孩：两个人都在照顾对方，又都不肯承认。' },
      { title: '《饮食男女》', note: '一家人围着一桌菜，全部的话都靠食物说出。' },
      { title: '《一次别离》', note: '一对夫妻的分开，牵出信仰、阶级与责任的连锁反应。' }
    ],
    fields: [
      { id: 'who', label: '谁在场？（两个人或一组关系）', placeholder: '他们是谁？年龄、处境、此刻的状态……', min: 2 },
      { id: 'wants', label: '各自想要什么？', placeholder: 'A 想要……　B 想要……', min: 4 },
      { id: 'bond', label: '他们之间那条看不见的线', placeholder: '他们如何牵连，又如何被这层关系困住……', min: 4 }
    ]
  },
  {
    id: 'conflict',
    index: 2,
    kicker: '第三步 · 冲突',
    title: '找到那个非发生不可的时刻',
    hint: '冲突不必是争吵。它是两个人的渴望在同一个空间里相撞，而某样具体的东西迫使这一刻无法被绕开。',
    questions: [
      '这一刻，什么具体的东西让矛盾无法再拖？',
      '真正的冲突是说出口的话，还是没说出口的那句？',
      '如果这一场顺利，谁会失去他最在意的东西？'
    ],
    references: [
      { title: '《十二怒汉》', note: '一间闷热的房间、一把刀：偏见被逼到无法藏身。' },
      { title: '《婚姻故事》', note: '最狠的争吵爆发前，两人其实都还想做体面的人。' },
      { title: '《霸王别姬》', note: '一辈子的戏与情，压在“你到底是不是虞姬”这一句上。' }
    ],
    fields: [
      { id: 'stakes', label: '此刻不能再拖的是什么？', placeholder: '一件正在逼近、绕不开的事……', min: 4 },
      { id: 'pressure', label: '外部压力来自哪里？', placeholder: '一个人、一个期限、一个秘密，或一场雨……', min: 2 },
      { id: 'unsaid', label: '水面之下，没说出口的是什么？', placeholder: '观众能感到、人物却不说的那件事……', min: 4 }
    ]
  },
  {
    id: 'scene',
    index: 3,
    kicker: '第四步 · 场景目标',
    title: '为观众设计一场具体的体验',
    hint: '这是拍摄之前的最后一步：决定观众在几分钟内，如何从一种状态被带到另一种状态。想清楚体验，镜头选择才有理由。',
    questions: [
      '这一场开始时，观众以为自己在看什么？',
      '你希望观众的情绪在哪一刻发生转折？',
      '灯光熄灭后，留在观众身体里的是什么？'
    ],
    references: [
      { title: '《教父》', note: '洗礼与暗杀并行：观众在神圣与血腥之间被撕裂。' },
      { title: '《朱尔与吉姆》', note: '奔跑、旁白与音乐，让观众先爱上自由，再察觉危险。' },
      { title: '《爱乐之城》', note: '最后一眼的蒙太奇：观众替主角过完了另一种人生。' }
    ],
    fields: [
      { id: 'place', label: '这一场发生在哪里、什么时间？', placeholder: '一个具体的空间与时刻……', min: 2 },
      { id: 'arc', label: '观众的情绪弧线', placeholder: '开场让观众感到……；到这一刻转为……', min: 4 },
      { id: 'leaving', label: '散场后，你希望观众带走什么？', placeholder: '一个疑问、一种滋味，或一个忘不掉的画面……', min: 4 }
    ]
  }
]

const clipText = (value, max = 80) => {
  const text = String(value ?? '').trim()
  return text.length > max ? `${text.slice(0, max)}…` : text
}

const serializeProject = (row) => {
  const steps = db.prepare('SELECT step_id as stepId, content, created_at as createdAt, updated_at as updatedAt FROM director_step WHERE project_id=? ORDER BY id').all(row.id)
  return {
    id: row.id,
    theme: row.theme,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at || null,
    steps: steps.map(step => ({ ...step, content: JSON.parse(step.content) }))
  }
}

const getProjectRow = (id) => db.prepare('SELECT * FROM director_project WHERE id=?').get(id)

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

// 「从主题到场景」工作台 API
app.get('/api/workbench/steps', (_, res) => res.json(directorSteps))
app.get('/api/workbench/projects', (_, res) => {
  const rows = db.prepare('SELECT * FROM director_project ORDER BY updated_at DESC').all()
  res.json(rows.map(row => {
    const saved = db.prepare('SELECT step_id FROM director_step WHERE project_id=?').all(row.id).map(item => item.step_id)
    return {
      id: row.id,
      theme: row.theme,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at || null,
      savedSteps: saved,
      preview: Object.fromEntries(db.prepare('SELECT step_id, content FROM director_step WHERE project_id=?').all(row.id)
        .map(item => [item.step_id, clipText(JSON.parse(item.content)[directorSteps.find(s => s.id === item.step_id)?.fields[0]?.id] || '', 60)]))
    }
  }))
})
app.post('/api/workbench/projects', (req, res) => {
  const theme = clipText(req.body.theme, 60)
  if (!theme) return res.status(400).json({ error: 'theme is required' })
  const now = new Date().toISOString()
  const result = db.prepare('INSERT INTO director_project (theme, created_at, updated_at) VALUES (?, ?, ?)').run(theme, now, now)
  res.status(201).json(serializeProject(getProjectRow(result.lastInsertRowid)))
})
app.get('/api/workbench/projects/:id', (req, res) => {
  const row = getProjectRow(Number(req.params.id))
  if (!row) return res.status(404).json({ error: 'project not found' })
  res.json(serializeProject(row))
})
app.put('/api/workbench/projects/:id/theme', (req, res) => {
  const row = getProjectRow(Number(req.params.id))
  if (!row) return res.status(404).json({ error: 'project not found' })
  const theme = clipText(req.body.theme, 60)
  if (!theme) return res.status(400).json({ error: 'theme is required' })
  const now = new Date().toISOString()
  db.prepare('UPDATE director_project SET theme=?, updated_at=? WHERE id=?').run(theme, now, row.id)
  res.json(serializeProject(getProjectRow(row.id)))
})
app.put('/api/workbench/projects/:id/steps/:stepId', (req, res) => {
  const row = getProjectRow(Number(req.params.id))
  if (!row) return res.status(404).json({ error: 'project not found' })
  const step = directorSteps.find(item => item.id === req.params.stepId)
  if (!step) return res.status(400).json({ error: 'unknown step' })
  const incoming = req.body.content
  if (!incoming || typeof incoming !== 'object') return res.status(400).json({ error: 'content object is required' })
  const content = {}
  for (const field of step.fields) {
    const value = String(incoming[field.id] ?? '').trim()
    if (value.length < field.min) return res.status(400).json({ error: `「${field.label}」还没有写完，先写下你自己的想法` })
    content[field.id] = value.slice(0, 2000)
  }
  const now = new Date().toISOString()
  db.prepare(`INSERT INTO director_step (project_id, step_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(project_id, step_id) DO UPDATE SET content=excluded.content, updated_at=excluded.updated_at`)
    .run(row.id, step.id, JSON.stringify(content), now, now)
  db.prepare('UPDATE director_project SET updated_at=? WHERE id=?').run(now, row.id)
  res.json(serializeProject(getProjectRow(row.id)))
})
app.post('/api/workbench/projects/:id/complete', (req, res) => {
  const row = getProjectRow(Number(req.params.id))
  if (!row) return res.status(404).json({ error: 'project not found' })
  const saved = db.prepare('SELECT step_id FROM director_step WHERE project_id=?').all(row.id).map(item => item.step_id)
  const missing = directorSteps.filter(step => !saved.includes(step.id))
  if (missing.length) return res.status(400).json({ error: `还有 ${missing.length} 步没有完成` })
  const now = new Date().toISOString()
  db.prepare('UPDATE director_project SET status=?, completed_at=?, updated_at=? WHERE id=?').run('completed', now, now, row.id)
  res.json(serializeProject(getProjectRow(row.id)))
})

app.use('/api', (_, res) => res.status(404).json({ error: 'API route not found' }))
app.use(express.static(path.join(__dirname, 'dist')))
app.use((_, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))
app.listen(3001, () => console.log('Director lab API listening on http://localhost:3001'))
