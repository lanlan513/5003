import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { randomInt, randomBytes } from 'node:crypto'
import { onsetGraph, advanceOnset, continueOnset, publicOnsetNode, tallyOnsetPath, initialOnsetState } from './src/onsetMachine.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new DatabaseSync(path.join(__dirname, 'lab.db'))
db.exec(`CREATE TABLE IF NOT EXISTS progress (id INTEGER PRIMARY KEY, completed INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS practice (id INTEGER PRIMARY KEY AUTOINCREMENT, module_id TEXT NOT NULL, answer TEXT NOT NULL, score INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS completed_module (module_id TEXT PRIMARY KEY, completed_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS director_project (id INTEGER PRIMARY KEY AUTOINCREMENT, theme TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, completed_at TEXT);
CREATE TABLE IF NOT EXISTS director_step (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL, step_id TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(project_id, step_id));
CREATE TABLE IF NOT EXISTS shoot_condition_mission (id INTEGER PRIMARY KEY AUTOINCREMENT, seed TEXT NOT NULL UNIQUE, constraints TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS shoot_condition_decision (id INTEGER PRIMARY KEY AUTOINCREMENT, mission_id INTEGER NOT NULL UNIQUE, decisions TEXT NOT NULL, strategy TEXT NOT NULL, result TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS onsite_run (id INTEGER PRIMARY KEY AUTOINCREMENT, status TEXT NOT NULL DEFAULT 'active', current_node TEXT NOT NULL, state TEXT NOT NULL, path TEXT NOT NULL, result TEXT, started_at TEXT NOT NULL, updated_at TEXT NOT NULL, finished_at TEXT);`)
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

/* ---------------- 拍摄条件决策模拟 ---------------- */

