import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Compass, Undo2, X } from 'lucide-react'
import type { ProfileRole } from '../domain/types'
import type { View } from '../App'
import { TOUR_EVENT } from '../tutorial/events'
import { isUsableRect, padRect, placeBalloon, sameRect, scrollDelta } from '../tutorial/position'
import type { Rect, Size } from '../tutorial/position'
import { createSeenStore } from '../tutorial/storage'
import { tourFor } from '../tutorial/steps'
import type { TourDefinition } from '../tutorial/steps'
import './Tour.css'

export interface TourProps {
  /** Perfil em uso. Cada perfil tem o seu tour e o seu convite. */
  role: ProfileRole
  /** Tela atual. O tour navega até a tela de cada passo quando ela é outra. */
  view: View
  navigate: (view: View, focus?: string) => void
}

interface TargetState { rect: Rect | null; settled: boolean }

const SPOT_PADDING = 6
/** Altura da barra superior fixa, reservada ao rolar a página até o alvo. */
const TOPBAR_HEIGHT = 60
const POLL_MS = 150
/** Depois de navegar, espera a nova tela montar antes de desistir do alvo. */
const SETTLE_TICKS = 4
/** Tentativas de rolar até o alvo; evita brigar com a rolagem ao topo que a navegação dispara. */
const SCROLL_TRIES = 8

function readViewport(): Size {
  return { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight }
}

/** Elementos fixos ou sticky (menu, barra superior, avisos) não se movem com a rolagem. */
function isPinned(element: Element): boolean {
  for (let node: Element | null = element; node && node !== document.documentElement; node = node.parentElement) {
    const position = getComputedStyle(node).position
    if (position === 'fixed' || position === 'sticky') return true
  }
  return false
}

function focusMain() {
  const main = document.getElementById('main-content')
  if (!main) return
  main.setAttribute('tabindex', '-1')
  main.focus({ preventScroll: true })
  main.addEventListener('blur', () => main.removeAttribute('tabindex'), { once: true })
}

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Perfis sem tour (ou fora da demonstração) não mostram convite nem balão. */
export function Tour(props: TourProps) {
  const definition = tourFor(props.role)
  return definition ? <TourRunner {...props} definition={definition} /> : null
}

