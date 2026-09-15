/* ---------------- 导演现场决策 · 状态机 ---------------- */
// 设计原则：剧情是一张声明式的节点/转移图，引擎只做通用动作——
// 守卫判定、应用效果、状态转移、崩溃闸门、结局画像。新增剧情只加数据，不写 if/else。
//
// 节点类型：
//   brief    开场说明，单一自动转移
//   incident 突发事件，用户必须且只能选择一种处理方式
//   beat     上一选择引出的分支后果，同样是一次强制单选
//   finale   终局（可由崩溃闸门强制进入），由 profiles 按状态匹配画像
//
// 选择（choice）：
//   stance  'protect' 守护原始创作意图 | 'adapt' 为现场条件主动改变方案
//   guard   不可选条件（如加班费需要士气 ≥ 30 才谈得下来）
//   effects 对现场状态的增减：time(分钟,支出为负) / morale / intent / craft / flags
//   next    转移目标节点 id

const ONSET_START_TIME = 120 // 今夜总拍摄时长（分钟）
const ONSET_TIME_GUARD = 35 // 剩余时间低于此值时，耗时处理已谈不下来
const ONSET_OVERTIME_MORALE_GUARD = 25 // 全组累到这个士气以下，加班费也喊不动人
const ONSET_COLLAPSE_MORALE = 18 // 杀青时士气低于此值，片场在天亮前停摆