// 固定剧本：《等不到的人》—— 雨夜便利店
// 每个节拍标注它对表达的作用、原始资源需求；adapt 是“在受限条件下变通”的具体拍法。
// 复杂度权重不出库给前端，避免照着数字解题。
const shootScript = {
  id: 'rainy-store',
  title: '《等不到的人》',
  logline: '雨夜，女孩在便利店门口等一个没有出现的人。',
  synopsis: '六分钟的短片，只有一夜、一扇门。从她抵达，到她离开——所有的“戏”都发生在等待里。',
  venueLabels: { store: '便利店店内', door: '便利店门口', street: '店外街道' },
  timeLabels: { day: '白天', dusk: '黄昏', night: '深夜' },
  lightLabels: { 2: '大灯组（可调色温的大型影视灯）', 1: '单一实用光源（店里的日光灯）', 0: '仅有现场光' },
  beats: [
    {
      id: 'empty-street',
      code: 'S-01',
      title: '空街：她先被空间吞没',
      description: '远景。雨里的空街，一个很小的人影从画面深处走来，在便利店门口停下。空间先于人物抵达。',
      meaning: '让观众先感到“空旷”——孤独是在她出现之前就存在的。',
      importance: 'key',
      roles: ['girl'],
      extras: 0,
      venue: 'street',
      time: 'night',
      light: 2,
      shots: 2,
      weight: 18,
      baseComplexity: 2,
      adaptations: [
        { id: 'store-window', label: '改为店内侧拍：隔着玻璃门拍她停下的脚步，雨水糊在玻璃上', note: '保留“被框住的孤独”，代价是放弃空街的尺度感。', roles: ['girl'], extras: 0, venue: 'door', time: 'night', light: 1, shots: 1, fidelity: 0.6, complexity: 1 },
        { id: 'sound-only', label: '改为纯声音：只留雨声与渐近的脚步，画面停在湿掉的霓虹招牌', note: '把空间交给观众的想象，但不再“看见”她的渺小。', roles: [], extras: 0, venue: 'any', time: 'any', light: 0, shots: 1, fidelity: 0.45, complexity: 0 }
      ]
    },
    {
      id: 'unspoken',
      code: 'S-02',
      title: '没说出口的那句话',
      description: '中近景。她推门进去又退回来，对店员欲言又止，最后只说“没事”。',
      meaning: '建立她在等谁、为什么不能开口问——人物从动作里长出来。',
      importance: 'key',
      roles: ['girl', 'clerk'],
      extras: 0,
      venue: 'store',
      time: 'night',
      light: 1,
      shots: 3,
      weight: 16,
      baseComplexity: 1,
      adaptations: [
        { id: 'self-checkout', label: '店员改为自助结账机：她对着机器停顿，把那句话咽回去', note: '倾诉对象变成机器，反而强化“无人可说”。', roles: ['girl'], extras: 0, venue: 'store', time: 'any', light: 1, shots: 2, fidelity: 0.7, complexity: 0 },
        { id: 'phone-draft', label: '改为手机屏幕特写：对话框里打了又删的一行字', note: '信息更直白，但少了面对活人时的窘迫。', roles: ['girl'], extras: 0, venue: 'any', time: 'any', light: 0, shots: 1, fidelity: 0.55, complexity: 0 }
      ]
    },
    {
      id: 'memory',
      code: 'S-03',
      title: '回忆：站台',
      description: '暖色闪回。白天的站台，另一个人替她围上围巾，说“我很快回来”。',
      meaning: '给观众一个可以被辜负的约定——没有它，等待就没有重量。',
      importance: 'key',
      roles: ['girl', 'other'],
      extras: 0,
      venue: 'platform',
      time: 'day',
      light: 2,
      shots: 2,
      weight: 18,
      baseComplexity: 4,
      adaptations: [
        { id: 'keepsake', label: '不拍闪回：特写她手里攥着的旧围巾/票根，用色彩与声音暗示', note: '约定变成一个物件，观众自己补全温度。', roles: [], extras: 0, venue: 'any', time: 'any', light: 0, shots: 1, fidelity: 0.5, complexity: 1 },
        { id: 'shelf-flash', label: '在店内借位：暖色货架做背景，一只画外的手递来围巾', note: '保住“被照顾”的触感，但回忆失去了自己的空间。', roles: ['girl'], extras: 0, venue: 'store', time: 'any', light: 1, shots: 1, fidelity: 0.65, complexity: 2 },
        { id: 'day-aisle', label: '白天补拍：在货架之间拍一个三秒钟的暖光短闪回', note: '闪回有了真实的光与人，但要额外占用白天档期，还得让观众明确“跳回了过去”。', roles: ['girl', 'other'], extras: 0, venue: 'store', time: 'day', light: 1, shots: 1, fidelity: 0.72, complexity: 3 }
      ]
    },
    {
      id: 'clock',
      code: 'S-04',
      title: '时间过去：一组等待蒙太奇',
      description: '时钟、冷掉的咖啡、门口每一次被推开都不是他。等待被切成碎片。',
      meaning: '让观众亲身体验时间被拉长——这是全片的“呼吸”。',
      importance: 'supporting',
      roles: ['girl'],
      extras: 0,
      venue: 'store',
      time: 'night',
      light: 1,
      shots: 5,
      weight: 14,
      baseComplexity: 2,
      adaptations: [
        { id: 'single-take', label: '压成一个固定长镜头：让真实时间在镜头里流过去', note: '镜头更少，却可能更煎熬——用真实时间代替剪辑时间。', roles: ['girl'], extras: 0, venue: 'store', time: 'any', light: 0, shots: 1, fidelity: 0.75, complexity: 1 },
        { id: 'coffee-only', label: '只留咖啡：从冒热气到结出冷凝水，一个镜头交代时间', note: '极简，但等待的反复失落被抹平了。', roles: [], extras: 0, venue: 'any', time: 'any', light: 0, shots: 1, fidelity: 0.4, complexity: 0 }
      ]
    },
    {
      id: 'crowd',
      code: 'S-05',
      title: '人群：每个进门的人都不是他',
      description: '三组路人鱼贯进店，她一次次抬头，又一次次低下头。',
      meaning: '用陌生人的喧闹反衬她——世界并不为一个人的等待停步。',
      importance: 'supporting',
      roles: ['girl', 'clerk'],
      extras: 3,
      venue: 'store',
      time: 'night',
      light: 1,
      shots: 3,
      weight: 14,
      baseComplexity: 3,
      adaptations: [
        { id: 'one-stranger', label: '只留一个路人：一次抬头、一次落空，其余交给门铃声暗示', note: '少了群像的压迫，但一次落空也可以很疼。', roles: ['girl'], extras: 1, venue: 'store', time: 'any', light: 1, shots: 2, fidelity: 0.6, complexity: 1 },
        { id: 'door-bell', label: '不拍人：只拍门被推开、门铃响，她的眼神在画外变化', note: '彻底绕开演员调度，落空变成一种声音节奏。', roles: ['girl'], extras: 0, venue: 'door', time: 'any', light: 0, shots: 2, fidelity: 0.5, complexity: 0 }
      ]
    },
    {
      id: 'leave',
      code: 'S-06',
      title: '离开：她走进雨里',
      description: '她把没送出的围巾留在柜台上，推门离开，没有回头。镜头留在空掉的座位。',
      meaning: '最后停在“空”上——观众带走的不是答案，是那个位置。',
      importance: 'key',
      roles: ['girl', 'clerk'],
      extras: 0,
      venue: 'door',
      time: 'night',
      light: 1,
      shots: 2,
      weight: 20,
      baseComplexity: 2,
      adaptations: [
        { id: 'seat-shot', label: '店员不出镜：她起身离开，镜头只留在空座位与留下的围巾', note: '结尾的“空”被保留，放弃的只是视线交接。', roles: ['girl'], extras: 0, venue: 'store', time: 'any', light: 0, shots: 1, fidelity: 0.75, complexity: 0 },
        { id: 'from-inside', label: '改为店内视角：透过玻璃看她走进雨里，门在画面前合上', note: '观众被留在店里，和她之间隔着一层永远的玻璃。', roles: ['girl'], extras: 0, venue: 'door', time: 'night', light: 1, shots: 1, fidelity: 0.7, complexity: 1 }
      ]
    }
  ]
}