function TourRunner({ role, view, navigate, definition }: TourProps & { definition: TourDefinition }) {
  const store = useMemo(() => createSeenStore(() => window.localStorage), [])
  const [seen, setSeen] = useState<string[]>(() => store.read())
  const [session, setSession] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [viewport, setViewport] = useState<Size>(readViewport)
  const [target, setTarget] = useState<TargetState>({ rect: null, settled: false })
  const [size, setSize] = useState<Size>({ width: 340, height: 230 })
  const [announcement, setAnnouncement] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const navigateRef = useRef(navigate)
  const navigatedFor = useRef(-1)
  const titleId = useId()
  const bodyId = useId()

  const steps = definition.steps
  const open = session === role
  const stepIndex = Math.min(index, steps.length - 1)
  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1

  useLayoutEffect(() => { navigateRef.current = navigate })

  const start = useCallback(() => {
    const active = document.activeElement
    restoreRef.current = active instanceof HTMLElement && active !== document.body ? active : null
    navigatedFor.current = -1
    setIndex(0)
    setAnnouncement('')
    setTarget({ rect: null, settled: false })
    setSession(role)
    setSeen(store.add(role))
  }, [role, store])
  const close = useCallback(() => setSession(null), [])
  // O foco permanece no botão ao avançar; um aviso de leitura anuncia o novo passo.
  const go = useCallback((next: number) => {
    const target = steps[next]
    setIndex(next)
    if (target) setAnnouncement(`Passo ${next + 1} de ${steps.length}. ${target.title}. ${target.body}`)
  }, [steps])
  const dismissOffer = useCallback(() => setSeen(store.add(role)), [role, store])

  // Permite reabrir o tour de fora, por exemplo pela página "Como usar".
  useEffect(() => {
    window.addEventListener(TOUR_EVENT, start)
    return () => window.removeEventListener(TOUR_EVENT, start)
  }, [start])

  // Enquanto o balão está aberto, só ele recebe foco e cliques. Ao fechar, o foco volta a quem o tinha.
  useEffect(() => {
    if (!open) return
    const root = document.getElementById('root')
    const wasInert = root?.hasAttribute('inert') ?? false
    root?.setAttribute('inert', '')
    return () => {
      if (!wasInert) root?.removeAttribute('inert')
      const previous = restoreRef.current
      restoreRef.current = null
      if (previous?.isConnected) previous.focus({ preventScroll: true })
      else focusMain()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const update = () => setViewport((current) => {
      const next = readViewport()
      return current.width === next.width && current.height === next.height ? current : next
    })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [open])

  // Esc fecha e Tab circula dentro do balão.
  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); close(); return }
      if (event.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) { event.preventDefault(); dialog.focus(); return }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (!dialog.contains(active)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); return }
      if (event.shiftKey && active === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open, close])

  // Leva o usuário à tela do passo, rola até o alvo e acompanha o retângulo dele. Se o alvo não
  // existir (fila vazia, menu recolhido, aviso que já sumiu), o passo cai num balão centralizado.
  useLayoutEffect(() => {
    if (!open) {
      navigatedFor.current = -1
      return
    }
    if (step.view && view !== step.view) {
      if (navigatedFor.current !== stepIndex) {
        navigatedFor.current = stepIndex
        setTarget({ rect: null, settled: false })
        navigateRef.current(step.view)
      }
      return
    }
    const budget = navigatedFor.current === stepIndex ? SETTLE_TICKS : 0
    let ticks = 0
    let scrolls = 0
    let frame = 0

    function measure() {
      const area = readViewport()
      const element = document.querySelector<HTMLElement>(step.selector)
      let rect: Rect | null = null
      if (element) {
        let box = element.getBoundingClientRect()
        if (scrolls < SCROLL_TRIES && !isPinned(element)) {
          const delta = scrollDelta({ left: box.left, top: box.top, width: box.width, height: box.height }, area.height, TOPBAR_HEIGHT)
          if (Math.abs(delta) > 1) {
            scrolls++
            window.scrollBy({ top: delta, behavior: 'instant' })
            box = element.getBoundingClientRect()
          }
        }
        const candidate: Rect = { left: box.left, top: box.top, width: box.width, height: box.height }
        if (isUsableRect(candidate, area) && getComputedStyle(element).visibility !== 'hidden') rect = candidate
      }
      const settled = rect !== null || ticks >= budget
      ticks++
      setTarget((current) => current.settled === settled && sameRect(current.rect, rect) ? current : { rect, settled })
    }
    function schedule() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }

    measure()
    const timer = window.setInterval(measure, POLL_MS)
    window.addEventListener('scroll', schedule, { capture: true, passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.clearInterval(timer)
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule, { capture: true })
      window.removeEventListener('resize', schedule)
    }
  }, [open, stepIndex, view, step])

  // O balão muda de tamanho com o texto, a largura da tela e o conteúdo extra do passo sem alvo.
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog) return
    const read = () => setSize((current) => current.width === dialog.offsetWidth && current.height === dialog.offsetHeight ? current : { width: dialog.offsetWidth, height: dialog.offsetHeight })
    read()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(read)
    observer.observe(dialog)
    return () => observer.disconnect()
  }, [open])

  useEffect(() => {
    if (!open || !target.settled) return
    const dialog = dialogRef.current
    if (dialog && !dialog.contains(document.activeElement)) primaryRef.current?.focus({ preventScroll: true })
  }, [open, target.settled])

  const spot = target.rect ? padRect(target.rect, SPOT_PADDING, viewport) : { left: 0, top: 0, width: viewport.width, height: viewport.height }
  const placed = useMemo(
    () => placeBalloon({ target: target.rect ? padRect(target.rect, SPOT_PADDING, viewport) : null, balloon: size, viewport, prefer: step.placement }),
    [target.rect, size, viewport, step.placement],
  )
  const missing = target.settled && target.rect === null
  const showOffer = !open && !seen.includes(role) && (view as string) !== 'help'
  const count = steps.length

  return createPortal(<>
    {showOffer && <section className="tour-offer" aria-label={`Tour guiado do perfil ${definition.label}`}>
      <span className="tour-offer__icon" aria-hidden="true"><Compass size={17} /></span>
      <div className="tour-offer__text"><strong>Tour do perfil {definition.label}</strong><span>{count} passos até a sua próxima ação.</span></div>
      <div className="tour-offer__actions">
        <button type="button" className="button button--small button--primary" onClick={start}>Ver tour de {count} passos</button>
        <button type="button" className="button button--small button--quiet" onClick={dismissOffer}>Agora não</button>
      </div>
    </section>}
    {open && <div className="tour-root" onMouseDown={(event) => { if (event.target === event.currentTarget) event.preventDefault() }}>
      <div className={`tour-spot${target.rect ? '' : ' tour-spot--none'}`} aria-hidden="true" style={{ left: spot.left, top: spot.top, width: spot.width, height: spot.height }} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        className={`tour-dialog${target.settled ? '' : ' tour-dialog--pending'}`}
        style={{ transform: `translate3d(${placed.x}px, ${placed.y}px, 0)`, '--tour-arrow': placed.arrow === null ? undefined : `${placed.arrow}px` } as CSSProperties}
      >
        <div className="tour-card">
          <div key={`${stepIndex}-${target.settled}`} className="tour-copy">
            <div className="tour-progress">
              <p className="tour-eyebrow">{definition.label} · passo {stepIndex + 1} de {count}</p>
              <div className="tour-dots" aria-hidden="true">{steps.map((item, position) => <span key={item.id} className={`tour-dot${position === stepIndex ? ' tour-dot--active' : position < stepIndex ? ' tour-dot--done' : ''}`} />)}</div>
            </div>
            <h2 id={titleId} className="tour-title">{step.title}</h2>
            <p id={bodyId} className="tour-body">{step.body}</p>
            {missing && step.whenMissing && <p className="tour-note">{step.whenMissing}</p>}
            {missing && step.specimen && <div className="tour-specimen" aria-hidden="true">
              <span className="tour-specimen__tag">Exemplo</span>
              <CheckCircle2 size={16} className="tour-specimen__icon" />
              <span className="tour-specimen__text">{step.specimen === 'undo' ? 'Ação registrada.' : 'Resposta registrada.'}</span>
              {step.specimen === 'undo' && <span className="tour-specimen__undo"><Undo2 size={13} /> Desfazer</span>}
              <X size={14} className="tour-specimen__close" />
            </div>}
          </div>
          <div className="tour-actions">
            <button type="button" className="text-button tour-skip" onClick={close}>Pular tour</button>
            <div className="tour-nav">
              {stepIndex > 0 && <button type="button" className="button button--small" onClick={() => go(stepIndex - 1)}>Anterior</button>}
              <button ref={primaryRef} type="button" className="button button--small button--primary" onClick={() => isLast ? close() : go(stepIndex + 1)}>{isLast ? 'Concluir' : 'Próximo'}</button>
            </div>
          </div>
        </div>
        {placed.arrow !== null && (placed.placement === 'top' || placed.placement === 'bottom' || placed.placement === 'left' || placed.placement === 'right') && <span className={`tour-arrow tour-arrow--${placed.placement}`} aria-hidden="true" />}
        <div className="tour-sr" role="status" aria-live="polite">{announcement}</div>
      </div>
    </div>}
  </>, document.body)
}
