# Plano do MVP Integrae

## Objetivo

Demonstrar, com cenário fictício compartilhado, o fluxo da agenda da banca ao depósito institucional. Integrae é a proposta para o desafio SIG-Banca. As regras de depósito seguem a Portaria CEETEPS-GDS nº 4069/2024, conforme a pesquisa da equipe; o que a Portaria não define está em "Perguntas abertas". O protótipo não realiza integração real.

## Incrementos e estado

| Incremento | Estado | Evidência |
|---|---|---|
| 1. Base compartilhada | Feito | React, TypeScript, Vite; perfis de demonstração; `localStorage`; restauração do cenário; navegação responsiva; estados de carregamento/erro/empty |
| 2. Agendamento e convite | Feito | Cadastro de banca, avaliadores, caixa de saída simulada, resposta por token, expiração, recusa e substituição; detector de conflito e sugestões por disponibilidade |
| 3. Pós-banca | Feito | Ata e TA, ajuste documental, checklist, tarefas, prazo +15 dias, versões independentes e aprovação por versão (ordem reorganizada no incremento 6) |
| 4. Consulta e coordenação | Feito | Filtros combinados com metadados acadêmicos; pendências da coordenação (o registro do depósito passou ao bibliotecário no incremento 6) |
| 5. Diferenciais e entrega | Feito | Build passou; cinco testes de regras passaram; preview Vercel READY e HTTP 200; pitch escrito em `PITCH.md`; branch enviada ao GitHub (verificação anterior ao incremento 6) |
| 6. Aderência à Portaria 4069/2024 | Feito | Perfil Bibliotecário e tela "Fila da biblioteca" (`LibraryPage`); pós-banca em quatro etapas (ata conferida, aval, TA, pacote à biblioteca) com validação automática do TA; painel da coordenação com prazo de correção, prazo da biblioteca e assinatura do coordenador; "Registrar realização" na agenda; nome de arquivo exigido na tela do aluno; leitura local de PDF e PDF/A no `FilePicker`; página "Modelo do processo"; visão geral calculada do estado; rótulos de status e coluna RIC-CPS na consulta; amostras em `public/amostras/` (`scripts/gerar-amostras.mjs`); 10 testes de regra passam; fluxo completo percorrido em Chrome headless, inclusive a 390 px sem rolagem horizontal |
| 7. IA real (OpenRouter) | Feito | "Ler ata com IA" na etapa da ata: o servidor chama `anthropic/claude-haiku-5.5` pela OpenRouter (chave só no servidor), valida a resposta e devolve nota, indicação, data, banca, correções e divergências com o cadastro; o orientador confere antes de aplicar e as tarefas criadas aguardam revisão; `npm run test:ai` cobre a validação da resposta, sem rede; detalhes no README |

## Arquitetura

```text
src/
  domain/       tipos, rótulos (labels.ts) e regras: prazos, conflito, token, nome de arquivo,
                nível de acesso, inspeção de PDF e validação do TA
  data/         cenário fictício inicial
  repositories/ localStorage (chave sig-banca-demo-v2) e restauração
  components/   navegação, status, cabeçalho e seleção de arquivos (lê bytes localmente)
  pages/        agenda, convite, aluno, pós-banca, consulta, coordenação, biblioteca,
                modelo do processo (a visão geral e a caixa de saída ficam em App.tsx)
public/amostras/  PDFs de amostra, gerados por scripts/gerar-amostras.mjs
scripts/          rules.test.mjs (testes de regra) e gerar-amostras.mjs
```

Persistência tem adapter de navegador. O MVP não tem banco institucional, autenticação real, integração de e-mail nem RIC-CPS. A única chamada externa é a IA (OpenRouter), feita só pelo servidor (`server/ata-assistant.ts`, exposto por `api/ata-assistant.ts` e pelo middleware do Vite); as sugestões de correção do cenário inicial continuam sendo exemplos fixos.

O `FilePicker` lê os bytes do arquivo no navegador (arquivos até 24 MB inteiros; acima disso, 4 MB do início e 4 MB do fim) para detectar o cabeçalho `%PDF` e `pdfaid:part`. Nenhum byte sai da máquina e só o resultado (`PdfInspection`) persiste. A detecção é heurística e não substitui o veraPDF.

## Modelo

