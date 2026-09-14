import React from 'react'

// 每个概念的场景渲染器：根据所选镜头方案的 visual 参数（来自后端）实时改变画面。

/* ---------- 01 景别：雨夜便利店 ---------- */
function ShotSizeScene({ visual }) {
  const { zoom, focusX, focusY } = visual
  const transform = `translate(200px, 120px) scale(${zoom}) translate(${-focusX}px, ${-focusY}px)`
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="ss-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2126" /><stop offset="1" stopColor="#2c3438" />
        </linearGradient>
        <radialGradient id="ss-lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd88e" stopOpacity="0.55" /><stop offset="1" stopColor="#ffd88e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ss-door" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#ffdf9e" stopOpacity="0.5" /><stop offset="1" stopColor="#ffdf9e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ss-phone" cx="0.5" cy="0.5" r="0.55">
          <stop offset="0" stopColor="#d8e8e2" stopOpacity="0.75" /><stop offset="1" stopColor="#d8e8e2" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g style={{ transform, transition: 'transform .8s cubic-bezier(.33,1,.32,1)' }}>
        <rect x="-200" y="-160" width="800" height="360" fill="url(#ss-sky)" />
        {/* 雨 */}
        <g stroke="#8fa3ab" strokeWidth="0.7" opacity="0.5">
          {Array.from({ length: 42 }, (_, i) => {
            const x = -180 + ((i * 47) % 780); const y = -150 + ((i * 31) % 330)
            return <line key={i} x1={x} y1={y} x2={x - 3} y2={y + 11} />
          })}
        </g>
        {/* 路灯 */}
        <rect x="118" y="60" width="3" height="140" fill="#3a4145" />
        <circle cx="119.5" cy="58" r="5" fill="#ffd88e" />
        <circle cx="119.5" cy="58" r="46" fill="url(#ss-lamp)" />
        {/* 便利店 */}
        <rect x="180" y="52" width="190" height="148" fill="#22282b" />
        <rect x="180" y="52" width="190" height="20" fill="#31434a" />
        <text x="275" y="66" textAnchor="middle" fontSize="9" fill="#cfe0d8" fontFamily="DM Mono, monospace" letterSpacing="3">24H STORE</text>
        <rect x="252" y="86" width="52" height="114" fill="#3d4a48" />
        <rect x="256" y="90" width="44" height="106" fill="#c8b98a" opacity="0.85" />
        <rect x="252" y="86" width="52" height="114" fill="url(#ss-door)" />
        <rect x="186" y="90" width="56" height="44" fill="#2e3a3c" stroke="#4a5a58" strokeWidth="1" />
        <rect x="312" y="90" width="50" height="44" fill="#2e3a3c" stroke="#4a5a58" strokeWidth="1" />
        {/* 地面 */}
        <rect x="-200" y="200" width="800" height="60" fill="#181d1f" />
        <rect x="-200" y="200" width="800" height="3" fill="#3d3a2e" opacity="0.7" />
        <ellipse cx="252" cy="204" rx="60" ry="5" fill="#ffdf9e" opacity="0.14" />
        {/* 女孩 */}
        <g>
          <ellipse cx="250" cy="201" rx="16" ry="3" fill="#000" opacity="0.4" />
          <path d="M240 200 L244 148 L256 148 L260 200 Z" fill="#22282b" />
          <path d="M244 148 L256 148 L254 132 L246 132 Z" fill="#2e3538" />
          <circle cx="250" cy="122" r="11" fill="#c9a582" />
          <path d="M239 120 a11 11 0 0 1 22 0 l-2 -8 a12 10 0 0 0 -18 0 Z" fill="#2b2320" />
          <rect x="238" y="150" width="5" height="20" rx="2" fill="#22282b" transform="rotate(14 240 150)" />
          {/* 抬起的手臂与握着手机的手（特写的视觉主体） */}
          <line x1="255" y1="141" x2="262" y2="150" stroke="#22282b" strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="260" cy="144" r="17" fill="url(#ss-phone)" />
          <g transform="rotate(-8 261 144)">
            <rect x="255" y="135" width="11" height="17" rx="1.5" fill="#0f1315" stroke="#5a6a66" strokeWidth="0.7" />
            <rect x="257" y="137.5" width="7" height="11" rx="0.8" fill="#cfe0d8" opacity="0.95" />
          </g>
          <circle cx="262" cy="151" r="4.4" fill="#c9a582" />
          <path d="M258 148 q4 -3 7 1" stroke="#b9926f" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}

