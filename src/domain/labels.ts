import type { TermData } from './types'

export const accessLabels: Record<TermData['accessLevel'], string> = { integral: 'Autorização plena (texto integral)', embargo: 'Autorização com embargo até uma data', restrito: 'Não autoriza texto integral (resumo e registro públicos)' }
export const fundingLabels: Record<TermData['fundingAgency'], string> = { nao: 'Não', capes: 'CAPES', cnpq: 'CNPq', fapesp: 'FAPESP', outro: 'Outro' }
