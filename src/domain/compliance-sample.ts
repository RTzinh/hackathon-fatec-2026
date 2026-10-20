import type { ComplianceContext, ComplianceKind } from '../../server/compliance-review'

/** Dados do cadastro que o contexto da revisão não carrega, usados só para montar o texto de exemplo. */
export interface ComplianceSampleExtras {
  courseName?: string
  advisor?: string
  /** AAAA-MM-DD */
  defenseDate?: string
  workType?: string
  hasProduct?: boolean
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? 'autor não informado'
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`
}

function formatDate(isoDate?: string) {
  return isoDate ? isoDate.split('-').reverse().join('/') : '__/__/____'
}

/**
 * Texto fictício de versão final para demonstração. Trata a primeira correção da banca, deixa as demais
 * sem tratamento e omite de propósito a seção "Palavras-chave", para a revisão mostrar achados.
 */
function buildSampleVersaoFinal({ title, authors, corrections }: ComplianceContext): string {
  const handled = corrections[0]
  const note = handled
    ? `Nota da versão corrigida: nesta versão foi atendido o pedido da banca "${handled.title}".\n\n`
    : ''
  return `${title.toUpperCase()}

${joinNames(authors)}
Fatec Bauru · Trabalho de Graduação

${note}RESUMO
Este trabalho apresenta o desenvolvimento de uma solução digital para apoiar a tomada de decisão de organizações locais. A partir de um levantamento com usuários, foi construído um protótipo funcional com indicadores de acompanhamento, que foi avaliado em testes de usabilidade. Os resultados indicam boa aceitação da interface e redução do tempo para consultar informações.

1 INTRODUÇÃO
As organizações locais produzem muitos dados, mas raramente os reúnem em um formato que facilite o acompanhamento. Este trabalho propõe uma solução simples, de baixo custo, para organizar e visualizar esses dados. O objetivo geral é desenvolver e avaliar um protótipo de painel de indicadores. Os objetivos específicos são levantar necessidades, implementar o protótipo e testá-lo com usuários.

2 METODOLOGIA
A pesquisa teve natureza aplicada e abordagem qualitativa. Os dados foram coletados por meio de entrevistas e de planilhas fornecidas pelas organizações participantes. O protótipo foi desenvolvido de forma incremental e avaliado em testes de usabilidade com usuários voluntários.

3 DESENVOLVIMENTO
O protótipo reúne os dados em uma única tela, com gráficos de evolução e alertas simples. A arquitetura separa a coleta, o tratamento e a apresentação das informações, o que facilita a manutenção. Os testes de usabilidade foram feitos em duas rodadas, com ajustes de interface entre elas.

4 CONCLUSÃO
O protótipo mostrou-se adequado para o acompanhamento dos indicadores e foi bem recebido pelos usuários. O trabalho cumpriu os objetivos propostos e abre caminho para uma versão de produção.

REFERÊNCIAS
ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. NBR 14724: informação e documentação: trabalhos acadêmicos: apresentação. Rio de Janeiro: ABNT, 2011.
ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. NBR 6023: informação e documentação: referências: elaboração. Rio de Janeiro: ABNT, 2018.
NIELSEN, J. Usability engineering. San Francisco: Morgan Kaufmann, 1993.
`
}

/** Texto fictício de Termo de Autorização (Anexo C). Omite de propósito a agência de fomento e a assinatura do coordenador. */
function buildSampleTermo(context: ComplianceContext, extras: ComplianceSampleExtras): string {
  const access = context.accessLevel ?? 'restrito'
  const accessLine = access === 'integral'
    ? 'Autorizo a disponibilização do texto integral no RIC-CPS.'
    : access === 'embargo'
      ? 'Autorizo a disponibilização do texto integral no RIC-CPS após o período de embargo informado.'
      : 'Autorizo a disponibilização restrita (apenas resumo e metadados) no RIC-CPS.'
  const grade = context.grade === undefined ? '' : context.grade.toLocaleString('pt-BR')
  return `TERMO DE AUTORIZAÇÃO PARA DISPONIBILIZAÇÃO NO RIC-CPS
Anexo C da Portaria CEETEPS-GDS nº 4069/2024

Unidade: Fatec Bauru · Município: Bauru
Curso: ${extras.courseName ?? context.courseCode}
Título do trabalho: ${context.title}
Tipo do trabalho: ${extras.workType ?? 'não informado'}
Produto complementar: ${extras.hasProduct === undefined ? 'não informado' : extras.hasProduct ? 'Sim' : 'Não'}
Autores: ${joinNames(context.authors)}
Orientador(a): ${extras.advisor ?? 'não informado'}
Data da defesa: ${formatDate(extras.defenseDate)}
Nota: ${grade}
Indicação da banca para disponibilização integral: ${context.nominated === undefined ? 'não informada' : context.nominated ? 'Sim' : 'Não'}

Opção de acesso: ${access === 'embargo' ? 'embargo' : access}
${accessLine}

Declaro(amos) que todas as correções solicitadas pela banca examinadora foram realizadas e que a versão final foi entregue.

Assinaturas:
${context.authors.map((author) => `${author} (autor) ______________________  assinado`).join('\n')}
${extras.advisor ?? 'Orientador(a)'} (orientador) ______________________  assinado
Coordenador(a) do curso ______________________
`
}

/** Texto de exemplo montado com o contexto da banca, com achados propositais para a demonstração. */
export function buildSampleComplianceText(kind: ComplianceKind, context: ComplianceContext, extras: ComplianceSampleExtras = {}): string {
  return kind === 'versao-final' ? buildSampleVersaoFinal(context) : buildSampleTermo(context, extras)
}