/* ---------- 02 机位：审讯室 ---------- */
function AngleScene({ visual }) {
  const { mode } = visual
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="ag-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2f31" /><stop offset="1" stopColor="#1b1f21" />
        </linearGradient>
        <radialGradient id="ag-lamp" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#ffe6ae" stopOpacity="0.8" /><stop offset="1" stopColor="#ffe6ae" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#ag-wall)" />
      {mode === 'high' && (
        <g style={{ animation: 'fadeIn .6s ease' }}>
          {/* 俯拍：地平线压低，人物被压在画面底部 */}
          <rect y="150" width="400" height="90" fill="#24292b" />
          <line x1="0" y1="150" x2="400" y2="150" stroke="#3a4144" strokeWidth="1" />
          <polygon points="196,30 204,30 236,150 164,150" fill="#ffe6ae" opacity="0.1" />
          <circle cx="200" cy="26" r="7" fill="#ffe6ae" />
          <circle cx="200" cy="26" r="60" fill="url(#ag-lamp)" opacity="0.5" />
          <ellipse cx="200" cy="185" rx="95" ry="26" fill="#31383b" stroke="#454e52" strokeWidth="1.5" />
          {/* 嫌疑人：俯视的小小人影 */}
          <ellipse cx="200" cy="178" rx="20" ry="9" fill="#3f4a4e" />
          <circle cx="200" cy="172" r="10" fill="#b9926f" />
          <path d="M190 170 a10 10 0 0 1 20 0 l-1.5 -5 a10 8 0 0 0 -17 0 Z" fill="#241f1c" />
          <text x="200" y="228" textAnchor="middle" fontSize="8" fill="#7d8588" fontFamily="DM Mono, monospace" letterSpacing="2">HIGH ANGLE — 权力在镜头这边</text>
        </g>
      )}
      {mode === 'eye' && (
        <g style={{ animation: 'fadeIn .6s ease' }}>
          {/* 平拍：势均力敌的对峙 */}
          <rect y="140" width="400" height="100" fill="#24292b" />
          <line x1="0" y1="140" x2="400" y2="140" stroke="#3a4144" strokeWidth="1" />
          <line x1="200" y1="30" x2="200" y2="58" stroke="#4a5154" strokeWidth="2" />
          <circle cx="200" cy="62" r="6" fill="#ffe6ae" />
          <circle cx="200" cy="62" r="46" fill="url(#ag-lamp)" opacity="0.55" />
          <polygon points="120,240 280,240 250,168 150,168" fill="#31383b" stroke="#454e52" strokeWidth="1.5" />
          {/* 侦探（左）与嫌疑人（右）平视 */}
          <g>
            <circle cx="118" cy="128" r="15" fill="#8a6a4e" />
            <path d="M103 126 a15 15 0 0 1 30 0 l-2 -8 a15 12 0 0 0 -26 0 Z" fill="#1e1a17" />
            <path d="M96 240 L104 150 Q118 140 132 150 L138 240 Z" fill="#2c3437" />
          </g>
          <g>
            <circle cx="282" cy="128" r="15" fill="#b9926f" />
            <path d="M267 126 a15 15 0 0 1 30 0 l-2 -8 a15 12 0 0 0 -26 0 Z" fill="#241f1c" />
            <path d="M262 240 L268 150 Q282 140 296 150 L304 240 Z" fill="#3f4a4e" />
          </g>
          <text x="200" y="228" textAnchor="middle" fontSize="8" fill="#7d8588" fontFamily="DM Mono, monospace" letterSpacing="2">EYE LEVEL — 势均力敌</text>
        </g>
      )}
      {mode === 'low' && (
        <g style={{ animation: 'fadeIn .6s ease' }}>
          {/* 仰拍：人物高耸入画 */}
          <rect y="196" width="400" height="44" fill="#24292b" />
          <line x1="0" y1="196" x2="400" y2="196" stroke="#3a4144" strokeWidth="1" />
          <line x1="200" y1="0" x2="200" y2="18" stroke="#4a5154" strokeWidth="2" />
          <circle cx="200" cy="22" r="6" fill="#ffe6ae" />
          <circle cx="200" cy="22" r="40" fill="url(#ag-lamp)" opacity="0.4" />
          <polygon points="60,240 340,240 300,190 100,190" fill="#31383b" stroke="#454e52" strokeWidth="1.5" />
          {/* 嫌疑人：自下而上的巨大体量 */}
          <path d="M120 240 L150 96 Q200 78 250 96 L280 240 Z" fill="#3f4a4e" />
          <circle cx="200" cy="72" r="24" fill="#b9926f" />
          <path d="M176 68 a24 24 0 0 1 48 0 l-3 -12 a24 18 0 0 0 -42 0 Z" fill="#241f1c" />
          <path d="M182 84 Q200 96 218 84 L218 92 Q200 102 182 92 Z" fill="#241f1c" opacity="0.35" />
          <text x="200" y="228" textAnchor="middle" fontSize="8" fill="#9aa3a6" fontFamily="DM Mono, monospace" letterSpacing="2">LOW ANGLE — 他掌控了房间</text>
        </g>
      )}
    </svg>
  )
}

