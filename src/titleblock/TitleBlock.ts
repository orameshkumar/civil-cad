import paper from 'paper'
import type { TitleBlockData } from '../store/useDrawingStore'

let tbGroup: paper.Group | null = null

const PAPER_SIZES = {
  A3: { w: 420, h: 297 },
  A4: { w: 297, h: 210 },
}

export function drawTitleBlock(data: TitleBlockData, canvasW: number, canvasH: number) {
  if (tbGroup) tbGroup.remove()
  tbGroup = new paper.Group()
  tbGroup.data = { layerId: 'titleblock' }
  tbGroup.locked = true

  const { w: pw, h: ph } = PAPER_SIZES[data.paperSize]

  // Centre paper on visible canvas area (in project/mm coordinates)
  const tl = paper.view.viewToProject(new paper.Point(0, 0))
  const canvasMmW = canvasW / paper.view.zoom
  const canvasMmH = canvasH / paper.view.zoom
  const ox = tl.x + (canvasMmW - pw) / 2
  const oy = tl.y + (canvasMmH - ph) / 2

  const white = new paper.Color('#e2e8f0')
  const thin = 0.4   // mm
  const thick = 1.0  // mm

  // Border
  const border = new paper.Path.Rectangle(
    new paper.Point(ox + 20, oy + 10),
    new paper.Size(pw - 30, ph - 20)
  )
  border.strokeColor = white
  border.strokeWidth = thick
  tbGroup.addChild(border)

  // Title block box (bottom right, 180×50mm)
  const tbW = 180
  const tbH = 50
  const tbX = ox + pw - 10 - tbW
  const tbY = oy + ph - 10 - tbH

  const box = new paper.Path.Rectangle(new paper.Point(tbX, tbY), new paper.Size(tbW, tbH))
  box.strokeColor = white
  box.strokeWidth = thin
  tbGroup.addChild(box)

  // Fields
  const fields = [
    { label: 'PROJECT', value: data.project, y: tbY + 8 },
    { label: 'TITLE',   value: data.title,   y: tbY + 20 },
    { label: 'SCALE',   value: data.scale,   y: tbY + 32 },
    { label: 'DATE',    value: data.date,    y: tbY + 44 },
    { label: 'DRAWN',   value: data.drawnBy, y: tbY + 32, x2: true },
    { label: 'REV',     value: data.revision,y: tbY + 44, x2: true },
  ]

  const col2X = tbX + tbW / 2

  fields.forEach(({ label, value, y, x2 }) => {
    const bx = x2 ? col2X + 4 : tbX + 4
    const lbl = new paper.PointText(new paper.Point(bx, y))
    lbl.content = label
    lbl.fillColor = new paper.Color('#94a3b8')
    lbl.fontSize = 3   // 3mm ≈ 6px at base zoom
    tbGroup!.addChild(lbl)

    const val = new paper.PointText(new paper.Point(bx, y + 8))
    val.content = value || '—'
    val.fillColor = white
    val.fontSize = 4   // 4mm ≈ 8px at base zoom
    val.fontWeight = 'bold'
    tbGroup!.addChild(val)
  })

  // Divider lines
  const midY1 = tbY + 14; const midY2 = tbY + 26; const midY3 = tbY + 38
  const midX = tbX + tbW / 2
  ;[midY1, midY2, midY3].forEach((hy) => {
    const l = new paper.Path.Line(new paper.Point(tbX, hy), new paper.Point(tbX + tbW, hy))
    l.strokeColor = new paper.Color('#334155'); l.strokeWidth = thin
    tbGroup!.addChild(l)
  })
  const vl = new paper.Path.Line(new paper.Point(midX, tbY + 28), new paper.Point(midX, tbY + tbH))
  vl.strokeColor = new paper.Color('#334155'); vl.strokeWidth = thin
  tbGroup!.addChild(vl)
}

export function removeTitleBlock() {
  if (tbGroup) { tbGroup.remove(); tbGroup = null }
}