const onsetGraph = {
  start: 'brief',
  categoryMeta: {
    actor:   { label: '演员状态', icon: 'users' },
    noise:   { label: '场地噪音', icon: 'volume' },
    weather: { label: '天气变化', icon: 'cloud' },
    prop:    { label: '道具损坏', icon: 'package' },
    time:    { label: '时间不足', icon: 'clock' },
    branch:  { label: '连锁反应', icon: 'gitbranch' }
  },
  nodes: {
    brief: {
      type: 'brief',
      code: 'CALL SHEET 08',
      title: '今夜，按原计划开机',
      body: '《等不到的人》进入实拍夜。剧本围读过、分镜画过、演员也排练到位——你对这场戏要什么心里有数。\n但片场从不按分镜运行。接下来的几个小时，状况会自己找上门：每一次，你只能选一种处理方式，选完就继续往下拍，没有撤换键。\n全组都在等你的那声“开机”。',
      next: 'incident-actor'
    },

    /* —— 事件一：演员状态 —— */
    "incident-actor": {
      type: 'incident',
      category: 'actor',
      code: 'EVENT 01',
      title: '男一号突然崩不住了',
      body: '开机前 20 分钟，饰演“约定的人”的男演员把自己锁进休息车里。助理导演小声回报：下午和家里吵翻了，他现在“一个表情都不想给”。\n他是“站台回忆”和结尾视线交接的核心——今晚所有重场戏都压在他身上。',
      choices: [
        {
          id: 'wait-reset', label: '推迟一小时开机，等他把状态捡回来',
          note: '他是戏的核心，宁可吃时间也要等他回到角色里。',
          stance: 'protect', guard: { timeMin: 80 },
          effects: { time: -48, morale: -14 }, outcomeTitle: '一小时后，他走出休息车',
          outcome: '等待里全组无所事事，怨气在悄悄涨。他终于出现，没说话，但第一场戏眼神是对的——你保住了那个完整的人，也让整个剧组陪你耗掉了一小时。',
          next: 'incident-noise'
        },
        {
          id: 'talk-reset', label: '亲自进休息车谈十分钟，带他走一遍人物的此刻',
          note: '用导演和演员之间的工作解决状态问题，不动排期。',
          stance: 'protect',
          effects: { time: -12, morale: 2 }, outcomeTitle: '他擦掉脸，说“再来一次”',
          outcome: '你没有安慰他，只和他过了一遍“那个人为什么会回来”。他点点头，带着一点没散的私人情绪走进光里——这恰好是角色需要的。',
          next: 'incident-noise'
        },
        {
          id: 'no-face', label: '不等了：改写分镜，让他只以画外音和局部出镜',
          note: '今晚先拍没有他正脸的方案：背影、递围巾的手、画外的一句“我很快回来”。',
          stance: 'adapt',
          effects: { time: -6, intent: -12, craft: 16, flags: { noFace: true } }, outcomeTitle: '正脸被从今夜的分镜里拿掉',
          outcome: '你当场重画了通告单：他可以不出脸，但戏不能塌。声音、手、影子——你开始把一个“缺席的人”拍进画面。',
          next: 'beat-actor-loop'
        }
      ]
    },
    // no-face 引出的分支：转场间隙，男演员状态回升
    'beat-actor-loop': {
      type: 'beat',
      category: 'branch',
      code: 'AFTER 01',
      title: '转场间隙，他来敲门',
      body: '拍完画外音那段，凌晨一点，男演员主动找到监视器前：情绪过去了，他想把白天站台的正脸补回来。\n补拍要重新布光、重排调度，但他此刻的状态，是这一整夜最好的一次。',
      choices: [
        {
          id: 'keep-noface', label: '维持改后方案，把好状态用在声音戏上',
          note: '改方案已经成立，不为一个“更好”推翻全组重新适应的节奏。',
          stance: 'adapt',
          effects: { time: -5, morale: 8, intent: -4, craft: 8 }, outcomeTitle: '他把那句台词录到了最好的一遍',
          outcome: '你对他说：今晚的你，活在声音里。他在录音棚里把“我很快回来”读得很轻，轻得像一句真会被辜负的承诺。',
          next: 'incident-noise'
        },
        {
          id: 'restore-face', label: '立刻重布光，趁状态补回站台正脸',
          note: '这是夺回原始设计的窗口——演员和光都在，值得赌。',
          stance: 'protect', guard: { timeMin: ONSET_TIME_GUARD },
          effects: { time: -34, morale: -4, intent: 10 }, outcomeTitle: '凌晨一点，站台在店里被重新搭起来',
          outcome: '全组折返重布光，灯位、走位、调度全部重来。疲惫写在每个人脸上，但监视器里出现了那个完整的、会回来的人。',
          next: 'incident-noise'
        }
      ]
    },

    /* —— 事件二：场地噪音 —— */
    "incident-noise": {
      type: 'incident',
      category: 'noise',
      code: 'EVENT 02',
      title: '隔壁突然开始装修',
      body: '刚拍到店内对话，隔壁门面半夜赶工：电钻声整面墙地透过来，周期性盖过演员的气音。\n这场“欲言又止”的戏靠的全是声音的细处。录音师摘下耳机，看着你。',
      choices: [
        {
          id: 'pay-quiet', label: '制片出面，付一笔停工费请隔壁收工',
          note: '花钱买回安静，原分镜、同期声都不动。',
          stance: 'protect',
          effects: { time: -14, morale: -6 }, outcomeTitle: '电钻在十五分钟后停了',
          outcome: '隔壁将信将疑地收了工。深夜重新安静下来，演员那句没说完的话，终于能被一根针掉地似的听见。',
          next: 'incident-weather'
        },
        {
          id: 'embrace-noise', label: '不躲：让电钻进入声音设计，压过那句“没事”',
          note: '她开口的瞬间，噪音恰好替她说不出口——世界从不为等待者安静。',
          stance: 'adapt',
          effects: { time: -4, intent: -2, craft: 20, morale: 4 }, outcomeTitle: '噪音变成了角色的处境',
          outcome: '你让录音师不要躲电钻，反而请它“按节奏来”。她那句“没事”被轰鸣整个吞掉——剪辑台上，这可能是全片最残忍的一次失语。',
          next: 'incident-weather'
        },
        {
          id: 'post-dub', label: '放弃同期声，所有台词改为后期配音',
          note: '现场只拍画面，声音以后补——但她此刻脸上的东西，棚里未必还找得回来。',
          stance: 'adapt',
          effects: { time: 22, intent: -14, craft: 2, flags: { adr: true } }, outcomeTitle: '现场变成了一场无声的表演',
          outcome: '现场不收音了，进度反而快起来。只是你盯着监视器知道：她此刻哽住的那半秒，日后要在录音棚里重新活一遍。',
          next: 'incident-weather'
        }
      ]
    },

    /* —— 事件三：天气变化 —— */
    "incident-weather": {
      type: 'incident',
      category: 'weather',
      code: 'EVENT 03',
      title: '雨，提前停了',
      body: '天气预报说下到凌晨三点，雨却在零点前停了。地开始干，玻璃上的水痕在退，而“雨夜”是这部短片的空气本身——片名、情绪、空街与结尾的雨幕，全都建立在雨上。\n制片问：还按原计划拍吗？',
      choices: [
        {
          id: 'water-truck', label: '调来洒水车，重造一场雨',
          note: '雨夜是创作的地基，用技术把它买回来。',
          stance: 'protect', guard: { timeMin: ONSET_TIME_GUARD },
          effects: { time: -30, morale: -12 }, outcomeTitle: '人造雨落了下来',
          outcome: '等车、接管、调试水压耗掉大半小时。雨是假的，但在镜头里是真的——玻璃重新糊满水，她又被放回了那场雨里。',
          next: 'incident-prop'
        },
        {
          id: 'after-rain', label: '改写设定：拍“雨刚停之后”的世界',
          note: '湿漉漉的地面、屋檐滴水、她呼出的白气——把失去的雨变成雨的余韵。',
          stance: 'adapt',
          effects: { time: -8, intent: -8, craft: 16 }, outcomeTitle: '雨退场了，湿意留下了',
          outcome: '你迅速改了镜头顺序，先抢地面反光，再拍滴水的屋檐。没有雨的夜更冷了——她等的不是雨中的人，是一个连雨都停了之后还没来的人。',
          next: 'incident-prop'
        },
        {
          id: 'wet-zone', label: '只造湿：水管浇透门口三米地，镜头绝不抬远',
          note: '守住门口的关键雨意，放弃整条街的雨景。',
          stance: 'adapt',
          effects: { time: -14, intent: -6, craft: 8 }, outcomeTitle: '镜头里有了一小片湿',
          outcome: '门口三米被浇得湿透，反光刚好托住她的鞋尖。景别被死死按在局部——空街的尺度没了，但那个停住的位置保住了。',
          next: 'incident-prop'
        }
      ]
    },

    /* —— 事件四：道具损坏 —— */
    "incident-prop": {
      type: 'incident',
      category: 'prop',
      code: 'EVENT 04',
      title: '关键道具：围巾毁了',
      body: '那条旧围巾是全片的道具核心——站台回忆里他替她围上，结尾她留在柜台上的也是它。\n场工慌乱地跑来：转场时围巾被灯架勾破，又被地上的积水浸透，颜色洇开，已经没法上镜。',
      choices: [
        {
          id: 'find-replace', label: '全城找一条同款旧围巾，赶回来再拍',
          note: '道具的意义不能将就，戏等它。',
          stance: 'protect', guard: { timeMin: ONSET_TIME_GUARD },
          effects: { time: -32, morale: -12 }, outcomeTitle: '道具组冲进了凌晨的城市',
          outcome: '两个助理跑遍夜市和旧衣摊，在四十分钟后带回一条颜色几乎一致的旧围巾。镜头分不出来——但全组都知道，刚才那四十分钟有多贵。',
          next: 'incident-time'
        },
        {
          id: 'wear-damage', label: '不换：把破与湿变成戏——这是一条被攥了整夜的围巾',
          note: '损坏给物件加上经历，她为什么把它攥成这样，观众会自己补。',
          stance: 'adapt',
          effects: { time: -4, intent: -2, craft: 18, morale: 4 }, outcomeTitle: '破损被写进了人物',
          outcome: '你举起那条湿围巾看了很久，然后让造型把破口处理得更像旧伤。结尾她留下它时，那条围巾看起来已经被等待磨坏了——比原样更对。',
          next: 'incident-time'
        },
        {
          id: 'swap-ticket', label: '换道具：用一张旧票根承担约定',
          note: '围巾的戏分全部转给站台票根，特写、留下、回忆，都靠它。',
          stance: 'adapt',
          effects: { time: -10, intent: -18, craft: 6 }, outcomeTitle: '围巾退场，票根上场',
          outcome: '分镜里所有围巾的位置被一张旧票根替掉。约定的“触感”没了，变成一个更冷的证据：他留下的只是一张票。',
          next: 'incident-time'
        }
      ]
    },

    /* —— 事件五：时间不足 —— */
    "incident-time": {
      type: 'incident',
      category: 'time',
      code: 'EVENT 05',
      title: '天光前的最后窗口，两个重场没拍',
      body: '天色将亮，留给夜戏的时间只剩最后一个短窗口：开场“空街走来”与结尾“走进雨里”都还没拍——一头一尾，是这部短片的呼吸。\n制片拿着手机等你发话：加钱续时，还是现在做减法？',
      choices: [
        {
          id: 'overtime', label: '加钱留人，两个镜头都按原计划拍完',
          note: '开场的空与结尾的空互相照应，一个都不能少。',
          stance: 'protect',
          guard: { moraleMin: ONSET_OVERTIME_MORALE_GUARD, timeMin: 1 },
          effects: { time: -45, morale: -21, intent: 8 }, outcomeTitle: '全组留了下来，把夜熬穿',
          outcome: '钱谈下来了，人没走，但每个人都在透支边缘。清晨五点，她终于从空街走来，又在同一身疲惫里走进雨里。两头的“空”都在——监视器后没人有力气说话。',
          next: 'finale-wrap'
        },
        {
          id: 'cut-opening', label: '保结尾：放弃开场空街，只拍她走进雨里',
          note: '结尾是观众带走的最后一个画面；开场可以靠声音补。',
          stance: 'protect',
          effects: { time: 2, intent: -10, craft: 4 }, outcomeTitle: '开场留在了剧本里',
          outcome: '你在 30 秒内划掉了开场。结尾那条她走进雨里的长镜头拍得很稳，稳得像全片本该只有这一口气。',
          next: 'finale-wrap'
        },
        {
          id: 'merge-take', label: '合成一个镜头：从门口出发，绕街一圈，再走回门口',
          note: '让出发与离开在同一个长镜头里首尾相衔——一次走动，同时是开始和结束。',
          stance: 'adapt',
          effects: { time: 6, intent: -8, craft: 18, morale: 6 }, outcomeTitle: '开始与结束被缝进了同一口气',
          outcome: '你临时设计了一个环绕长镜：她从门口走进空街，镜头不切，跟着她绕了一圈，又回到门口推门。分不清这是抵达还是离开——这或许正是等待的形状。',
          next: 'finale-wrap'
        }
      ]
    },

    /* —— 终局 —— */
    'finale-wrap': {
      type: 'finale',
      gate: { moraleBelow: ONSET_COLLAPSE_MORALE, to: 'finale-collapse' },
      code: 'WRAP',
      title: '天亮了，杀青',
      body: '灯一盏盏熄灭，器材箱扣上的声音此起彼伏。你坐在监视器前回看粗剪：这还是不是昨晚围读时的那部电影？\n答案写在你一路做出的每个选择里。',
      profiles: [
        { match: { protectMin: 4 }, title: '原旨守门人',
          summary: '一整夜，你几乎没让现实改动分镜。演员要等、雨要造、围巾要找回来、夜要加钱熬穿——你把“原本要拍的东西”护到了最后。',
          reading: '强保护路径：创作意图被完整守住，代价由全组的时间与士气承担。守住初衷是导演的骨气；也要看清，哪些坚持是为了电影，哪些只是不肯和意外谈判。' },
        { match: { adaptMin: 4, craftMin: 55, intentMin: 50 }, title: '现场作者',
          summary: '你没有死守分镜，而是把每一次意外改写成表达：噪音成了失语，破损成了经历，首尾合成了同一口气。',
          reading: '高应变·高创造：改变方案不是退让，而是换一种说法，并且新说法保住了原表达的功能。这正是片场最稀缺的能力——在失控里继续创作。' },
        { match: { adaptMin: 4 }, title: '顺势转弯者',
          summary: '你一路顺着现场条件改方案，片子顺利拍完了。但回头看，有些转弯是创作，有些只是图省事。',
          reading: '高应变·表达折损：现场都活下来了，原始意图却在一次次“算了”里被磨薄。问自己：如果条件全都齐备，你还会这样拍吗？' },
        { match: { intentMin: 68 }, title: '清醒的权衡者',
          summary: '你在该守的地方寸步不让，在能放的地方当场放手。被改掉的和被保住的，都看得出理由。',
          reading: '均衡路径：你清楚这场戏的核是什么——核在，手法可以谈；核不在，再省也不拍。取舍本身，就是导演的语言。' },
        { match: {}, title: '随波逐流的一夜',
          summary: '这一夜你做了许多决定，但它们更像被状况推着走，而不是出于某个一以贯之的判断。',
          reading: '立场摇摆：既没有坚定地守住什么，也没有把意外发展成新的表达。下一次，试着在开机前先回答：无论发生什么，我绝不放弃的那一格画面是什么？' }
      ],
      axisLabels: { protect: '守护原始意图', adapt: '为现场改变方案' }
    },
    'finale-collapse': {
      type: 'finale',
      code: 'WRAP · COLLAPSE',
      title: '片场在天亮前停摆',
      body: '连续的坚持耗尽了这支队伍。最后通告没人应声，灯自己灭了——不是你选择杀青，是拍摄停止了。',
      profiles: [
        { match: {}, title: '意图的废墟',
          summary: '你保住了每一个“应该这么拍”，却把执行它们的人熬到了极限。意图完好无损地躺在一份没有完成的通告单上。',
          reading: '守护初衷不等于无视现场：导演的工作对象不只有剧本，还有时间、天气、器材和一群会累的人。再好的意图，也要有人有力气把它拍出来。' }
      ],
      axisLabels: { protect: '守护原始意图', adapt: '为现场改变方案' }
    }
  }
}