/* ---------- 03 镜头运动：末班站台 ---------- */
function MovementScene({ visual }) {
  const { mode } = visual
  const shaking = mode === 'handheld'
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className={shaking ? 'mv-shake' : ''}>
      <defs>
        <linearGradient id="mv-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#232a2e" /><stop offset="1" stopColor="#333d41" />
        </linearGradient>
      </defs>
      <g className={mode === 'pan' ? 'mv-pan' : ''}>
        <rect width="400" height="240" fill="url(#mv-sky)" />
        {/* 列车 */}
        <rect x="238" y="86" width="220" height="96" rx="6" fill="#3d4a50" />
        <rect x="238" y="86" width="220" height="14" rx="6" fill="#2c363b" />
        {[252, 288, 324, 360, 396].map(x => <rect key={x} x={x} y="106" width="26" height="30" rx="3" fill="#c9bd8d" opacity="0.85" />)}
        <rect x="238" y="176" width="220" height="6" fill="#22292c" />
        {/* 站台 */}
        <rect y="182" width="400" height="58" fill="#1d2224" />
        <rect y="182" width="400" height="4" fill="#c8a24a" opacity="0.8" />
        {/* 人流剪影 */}
        {[[36, 150], [70, 156], [104, 148], [180, 158], [214, 152]].map(([x, y], i) => (
          <g key={i} opacity="0.75">
            <circle cx={x} cy={y} r="7" fill="#14181a" />
            <path d={`M${x - 8} 182 L${x - 5} ${y + 8} L${x + 5} ${y + 8} L${x + 8} 182 Z`} fill="#14181a" />
          </g>
        ))}
        {/* 奔跑的男孩 */}
        <g className={mode === 'dolly' ? 'mv-dolly' : ''} style={{ transformOrigin: '150px 160px' }}>
          {(mode === 'handheld' || mode === 'pan') && (
            <g stroke="#8fa3ab" strokeWidth="1.4" opacity="0.55">
              <line x1="96" y1="146" x2="126" y2="146" /><line x1="90" y1="158" x2="124" y2="158" /><line x1="98" y1="170" x2="126" y2="170" />
            </g>
          )}
          <circle cx="150" cy="138" r="8" fill="#c9a582" />
          <path d="M142 136 a8 8 0 0 1 16 0 l-1.5 -5 a8 7 0 0 0 -13 0 Z" fill="#2b2320" />
          <path d="M144 148 L158 148 L162 172 L148 172 Z" fill="#7a4a34" transform="rotate(12 152 160)" />
          <line x1="150" y1="170" x2="138" y2="190" stroke="#2c3437" strokeWidth="5" strokeLinecap="round" />
          <line x1="156" y1="170" x2="170" y2="186" stroke="#2c3437" strokeWidth="5" strokeLinecap="round" />
          <line x1="146" y1="152" x2="132" y2="164" stroke="#7a4a34" strokeWidth="4" strokeLinecap="round" />
          <line x1="158" y1="152" x2="172" y2="160" stroke="#7a4a34" strokeWidth="4" strokeLinecap="round" />
        </g>
        {/* 各运动方式的视觉提示 */}
        {mode === 'static' && (
          <g>
            <line x1="180" y1="150" x2="360" y2="150" stroke="#d0775e" strokeWidth="1.5" strokeDasharray="7 6" />
            <polygon points="360,150 348,144 348,156" fill="#d0775e" />
            <text x="270" y="140" textAnchor="middle" fontSize="8" fill="#d0775e" fontFamily="DM Mono, monospace" letterSpacing="2">他即将出画</text>
          </g>
        )}
        {mode === 'dolly' && (
          <g fill="none" stroke="#d8ceb8" strokeWidth="1.2">
            <rect x="106" y="104" width="92" height="86" rx="4" className="mv-pulse" style={{ transformOrigin: '152px 147px' }} />
            <rect x="116" y="112" width="72" height="70" rx="4" className="mv-pulse" style={{ transformOrigin: '152px 147px', animationDelay: '.5s' }} />
          </g>
        )}
        {mode === 'pan' && (
          <g stroke="#8fa3ab" strokeWidth="1" opacity="0.35">
            {[40, 80, 120, 200, 240, 300, 340].map(y => <line key={y} x1="0" y1={y / 2 + 40} x2="400" y2={y / 2 + 40} />)}
          </g>
        )}
      </g>
    </svg>
  )
}

