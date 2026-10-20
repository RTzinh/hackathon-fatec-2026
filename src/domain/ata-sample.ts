export interface AtaSampleContext {
  title: string
  authors: string[]
  /** AAAA-MM-DD */
  defenseDate: string
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? 'autor não informado'
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`
}

/** Texto fictício de ata para demonstração: nota 8,5, indicação da banca e 3 pedidos de correção. */
export function buildSampleAta({ title, authors, defenseDate }: AtaSampleContext): string {
  const [year, month, day] = defenseDate.split('-').map(Number)
  const when = year && month && day ? `Aos ${day} dias do mês de ${MONTHS[month - 1]} de ${year}` : 'Em data a confirmar'
  const plural = authors.length > 1
  return `FATEC BAURU
ATA DA SESSÃO DE DEFESA DO TRABALHO DE GRADUAÇÃO

${when}, às 14h, na Fatec Bauru, reuniu-se a banca examinadora para a defesa pública do Trabalho de Graduação intitulado "${title}", de autoria ${plural ? 'dos alunos' : 'do(a) aluno(a)'} ${joinNames(authors)}.

A banca foi composta pelos professores: Prof. Dr. Henrique Moura (orientador), Profa. Ma. Luciana Faria e Prof. Me. Otávio Pimentel.

Após a apresentação e a arguição, a banca deliberou e atribuiu ao trabalho a nota final 8,5 (oito vírgula cinco). A banca indica o trabalho para disponibilização integral do texto no RIC-CPS.

A banca solicita as seguintes correções, a serem entregues na versão final:
1. Padronizar as referências bibliográficas conforme a ABNT, conferindo ordem, ano e formato.
2. Detalhar na seção de metodologia os critérios usados para coletar e selecionar os dados.
3. Incluir na conclusão as limitações do estudo e sugestões de trabalhos futuros.

O prazo para a entrega da versão corrigida é de 15 dias corridos a partir desta data. Nada mais havendo a tratar, lavrou-se a presente ata, que vai assinada pelos membros da banca.

Bauru, ${day ? `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}` : '__/__/____'}.
`
}
