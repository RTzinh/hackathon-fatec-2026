# Plano do MVP Integrae

## Objetivo

Demonstrar, com cenário fictício compartilhado, o fluxo da agenda da banca ao depósito institucional. Integrae é a proposta para o desafio SIG-Banca. Este protótipo não declara regras acadêmicas não confirmadas nem realiza integração real.

## Incrementos e estado

| Incremento | Estado | Evidência |
|---|---|---|
| 1. Base compartilhada | Feito | React, TypeScript, Vite; perfis de demonstração; `localStorage`; restauração do cenário; navegação responsiva; estados de carregamento/erro/empty |
| 2. Agendamento e convite | Feito | Cadastro de banca, avaliadores, caixa de saída simulada, resposta por token, expiração, recusa e substituição; detector de conflito e sugestões por disponibilidade |
| 3. Pós-banca | Feito | Ata e RIC-CPS, ajuste documental, checklist, tarefas, prazo +15 dias, versões independentes e aprovação por versão |
| 4. Consulta e coordenação | Feito | Filtros combinados com metadados acadêmicos; pendências; encaminhamento local; depósito por link ou comprovante |
| 5. Diferenciais e entrega | Feito | Build passou; cinco testes de regras passaram; preview Vercel READY e HTTP 200; pitch escrito em `PITCH.md`; branch enviada ao GitHub |

## Arquitetura

```text
src/
  domain/       tipos e regras de data, token e conflito
  data/         cenário fictício inicial
  repositories/ localStorage e restauração
  components/   navegação, status, cabeçalho e seleção de arquivos
  pages/        início, agenda, convite, aluno, pós-banca, consulta, coordenação
```

Persistência tem adapter de navegador. O MVP não tem API, banco institucional, autenticação, integração de e-mail, RIC-CPS nem chamada de IA.

## Modelo

- `User` com papel separado; `Course`; `Work` e autoria (`authorIds`, `WorkAuthor`).
- `DefenseBoard` aponta para trabalho e tem status acadêmico independente dos documentos e convites.
- `Invitation` mantém status e token individuais. Tokens de demonstração não são credenciais de produção.
- `BoardDocument` separa Ata e autorização, arquivo local e status documental.
- `FinalVersion` guarda submissão e decisão por versão; aprovar uma não altera outra.
- `CorrectionTask`, `HistoryEvent` e `DepositRecord` registram tarefas, eventos e encaminhamento/depósito.
- `Availability` alimenta checagem de disponibilidade e sugestão de horário.
- `OutboxMessage` representa convite simulado, sem entrega externa.

## Estados do protótipo

```text
Banca: agendada -> realizada -> pendente-correcao -> concluida
Convite: pendente -> aceito | recusado | expirado
Documento: pendente -> enviado -> aprovado | ajustes-solicitados -> enviado
Versão: enviada -> aprovada | ajustes-solicitados -> nova versão enviada
Depósito: não encaminhado -> encaminhado -> registrado
```

Transições acima representam a demonstração. Não afirmam composição obrigatória, notas mínimas, regras de assinatura ou publicação institucional. A data final de correção é data da defesa + 15 dias corridos, conforme briefing.

## Requisitos nas telas

| Jornada | Tela | Ações conectadas |
|---|---|---|
| Orientador | Agenda e bancas | Criar banca e convites, ver respostas, substituir recusado, registrar conflito e alternativa |
| Orientador | Pós-banca e documentos | Escolher arquivos, solicitar ajustes, conferir documentos, revisar tarefas e decidir sobre versão específica |
| Docente convidado | Meus convites | Aceitar ou recusar com link de demonstração; token inválido, expirado e usado recebe estado explicativo |
| Aluno | Meu trabalho | Ver banca, prazo, tarefas, atraso e histórico; selecionar e registrar nova versão |
| Público | Consulta de bancas | Combinar sete filtros; consulta esconde e-mail, token e arquivo |
| Coordenação | Pendências | Ver situação; marcar encaminhamento local; registrar comprovante por link ou metadado de arquivo |
| Orientador | Caixa de saída | Ver destinatário, situação e link demonstrativo; sem envio real |

## Verificação de entrega

- `npm run build`: TypeScript + bundle de produção.
- `npm run test:rules`: prazo de 15 dias, conflito e validação de token.
- `npm run lint`: Oxlint no código-fonte.
- Smoke check do servidor e preview HTTP.
- Oxlint termina com avisos de pureza em datas no render e atualização de estado em efeitos.
- Não há validação real de arquivo, usuário institucional, envio de e-mail, confirmação RIC ou comportamento em celular físico; inspeção visual em navegador não foi possível neste ambiente.
- Vercel atribuiu o primeiro deploy à produção por ser o primeiro do projeto. Um deploy separado de preview foi gerado explicitamente com `--target preview`.

## Fora do MVP

Autenticação real, banco/API, e-mail, armazenamento binário, assinatura, leitura de PDF/A, integração RIC-CPS, geração de conteúdo por modelo de IA, publicação institucional e regras oficiais de banca/nota. Adicionar só após validação com responsáveis institucionais.
