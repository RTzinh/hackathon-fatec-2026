import { ArrowRight, Check, Compass } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import type { PageProps } from '../App'
import type { ProfileRole } from '../domain/types'
import { requestTour } from '../tutorial/events'
import { demoSteps, finalCheck, flow, glossary, tips } from '../tutorial/help-content'
import { tourFor } from '../tutorial/steps'
import './HelpPage.css'

const boardFlow = ['agendada', 'realizada', 'pendente-correcao', 'concluida']

export function HelpPage({ role, navigate }: { role: ProfileRole; navigate: PageProps['navigate'] }) {
  const tour = tourFor(role)
  return <>
    <PageHeader title="Como usar" description="O ciclo de uma banca, do agendamento ao depósito, passando por quatro perfis. Os dados são fictícios e ficam só neste navegador." />
    <div className="help-stack">
      {tour && <section className="panel" aria-labelledby="help-tour">
        <div className="panel-heading help-tour__head">
          <div><h2 id="help-tour">Tour guiado</h2><p>Você está como {tour.label}: {tour.steps.length} passos até a próxima ação deste perfil.</p></div>
          <button type="button" className="button button--primary" onClick={requestTour}><Compass size={16} /> Rever o tour deste perfil</button>
        </div>
        <ul className="help-tips">{tips.map((tip) => <li key={tip.title}><strong>{tip.title}</strong><span>{tip.text}</span></li>)}</ul>
      </section>}

      <section className="panel" aria-labelledby="help-flow">
        <div className="panel-heading"><div><h2 id="help-flow">Fluxo completo</h2><p>Cada perfil passa o trabalho ao seguinte. O orientador atua antes e depois da defesa.</p></div></div>
        <ol className="help-flow">{flow.map((item, index) => <li key={item.role} className={item.role === role ? 'help-flow__item help-flow__item--current' : 'help-flow__item'} aria-current={item.role === role ? 'true' : undefined}>
          <span className="help-flow__num" aria-hidden="true">{index + 1}</span>
          <div>
            <strong>{item.name}{item.role === role && <span className="status help-flow__here">Você está aqui</span>}</strong>
            <p>{item.does}</p>
            <div className="help-chips">{item.screens.map((screen) => <span className="status" key={screen}>{screen}</span>)}</div>
          </div>
        </li>)}</ol>
        <div className="help-status">
          <span>Status da banca</span>
          <ol aria-label="Status da banca, em ordem">{boardFlow.map((status) => <li key={status}><StatusBadge status={status} /></li>)}</ol>
          <button type="button" className="text-button" onClick={() => navigate('model')}>Ver o Modelo do processo <ArrowRight size={15} /></button>
        </div>
      </section>

      <section className="panel" aria-labelledby="help-demo">
        <div className="panel-heading"><div><h2 id="help-demo">Demonstração em 7 passos</h2><p>Use Restaurar cenário inicial para repetir.</p></div></div>
        <ol className="help-demo">
          {demoSteps.map((step, index) => <li key={step.text}>
            <span className="help-demo__num" aria-hidden="true">{index + 1}</span>
            <div>
              <div className="help-chips"><span className="status">{step.role}</span><span className="status">{step.screen}</span></div>
              <p>{step.text}</p>
              {step.details && <ul>{step.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}
            </div>
          </li>)}
          <li className="help-demo__final">
            <span className="help-demo__num help-demo__num--check" aria-hidden="true"><Check size={14} /></span>
            <div>
              <div className="help-chips"><span className="status">{finalCheck.role}</span><span className="status">{finalCheck.screen}</span></div>
              <p>{finalCheck.text}</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="panel" aria-labelledby="help-glossary">
        <div className="panel-heading"><div><h2 id="help-glossary">Glossário</h2></div></div>
        <dl className="help-glossary">{glossary.map((item) => <div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}</dd></div>)}</dl>
      </section>
    </div>
  </>
}
