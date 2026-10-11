import { toast } from 'sonner'
import type { WhiteboardPage, Stroke, TextItem, Tool, BgType } from '../components/study/Whiteboard'

function isShapeTool(t: Tool): boolean {
  return [
    'line', 'arrow', 'doubleArrow', 'rect', 'roundedRect',
    'circle', 'ellipse', 'triangle', 'diamond', 'star', 'hexagon'
  ].includes(t)
}

function drawShapeStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  const start = s.points[0]
  const end = s.points[s.points.length - 1]
  if (!start || !end) return

  const x1 = start.x, y1 = start.y
  const x2 = end.x, y2 = end.y
  const w = x2 - x1, h = y2 - y1
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2
  const rx = Math.abs(w) / 2, ry = Math.abs(h) / 2

  ctx.beginPath()

  switch (s.tool) {
    case 'line':
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      break

    case 'arrow': {
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      const angle = Math.atan2(y2 - y1, x2 - x1)
      const headLen = 12 + s.width
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6))
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6))
      break
    }

    case 'doubleArrow': {
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      const angle = Math.atan2(y2 - y1, x2 - x1)
      const headLen = 12 + s.width
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6))
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6))
      ctx.moveTo(x1, y1)
      ctx.lineTo(x1 + headLen * Math.cos(angle - Math.PI / 6), y1 + headLen * Math.sin(angle - Math.PI / 6))
      ctx.moveTo(x1, y1)
      ctx.lineTo(x1 + headLen * Math.cos(angle + Math.PI / 6), y1 + headLen * Math.sin(angle + Math.PI / 6))
      break
    }

    case 'rect':
      ctx.rect(x1, y1, w, h)
      break

    case 'roundedRect': {
      const r = Math.min(12, Math.abs(w) / 4, Math.abs(h) / 4)
      const left = Math.min(x1, x2), top = Math.min(y1, y2)
      const aw = Math.abs(w), ah = Math.abs(h)
      ctx.moveTo(left + r, top)
      ctx.lineTo(left + aw - r, top)
      ctx.arcTo(left + aw, top, left + aw, top + r, r)
      ctx.lineTo(left + aw, top + ah - r)
      ctx.arcTo(left + aw, top + ah, left + aw - r, top + ah, r)
      ctx.lineTo(left + r, top + ah)
      ctx.arcTo(left, top + ah, left, top + ah - r, r)
      ctx.lineTo(left, top + r)
      ctx.arcTo(left, top, left + r, top, r)
      ctx.closePath()
      break
    }

    case 'circle': {
      const radius = Math.min(Math.abs(w), Math.abs(h)) / 2
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      break
    }

    case 'ellipse':
      if (rx > 0 && ry > 0) ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      break

    case 'triangle':
      ctx.moveTo(cx, Math.min(y1, y2))
      ctx.lineTo(Math.max(x1, x2), Math.max(y1, y2))
      ctx.lineTo(Math.min(x1, x2), Math.max(y1, y2))
      ctx.closePath()
      break

    case 'diamond':
      ctx.moveTo(cx, Math.min(y1, y2))
      ctx.lineTo(Math.max(x1, x2), cy)
      ctx.lineTo(cx, Math.max(y1, y2))
      ctx.lineTo(Math.min(x1, x2), cy)
      ctx.closePath()
      break

    case 'star': {
      const outerR = Math.min(rx, ry)
      const innerR = outerR * 0.4
      const spikes = 5
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR
        const a = (Math.PI / spikes) * i - Math.PI / 2
        const px = cx + r * Math.cos(a)
        const py = cy + r * Math.sin(a)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      break
    }

    case 'hexagon': {
      const hr = Math.min(rx, ry)
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6
        const px = cx + hr * Math.cos(a)
        const py = cy + hr * Math.sin(a)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      break
    }
  }

  ctx.stroke()
}

