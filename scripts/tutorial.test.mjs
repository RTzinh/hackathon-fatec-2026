import assert from 'node:assert/strict'
import test from 'node:test'
import { demoSteps, flow, glossary } from '../src/tutorial/help-content.ts'
import { isUsableRect, padRect, placeBalloon, sameRect, scrollDelta } from '../src/tutorial/position.ts'
import { TOUR_SELECTORS, roleOrder, tourFor, tours } from '../src/tutorial/steps.ts'
import { TOUR_SEEN_KEY, createSeenStore } from '../src/tutorial/storage.ts'

const phone = { width: 390, height: 844 }
const small = { width: 320, height: 568 }
const desktop = { width: 1280, height: 800 }

test('cada perfil tem de 3 a 4 passos curtos com alvos permitidos', () => {
  for (const role of roleOrder) {
    const { steps, label } = tours[role]
    assert.ok(label)
    assert.ok(steps.length >= 3 && steps.length <= 4, `${role}: ${steps.length} passos`)
    assert.equal(new Set(steps.map((step) => step.id)).size, steps.length, `${role}: ids repetidos`)
    for (const step of steps) {
      assert.ok(TOUR_SELECTORS.includes(step.selector), `${role}/${step.id}: seletor ${step.selector}`)
      assert.ok(step.title.length > 0 && step.title.length <= 48, `${role}/${step.id}: título`)
      const sentences = step.body.split(/(?<=[.!?])\s+/).filter(Boolean)
      assert.ok(sentences.length >= 1 && sentences.length <= 2, `${role}/${step.id}: ${sentences.length} frases`)
      assert.ok(step.body.length <= 180, `${role}/${step.id}: corpo com ${step.body.length} caracteres`)
    }
  }
})

test('todo tour explica o aviso do Desfazer, e só o convidado não tem o botão', () => {
  for (const role of roleOrder) {
    const toast = tours[role].steps.find((step) => step.selector === '.toast')
    assert.ok(toast, `${role} sem passo do aviso`)
    assert.ok(toast.specimen, `${role}: falta o exemplo para quando não há aviso`)
    assert.equal(toast.specimen, role === 'convidado' ? 'no-undo' : 'undo')
  }
})

test('passos de alvo opcional explicam o que fazer quando ele não aparece', () => {
  for (const role of roleOrder) {
    for (const step of tours[role].steps) {
      if (step.selector === '.toast' || step.selector === '.queue-item') assert.ok(step.whenMissing, `${role}/${step.id}`)
    }
  }
})

test('perfis fora da demonstração não têm tour', () => {
  assert.equal(tourFor('publico'), undefined)
  assert.equal(tourFor('bibliotecario'), undefined)
  assert.ok(tourFor('orientador'))
})

test('página Como usar: sete passos de demonstração e glossário pedido', () => {
  assert.equal(demoSteps.length, 7)
  assert.deepEqual(glossary.map((item) => item.term), ['TA', 'RIC-CPS', 'PDF/A', 'Aval por versão'])
  assert.deepEqual(flow.map((item) => item.role), [...roleOrder])
})

test('balão fica abaixo do alvo quando cabe, com seta alinhada ao centro', () => {
  const target = { left: 500, top: 20, width: 200, height: 40 }
  const placed = placeBalloon({ target, balloon: { width: 360, height: 200 }, viewport: desktop })
  assert.equal(placed.placement, 'bottom')
  assert.equal(placed.y, 74)
  assert.equal(placed.x + placed.arrow, 600)
})

test('sem espaço abaixo, o balão sobe; sem alvo, centraliza', () => {
  const low = placeBalloon({ target: { left: 100, top: 700, width: 200, height: 60 }, balloon: { width: 360, height: 220 }, viewport: desktop })
  assert.equal(low.placement, 'top')
  assert.ok(low.y + 220 <= 700 - 14 + 0.1)
  const none = placeBalloon({ target: null, balloon: { width: 360, height: 200 }, viewport: desktop })
  assert.deepEqual([none.placement, none.x, none.y, none.arrow], ['center', 460, 300, null])
})

test('lado preferido é respeitado e o menu lateral recebe o balão à direita', () => {
  const nav = { left: 14, top: 120, width: 220, height: 180 }
  const placed = placeBalloon({ target: nav, balloon: { width: 360, height: 200 }, viewport: desktop, prefer: 'right' })
  assert.equal(placed.placement, 'right')
  assert.equal(placed.x, 14 + 220 + 14)
})

test('alvo que ocupa a tela recebe o balão sobre ele, rente à borda inferior', () => {
  const placed = placeBalloon({ target: { left: 0, top: 0, width: 390, height: 844 }, balloon: { width: 360, height: 220 }, viewport: phone })
  assert.equal(placed.placement, 'inside')
  assert.equal(placed.arrow, null)
  assert.equal(placed.y, 844 - 12 - 220)
})

