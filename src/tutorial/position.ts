/**
 * Geometria do tour guiado. Funções puras, sem DOM: recebem retângulos em coordenadas da janela
 * (como `getBoundingClientRect`) e devolvem onde desenhar o recorte e o balão.
 */

export interface Rect { left: number; top: number; width: number; height: number }
export interface Size { width: number; height: number }
export type Side = 'top' | 'bottom' | 'left' | 'right'
/** `center`: sem alvo. `inside`: o alvo ocupa quase toda a tela e o balão fica sobre ele, rente à borda inferior. */
export type Placement = Side | 'center' | 'inside'

export interface PlaceOptions {
  /** Alvo já com a folga do recorte; `null` centraliza o balão. */
  target: Rect | null
  balloon: Size
  viewport: Size
  prefer?: Side | 'auto'
  /** Distância entre o alvo e o balão. */
  gap?: number
  /** Distância mínima do balão às bordas da janela. */
  margin?: number
}

export interface Placed {
  x: number
  y: number
  placement: Placement
  /** Posição da seta ao longo da borda do balão voltada para o alvo; `null` quando não há seta. */
  arrow: number | null
}

const SIDES: Side[] = ['bottom', 'top', 'right', 'left']
const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
const ARROW_INSET = 18
/** Abaixo desta fração do espaço necessário, o balão deixa de ficar ao lado e passa a cobrir o alvo. */
const MIN_FIT = 0.6

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}

function order(prefer?: Side | 'auto'): Side[] {
  if (!prefer || prefer === 'auto') return SIDES
  return [prefer, OPPOSITE[prefer], ...SIDES.filter((side) => side !== prefer && side !== OPPOSITE[prefer])]
}

/** O alvo conta como visível quando uma parte útil dele aparece dentro da janela. */
export function isUsableRect(rect: Rect, viewport: Size, minVisible = 8): boolean {
  const visibleWidth = Math.min(rect.left + rect.width, viewport.width) - Math.max(rect.left, 0)
  const visibleHeight = Math.min(rect.top + rect.height, viewport.height) - Math.max(rect.top, 0)
  return rect.width > 0 && rect.height > 0 && visibleWidth >= minVisible && visibleHeight >= minVisible
}

/** Expande o retângulo em `padding` e o recorta à janela, para o recorte nunca passar da tela. */
export function padRect(rect: Rect, padding: number, viewport: Size): Rect {
  const left = Math.max(0, rect.left - padding)
  const top = Math.max(0, rect.top - padding)
  const right = Math.min(viewport.width, rect.left + rect.width + padding)
  const bottom = Math.min(viewport.height, rect.top + rect.height + padding)
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) }
}

export function sameRect(a: Rect | null, b: Rect | null, tolerance = 0.5): boolean {
  if (a === null || b === null) return a === b
  return Math.abs(a.left - b.left) <= tolerance && Math.abs(a.top - b.top) <= tolerance
    && Math.abs(a.width - b.width) <= tolerance && Math.abs(a.height - b.height) <= tolerance
}

/**
 * Quanto rolar a página (positivo = para baixo) para o alvo ficar à vista. Alvos baixos são
 * centralizados na área útil; alvos altos têm o início alinhado ao topo. `topInset` reserva a barra
 * superior fixa.
 */
export function scrollDelta(rect: Rect, viewportHeight: number, topInset = 60, margin = 16): number {
  const visibleTop = topInset + margin
  const visibleBottom = viewportHeight - margin
  const visibleHeight = Math.max(0, visibleBottom - visibleTop)
  const bottom = rect.top + rect.height
  if (rect.height > visibleHeight * 0.6) {
    return rect.top >= visibleTop && rect.top <= visibleTop + visibleHeight * 0.35 ? 0 : rect.top - visibleTop
  }
  if (rect.top >= visibleTop && bottom <= visibleBottom) return 0
  return rect.top - (visibleTop + (visibleHeight - rect.height) / 2)
}

/** Escolhe o lado do alvo com espaço para o balão e o mantém dentro da janela. */
export function placeBalloon(options: PlaceOptions): Placed {
  const { target, viewport } = options
  const gap = options.gap ?? 14
  const margin = options.margin ?? 12
  const bounds = { left: margin, top: margin, right: viewport.width - margin, bottom: viewport.height - margin }
  const width = Math.min(options.balloon.width, Math.max(0, bounds.right - bounds.left))
  const height = Math.min(options.balloon.height, Math.max(0, bounds.bottom - bounds.top))

  if (!target) {
    return {
      x: round(clamp((viewport.width - width) / 2, bounds.left, bounds.right - width)),
      y: round(clamp((viewport.height - height) / 2, bounds.top, bounds.bottom - height)),
      placement: 'center',
      arrow: null,
    }
  }

  const centerX = target.left + target.width / 2
  const centerY = target.top + target.height / 2
  const space: Record<Side, number> = {
    bottom: bounds.bottom - (target.top + target.height + gap),
    top: target.top - gap - bounds.top,
    right: bounds.right - (target.left + target.width + gap),
    left: target.left - gap - bounds.left,
  }
  const need: Record<Side, number> = { bottom: height, top: height, right: width, left: width }
  const sides = order(options.prefer)
  const fitting = sides.find((side) => space[side] >= need[side])
  const side = fitting ?? sides.reduce((best, candidate) => space[candidate] / need[candidate] > space[best] / need[best] ? candidate : best, sides[0])

  if (!fitting && space[side] / need[side] < MIN_FIT) {
    return { x: round(clamp(centerX - width / 2, bounds.left, bounds.right - width)), y: round(bounds.bottom - height), placement: 'inside', arrow: null }
  }

  let x: number
  let y: number
  if (side === 'bottom' || side === 'top') {
    x = clamp(centerX - width / 2, bounds.left, bounds.right - width)
    y = side === 'bottom' ? target.top + target.height + gap : target.top - gap - height
  } else {
    y = clamp(centerY - height / 2, bounds.top, bounds.bottom - height)
    x = side === 'right' ? target.left + target.width + gap : target.left - gap - width
  }
  x = clamp(x, bounds.left, bounds.right - width)
  y = clamp(y, bounds.top, bounds.bottom - height)

  const arrow = !fitting ? null : side === 'bottom' || side === 'top'
    ? clamp(centerX - x, ARROW_INSET, width - ARROW_INSET)
    : clamp(centerY - y, ARROW_INSET, height - ARROW_INSET)
  return { x: round(x), y: round(y), placement: side, arrow: arrow === null ? null : round(arrow) }
}
