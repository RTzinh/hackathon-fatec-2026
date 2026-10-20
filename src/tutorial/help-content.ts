import type { TourRole } from './steps'

/** Textos da página "Como usar". Ficam aqui, fora do componente, para serem conferidos em teste. */

export interface FlowItem {
  role: TourRole
  name: string
  screens: string[]
  does: string
}

/** Perfis na ordem em que passam o trabalho adiante. */
export const flow: FlowItem[] = [
  { role: 'orientador', name: 'Orientador', screens: ['Visão geral', 'Agenda e bancas', 'Pós-banca', 'Caixa de saída'], does: 'Cadastra a banca e convida os docentes. Depois da defesa, confere a ata, dá o aval a uma versão, valida o Termo de Autorização e encaminha o pacote à biblioteca.' },
  { role: 'convidado', name: 'Convidado', screens: ['Meus convites'], does: 'Abre o link individual e aceita ou recusa a participação. A resposta é única.' },
  { role: 'aluno', name: 'Aluno', screens: ['Meu trabalho'], does: 'Acompanha o prazo (defesa + 15 dias corridos) e envia a versão corrigida com o nome de arquivo exigido.' },
  { role: 'coordenacao', name: 'Coordenação', screens: ['Pendências', 'Depósito RIC-CPS'], does: 'Confirma a assinatura do coordenador no TA, acompanha os prazos e registra a submissão no RIC-CPS.' },
]

export interface DemoStep {
  role: string
  screen: string
  text: string
  /** Passos menores dentro do mesmo passo. */
  details?: string[]
}

/** Mesma ordem do "Roteiro de teste" do README: sete passos e a conferência final. */
export const demoSteps: DemoStep[] = [
  { role: 'Orientador', screen: 'Agenda e bancas', text: 'Em uma banca agendada, clique em Registrar realização. O aviso sobre data futura é esperado e o status passa a Realizada.' },
  { role: 'Orientador', screen: 'Pós-banca', text: 'Selecione a banca do Davi. Observe as quatro etapas e que o Termo de Autorização (TA) está bloqueado.' },
  { role: 'Aluno', screen: 'Meu trabalho', text: 'Veja o nome de arquivo exigido e envie uma nova versão com o PDF de amostra, pelo link “Baixar PDF de amostra para testar”.' },
  {
    role: 'Orientador', screen: 'Pós-banca', text: 'Percorra as etapas em ordem:',
    details: [
      'Ata: clique em Conferir ata (ou em Ler ata com IA e revise a sugestão), informe nota e indicação e clique em Registrar conferência.',
      'Versão final: opcionalmente use Revisar conformidade com IA e, em Aprovar esta versão, dê o aval à nova versão. O TA é liberado.',
      'TA: preencha acesso, fomento, declaração de correções e assinaturas de autores e orientador. Anexe a amostra inválida para ver a validação falhar e depois a válida.',
    ],
  },
  { role: 'Coordenação', screen: 'Pendências', text: 'Em Assinar Termos de Autorização, clique em Confirmar assinatura. Confira os prazos de correção e da biblioteca.' },
  { role: 'Orientador', screen: 'Pós-banca', text: 'Clique em Validar TA e concluir banca (a banca passa a Concluída) e depois em Encaminhar pacote à biblioteca.' },
  { role: 'Coordenação', screen: 'Depósito RIC-CPS', text: 'Abra o pacote, informe um link ou selecione um comprovante e clique em Registrar submissão.' },
]

export const finalCheck: DemoStep = {
  role: 'Qualquer perfil', screen: 'Consulta pública',
  text: 'Filtre por status Concluída e confira a coluna RIC-CPS. Abra também o Modelo do processo.',
}

export interface GlossaryItem { term: string; meaning: string }

export const glossary: GlossaryItem[] = [
  { term: 'TA', meaning: 'Termo de Autorização (Anexo C da Portaria 4069/2024). Define se o texto integral vai ao RIC-CPS e leva nota, indicação da banca, declaração de correções e assinaturas. Só é liberado depois da ata conferida e do aval de uma versão.' },
  { term: 'RIC-CPS', meaning: 'Repositório institucional do Centro Paula Souza, onde o trabalho é depositado. Aqui o depósito é um registro manual por link ou comprovante, sem integração.' },
  { term: 'PDF/A', meaning: 'Formato de PDF para guarda de longo prazo. O Integrae confere se o arquivo declara PDF/A nos metadados, o que não substitui um validador completo.' },
  { term: 'Aval por versão', meaning: 'O orientador aprova uma versão específica (v1, v2…). A decisão não vale para versões enviadas depois.' },
]

export const tips: Array<{ title: string; text: string }> = [
  { title: 'Trocar de perfil', text: 'Use os botões “Ver como” no topo. O cenário é compartilhado entre os perfis.' },
  { title: 'Desfazer', text: 'Avisos com Desfazer duram cerca de 7 segundos e restauram o estado anterior à última ação.' },
  { title: 'Recomeçar', text: 'Restaurar cenário inicial, no rodapé do menu, volta aos dados de exemplo.' },
]