// 返回给前端的剧本：隐去权重与复杂度，只保留做决定需要的信息
const publicScript = () => ({
  ...shootScript,
  beats: shootScript.beats.map(({ weight, baseComplexity, ...beat }) => ({
    ...beat,
    adaptations: beat.adaptations.map(({ fidelity, complexity, ...a }) => a)
  }))
})

const venuePool = ['store', 'door', 'street']
const rollChance = (p) => randomBytes(4).readUInt32BE(0) / 0x100000000 < p

const generateConstraints = () => {
  // 场地：每个独立 60% 概率，至少保留一个
  let venues = venuePool.filter(() => rollChance(0.6))
  if (!venues.length) venues = [venuePool[randomInt(0, venuePool.length)]]
  const timeRoll = randomInt(0, 10)
  const timeWindow = timeRoll < 4 ? 'night' : timeRoll < 7 ? 'dusk' : 'day'
  return {
    actors: randomInt(1, 4),       // 能出镜的演员人数（不含路人）
    extras: randomInt(0, 3),       // 可调度的群演人数
    venues,
    timeWindow,                    // day | dusk | night；any 不受限
    lightLevel: randomInt(0, 3),   // 0 现场光 / 1 实用光 / 2 大灯组
    maxShots: randomInt(3, 9)      // 最终成片最多保留的镜头数
  }
}

const TIERS = [
  { min: 90, label: 'S', title: '受限中的创造' },
  { min: 80, label: 'A', title: '清醒的取舍' },
  { min: 68, label: 'B', title: '成立的妥协' },
  { min: 55, label: 'C', title: '勉强可执行' },
  { min: 0, label: 'D', title: '还没找到拍法' }
]