/* ---------- 04 构图：走廊尽头 ---------- */
function CompositionScene({ visual }) {
  const { subjectX, grid, frames, empty } = visual
  const px = subjectX * 400
  const figureScale = empty ? 0.72 : 1
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="cp-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#33393c" /><stop offset="1" stopColor="#22272a" />
        </linearGradient>
        <radialGradient id="cp-door" cx="0.5" cy="0.5" r="0.65">
          <stop offset="0" stopColor="#ffe2a6" stopOpacity="0.9" /><stop offset="1" stopColor="#ffe2a6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#cp-wall)" />
      {/* 走廊透视 */}
      <g stroke="#454e52" strokeWidth="1">
        <line x1="0" y1="0" x2="200" y2="120" /><line x1="400" y1="0" x2="200" y2="120" />
        <line x1="0" y1="240" x2="200" y2="120" /><line x1="400" y1="240" x2="200" y2="120" />
      </g>
      <rect x="168" y="88" width="64" height="64" fill="#2a3033" stroke="#454e52" />
      {/* 尽头的门与光 */}
      <rect x="186" y="96" width="28" height="56" fill="#e8d5a2" />
      <circle cx="200" cy="120" r={empty ? 26 : 44} fill="url(#cp-door)" opacity={empty ? 0.4 : 0.8} />
      {/* 框中框 */}
      {frames === 3 && (
        <g fill="none" stroke="#4a5457" strokeWidth="3">
          <rect x="60" y="18" width="280" height="204" />
          <rect x="112" y="46" width="176" height="148" />
        </g>
      )}
      {/* 母亲 */}
      <g style={{ transform: `translate(${px}px, ${empty ? 176 : 168}px) scale(${figureScale})`, transition: 'transform .7s cubic-bezier(.33,1,.32,1)' }}>
        <ellipse cx="0" cy="34" rx="12" ry="2.6" fill="#000" opacity="0.35" />
        <path d="M-9 34 L-6 -2 L6 -2 L9 34 Z" fill="#4a3f4c" />
        <circle cx="0" cy="-10" r="7" fill="#c9a582" />
        <path d="M-7 -12 a7 7 0 0 1 14 0 l-1 -4 a7 6 0 0 0 -12 0 Z" fill="#3a3230" />
      </g>
      {/* 构图辅助线 */}
      {grid === 'thirds' && (
        <g stroke="#d8ceb8" strokeWidth="0.7" strokeDasharray="4 4" opacity="0.6">
          <line x1="133" y1="0" x2="133" y2="240" /><line x1="267" y1="0" x2="267" y2="240" />
          <line x1="0" y1="80" x2="400" y2="80" /><line x1="0" y1="160" x2="400" y2="160" />
        </g>
      )}
      {grid === 'center' && (
        <g stroke="#d8ceb8" strokeWidth="0.7" strokeDasharray="4 4" opacity="0.6">
          <line x1="200" y1="0" x2="200" y2="240" /><line x1="0" y1="120" x2="400" y2="120" />
        </g>
      )}
    </svg>
  )
}