- `User` com papel separado (`ProfileRole`: orientador, convidado, aluno, coordenação, bibliotecário e público); `Course`; `Work` e autoria (`authorIds`, `WorkAuthor`).
- `Work` tem `workType` e `hasProduct` (produto complementar), informados na agenda.
- `DefenseBoard` aponta para trabalho e tem status acadêmico independente dos documentos e convites. Guarda `semester`, `year` e, após a conferência da ata, `grade` e `nominatedByBoard`.
- `Invitation` mantém status e token individuais. Tokens de demonstração não são credenciais de produção.
- `BoardDocument` separa Ata e autorização (TA), arquivo local e status documental; o TA carrega `term: TermData`.
- `TermData` (Anexo C): `accessLevel` (`integral`, `embargo`, `restrito`), `embargoUntil`, `fundingAgency` (`nao`, `capes`, `cnpq`, `fapesp`, `outro`), `correctionsDeclared` e `signatures` (`authors`, `advisor`, `coordinator`), com `coordinatorSignedBy` e `coordinatorSignedAt`.
- `StoredFile` guarda nome, tipo, tamanho, data e `inspection?: PdfInspection` (`isPdf`, `pdfaPart`, `inspectedBytes`), resultado da leitura local.
- `FinalVersion` guarda submissão e decisão por versão; aprovar uma não altera outra.
- `CorrectionTask` e `HistoryEvent` registram tarefas e eventos.
- `DepositRecord` registra o encaminhamento do orientador (`forwardedBy`, `sentToLibraryAt`, `packageFiles`, `academicServicesCopy`) e a submissão do bibliotecário (`submittedBy`, `recordedAt`, `receiptUrl`, `receiptFile`, `note`).
- `Availability` alimenta checagem de disponibilidade e sugestão de horário.
- `OutboxMessage` representa convite simulado, sem entrega externa.

## Estados do protótipo

```text
Banca: agendada -> realizada -> pendente-correcao -> concluida
Convite: pendente -> aceito | recusado | expirado
Documento: pendente -> enviado -> aprovado | ajustes-solicitados -> enviado
Versão: enviada -> aprovada | ajustes-solicitados -> nova versão enviada
Depósito: nao-encaminhado -> encaminhado -> registrado
```

Gatilhos das transições da banca:

| Transição | Gatilho | Quem |
|---|---|---|
| agendada -> realizada | "Registrar realização" na agenda (pede confirmação, com aviso se a data é futura ou se nenhum convidado aceitou) | Orientador |
| realizada -> pendente-correcao | Conferência da ata, com nota (0 a 10) e indicação da banca | Orientador |
| pendente-correcao -> concluida | Validação do TA, liberado só após ata conferida e aval de uma versão | Orientador |

Demais transições: ata ou TA vai a `enviado` ao anexar arquivo e a `aprovado` na conferência ou validação; a versão vai a `aprovada` ou `ajustes-solicitados` por decisão do orientador; o depósito vai a `encaminhado` quando o orientador envia o pacote e a `registrado` quando o bibliotecário informa link ou comprovante.

Validação automática do TA (bloqueia "Validar TA e concluir banca" enquanto houver item pendente): nota e indicação vindas da ata; nível de acesso coerente (integral só com nota >= 9 e indicação, Art. 14; embargo exige data); declaração de correções; assinaturas de autores, orientador e coordenador; arquivo PDF com declaração PDF/A, tamanho até 1 GB e nome no padrão com sufixo `_TA`. A versão final recebe as checagens de nome, PDF, PDF/A e tamanho (até 10 GB), mas elas não bloqueiam o aluno nem o aval.

Nome de arquivo (Art. 6): `curso_ano_semestre_primeiroautor_titulo.pdf`, com as 5 primeiras palavras do título, sem acento, espaço ou maiúscula; o TA recebe o sufixo `_TA`.

Prazos: correção = data da defesa + 15 dias corridos, conforme o briefing; biblioteca = fim do semestre + 90 dias (Art. 10, §2º), com fim de semestre de calendário demonstrativo (30/06 e 15/12), pois a unidade define o calendário real. Atraso é aviso, sem bloqueio.

"Concluída" = aval da versão + TA validado é decisão de projeto, a confirmar com a coordenação. O protótipo não afirma composição mínima da banca nem modelo oficial de ata.

## Requisitos nas telas