const evaluatePlan = (constraints, decisions) => {
  const beatMap = Object.fromEntries(shootScript.beats.map(b => [b.id, b]))
  const chosen = {}
  let rawComplexity = 0
  let lossPoints = 0
  let cutCount = 0
  let keepCount = 0
  let smartAdapt = 0
  const roles = new Set()
  let extrasNeeded = 0
  let shotsNeeded = 0
  const lightGaps = []

  for (const beat of shootScript.beats) {
    const action = decisions[beat.id]
    if (action === 'cut') {
      chosen[beat.id] = { action: 'cut' }
      lossPoints += beat.weight
      cutCount++
      continue
    }
    let plan = null
    if (action === 'keep') {
      plan = { kind: 'keep', label: '按原剧本拍摄', roles: beat.roles, extras: beat.extras, venue: beat.venue, time: beat.time, light: beat.light, shots: beat.shots, fidelity: 1, complexity: beat.baseComplexity }
      keepCount++
    } else {
      const adapt = beat.adaptations.find(a => a.id === action)
      if (!adapt) throw Object.assign(new Error('存在无效的改编方案'), { status: 400 })
      plan = { ...adapt, kind: 'adapt' }
      if (adapt.fidelity >= 0.6) smartAdapt++
    }
    chosen[beat.id] = { action: plan.kind, optionId: plan.kind === 'adapt' ? plan.id : null, label: plan.label }
    plan.roles.forEach(r => roles.add(r))
    extrasNeeded = Math.max(extrasNeeded, plan.extras)
    shotsNeeded += plan.shots
    rawComplexity += plan.complexity
    lossPoints += beat.weight * (1 - plan.fidelity)
    if (plan.kind === 'adapt') rawComplexity += 1 // 改编本身需要设计与沟通成本
    if (plan.light > constraints.lightLevel) lightGaps.push({ beat: beat.id, required: plan.light, available: constraints.lightLevel })
  }

  const castUsed = roles.size
  const castOver = Math.max(0, castUsed - constraints.actors)
  const extrasOver = Math.max(0, extrasNeeded - constraints.extras)
  const shotsOver = Math.max(0, shotsNeeded - constraints.maxShots)
  if (castOver) rawComplexity += castOver * 9
  if (extrasOver) rawComplexity += extrasOver * 4
  if (shotsOver) rawComplexity += shotsOver * 3
  // 灯不够不会让拍摄物理上停摆，但每个缺口都意味着布光妥协与画面风险
  rawComplexity += lightGaps.length * 5

  const complexityScore = Math.max(4, Math.round(100 - rawComplexity * (100 / 55)))
  const expressionLoss = Math.round(lossPoints)
  const retentionScore = 100 - expressionLoss

  // 不按成本最低评分：把全部砍掉（复杂度 0）的方案表达分为 0，总分自然垫底
  let score = Math.round(retentionScore * 0.62 + complexityScore * 0.38)
  // 高保真改编奖励：用巧思把“拍不起”变成“换一种说法”
  let ingenuity = 0
  if (smartAdapt >= 2) {
    ingenuity = Math.min(6, 2 + smartAdapt)
    score += ingenuity
  }
  // 演员、群演、镜头超支 = 物理上做不到；灯光不足只计代价，仍可“硬拍”
  const infeasible = Boolean(castOver || extrasOver || shotsOver)
  if (infeasible) score = Math.min(score, 54)
  score = Math.max(0, Math.min(100, score))

  const tier = TIERS.find(t => score >= t.min)

  // 导演式反馈：针对具体选择，而不是泛泛打分
  const notes = []
  if (cutCount === shootScript.beats.length) {
    notes.push('全部舍弃确实“零成本”，但银幕上将什么都不剩下——条件再差，导演的工作也是找出那个非拍不可的核。')
  } else {
    for (const beat of shootScript.beats) {
      const c = chosen[beat.id]
      if (c.action === 'cut' && beat.importance === 'key') {
        notes.push(`「${beat.title}」承担着关键表达（${beat.meaning}），舍弃它意味着你需要用别的部分补回这个功能——观众还接得住吗？`)
      } else if (c.action === 'adapt') {
        const adapt = beat.adaptations.find(a => a.id === c.optionId)
        notes.push(`「${beat.title}」改为「${adapt.label.replace(/：.*$/, '')}」——${adapt.note}`)
      }
    }
    if (keepCount === shootScript.beats.length) {
      notes.push('六个节拍全部按原剧本保留是最“贵”的拍法：如果条件真的允许，当然完整；但导演的价值往往正体现在没有条件的时候。')
    } else if (!infeasible && smartAdapt >= 2) {
      notes.push('你没有硬撑原方案，也没有简单放弃——把限制变成了新的表达方式，这正是片场里导演每天在做的事。')
    } else if (!infeasible && cutCount >= 3) {
      notes.push('方案很省，但连续的舍弃正在抽空这场戏的呼吸。问问自己：省下的镜头里，有没有其实换个拍法就能留下的？')
    }
  }
  if (lightGaps.length) notes.push(`有 ${lightGaps.length} 个节拍需要的灯光超出了现有条件，要么换拍法，要么接受无法掌控的画面风险。`)
  if (castOver) notes.push(`演员超员 ${castOver} 人：临时加人在真实片场意味着档期、预算与排期的连锁代价。`)
  if (extrasOver) notes.push(`群演超员 ${extrasOver} 人。`)
  if (shotsOver) notes.push(`镜头数超出上限 ${shotsOver} 个：成片时长与剪辑节奏都会失控，试着合并或取舍。`)
  if (!infeasible && cutCount < shootScript.beats.length) notes.push('方案在现有条件下可执行。最后确认一件事：观众离开时，心里留下的东西还在吗？')

  return {
    score, tier: tier.label, tierTitle: tier.title,
    complexityScore, expressionLoss, retentionScore, ingenuity,
    usage: { cast: castUsed, castLimit: constraints.actors, extras: extrasNeeded, extrasLimit: constraints.extras, shots: shotsNeeded, shotsLimit: constraints.maxShots, lightGaps: lightGaps.length },
    flags: { infeasible, castOver, extrasOver, shotsOver, lightShortage: lightGaps.length, cutCount, keepCount, adaptCount: shootScript.beats.length - cutCount - keepCount },
    notes
  }
}

