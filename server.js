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
  { id:'edit', kicker:'04 · 剪辑', title:'在哪一个呼吸点切开？', duration:'14 min', type:'scene', color:'green', prompt:'女孩推开门，看见屋里已经坐满陌生人。她没有说话。', choices:[{id:'before',label:'在她看见之前切',detail:'让观众和她同时发现，惊讶属于共同的当下。',score:3},{id:'after',label:'停在她的反应上再切',detail:'先让观众读取她，再把信息延迟半拍。',score:2},{id:'object',label:'切到桌上多出的杯子',detail:'用物件代替解释，悬念从人物转移到证据。',score:2}]},
  { id:'directing', kicker:'05 · 演员指导', title:'演员不是执行台词的人', duration:'18 min', type:'directing', color:'plum', prompt:'三种导演指令，三种表演空间。你说出口的每句话，都在决定演员还能不能创作。',
    intro:[
      '很多人以为，导演的工作是告诉演员“怎么演”：这里哭，那里笑，语气再重一点。',
      '但演员不是执行台词的人。当你直接给出情绪，演员只能模仿情绪——表演变成展示结果，而不是经历此刻。',
      '导演真正的工作，是给演员可以玩的东西：人物想要什么（目标），他正在做什么（行动）。情绪，留给演员自己找到。'
    ],
    principle:'指令越接近结果，演员的空间越小；越接近行动，空间越大。',
    kinds:{
      emotion:{ label:'情绪指令', example:'“再难过一点。”', gives:'一个要模仿的结果', space:1, spaceLabel:'收窄', note:'演员开始检查自己的情绪对不对。排练会一次比一次像，也一次比一次空。' },
      action:{ label:'行动指令', example:'“用这句话试探他。”', gives:'一件可以做的事', space:2, spaceLabel:'有了支点', note:'台词变成工具。演员想着“做什么”，不再想“演什么”——情绪自己会来。' },
      objective:{ label:'目标指令', example:'“你想让他留下来。”', gives:'一个要去的方向', space:3, spaceLabel:'打开', note:'怎么表达由演员寻找。同一句台词，每场排练都可能长出新的东西。' }
    },
    scenarios:[
      { id:'goodbye', short:'机场送别', slug:'SCENE 01 / EXT. AIRPORT — DAWN', speaker:'女儿', scene:'机场，清晨。父亲要去一个也许不会再回来的城市。女儿送他到安检口，替他整了整衣领。', line:'“路上小心。”', ask:'演员看着你，等你开口。你会怎么指导她？',
        options:[
          { id:'goodbye-emotion', kind:'emotion', say:'“这里你要特别难过——眼泪在眼眶里打转，声音发抖。”', actor:'她开始检查自己：眼泪够吗？声音抖了吗？她不再看对面的父亲，只监控自己的情绪。', why:'你预定了结果，她只能交付结果。每一次排练都会一模一样——因为没有别的东西可以探索。' },
          { id:'goodbye-objective', kind:'objective', say:'“你不想让他走。但你知道，一说出口，他就真的走不了了。”', actor:'她开始自己做决定：是笑着挥手，还是低头躲开他的目光？每一种选择都属于她。', why:'你给了她“想要什么”，怎么表达由她寻找。同一句台词，每次排练都可能不同。' },
          { id:'goodbye-action', kind:'action', say:'“用这句台词，让他回头再看你一眼。”', actor:'她有了一个可以执行的动作。也许停顿，也许说得轻描淡写——只要能让父亲回头。', why:'行动是可以“做”的。她不再想“该有什么情绪”，只想“怎么让他回头”——情绪自己会来。' }
        ]},
      { id:'lie', short:'厨房谎言', slug:'SCENE 02 / INT. KITCHEN — NIGHT', speaker:'丈夫', scene:'深夜，厨房。丈夫比平时晚回家三个小时。妻子坐在桌边，没有开大灯。她问：“去哪了？”', line:'“加班。”', ask:'这句台词只有一个词。你会怎么指导他？',
        options:[
          { id:'lie-action', kind:'action', say:'“用这句话试探她：她到底知道了多少？”', actor:'“加班”变成一次探测。他说完会等——她的反应，决定他下一步怎么走。', why:'行动让台词有了任务。台词不再是信息，而是他用来达到目的的工具。' },
          { id:'lie-emotion', kind:'emotion', say:'“你要心虚——眼神躲闪，语气发虚，不敢看她。”', actor:'他开始“表演心虚”：摸鼻子、看地板。观众看到的是一个人在做心虚的动作。', why:'你把内心活动直接指定成外在表情。他忙着呈现“心虚的样子”，忘了自己此刻在做什么。' },
          { id:'lie-objective', kind:'objective', say:'“你要让这件事今晚就翻篇，不能再出任何问题。”', actor:'他自己决定怎么“翻篇”：可能过分轻松，可能主动倒水喝。每种处理都成立。', why:'目标给了他方向，但没有规定路线。他的每个选择，都在回答“怎么让今晚平安过去”。' }
        ]},
      { id:'sit', short:'茶馆一字', slug:'SCENE 03 / INT. TEA HOUSE — AFTERNOON', speaker:'哥哥', scene:'老茶馆。十年没见的弟弟来借钱，哥哥已经拒绝过三次。弟弟站在桌边，没有坐下。', line:'“坐。”', ask:'台词只有一个字。你会怎么指导他？',
        options:[
          { id:'sit-objective', kind:'objective', say:'“你想让他自己开口认错，而不是你逼他。”', actor:'他开始设计：是慢慢倒茶，还是让他站着等？主动权在他手里。', why:'目标给了他一个可以朝向的方向。“坐”可以是施舍、是台阶、是最后的耐心——由他决定。' },
          { id:'sit-action', kind:'action', say:'“用一个字，把这场谈话的主动权拿回来。”', actor:'“坐”变成了武器。他说完会观察弟弟：这个字，奏效了吗？', why:'行动是最小的可执行单位。一个字也有了任务，演员知道自己在“做什么”，而不是“演什么”。' },
          { id:'sit-emotion', kind:'emotion', say:'“你要演出那种又恨又心疼的复杂感。”', actor:'“复杂”无法直接执行。他只好同时做几种表情，希望有一种是对的。', why:'“复杂”是对结果的描述，不是可以做的事。被要求同时到达几个终点，演员只能原地打转。' }
        ]}
    ],
    reflectPrompt:'排练中段，演员停下来问你：“导演，这句台词我到底该用什么情绪？”',
    choices:[
      { id:'result', kind:'emotion', label:'“再绝望一点——想象你永远失去他了。”', detail:'你又一次替她完成了工作。她演的是你的想象，不是她的发现。', score:1 },
      { id:'goal', kind:'objective', label:'“先别管情绪。问问自己：此刻你最想从他那里得到什么？”', detail:'你把问题还给了人物。她会从“想要”里，长出自己的情绪。', score:3 },
      { id:'task', kind:'action', label:'“试着用这句台词，让他在原地站住三秒钟。”', detail:'你给了她一件可以做的事。做到了，情绪自然在场。', score:3 }
    ]}
]

const app = express()
app.use(express.json())
app.get('/api/modules', (_, res) => res.json(modules))
app.get('/api/progress', (_, res) => res.json(db.prepare('SELECT completed, streak, updated_at as updatedAt FROM progress WHERE id=1').get()))
app.post('/api/progress', (req, res) => {
  const completed = Number(req.body.completed)
  const streak = Number(req.body.streak)
  if (!Number.isInteger(completed) || completed < 0 || completed > modules.length || !Number.isInteger(streak) || streak < 0) {
    return res.status(400).json({ error: `completed must be an integer between 0 and ${modules.length}, and streak must be a non-negative integer` })
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