// —— 纯函数引擎：与具体剧情无关，任何节点图都能驱动 ——

const choiceStance = (node, choiceId) => node.choices?.find(c => c.id === choiceId)?.stance || null

const guardFail = (guard, state) => {
  if (!guard) return null
  if (Number.isFinite(guard.timeMin) && state.time < guard.timeMin) return '剩余时间已经不够，这个处理方式今晚谈不下来了'
  if (Number.isFinite(guard.moraleMin) && state.morale < guard.moraleMin) return '全组士气已经太低，这个命令此刻喊不动人'
  if (guard.flagIs && !state.flags[guard.flagIs]) return '现场还没有走到这一步'
  return null
}

// 供前端预览的不可选原因
const choiceBlockedReason = (choice, state) => guardFail(choice.guard, state)

const applyEffects = (state, effects) => {
  const next = { ...state, flags: { ...state.flags } }
  if (Number.isFinite(effects.time)) next.time = Math.max(0, next.time + effects.time)
  if (Number.isFinite(effects.morale)) next.morale = Math.max(0, Math.min(100, next.morale + effects.morale))
  if (Number.isFinite(effects.intent)) next.intent = Math.max(0, Math.min(100, next.intent + effects.intent))
  if (Number.isFinite(effects.craft)) next.craft = Math.max(0, Math.min(100, next.craft + effects.craft))
  if (effects.flags) Object.assign(next.flags, effects.flags)
  return next
}