const serializeMission = (row) => {
  const decisionRow = db.prepare('SELECT decisions, strategy, result, created_at as decidedAt FROM shoot_condition_decision WHERE mission_id=?').get(row.id)
  return {
    id: row.id,
    seed: row.seed,
    constraints: JSON.parse(row.constraints),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    decided: Boolean(decisionRow),
    decidedAt: decisionRow?.decidedAt || null,
    decisions: decisionRow ? JSON.parse(decisionRow.decisions) : null,
    strategy: decisionRow?.strategy || '',
    result: decisionRow ? JSON.parse(decisionRow.result) : null
  }
}

// 随机条件只在服务端生成一次，并随任务落库；前端刷新只会取回同一条任务
const ensureDailyMission = () => {
  const seed = new Date().toISOString().slice(0, 10)
  let row = db.prepare('SELECT * FROM shoot_condition_mission WHERE seed=?').get(seed)
  if (!row) {
    const now = new Date().toISOString()
    db.prepare('INSERT INTO shoot_condition_mission (seed, constraints, created_at, updated_at) VALUES (?, ?, ?, ?)')
      .run(seed, JSON.stringify(generateConstraints()), now, now)
    row = db.prepare('SELECT * FROM shoot_condition_mission WHERE seed=?').get(seed)
  }
  return row
}

