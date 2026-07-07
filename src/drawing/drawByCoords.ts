import paper from 'paper'
import { history } from '../history/HistoryManager'
import { useDrawingStore } from '../store/useDrawingStore'
import { applyCurrentLayerStates } from '../layers/LayerManager'

const WITNESS_OFFSET = 5   // mm
const DIM_LINE_OFFSET = 12 // mm
const ARROW_SIZE = 3       // mm

function getCtx() {
  const s = useDrawingStore.getState()
  const color = new paper.Color(
    s.layers.find((l) => l.id === s.activeLayerId)?.color ?? '#ffffff'
  )
  return { color, layerId: s.activeLayerId, s }
}

function commit(item: paper.Item, layerId: string) {
  item.data = { layerId }
  paper.view.update()
  history.snapshot()
  applyCurrentLayerStates()
}

export function drawLine(x1: number, y1: number, x2: number, y2: number) {
  const { color, layerId } = getCtx()
  const path = new paper.Path.Line(new paper.Point(x1, y1), new paper.Point(x2, y2))
  path.strokeColor = color
  path.strokeWidth = 1.5
  commit(path, layerId)
}

export function drawRectangle(x: number, y: number, w: number, h: number) {
  const { color, layerId } = getCtx()
  const rect = new paper.Path.Rectangle(new paper.Point(x, y), new paper.Size(w, h))
  rect.strokeColor = color
  rect.strokeWidth = 1.5
  commit(rect, layerId)
}

export function drawCircle(cx: number, cy: number, r: number) {
  const { color, layerId } = getCtx()
  const circle = new paper.Path.Circle(new paper.Point(cx, cy), r)
  circle.strokeColor = color
  circle.strokeWidth = 1.5
  commit(circle, layerId)
}

// 3-point arc: from → through → to  (matches ArcTool click pattern)
export function drawArc(
  x1: number, y1: number,
  xt: number, yt: number,
  x2: number, y2: number,
) {
  const { color, layerId } = getCtx()
  const arc = new paper.Path()
  arc.moveTo(new paper.Point(x1, y1))
  arc.arcTo(new paper.Point(xt, yt), new paper.Point(x2, y2))
  arc.strokeColor = color
  arc.strokeWidth = 1.5
  commit(arc, layerId)
}

export function drawWall(x1: number, y1: number, x2: number, y2: number) {
  const { color, layerId, s } = getCtx()
  const half = (s.wallThickness ?? 200) / 2
  const from = new paper.Point(x1, y1)
  const to = new paper.Point(x2, y2)
  const dir = to.subtract(from).normalize()
  const perp = new paper.Point(-dir.y, dir.x).multiply(half)

  const group = new paper.Group()
  const line1 = new paper.Path.Line(from.add(perp), to.add(perp))
  const line2 = new paper.Path.Line(from.subtract(perp), to.subtract(perp))
  ;[line1, line2].forEach((l) => { l.strokeColor = color; l.strokeWidth = 1.5 })
  group.addChild(line1)
  group.addChild(line2)
  commit(group, layerId)
}

export function drawPolyline(points: [number, number][]) {
  const filtered = points.filter((_, i) =>
    i < points.length - 1
      ? true
      : points.length >= 2
  )
  if (filtered.length < 2) return
  const { color, layerId } = getCtx()
  const path = new paper.Path()
  filtered.forEach(([x, y]) => path.add(new paper.Point(x, y)))
  path.strokeColor = color
  path.strokeWidth = 1.5
  commit(path, layerId)
}

export function drawText(x: number, y: number, content: string) {
  if (!content.trim()) return
  const { color, layerId, s } = getCtx()
  const text = new paper.PointText(new paper.Point(x, y))
  text.content = content.trim()
  text.fillColor = color
  text.fontSize = s.fontSize
  text.fontFamily = 'monospace'
  commit(text, layerId)
}

export function drawDimension(x1: number, y1: number, x2: number, y2: number) {
  const { layerId } = getCtx()
  const p1 = new paper.Point(x1, y1)
  const p2 = new paper.Point(x2, y2)

  const group = new paper.Group()
  const color = new paper.Color('#fbbf24')
  const sw = 1.2

  const dir = p2.subtract(p1).normalize()
  const perp = new paper.Point(-dir.y, dir.x)
  const offset = perp.multiply(DIM_LINE_OFFSET)
  const d1 = p1.add(offset)
  const d2 = p2.add(offset)

  const w1 = new paper.Path.Line(p1.add(perp.multiply(WITNESS_OFFSET)), d1.add(perp.multiply(4)))
  const w2 = new paper.Path.Line(p2.add(perp.multiply(WITNESS_OFFSET)), d2.add(perp.multiply(4)))
  const dimLine = new paper.Path.Line(d1, d2)

  const makeArrow = (base: paper.Point, direction: paper.Point) => {
    const left = base.add(direction.multiply(ARROW_SIZE)).add(perp.multiply(ARROW_SIZE / 2))
    const right = base.add(direction.multiply(ARROW_SIZE)).subtract(perp.multiply(ARROW_SIZE / 2))
    const a = new paper.Path([base, left, right])
    a.closed = true; a.fillColor = color; a.strokeColor = color
    return a
  }

  const distMm = p1.getDistance(p2)
  const label = new paper.PointText(d1.add(d2).divide(2).add(perp.multiply(8)))
  label.content = distMm >= 1000
    ? `${(distMm / 1000).toFixed(2)}m`
    : `${Math.round(distMm)}mm`
  label.fillColor = color
  label.fontSize = 5.5
  label.justification = 'center'

  ;[w1, w2, dimLine].forEach((p) => { p.strokeColor = color; p.strokeWidth = sw })
  ;[w1, w2, dimLine, makeArrow(d1, dir), makeArrow(d2, dir.multiply(-1)), label]
    .forEach((c) => group.addChild(c))

  commit(group, layerId)
}