/* ---------- 05 光线：深夜书房 ---------- */
function LightingScene({ visual }) {
  const { mode } = visual
  const palette = {
    high: { bg: '#ddd5c2', wall: '#cfc6b0', figure: '#6b5a48', hair: '#3a2f26', desk: '#8a7358', letter: '#f2ecdc', lampGlow: 0.25 },
    low: { bg: '#0f1314', wall: '#161b1d', figure: '#1e2426', hair: '#101314', desk: '#232a2c', letter: '#e8dcb8', lampGlow: 0.9 },
    side: { bg: '#1a1f21', wall: '#22282a', figure: '#4a3f33', hair: '#241f1c', desk: '#3a332a', letter: '#e8dcb8', lampGlow: 0.5 },
    back: { bg: '#101415', wall: '#181e20', figure: '#0c0e0f', hair: '#0c0e0f', desk: '#14181a', letter: '#c9bd9a', lampGlow: 0 }
  }[mode]
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="lt-glow" cx="0.5" cy="0.5" r="0.55">
          <stop offset="0" stopColor="#ffe2a6" stopOpacity="0.85" /><stop offset="1" stopColor="#ffe2a6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lt-window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8ecdc" /><stop offset="1" stopColor="#b9c4b2" />
        </linearGradient>
        <linearGradient id="lt-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffe2a6" stopOpacity="0.28" /><stop offset="0.55" stopColor="#ffe2a6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={palette.bg} style={{ transition: 'fill .6s' }} />
      <rect y="176" width="400" height="64" fill={palette.wall} style={{ transition: 'fill .6s' }} />
      {/* 逆光：身后的大窗 */}
      {mode === 'back' && (
        <g style={{ animation: 'fadeIn .6s ease' }}>
          <rect x="130" y="26" width="140" height="150" fill="url(#lt-window)" />
          <line x1="200" y1="26" x2="200" y2="176" stroke="#8a9484" strokeWidth="3" />
          <line x1="130" y1="100" x2="270" y2="100" stroke="#8a9484" strokeWidth="3" />
        </g>
      )}
      {/* 书桌与信 */}
      <rect x="120" y="150" width="160" height="10" fill={palette.desk} style={{ transition: 'fill .6s' }} />
      <rect x="132" y="160" width="8" height="60" fill={palette.desk} />
      <rect x="260" y="160" width="8" height="60" fill={palette.desk} />
      <rect x="186" y="142" width="30" height="9" rx="1" fill={palette.letter} transform="rotate(-4 200 146)" style={{ transition: 'fill .6s' }} />
      {/* 台灯（低调模式的主角） */}
      {mode !== 'back' && (
        <g>
          <rect x="246" y="118" width="4" height="34" fill={palette.desk} />
          <path d="M238 118 L262 118 L256 102 L244 102 Z" fill={mode === 'high' ? '#a89878' : '#c8a24a'} />
          <circle cx="250" cy="112" r={mode === 'low' ? 90 : 46} fill="url(#lt-glow)" opacity={palette.lampGlow} style={{ transition: 'opacity .6s' }} />
        </g>
      )}
      {/* 读信的女人 */}
      <g>
        <path d="M168 150 L176 108 Q200 98 224 108 L232 150 Z" fill={palette.figure} style={{ transition: 'fill .6s' }} />
        <circle cx="200" cy="92" r="14" fill={mode === 'back' ? palette.figure : '#c9a582'} style={{ transition: 'fill .6s' }} />
        <path d="M186 90 a14 14 0 0 1 28 0 l-2 -8 a14 11 0 0 0 -24 0 Z" fill={palette.hair} />
        {/* 侧光：半张脸沉入阴影 */}
        {mode === 'side' && <path d="M200 78 a14 14 0 0 1 0 28 Z" fill="#101314" opacity="0.75" style={{ animation: 'fadeIn .6s ease' }} />}
        {/* 逆光：轮廓镶边 */}
        {mode === 'back' && (
          <g fill="none" stroke="#e8ecdc" strokeWidth="1.4" opacity="0.9" style={{ animation: 'fadeIn .6s ease' }}>
            <path d="M186 90 a14 14 0 0 1 4 -10" /><path d="M168 150 L176 108" />
          </g>
        )}
      </g>
      {mode === 'side' && <rect width="400" height="240" fill="url(#lt-side)" style={{ animation: 'fadeIn .6s ease' }} />}
      {mode === 'low' && <rect width="400" height="240" fill="#000" opacity="0.25" style={{ animation: 'fadeIn .6s ease' }} />}
    </svg>
  )
}