test('em 390 px e 320 px o balão nunca sai da tela, para qualquer alvo', () => {
  let seed = 7
  const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
  for (const viewport of [phone, small, desktop]) {
    const balloon = { width: Math.min(360, viewport.width - 24), height: 230 }
    for (let i = 0; i < 500; i++) {
      const width = 20 + random() * viewport.width
      const height = 20 + random() * viewport.height
      const target = { left: random() * (viewport.width - 20) - 10, top: random() * (viewport.height - 20) - 10, width, height }
      const placed = placeBalloon({ target: padRect(target, 6, viewport), balloon, viewport })
      assert.ok(placed.x >= 12 - 0.1 && placed.x + balloon.width <= viewport.width - 12 + 0.1, `x fora: ${JSON.stringify({ viewport, target, placed })}`)
      assert.ok(placed.y >= 12 - 0.1 && placed.y + balloon.height <= viewport.height - 12 + 0.1, `y fora: ${JSON.stringify({ viewport, target, placed })}`)
    }
  }
})

test('quando o balão fica ao lado, ele não cobre o alvo', () => {
  const target = { left: 40, top: 300, width: 300, height: 120 }
  const balloon = { width: 360, height: 200 }
  const placed = placeBalloon({ target, balloon, viewport: desktop })
  const overlapX = placed.x < target.left + target.width && placed.x + balloon.width > target.left
  const overlapY = placed.y < target.top + target.height && placed.y + balloon.height > target.top
  assert.equal(overlapX && overlapY, false)
})

test('balão mais largo que a tela encolhe até caber', () => {
  const placed = placeBalloon({ target: null, balloon: { width: 500, height: 100 }, viewport: small })
  assert.equal(placed.x, 12)
})

test('alvo só conta como visível quando uma parte útil aparece na janela', () => {
  assert.equal(isUsableRect({ left: -300, top: 0, width: 298, height: 500 }, phone), false)
  assert.equal(isUsableRect({ left: -300, top: 0, width: 400, height: 500 }, phone), true)
  assert.equal(isUsableRect({ left: 10, top: 900, width: 100, height: 50 }, phone), false)
  assert.equal(isUsableRect({ left: 10, top: 10, width: 0, height: 50 }, phone), false)
})

test('recorte é limitado à janela e comparação de retângulos tolera meio pixel', () => {
  assert.deepEqual(padRect({ left: 2, top: 2, width: 100, height: 100 }, 6, phone), { left: 0, top: 0, width: 108, height: 108 })
  assert.equal(sameRect({ left: 1, top: 1, width: 10, height: 10 }, { left: 1.4, top: 1, width: 10, height: 10 }), true)
  assert.equal(sameRect(null, null), true)
  assert.equal(sameRect(null, { left: 0, top: 0, width: 1, height: 1 }), false)
})

test('rolagem: alvo visível fica parado; alvo longe é centralizado; alvo alto alinha ao topo', () => {
  assert.equal(scrollDelta({ left: 0, top: 200, width: 300, height: 100 }, 800), 0)
  const far = scrollDelta({ left: 0, top: 1500, width: 300, height: 100 }, 800)
  assert.ok(far > 1000)
  assert.equal(scrollDelta({ left: 0, top: 400, width: 300, height: 700 }, 800), 400 - (60 + 16))
  assert.equal(scrollDelta({ left: 0, top: -300, width: 300, height: 100 }, 800, 60) < 0, true)
})

test('perfis vistos sobrevivem a recarga e armazenamento quebrado não derruba o tour', () => {
  const data = new Map()
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value) } }
  const first = createSeenStore(() => storage)
  assert.deepEqual(first.read(), [])
  assert.deepEqual(first.add('aluno'), ['aluno'])
  assert.deepEqual(first.add('aluno'), ['aluno'])
  assert.deepEqual(createSeenStore(() => storage).add('orientador'), ['aluno', 'orientador'])
  data.set(TOUR_SEEN_KEY, '{lixo')
  assert.deepEqual(createSeenStore(() => storage).read(), [])
  data.set(TOUR_SEEN_KEY, '[1,"aluno",null]')
  assert.deepEqual(createSeenStore(() => storage).read(), ['aluno'])

  const broken = createSeenStore(() => { throw new Error('bloqueado') })
  assert.deepEqual(broken.read(), [])
  assert.deepEqual(broken.add('aluno'), ['aluno'])
  assert.deepEqual(broken.add('convidado'), ['aluno', 'convidado'])
  const readOnly = createSeenStore(() => ({ getItem: () => null, setItem: () => { throw new Error('cheio') } }))
  assert.deepEqual(readOnly.add('aluno'), ['aluno'])
})