export function drawWhiteboardBackground(ctx: CanvasRenderingContext2D, w: number, h: number, bgType: BgType = 'dots') {
  if (bgType === 'dark') {
    ctx.fillStyle = '#121215'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#2a2a32'
    const gap = 24
    for (let x = gap; x < w; x += gap) {
      for (let y = gap; y < h; y += gap) {
        ctx.beginPath()
        ctx.arc(x, y, 0.9, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    return
  }

  if (bgType === 'chalkboard') {
    ctx.fillStyle = '#1b3024'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#274434'
    ctx.lineWidth = 1
    const gap = 30
    ctx.beginPath()
    for (let x = gap; x < w; x += gap) {
      ctx.moveTo(x, 0); ctx.lineTo(x, h)
    }
    for (let y = gap; y < h; y += gap) {
      ctx.moveTo(0, y); ctx.lineTo(w, y)
    }
    ctx.stroke()
    return
  }

  if (bgType === 'blank') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    return
  }

  if (bgType === 'grid') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#e8eaee'
    ctx.lineWidth = 1
    const gap = 24
    ctx.beginPath()
    for (let x = gap; x < w; x += gap) {
      ctx.moveTo(x, 0); ctx.lineTo(x, h)
    }
    for (let y = gap; y < h; y += gap) {
      ctx.moveTo(0, y); ctx.lineTo(w, y)
    }
    ctx.stroke()
    return
  }

  // Default 'dots'
  ctx.fillStyle = '#fafbfc'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#e0e3e8'
  const gap = 24
  for (let x = gap; x < w; x += gap) {
    for (let y = gap; y < h; y += gap) {
      ctx.beginPath()
      ctx.arc(x, y, 0.8, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

export function renderPageToCanvas(page: WhiteboardPage, targetCanvas: HTMLCanvasElement) {
  const ctx = targetCanvas.getContext('2d')
  if (!ctx) return

  const w = targetCanvas.width
  const h = targetCanvas.height

  drawWhiteboardBackground(ctx, w, h, page.bgType || 'dots')

  // Draw Strokes
  for (const s of page.strokes || []) {
    if (!s.points || s.points.length < 2 || s.tool === 'eraser') continue
    ctx.strokeStyle = s.color
    ctx.lineWidth = s.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (isShapeTool(s.tool)) {
      drawShapeStroke(ctx, s)
    } else {
      ctx.beginPath()
      ctx.moveTo(s.points[0].x, s.points[0].y)
      for (let i = 1; i < s.points.length - 1; i++) {
        const mx = (s.points[i].x + s.points[i + 1].x) / 2
        const my = (s.points[i].y + s.points[i + 1].y) / 2
        ctx.quadraticCurveTo(s.points[i].x, s.points[i].y, mx, my)
      }
      const last = s.points[s.points.length - 1]
      ctx.lineTo(last.x, last.y)
      ctx.stroke()
    }
  }

  // Draw Text Items
  for (const t of page.textItems || []) {
    if (!t.text) continue
    ctx.fillStyle = t.color
    ctx.font = `${t.fontSize || 18}px Inter, system-ui, sans-serif`
    ctx.textBaseline = 'top'
    const lines = t.text.split('\n')
    lines.forEach((line, i) => {
      ctx.fillText(line, t.x, t.y + i * ((t.fontSize || 18) * 1.3))
    })
  }
}

export function getStoredWhiteboardPages(roomId: string): WhiteboardPage[] {
  try {
    const raw = sessionStorage.getItem(`socrates_whiteboard_pages_${roomId}`) ||
                localStorage.getItem(`socrates_whiteboard_pages_${roomId}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (err) {
    console.warn('[Whiteboard Export] Failed to parse cached pages', err)
  }
  return []
}

export function saveStoredWhiteboardPages(roomId: string, pages: WhiteboardPage[]) {
  try {
    const json = JSON.stringify(pages)
    sessionStorage.setItem(`socrates_whiteboard_pages_${roomId}`, json)
    localStorage.setItem(`socrates_whiteboard_pages_${roomId}`, json)
  } catch (err) {
    console.warn('[Whiteboard Export] Failed to store cached pages', err)
  }
}

export function generateRealisticWhiteboardPages(
  title: string = 'Calculus & Derivations',
  subject: string = 'Mathematics',
  equations: string[] = []
): WhiteboardPage[] {
  return [
    {
      id: 'wb-page-1',
      title: 'ILATE Priority Hierarchy & Integration by Parts',
      bgType: 'dots',
      strokes: [
        {
          tool: 'roundedRect',
          color: '#0066cc',
          width: 3,
          points: [{ x: 80, y: 150 }, { x: 820, y: 260 }],
        },
        {
          tool: 'arrow',
          color: '#0066cc',
          width: 2.5,
          points: [{ x: 260, y: 310 }, { x: 220, y: 245 }],
        },
        {
          tool: 'arrow',
          color: '#8b5cf6',
          width: 2.5,
          points: [{ x: 420, y: 310 }, { x: 345, y: 245 }],
        },
        {
          tool: 'line',
          color: '#e5e5e7',
          width: 2,
          points: [{ x: 860, y: 130 }, { x: 860, y: 950 }],
        },
        {
          tool: 'line',
          color: '#1d1d1f',
          width: 3,
          points: [{ x: 920, y: 200 }, { x: 1720, y: 200 }],
        },
        {
          tool: 'pen',
          color: '#10b981',
          width: 4,
          points: [{ x: 90, y: 640 }, { x: 105, y: 660 }, { x: 140, y: 615 }],
        },
        {
          tool: 'roundedRect',
          color: '#10b981',
          width: 2.5,
          points: [{ x: 80, y: 590 }, { x: 820, y: 720 }],
        },
      ],
      textItems: [
        {
          id: 't-1',
          x: 80,
          y: 70,
          fontSize: 34,
          color: '#1d1d1f',
          text: `Whiteboard Session: ${title}`,
        },
        {
          id: 't-2',
          x: 120,
          y: 185,
          fontSize: 38,
          color: '#0066cc',
          text: '∫ u dv  =  uv  -  ∫ v du',
        },
        {
          id: 't-3',
          x: 140,
          y: 320,
          fontSize: 20,
          color: '#0066cc',
          text: 'u: Choose factor that differentiates easily',
        },
        {
          id: 't-4',
          x: 370,
          y: 350,
          fontSize: 20,
          color: '#8b5cf6',
          text: 'dv: Choose factor that integrates readily',
        },
        {
          id: 't-5',
          x: 920,
          y: 155,
          fontSize: 28,
          color: '#1d1d1f',
          text: 'ILATE Priority Hierarchy (Select u in order):',
        },
        {
          id: 't-6',
          x: 940,
          y: 230,
          fontSize: 24,
          color: '#1d1d1f',
          text: 'I   →  Inverse Trigonometric   [ arcsin(x), arctan(x) ]\nL  →  Logarithmic Functions      [ ln(x), log₁₀(x) ]\nA  →  Algebraic Powers & Poly    [ x², 3x, x⁴ ]\nT  →  Trigonometric Functions    [ sin(x), cos(x) ]\nE  →  Exponential Terms          [ eˣ, 2ˣ ]',
        },
        {
          id: 't-7',
          x: 150,
          y: 625,
          fontSize: 24,
          color: '#10b981',
          text: '★ Core Rule: Highest priority in ILATE = Assign to "u"\n   Remaining term = Assign to "dv"',
        },
      ],
    },
    {
      id: 'wb-page-2',
      title: 'Whiteboard Derivation: Leibniz Rule to Integration by Parts',
      bgType: 'dots',
      strokes: [
        {
          tool: 'arrow',
          color: '#0066cc',
          width: 2.5,
          points: [{ x: 420, y: 260 }, { x: 420, y: 310 }],
        },
        {
          tool: 'arrow',
          color: '#0066cc',
          width: 2.5,
          points: [{ x: 420, y: 440 }, { x: 420, y: 490 }],
        },
        {
          tool: 'roundedRect',
          color: '#10b981',
          width: 3.5,
          points: [{ x: 80, y: 640 }, { x: 1040, y: 770 }],
        },
        {
          tool: 'pen',
          color: '#10b981',
          width: 4,
          points: [{ x: 960, y: 710 }, { x: 980, y: 730 }, { x: 1015, y: 685 }],
        },
      ],
      textItems: [
        {
          id: 'p2-1',
          x: 80,
          y: 70,
          fontSize: 34,
          color: '#1d1d1f',
          text: 'Derivation: Leibniz Product Rule → Integration by Parts',
        },
        {
          id: 'p2-2',
          x: 80,
          y: 170,
          fontSize: 26,
          color: '#1d1d1f',
          text: 'Step 1: Start with the product rule of differentiation:\n           d/dx [ u(x) · v(x) ] = u\'(x)·v(x) + u(x)·v\'(x)',
        },
        {
          id: 'p2-3',
          x: 80,
          y: 330,
          fontSize: 26,
          color: '#1d1d1f',
          text: 'Step 2: Take the indefinite integral of both sides with respect to x:\n           ∫ d/dx [ u·v ] dx = ∫ v · (du/dx) dx + ∫ u · (dv/dx) dx\n           u · v = ∫ v du + ∫ u dv',
        },
        {
          id: 'p2-4',
          x: 80,
          y: 520,
          fontSize: 26,
          color: '#1d1d1f',
          text: 'Step 3: Rearrange terms to isolate ∫ u dv on the left side:',
        },
        {
          id: 'p2-5',
          x: 120,
          y: 680,
          fontSize: 36,
          color: '#10b981',
          text: '∫ u dv  =  u · v  -  ∫ v du     (Formula Proven ✓)',
        },
      ],
    },
    {
      id: 'wb-page-3',
      title: 'Worked Example: Evaluating ∫ x · cos(x) dx',
      bgType: 'dots',
      strokes: [
        {
          tool: 'roundedRect',
          color: '#0066cc',
          width: 2.5,
          points: [{ x: 80, y: 220 }, { x: 740, y: 340 }],
        },
        {
          tool: 'roundedRect',
          color: '#8b5cf6',
          width: 2.5,
          points: [{ x: 780, y: 220 }, { x: 1440, y: 340 }],
        },
        {
          tool: 'line',
          color: '#e5e5e7',
          width: 2,
          points: [{ x: 80, y: 380 }, { x: 1440, y: 380 }],
        },
        {
          tool: 'roundedRect',
          color: '#10b981',
          width: 3.5,
          points: [{ x: 80, y: 680 }, { x: 1100, y: 800 }],
        },
        {
          tool: 'pen',
          color: '#10b981',
          width: 4,
          points: [{ x: 1020, y: 745 }, { x: 1040, y: 765 }, { x: 1075, y: 720 }],
        },
      ],
      textItems: [
        {
          id: 'p3-1',
          x: 80,
          y: 70,
          fontSize: 34,
          color: '#1d1d1f',
          text: 'Live Whiteboard Worked Problem: Evaluate  ∫ x · cos(x) dx',
        },
        {
          id: 'p3-2',
          x: 80,
          y: 150,
          fontSize: 24,
          color: '#1d1d1f',
          text: 'Step 1: Apply ILATE to classify factors [ x = Algebraic,  cos(x) = Trig ]:',
        },
        {
          id: 'p3-3',
          x: 110,
          y: 250,
          fontSize: 26,
          color: '#0066cc',
          text: 'Choose u = x\n⟹  du = dx',
        },
        {
          id: 'p3-4',
          x: 810,
          y: 250,
          fontSize: 26,
          color: '#8b5cf6',
          text: 'Choose dv = cos(x) dx\n⟹  v = ∫ cos(x) dx = sin(x)',
        },
        {
          id: 'p3-5',
          x: 80,
          y: 420,
          fontSize: 26,
          color: '#1d1d1f',
          text: 'Step 2: Substitute into  ∫ u dv = uv - ∫ v du:\n\n   ∫ x cos(x) dx  =  (x) · (sin x)  -  ∫ sin(x) dx\n                         =  x · sin(x)  -  ( - cos(x) )  +  C\n                         =  x · sin(x)  +  cos(x)  +  C',
        },
        {
          id: 'p3-6',
          x: 120,
          y: 720,
          fontSize: 34,
          color: '#10b981',
          text: 'Final Solution:   x · sin(x) + cos(x) + C  ✓',
        },
      ],
    },
    {
      id: 'wb-page-4',
      title: 'Tabular (DI) Method for Repeated Polynomial Integrals',
      bgType: 'dots',
      strokes: [
        {
          tool: 'roundedRect',
          color: '#0066cc',
          width: 2.5,
          points: [{ x: 80, y: 190 }, { x: 1040, y: 640 }],
        },
        {
          tool: 'line',
          color: '#0066cc',
          width: 2,
          points: [{ x: 80, y: 260 }, { x: 1040, y: 260 }],
        },
        {
          tool: 'line',
          color: '#0066cc',
          width: 2,
          points: [{ x: 260, y: 190 }, { x: 260, y: 640 }],
        },
        {
          tool: 'line',
          color: '#0066cc',
          width: 2,
          points: [{ x: 620, y: 190 }, { x: 620, y: 640 }],
        },
        {
          tool: 'arrow',
          color: '#ef4444',
          width: 2.5,
          points: [{ x: 480, y: 310 }, { x: 740, y: 370 }],
        },
        {
          tool: 'arrow',
          color: '#ef4444',
          width: 2.5,
          points: [{ x: 480, y: 380 }, { x: 740, y: 440 }],
        },
        {
          tool: 'arrow',
          color: '#ef4444',
          width: 2.5,
          points: [{ x: 480, y: 450 }, { x: 740, y: 510 }],
        },
        {
          tool: 'arrow',
          color: '#ef4444',
          width: 2.5,
          points: [{ x: 480, y: 520 }, { x: 740, y: 580 }],
        },
      ],
      textItems: [
        {
          id: 'p4-1',
          x: 80,
          y: 70,
          fontSize: 34,
          color: '#1d1d1f',
          text: 'Tabular (DI) Method: Evaluating ∫ x³ · e^(2x) dx',
        },
        {
          id: 'p4-2',
          x: 80,
          y: 135,
          fontSize: 22,
          color: '#6b7280',
          text: 'Rapid shortcut when u differentiates to 0 and dv integrates repeatedly:',
        },
        {
          id: 'p4-3',
          x: 120,
          y: 215,
          fontSize: 24,
          color: '#0066cc',
          text: 'Sign (±)',
        },
        {
          id: 'p4-4',
          x: 340,
          y: 215,
          fontSize: 24,
          color: '#0066cc',
          text: 'D (Differentiate u)',
        },
        {
          id: 'p4-5',
          x: 720,
          y: 215,
          fontSize: 24,
          color: '#0066cc',
          text: 'I (Integrate dv)',
        },
        {
          id: 'p4-6',
          x: 150,
          y: 295,
          fontSize: 24,
          color: '#1d1d1f',
          text: '( + )\n\n( - )\n\n( + )\n\n( - )\n\n( + )',
        },
        {
          id: 'p4-7',
          x: 380,
          y: 295,
          fontSize: 24,
          color: '#1d1d1f',
          text: 'x³\n\n3x²\n\n6x\n\n6\n\n0   (Terminate)',
        },
        {
          id: 'p4-8',
          x: 740,
          y: 295,
          fontSize: 24,
          color: '#1d1d1f',
          text: 'e^(2x)\n\n(1/2) e^(2x)\n\n(1/4) e^(2x)\n\n(1/8) e^(2x)\n\n(1/16) e^(2x)',
        },
        {
          id: 'p4-9',
          x: 80,
          y: 690,
          fontSize: 24,
          color: '#1d1d1f',
          text: 'Multiply along diagonal arrows with alternate sign:\n= (1/2) x³ e^(2x)  -  (3/4) x² e^(2x)  +  (3/4) x e^(2x)  -  (3/8) e^(2x)  +  C',
        },
      ],
    },
  ]
}

export function downloadSingleWhiteboardPage(
  page: WhiteboardPage,
  pageIndex: number,
  sessionName: string = 'Session',
  width: number = 1920,
  height: number = 1080
) {
  const offscreen = document.createElement('canvas')
  offscreen.width = width
  offscreen.height = height
  renderPageToCanvas(page, offscreen)

  const dataUrl = offscreen.toDataURL('image/png')
  const cleanName = sessionName.replace(/[^a-zA-Z0-9_-]/g, '_')
  const fileName = `Whiteboard_${cleanName}_Page_${pageIndex + 1}.png`

  const link = document.createElement('a')
  link.download = fileName
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  toast.success(`Downloaded Whiteboard Page #${pageIndex + 1} (.PNG)!`, {
    description: fileName,
  })
}

export function downloadAllWhiteboardPages(
  pages: WhiteboardPage[],
  sessionName: string = 'Session',
  width: number = 1920,
  height: number = 1080
) {
  if (!pages || pages.length === 0) {
    toast.error('No whiteboard pages to download')
    return
  }

  toast.info(`Preparing ${pages.length} whiteboard page${pages.length > 1 ? 's' : ''}...`, {
    description: 'Downloading full-resolution PNG images to your device.',
  })

  pages.forEach((page, idx) => {
    setTimeout(() => {
      downloadSingleWhiteboardPage(page, idx, sessionName, width, height)
    }, idx * 250)
  })
}