| Jornada | Tela | Ações conectadas |
|---|---|---|
| Orientador | Visão geral | Contagens e trilha calculadas a partir do estado (bancas, convites, ata, aval, TA, depósito) |
| Orientador | Agenda e bancas | Criar banca (tipo do trabalho e produto complementar) e convites, ver respostas, substituir recusado, registrar conflito e alternativa, "Registrar realização" (agendada -> realizada) |
| Orientador | Pós-banca e documentos | 1. Anexar e conferir a ata (nota e indicação); 2. avaliar versões e dar aval a uma; 3. TA pré-preenchido com acesso, fomento, declaração e assinaturas, rascunho em HTML e validação; 4. encaminhar o pacote à biblioteca, com cópia do TA à Diretoria de Serviços Acadêmicos; revisar tarefas de correção |
| Docente convidado | Meus convites | Aceitar ou recusar com link de demonstração; token inválido, expirado e usado recebe estado explicativo |
| Aluno | Meu trabalho | Ver banca, prazo, tarefas, atraso e histórico; ver o nome de arquivo exigido e a checagem (sem bloqueio); selecionar e registrar nova versão |
| Coordenação | Pendências | Painel com TA aguardando assinatura, correção em atraso, pacotes na biblioteca e depositados; prazo de correção e prazo da biblioteca por trabalho; confirmar a assinatura do coordenador no TA. Não registra depósito |
| Bibliotecário | Fila da biblioteca | Ver pacotes encaminhados (arquivos, acesso escolhido, prazo) e registrar a submissão no RIC-CPS por link ou comprovante |
| Público | Consulta de bancas | Combinar sete filtros; rótulos corretos de status e coluna RIC-CPS; consulta esconde e-mail, token e arquivo |
| Orientador, Coordenação, Público | Modelo do processo | Diagrama de estados da banca, dimensões paralelas, eixo documental, fluxo de dados e regras do CPS automatizadas (entregável "Modelagem da solução") |
| Orientador | Caixa de saída | Ver destinatário, situação e link demonstrativo; sem envio real |

## Verificação de entrega

- `npm run test:rules`: 10 testes de regra passam (prazo de 15 dias, conflito, disponibilidade, token, nome de arquivo da Portaria, texto integral com nota >= 9 e indicação, prazo da biblioteca, declaração PDF/A no XMP e validação de arquivo e termo).
- Teste de ponta a ponta em Chrome headless percorreu o fluxo completo (agenda, realização, ata, versão, aval, TA, assinatura da coordenação, encaminhamento, submissão do bibliotecário, consulta), inclusive em largura de celular (390 px) sem rolagem horizontal. O roteiro manual equivalente está no README.
- `npm run build` e `npm run lint`: rodar antes da entrega; esta atualização de documentação não os reexecutou. O lint do incremento 5 terminava com avisos de pureza em datas no render e atualização de estado em efeitos.
- O preview Vercel registrado no README é anterior ao incremento 6 e precisa ser republicado para refletir as mudanças.
- A chave do `localStorage` passou a `sig-banca-demo-v2`; dados salvos por versões anteriores não são lidos.
- Limites: não há validação completa de PDF/A (só a declaração nos metadados), verificação de assinatura, usuário institucional, envio de e-mail, confirmação RIC-CPS nem teste em celular físico.
- Vercel atribuiu o primeiro deploy à produção por ser o primeiro do projeto. Um deploy separado de preview foi gerado explicitamente com `--target preview`.

## Perguntas abertas

Pendentes de resposta da coordenação ou da unidade (seção 5 da pesquisa):

1. Onde e como se contam os 15 dias corridos (marco inicial, atraso, exceções, nova rodada de correções)? Não consta na Portaria.
2. A banca é considerada confirmada com quais aceites (composição mínima)?
3. Qual é o modelo oficial de ata da Fatec Bauru?
4. O que significa "concluída" no filtro de status: aval do orientador, TA conferido ou depósito? O protótipo usa aval da versão + TA validado.
5. Que metadados da banca (membros, data, local) podem ser públicos?
6. Existe hoje algum procedimento de registro do encaminhamento à biblioteca que o sistema deva imitar?

## Fora do MVP

Autenticação real, banco/API, e-mail, armazenamento binário, verificação de assinatura, validação completa de PDF/A (veraPDF), integração RIC-CPS, IA que decide ou aprova (a IA só sugere, com revisão humana), publicação institucional e regras oficiais de banca/nota. Adicionar só após validação com responsáveis institucionais.
