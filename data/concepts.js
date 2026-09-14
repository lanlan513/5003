// 电影语言基础概念课程数据 —— 由后端统一管理，前端通过 /api/film-language/concepts 获取。
// 每个概念对应一个具体电影场景；每个镜头方案包含：
//   label    方案名称
//   brief    方案简述
//   feeling  这种处理可能带来的观看感受
//   analysis 导演分析（用户提交自己的判断后展示）
//   visual   前端画面渲染参数（驱动 SVG 场景变化）

export const concepts = [
  {
    id: 'shot-size',
    order: 1,
    name: '景别',
    en: 'SHOT SIZE',
    definition: '景别是被摄主体在画面中所占的范围。它决定观众与人物的心理距离：越远越客观，越近越亲密。',
    scene: {
      title: '雨夜便利店',
      slugline: 'EXT. 便利店门口 — 雨夜 23:47',
      story: '女孩在便利店门口等一个没有出现的人。雨一直下。'
    },
    options: [
      {
        id: 'extreme-wide',
        label: '大远景',
        brief: '她只是空旷街角里的一个小点。',
        feeling: '孤独先于人物抵达。观众像路人一样远远看着，被礼貌地拒之门外。',
        analysis: '大远景把情绪交给空间。人物越小，等待越像一种处境而非表情——适合一场戏的开端，让观众先进入世界，再进入人。',
        visual: { zoom: 1, focusX: 200, focusY: 120 }
      },
      {
        id: 'full',
        label: '全景',
        brief: '从头到脚，她和整个便利店门口。',
        feeling: '我们看清她的姿态和处境，仍保持观察者的距离。',
        analysis: '全景是陈述句：交代谁、在哪、做什么。它建立地理关系，为后续更近的景别积蓄势能。',
        visual: { zoom: 1.7, focusX: 250, focusY: 150 }
      },
      {
        id: 'medium',
        label: '中景',
        brief: '腰部以上，门和灯光退成背景。',
        feeling: '距离被拉近，我们开始注意她的动作和犹豫。',
        analysis: '中景是对话的景别。它把注意力从环境收回到人的行动上，是叙事推进时最常用、也最隐形的选择。',
        visual: { zoom: 2.6, focusX: 250, focusY: 136 }
      },
      {
        id: 'close-up',
        label: '特写',
        brief: '只剩她握着手机的手和半张脸。',
        feeling: '没有退路地贴近。每一次呼吸都被放大，等待变成煎熬。',
        analysis: '特写是强调，用得越少越有力——它告诉观众这一秒很重要。一场戏里第一个特写出现的位置，就是导演的重音。',
        visual: { zoom: 4.2, focusX: 253, focusY: 133 }
      }
    ]
  },
  {
    id: 'angle',
    order: 2,
    name: '机位',
    en: 'CAMERA ANGLE',
    definition: '机位是摄影机相对被摄主体的高度与角度。角度即态度——它悄悄规定了观众看谁、怎么看。',
    scene: {
      title: '审讯室',
      slugline: 'INT. 审讯室 — 深夜',
      story: '侦探与嫌疑人隔着一张铁桌，谁都没有先开口。'
    },
    options: [
      {
        id: 'high',
        label: '俯拍嫌疑人',
        brief: '摄影机从上方压下来。',
        feeling: '他被压在画面底部，渺小、无处可逃，我们几乎在审视他。',
        analysis: '俯拍削弱主体，权力在镜头这一边——即使侦探一言不发，观众已经站进了他的位置。',
        visual: { mode: 'high' }
      },
      {
        id: 'eye',
        label: '平拍对视',
        brief: '摄影机与两人视线齐平。',
        feeling: '两人势均力敌，空气里全是试探，我们无法预判谁会赢。',
        analysis: '平拍是中立，也是尊重。它不替观众下判断，把权力交还给表演和台词。',
        visual: { mode: 'eye' }
      },
      {
        id: 'low',
        label: '仰拍嫌疑人',
        brief: '摄影机从桌面以下往上看。',
        feeling: '他突然变得高大、危险，沉默里长出了威胁感。',
        analysis: '仰拍赋予主体力量。同一个嫌疑人，仰拍让他从被审问的人变成掌控房间的人——角度改写了案情。',
        visual: { mode: 'low' }
      }
    ]
  },
  {
    id: 'movement',
    order: 3,
    name: '镜头运动',
    en: 'CAMERA MOVEMENT',
    definition: '镜头运动是摄影机在空间中的移动方式。运动的动机决定观众是旁观者还是同行者。',
    scene: {
      title: '末班站台',
      slugline: 'EXT. 火车站台 — 末班车进站',
      story: '末班车进站，男孩逆着人流奔向站台另一端。'
    },
    options: [
      {
        id: 'static',
        label: '固定机位',
        brief: '让他跑出画。',
        feeling: '我们被留在原地，只能目送他离开，无力又克制。',
        analysis: '固定机位把主动权交给时间。人物出画的瞬间，缺席本身成为情绪——适合告别与失去。',
        visual: { mode: 'static' }
      },
      {
        id: 'dolly',
        label: '推轨推近',
        brief: '镜头缓慢向他靠近。',
        feeling: '世界安静下来，我们被一点点拉进他的焦急里。',
        analysis: '推近是注意力的物理化。镜头每前进一寸，观众的心跳就离人物近一寸——用速度换亲密。',
        visual: { mode: 'dolly' }
      },
      {
        id: 'handheld',
        label: '手持跟拍',
        brief: '跟着他一起跑。',
        feeling: '颠簸、喘息、近在耳边，我们成了他身边奔跑的人。',
        analysis: '手持把观看变成参与。不稳定的画面传递身体的在场感，纪实感与紧迫感由此而来。',
        visual: { mode: 'handheld' }
      },
      {
        id: 'pan',
        label: '摇镜横扫',
        brief: '镜头随他扫过整个站台。',
        feeling: '人流、灯光、车厢被扫成一片，我们在寻找中和他一样慌乱。',
        analysis: '摇镜模拟转头。它保留空间的连续性，让寻找这个动作发生在观众自己的眼睛里。',
        visual: { mode: 'pan' }
      }
    ]
  },
  {
    id: 'composition',
    order: 4,
    name: '构图',
    en: 'COMPOSITION',
    definition: '构图是画面元素的组织方式。位置、平衡与留白，共同决定观众的视线落点和情绪重心。',
    scene: {
      title: '走廊尽头',
      slugline: 'INT. 医院走廊 — 凌晨',
      story: '深夜的医院走廊，尽头有一扇亮着灯的门，母亲站在门口。'
    },
    options: [
      {
        id: 'center',
        label: '居中对称',
        brief: '她站在画面正中央。',
        feeling: '画面稳定、庄重，甚至有点不容置疑的仪式感。',
        analysis: '对称构图带来秩序与宿命感。人物被钉在视觉中心，像被命运钉住——韦斯·安德森与库布里克都深谙此道。',
        visual: { subjectX: 0.5, grid: 'center', frames: 1 }
      },
      {
        id: 'thirds',
        label: '三分法偏置',
        brief: '她站在右侧三分之一处。',
        feeling: '自然、呼吸顺畅，视线会顺着她望向门的方向。',
        analysis: '三分法是最隐形的构图。它给视线留出路径，给情绪留出余地，是叙事电影的安全区。',
        visual: { subjectX: 0.68, grid: 'thirds', frames: 1 }
      },
      {
        id: 'frame-in-frame',
        label: '框架套框架',
        brief: '透过门洞拍门洞里的她。',
        feeling: '我们像在偷看。她被层层框住，困在自己的处境里。',
        analysis: '框中框制造窥视感与囚禁感。每一层框都是一重处境——门框、走廊、画框，都是她走不出去的东西。',
        visual: { subjectX: 0.5, grid: null, frames: 3 }
      },
      {
        id: 'negative-space',
        label: '大面积留白',
        brief: '她缩在角落，其余全是空墙。',
        feeling: '空比满更吵。孤独被空白放大到刺耳。',
        analysis: '留白即情绪。负空间不是什么都没有，而是把人物被世界挤压的程度画了出来。',
        visual: { subjectX: 0.16, grid: null, frames: 1, empty: true }
      }
    ]
  },
  {
    id: 'lighting',
    order: 5,
    name: '光线',
    en: 'LIGHTING',
    definition: '光线塑造形体、引导视线、定义时间。光比与方向，是画面情绪的开关。',
    scene: {
      title: '深夜书房',
      slugline: 'INT. 书房 — 凌晨两点',
      story: '女人独自读完一封没有署名的信。'
    },
    options: [
      {
        id: 'high-key',
        label: '高调明亮',
        brief: '整个房间被均匀照亮。',
        feeling: '一切清晰可见，反而有种不真实的平静，像暴风雨之前。',
        analysis: '高调光消除阴影，也消除藏匿之处。用在悲伤场景里，它的正常本身就是不安。',
        visual: { mode: 'high' }
      },
      {
        id: 'low-key',
        label: '低调大光比',
        brief: '一盏台灯，四周沉入黑暗。',
        feeling: '黑暗围拢过来，她和那封信是世界上仅剩的东西。',
        analysis: '低调光用黑暗做减法。看不见的部分交给想象，恐惧与孤独都住在阴影里——黑色电影的家常便饭。',
        visual: { mode: 'low' }
      },
      {
        id: 'side',
        label: '侧光半明半暗',
        brief: '光只照亮她的半边脸。',
        feeling: '她的脸一半在光里一半在暗处，像一个还没做完的决定。',
        analysis: '侧光把矛盾画在脸上。明暗交界线就是人物内心的分界线——犹豫、双重性、不可告人。',
        visual: { mode: 'side' }
      },
      {
        id: 'back',
        label: '逆光剪影',
        brief: '她站在窗前，只剩轮廓。',
        feeling: '我们看不清她的表情，只能看见轮廓在窗前微微发抖。',
        analysis: '逆光夺走表情，却放大身体。当观众读不到脸，他们会更用力地读姿态——含蓄由此产生。',
        visual: { mode: 'back' }
      }
    ]
  },
  {
    id: 'color',
    order: 6,
    name: '色彩',
    en: 'COLOR',
    definition: '色彩是画面的情绪基调。色温、饱和度与配色关系，先于情节告诉观众该用什么心情看。',
    scene: {
      title: '夏日告别',
      slugline: 'EXT. 海边防波堤 — 八月黄昏',
      story: '两个人在防波堤上说完了最后一句话。'
    },
    options: [
      {
        id: 'cold',
        label: '冷蓝调',
        brief: '整个画面沉入蓝灰色。',
        feeling: '海风突然变凉了。告别像被冰镇过，克制而疏远。',
        analysis: '冷调拉开心理距离。同一句再见，在蓝色里显得更决绝——颜色替人物说出了没说出口的冷淡。',
        visual: { palette: { skyTop: '#6f93a8', skyBottom: '#c3d4da', sea: '#4f7185', sand: '#9aa5a6', sun: '#dfe8ea', figure: '#2c3a42' } }
      },
      {
        id: 'warm',
        label: '暖橙调',
        brief: '夕阳把一切镀上金色。',
        feeling: '告别变得温柔，像被回忆提前美化。',
        analysis: '暖调是记忆的滤镜。它让正在发生变成正在被怀念——怀旧感往往不是情节给的，是色温给的。',
        visual: { palette: { skyTop: '#e8a05c', skyBottom: '#f4d9a8', sea: '#c97f4e', sand: '#e0b184', sun: '#fff0c8', figure: '#4a2f24' } }
      },
      {
        id: 'vivid',
        label: '高饱和浓彩',
        brief: '红与蓝都被推到最大声。',
        feeling: '情绪浓得化不开，像青春片的高潮。',
        analysis: '高饱和是情绪的扩音器。它拒绝克制，把每一种感受都推到最大声——适合人物比理智更汹涌的时刻。',
        visual: { palette: { skyTop: '#1e6fd9', skyBottom: '#7ec8f2', sea: '#0b3fa0', sand: '#ffb63d', sun: '#fff45e', figure: '#d92638' } }
      },
      {
        id: 'mono',
        label: '黑白去色',
        brief: '颜色退场，只剩光影。',
        feeling: '只剩光影和两个人，告别忽然有了重量。',
        analysis: '去色让画面回到素描。当色彩不再分散注意力，构图与表演被推到台前——时间感也随之变得庄重。',
        visual: { palette: { skyTop: '#8a8a8a', skyBottom: '#cfcfcf', sea: '#6f6f6f', sand: '#a8a8a8', sun: '#ececec', figure: '#2b2b2b' } }
      }
    ]
  }
]
