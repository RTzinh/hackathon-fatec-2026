import type { View } from '../App'
import type { Side } from './position'

/**
 * Conteúdo do tour guiado, um por perfil de demonstração. Os alvos usam só os seletores abaixo,
 * que as telas mantêm estáveis; o tipo impede usar qualquer outro por engano.
 */
export const TOUR_SELECTORS = [
  '.side-nav', '.profile-tabs', '.overview-strip', '.action-list', '.agenda-list', '.workflow-track',
  '.stepper', '.step-panel', '.upload-panel', '.queue-item', '.status-chip', '.consultation-results',
  '.board-picker', '.page-heading', '.panel', '.toast',
] as const

export type TourSelector = (typeof TOUR_SELECTORS)[number]

/** Perfis da demonstração que têm tour. Qualquer outro perfil simplesmente não mostra convite. */
export type TourRole = 'orientador' | 'convidado' | 'aluno' | 'coordenacao'

export interface TourStep {
  id: string
  selector: TourSelector
  title: string
  /** Uma ou duas frases. */
  body: string
  /** Tela em que o alvo existe. O tour navega até ela antes de procurar o alvo. */
  view?: View
  /** Lado preferido do balão; o tour usa outro lado se não couber. */
  placement?: Side | 'auto'
  /** Explicação extra, mostrada só quando o alvo não está na tela (fila vazia, aviso que ainda não surgiu). */
  whenMissing?: string
  /** Aviso ilustrativo desenhado no balão quando não há um aviso real para destacar. */
  specimen?: 'undo' | 'no-undo'
}

export interface TourDefinition {
  /** Nome do perfil como aparece no seletor de perfil, no convite e no balão. */
  label: string
  steps: TourStep[]
}

const undoBody = 'Depois de cada ação, o aviso no canto da tela traz Desfazer por cerca de 7 segundos. Ele restaura o estado anterior à última ação.'

export const tours: Record<TourRole, TourDefinition> = {
  orientador: {
    label: 'Orientador',
    steps: [
      {
        id: 'perfil', selector: '.profile-tabs', placement: 'bottom',
        title: 'Troque de perfil',
        body: 'Cada botão mostra a jornada de um papel. O cenário é compartilhado: o que você faz aqui aparece para os outros perfis.',
      },
      {
        id: 'proxima-acao', selector: '.action-list', view: 'overview',
        title: 'Comece por “Para fazer agora”',
        body: 'Cada item é a próxima ação de uma banca, como conferir a ata ou avaliar uma versão. Clique para abrir direto na banca certa.',
      },
      {
        id: 'etapas', selector: '.stepper', view: 'post-defense',
        title: 'Pós-banca em quatro etapas',
        body: 'Ata, versão final, Termo de Autorização (TA) e biblioteca: cada etapa libera a seguinte. O TA só abre depois da ata conferida e do aval de uma versão.',
      },
      {
        id: 'desfazer', selector: '.toast', specimen: 'undo',
        title: 'Errou? Use Desfazer',
        body: undoBody,
        whenMissing: 'O aviso aparece depois de uma ação, como conferir a ata ou registrar a realização de uma banca.',
      },
    ],
  },
  convidado: {
    label: 'Convidado',
    steps: [
      {
        id: 'convite', selector: '.page-heading', view: 'guest',
        title: 'Responda ao convite da banca',
        body: 'Cada convite tem um link individual (token) e aceita uma única resposta. Os seus estão logo abaixo.',
      },
      {
        id: 'responder', selector: '.panel', view: 'guest',
        title: 'Abra, confira e responda',
        body: 'Clique em Abrir convite, confira data e local e escolha Aceitar participação ou Recusar convite. Depois, clique em Confirmar.',
      },
      {
        id: 'sem-desfazer', selector: '.toast', specimen: 'no-undo',
        title: 'Resposta única, sem Desfazer',
        body: 'A resposta é formal e o link vale uma vez só, então o aviso não traz Desfazer. Nos outros perfis, ele dura cerca de 7 segundos.',
        whenMissing: 'O aviso aparece depois de confirmar a resposta ao convite.',
      },
    ],
  },
  aluno: {
    label: 'Aluno',
    steps: [
      {
        id: 'prazo', selector: '.page-heading', view: 'student',
        title: 'Seu prazo e sua próxima ação',
        body: 'O prazo da versão corrigida é a data da defesa mais 15 dias corridos, logo abaixo. Atraso gera aviso, sem bloquear o envio.',
      },
      {
        id: 'envio', selector: '.upload-panel', view: 'student',
        title: 'Envie a versão corrigida',
        body: 'Copie o nome exigido, selecione o PDF e clique em Registrar versão definitiva. A checagem de PDF/A e de nome é só um aviso.',
      },
      {
        id: 'desfazer', selector: '.toast', specimen: 'undo',
        title: 'Enviou o arquivo errado?',
        body: 'O aviso da versão traz Desfazer por cerca de 7 segundos. Depois, o orientador dá o aval a uma versão específica.',
        whenMissing: 'O aviso aparece depois de clicar em Registrar versão definitiva.',
      },
    ],
  },
  coordenacao: {
    label: 'Coordenação',
    steps: [
      {
        id: 'indicadores', selector: '.overview-strip', view: 'coordination',
        title: 'Quatro indicadores, quatro filas',
        body: 'Clique em um indicador para filtrar o acompanhamento e clique de novo para limpar. Atraso é só aviso.',
      },
      {
        id: 'assinatura', selector: '.queue-item', view: 'coordination',
        title: 'Confirme a assinatura do coordenador',
        body: 'O TA anexado pelo orientador aparece aqui. Confira o arquivo e clique em Confirmar assinatura.',
        whenMissing: 'Nenhum TA aguarda assinatura agora. Ele aparece aqui quando o orientador anexa o termo no Pós-banca.',
      },
      {
        id: 'deposito', selector: '.queue-item', view: 'library',
        title: 'Registre a submissão no RIC-CPS',
        body: 'Em Depósito RIC-CPS, abra o pacote encaminhado, informe o link ou anexe o comprovante e clique em Registrar submissão.',
        whenMissing: 'A fila está vazia. Os pacotes chegam quando o orientador valida o TA e encaminha à biblioteca.',
      },
      {
        id: 'desfazer', selector: '.toast', specimen: 'undo',
        title: 'Confirmou sem querer?',
        body: 'Confirmar assinatura e Registrar submissão mostram Desfazer por cerca de 7 segundos.',
        whenMissing: 'O aviso aparece depois de uma dessas ações.',
      },
    ],
  },
}

/** Ordem em que os perfis aparecem na jornada completa e na página “Como usar”. */
export const roleOrder: readonly TourRole[] = ['orientador', 'convidado', 'aluno', 'coordenacao']

export function tourFor(role: string): TourDefinition | undefined {
  return (tours as Record<string, TourDefinition | undefined>)[role]
}