const clipText = (value, max = 80) => {  const text = String(value ?? '').trim()
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

// 「拍摄条件决策」模拟 API
app.get('/api/shoot/script', (_, res) => res.json(publicScript()))
app.post('/api/shoot/missions', (_, res) => {
  const row = ensureDailyMission()
  res.status(201).json(serializeMission(row))
})
app.get('/api/shoot/missions/latest', (_, res) => {
  const seed = new Date().toISOString().slice(0, 10)
  const row = db.prepare('SELECT * FROM shoot_condition_mission WHERE seed=?').get(seed)
  if (!row) return res.status(404).json({ error: 'today mission not created yet' })
  res.json(serializeMission(row))
})
app.get('/api/shoot/missions', (_, res) => {
  const rows = db.prepare('SELECT m.*, d.result FROM shoot_condition_mission m LEFT JOIN shoot_condition_decision d ON d.mission_id=m.id ORDER BY m.id DESC LIMIT 14').all()
  res.json(rows.map(row => ({
    id: row.id,
    seed: row.seed,
    constraints: JSON.parse(row.constraints),
    createdAt: row.created_at,
    decided: Boolean(row.result),
    result: row.result ? JSON.parse(row.result) : null
  })))
})
app.get('/api/shoot/missions/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM shoot_condition_mission WHERE id=?').get(Number(req.params.id))
  if (!row) return res.status(404).json({ error: 'mission not found' })
  res.json(serializeMission(row))
})
app.put('/api/shoot/missions/:id/decision', (req, res) => {
  const row = db.prepare('SELECT * FROM shoot_condition_mission WHERE id=?').get(Number(req.params.id))
  if (!row) return res.status(404).json({ error: 'mission not found' })
  const constraints = JSON.parse(row.constraints)
  const incoming = req.body?.decisions
  const strategy = String(req.body?.strategy ?? '').trim()
  if (!incoming || typeof incoming !== 'object') return res.status(400).json({ error: 'decisions object is required' })
  if (strategy.length < 8) return res.status(400).json({ error: '先写下你的整体策略：在这些限制下，你最想保住的是什么？' })

  const decisions = {}
  for (const beat of shootScript.beats) {
    const action = incoming[beat.id]
    if (!['keep', 'cut'].includes(action) && !beat.adaptations.some(a => a.id === action)) {
      return res.status(400).json({ error: `「${beat.title}」还没有做出决定` })
    }
    // 硬约束校验：保留/改编所需的场地与时间窗必须在条件内（“any”不受限）
    const plan = action === 'keep'
      ? { venue: beat.venue, time: beat.time }
      : action === 'cut'
        ? null
        : (() => { const a = beat.adaptations.find(x => x.id === action); return { venue: a.venue, time: a.time } })()
    if (plan) {
      if (plan.venue !== 'any' && !constraints.venues.includes(plan.venue)) {
        return res.status(400).json({ error: `「${beat.title}」需要的场地不在可用范围内，这个拍法在当前条件下无法执行` })
      }
      if (plan.time !== 'any' && constraints.timeWindow === 'day' && plan.time === 'night') {
        return res.status(400).json({ error: `「${beat.title}」需要夜戏，但今天只有白天的拍摄窗口` })
      }
      if (plan.time !== 'any' && constraints.timeWindow === 'night' && plan.time === 'day') {
        return res.status(400).json({ error: `「${beat.title}」需要日戏，但今天只有夜间的拍摄窗口` })
      }
    }
    decisions[beat.id] = action
  }

  let result
  try { result = evaluatePlan(constraints, decisions) }
  catch (error) { return res.status(error.status || 400).json({ error: error.message }) }

  const existed = db.prepare('SELECT id FROM shoot_condition_decision WHERE mission_id=?').get(row.id)
  const now = new Date().toISOString()
  if (existed) {
    db.prepare('UPDATE shoot_condition_decision SET decisions=?, strategy=?, result=?, updated_at=? WHERE mission_id=?')
      .run(JSON.stringify(decisions), strategy.slice(0, 2000), JSON.stringify(result), now, row.id)
  } else {
    db.prepare('INSERT INTO shoot_condition_decision (mission_id, decisions, strategy, result, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(row.id, JSON.stringify(decisions), strategy.slice(0, 2000), JSON.stringify(result), now, now)
  }
  db.prepare('UPDATE shoot_condition_mission SET updated_at=? WHERE id=?').run(now, row.id)
  res.status(existed ? 200 : 201).json(serializeMission(db.prepare('SELECT * FROM shoot_condition_mission WHERE id=?').get(row.id)))
})

// 「导演现场决策」状态机 API
const serializeOnsetRun = (row) => {
  const state = JSON.parse(row.state)
  const path = JSON.parse(row.path)
  const node = onsetGraph.nodes[row.current_node]
  const result = row.result ? JSON.parse(row.result) : null
  return {
    id: row.id,
    status: row.status,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    finishedAt: row.finished_at || null,
    currentNode: row.current_node,
    node: publicOnsetNode(node, state),
    state,
    path,
    tallies: tallyOnsetPath(path),
    result
  }
}

app.get('/api/onset/graph', (_, res) => {
  const initial = initialOnsetState()
  res.json({ start: onsetGraph.start, categoryMeta: onsetGraph.categoryMeta, initial, node: publicOnsetNode(onsetGraph.nodes[onsetGraph.start], initial) })
})
app.get('/api/onset/runs/latest', (_, res) => {
  const row = db.prepare("SELECT * FROM onsite_run WHERE status='active' ORDER BY id DESC LIMIT 1").get()
  if (!row) return res.status(404).json({ error: 'no active run' })
  res.json(serializeOnsetRun(row))
})
app.post('/api/onset/runs', (req, res) => {
  // 一次只推进一场：已存在进行中的运行时直接回到它，不另开副本
  if (!req.query.fresh) {
    const existing = db.prepare("SELECT * FROM onsite_run WHERE status='active' ORDER BY id DESC LIMIT 1").get()
    if (existing) return res.status(200).json(serializeOnsetRun(existing))
  } else if (process.env.LAB_TEST !== '1') {
    return res.status(403).json({ error: 'fresh runs disabled' })
  }
  const now = new Date().toISOString()
  const initialState = initialOnsetState()
  const result = db.prepare("INSERT INTO onsite_run (status, current_node, state, path, result, started_at, updated_at) VALUES ('active', ?, ?, ?, NULL, ?, ?)")
    .run(onsetGraph.start, JSON.stringify(initialState), JSON.stringify([]), now, now)
  res.status(201).json(serializeOnsetRun(db.prepare('SELECT * FROM onsite_run WHERE id=?').get(result.lastInsertRowid)))
})
app.get('/api/onset/runs', (_, res) => {
  const rows = db.prepare("SELECT * FROM onsite_run WHERE status='finished' ORDER BY id DESC LIMIT 12").all()
  res.json(rows.map(row => {
    const result = JSON.parse(row.result)
    return {
      id: row.id,
      finishedAt: row.finished_at,
      profileTitle: result.profileTitle,
      kind: result.kind,
      decisions: result.decisions,
      protect: result.tallies.protect,
      adapt: result.tallies.adapt,
      intent: result.state.intent,
      craft: result.state.craft
    }
  }))
})
app.get('/api/onset/runs/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM onsite_run WHERE id=?').get(Number(req.params.id))
  if (!row) return res.status(404).json({ error: 'run not found' })
  res.json(serializeOnsetRun(row))
})
app.post('/api/onset/runs/:id/continue', (req, res) => {
  const row = db.prepare('SELECT * FROM onsite_run WHERE id=?').get(Number(req.params.id))
  if (!row) return res.status(404).json({ error: 'run not found' })
  if (row.status !== 'active') return res.status(409).json({ error: '这一场已经杀青' })
  let next
  try {
    next = continueOnset({ currentNode: row.current_node, state: JSON.parse(row.state), path: JSON.parse(row.path) })
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message })
  }
  const now = new Date().toISOString()
  db.prepare('UPDATE onsite_run SET current_node=?, updated_at=? WHERE id=?').run(next.currentNode, now, row.id)
  res.status(200).json(serializeOnsetRun(db.prepare('SELECT * FROM onsite_run WHERE id=?').get(row.id)))
})
app.post('/api/onset/runs/:id/decision', (req, res) => {
  const row = db.prepare('SELECT * FROM onsite_run WHERE id=?').get(Number(req.params.id))
  if (!row) return res.status(404).json({ error: 'run not found' })
  if (row.status !== 'active') return res.status(409).json({ error: '这一场已经杀青，不能再改决定' })
  const choiceId = String(req.body?.choiceId ?? '')
  let advanced
  try {
    advanced = advanceOnset({ currentNode: row.current_node, state: JSON.parse(row.state), path: JSON.parse(row.path) }, choiceId)
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message })
  }
  const now = new Date().toISOString()
  const finished = Boolean(advanced.result)
  db.prepare('UPDATE onsite_run SET status=?, current_node=?, state=?, path=?, result=?, updated_at=?, finished_at=? WHERE id=?')
    .run(finished ? 'finished' : 'active', advanced.currentNode, JSON.stringify(advanced.state), JSON.stringify(advanced.path),
      advanced.result ? JSON.stringify(advanced.result) : null, now, finished ? now : null, row.id)
  res.status(200).json(serializeOnsetRun(db.prepare('SELECT * FROM onsite_run WHERE id=?').get(row.id)))
})

app.use('/api', (_, res) => res.status(404).json({ error: 'API route not found' }))
app.use(express.static(path.join(__dirname, 'dist')))
app.use((_, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))
app.listen(3001, () => console.log('Director lab API listening on http://localhost:3001'))
