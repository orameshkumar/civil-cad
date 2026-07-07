import paper from 'paper'

let gridGroup: paper.Group | null = null

export function drawGrid(canvasWidth: number, canvasHeight: number) {
  if (gridGroup) gridGroup.remove()
  gridGroup = new paper.Group()
  gridGroup.locked = true

  const minorMm = 100
  const majorMm = 500

  // Visible area in project (mm) coordinates, padded by one cell
  const pad = minorMm
  const tl = paper.view.viewToProject(new paper.Point(-pad, -pad))
  const br = paper.view.viewToProject(new paper.Point(canvasWidth + pad, canvasHeight + pad))

  const startX = Math.floor(tl.x / minorMm) * minorMm
  const endX   = Math.ceil(br.x  / minorMm) * minorMm
  const startY = Math.floor(tl.y / minorMm) * minorMm
  const endY   = Math.ceil(br.y  / minorMm) * minorMm

  // Stroke width in project units so lines stay 1 screen pixel wide
  const sw = 1 / paper.view.zoom

  for (let x = startX; x <= endX; x += minorMm) {
    const isMajor = Math.abs(x % majorMm) < 0.001
    const line = new paper.Path.Line(new paper.Point(x, startY), new paper.Point(x, endY))
    line.strokeColor = new paper.Color(isMajor ? '#334155' : '#1e293b')
    line.strokeWidth = (isMajor ? 1 : 0.5) * sw
    gridGroup.addChild(line)
  }

  for (let y = startY; y <= endY; y += minorMm) {
    const isMajor = Math.abs(y % majorMm) < 0.001
    const line = new paper.Path.Line(new paper.Point(startX, y), new paper.Point(endX, y))
    line.strokeColor = new paper.Color(isMajor ? '#334155' : '#1e293b')
    line.strokeWidth = (isMajor ? 1 : 0.5) * sw
    gridGroup.addChild(line)
  }

  gridGroup.sendToBack()
}

export function removeGrid() {
  if (gridGroup) { gridGroup.remove(); gridGroup = null }
}