/* ---------- 06 色彩：夏日告别 ---------- */
function ColorScene({ visual }) {
  const { palette } = visual
  const t = { transition: 'fill .7s ease, stop-color .7s ease' }
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="cl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: palette.skyTop, ...t }} /><stop offset="1" style={{ stopColor: palette.skyBottom, ...t }} />
        </linearGradient>
      </defs>
      <rect width="400" height="150" fill="url(#cl-sky)" />
      <circle cx="296" cy="104" r="24" fill={palette.sun} style={t} />
      <circle cx="296" cy="104" r="40" fill={palette.sun} opacity="0.25" style={t} />
      <rect y="150" width="400" height="46" fill={palette.sea} style={t} />
      <g stroke={palette.skyBottom} strokeWidth="1" opacity="0.5">
        <line x1="30" y1="164" x2="110" y2="164" /><line x1="180" y1="172" x2="290" y2="172" /><line x1="80" y1="182" x2="200" y2="182" />
      </g>
      <rect y="196" width="400" height="44" fill={palette.sand} style={t} />
      {/* 防波堤 */}
      <polygon points="120,240 280,240 236,186 164,186" fill={palette.figure} opacity="0.55" style={t} />
      {/* 告别的两个人 */}
      <g fill={palette.figure} style={t}>
        <g>
          <circle cx="178" cy="164" r="7" />
          <path d="M171 196 L174 172 L182 172 L185 196 Z" />
        </g>
        <g>
          <circle cx="222" cy="164" r="7" />
          <path d="M215 196 L218 172 L226 172 L229 196 Z" />
        </g>
      </g>
      <line x1="185" y1="176" x2="215" y2="176" stroke={palette.figure} strokeWidth="1" strokeDasharray="3 4" opacity="0.6" style={t} />
    </svg>
  )
}

/* ---------- 场景调度 ---------- */
const renderers = {
  'shot-size': ShotSizeScene,
  angle: AngleScene,
  movement: MovementScene,
  composition: CompositionScene,
  lighting: LightingScene,
  color: ColorScene
}

export default function ConceptScene({ conceptId, visual }) {
  const Renderer = renderers[conceptId]
  if (!Renderer || !visual) return null
  return <Renderer visual={visual} />
}