const profileFor = (node, state, tallies) => {
  const ctx = { ...state, ...tallies }
  const predicates = {
    protectMin: (v) => tallies.protect >= v,
    adaptMin: (v) => tallies.adapt >= v,
    intentMin: (v) => state.intent >= v,
    craftMin: (v) => state.craft >= v,
    moraleMin: (v) => state.morale >= v
  }
  return node.profiles.find(p => Object.entries(p.match).every(([k, v]) => predicates[k]?.(v)))
}

// 非交互节点（开场说明）的继续转移：不改变状态、不记入决策路径
const continueOnset = (run) => {
  const node = onsetGraph.nodes[run.currentNode]
  if (!node || node.type !== 'brief') throw Object.assign(new Error('当前节点不能继续'), { status: 409 })
  return { state: run.state, path: run.path, currentNode: node.next, node: onsetGraph.nodes[node.next], result: null }
}

// 一次决策：校验 → 应用效果 → 转移 → 崩溃闸门 → （终局）画像。返回需要持久化的全部内容。
const advanceOnset = (run, choiceId) => {
  const node = onsetGraph.nodes[run.currentNode]
  if (!node || !['incident', 'beat'].includes(node.type)) throw Object.assign(new Error('当前节点不接受决策'), { status: 409 })
  const choice = node.choices.find(c => c.id === choiceId)
  if (!choice) throw Object.assign(new Error('不存在的处理方式'), { status: 400 })
  const blocked = guardFail(choice.guard, run.state)
  if (blocked) throw Object.assign(new Error(blocked), { status: 409 })

  const state = applyEffects(run.state, choice.effects)
  const path = [...run.path, {
    nodeId: node.id, code: node.code, category: node.category || null, title: node.title,
    choiceId: choice.id, choiceLabel: choice.label, stance: choice.stance,
    outcomeTitle: choice.outcomeTitle, outcome: choice.outcome, at: new Date().toISOString()
  }]
  const tallies = path.reduce((acc, step) => { acc[step.stance] = (acc[step.stance] || 0) + 1; return acc }, { protect: 0, adapt: 0 })

  let currentNode = choice.next
  let result = null
  let current = onsetGraph.nodes[currentNode]
  // 终局崩溃闸门：终局节点声明式标注士气阈值，低于它强制转入崩盘结局
  if (current?.type === 'finale' && current.gate && state.morale < current.gate.moraleBelow) {
    currentNode = current.gate.to
    current = onsetGraph.nodes[currentNode]
  }
  if (current?.type === 'finale') {
    const profile = profileFor(current, state, tallies)
    result = {
      kind: currentNode === 'finale-collapse' ? 'collapse' : 'wrap',
      code: current.code, title: current.title, body: current.body,
      profileTitle: profile.title, summary: profile.summary, reading: profile.reading,
      axisLabels: current.axisLabels,
      state, tallies,
      decisions: path.length
    }
  }
  return { state, path, tallies, currentNode, node: current, result }
}

