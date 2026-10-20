import { ArrowRight } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import './ProcessModelPage.css'

const boardFlow = [
  { status: 'agendada', who: 'Orientador cadastra banca e convites' },
  { status: 'realizada', who: 'Orientador registra a realização' },
  { status: 'pendente-correcao', who: 'Ata conferida com nota e indicação · abre prazo de 15 dias' },
  { status: 'concluida', who: 'Aval de uma versão + TA validado' },
]

const dimensions = [
  { title: 'Convite', states: ['pendente', 'aceito', 'recusado', 'expirado'], note: 'Token individual, resposta única; recusado pode ser substituído.' },
  { title: 'Documento (ata e TA)', states: ['pendente', 'enviado', 'ajustes-solicitados', 'aprovado'], note: 'TA só libera após ata conferida e aval da versão.' },
  { title: 'Versão final', states: ['enviada', 'ajustes-solicitados', 'aprovada'], note: 'Aprovar uma versão não altera as outras.' },
  { title: 'Depósito', states: ['nao-encaminhado', 'encaminhado', 'registrado'], note: 'Orientador encaminha; bibliotecário submete no RIC-CPS.' },
]

const documentAxis = ['Defesa realizada', 'Ata anexada', 'Nota e indicação', 'Aluno envia versão', 'Aval do orientador', 'TA pré-preenchido', 'Assinaturas (autores, orientador, coordenador)', 'Validação: PDF/A, nome, campos', 'Pacote à biblioteca + cópia à DSA', 'Bibliotecário submete no RIC-CPS']

const rules = [
  ['Nome do arquivo', 'curso_ano_semestre_primeiroautor_titulo.pdf e sufixo _TA', 'Portaria 4069/2024, Art. 6'],
  ['Formato e tamanho', 'PDF/A declarado nos metadados; TCC até 10 GB, TA até 1 GB', 'Art. 6'],
  ['Texto integral', 'Só com nota ≥ 9 e indicação da banca; autor escolhe integral, embargo ou restrito', 'Art. 14 e Anexo C'],
  ['Prazo da biblioteca', 'Até 90 dias após o fim do semestre letivo', 'Art. 10, §2º'],
  ['Prazo de correção', 'Data da defesa + 15 dias corridos; atraso é aviso', 'Tema do hackathon'],
  ['Responsáveis', 'Orientador reúne e encaminha; bibliotecário submete', 'Arts. 10 e 11'],
]

export function ProcessModelPage() {
  return <>
    <PageHeader title="Modelo do processo" description="Diagrama de estados, eixo documental e fluxo de dados do protótipo. Transições marcadas como decisão de projeto ainda dependem de validação da coordenação." />
    <section className="panel model-panel"><div className="panel-heading"><div><h2>Status da banca (filtro oficial)</h2><p>Os quatro status do tema do hackathon; cada transição tem um gatilho.</p></div></div>
      <ol className="state-line">{boardFlow.map((step, index) => <li key={step.status}><StatusBadge status={step.status} /><small>{step.who}</small>{index < boardFlow.length - 1 && <ArrowRight size={16} className="state-line__arrow" aria-hidden="true" />}</li>)}</ol>
      <p className="model-note">“Concluída” = aval da versão + TA validado é uma decisão de projeto (pergunta 4 da pesquisa).</p>
    </section>
    <section className="panel model-panel"><div className="panel-heading"><div><h2>Dimensões acompanhadas em paralelo</h2><p>Separar os estados evita confundir aprovação acadêmica, documentação e publicação.</p></div></div>
      <div className="dimension-grid">{dimensions.map((dimension) => <article key={dimension.title}><h3>{dimension.title}</h3><div className="dimension-states">{dimension.states.map((state) => <StatusBadge key={state} status={state} />)}</div><p>{dimension.note}</p></article>)}</div>
    </section>
    <section className="panel model-panel"><div className="panel-heading"><div><h2>Eixo documental</h2><p>Ordem corrigida pela pesquisa: o TA depende da ata e da versão final.</p></div></div>
      <ol className="axis-list">{documentAxis.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol>
    </section>
    <section className="panel model-panel"><div className="panel-heading"><div><h2>Fluxo de dados</h2><p>O que existe no protótipo e o que entra numa versão institucional.</p></div></div>
      <div className="dataflow">
        <div className="dataflow__col"><h3>Atores</h3><span>Orientador</span><span>Docente convidado</span><span>Aluno</span><span>Coordenação</span><span>Bibliotecário</span><span>Consulta pública</span></div>
        <ArrowRight className="dataflow__arrow" aria-hidden="true" />
        <div className="dataflow__col"><h3>Interface React</h3><span>Telas por perfil</span><span>Leitura local do PDF (formato e PDF/A)</span></div>
        <ArrowRight className="dataflow__arrow" aria-hidden="true" />
        <div className="dataflow__col"><h3>Domínio</h3><span>Regras de prazo, conflito e token</span><span>Regras da Portaria 4069/2024</span></div>
        <ArrowRight className="dataflow__arrow" aria-hidden="true" />
        <div className="dataflow__col"><h3>Persistência</h3><span>localStorage (demonstração)</span><span className="dataflow__future">API + banco institucional</span><span className="dataflow__future">Armazenamento de arquivos</span><span className="dataflow__future">E-mail institucional com token</span></div>
      </div>
      <p className="model-note">Itens tracejados não fazem parte do protótipo. Não existe API conhecida do RIC-CPS; o depósito continua manual pelo bibliotecário.</p>
    </section>
    <section className="panel model-panel"><div className="panel-heading"><div><h2>Regras do CPS automatizadas</h2><p>Validações determinísticas; a IA fica só em sugestões revisadas por humano.</p></div></div>
      <div className="table-scroll"><table className="rules-table"><thead><tr><th>Regra</th><th>Como o sistema aplica</th><th>Fonte</th></tr></thead><tbody>{rules.map(([rule, how, source]) => <tr key={rule}><td><strong>{rule}</strong></td><td>{how}</td><td>{source}</td></tr>)}</tbody></table></div>
    </section>
  </>
}