// —— 对外（前端）的图与节点：隐去效果数值与结局画像，避免照着数字解题 ——
const publicOnsetChoice = (choice, state) => ({
  id: choice.id, label: choice.label, note: choice.note, stance: choice.stance,
  blockedReason: choiceBlockedReason(choice, state)
})

const publicOnsetNode = (node, state) => {
  if (node.type === 'incident' || node.type === 'beat') {
    return { type: node.type, code: node.code, category: node.category || null, title: node.title, body: node.body,
      choices: node.choices.map(c => publicOnsetChoice(c, state)) }
  }
  if (node.type === 'brief') {
    return { type: 'brief', code: node.code, title: node.title, body: node.body }
  }
  return { type: 'finale', code: node.code, title: node.title, body: node.body }
}

const tallyOnsetPath = (path) =>
  path.reduce((acc, step) => { acc[step.stance] = (acc[step.stance] || 0) + 1; return acc }, { protect: 0, adapt: 0 })

const initialOnsetState = () => ({ time: ONSET_START_TIME, morale: 70, intent: 100, craft: 0, flags: {} })

export { onsetGraph, ONSET_START_TIME, ONSET_TIME_GUARD, ONSET_OVERTIME_MORALE_GUARD, ONSET_COLLAPSE_MORALE, advanceOnset, continueOnset, publicOnsetNode, tallyOnsetPath, initialOnsetState }
