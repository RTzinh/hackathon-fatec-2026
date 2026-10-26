# Integrae

MVP navegável do Integrae, proposta para o desafio SIG-Banca no II Hackathon AMS Fatec Bauru/IBM. Dados e pessoas são fictícios. Protótipo demonstra o ciclo de uma banca; não substitui sistema institucional.

Roteiro escrito do pitch e guia de demonstração: [PITCH.md](./PITCH.md).

## Rodar local

Requisitos: Node.js 24+ e npm

```powershell
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite. O cenário persiste no `localStorage`; use **Restaurar cenário inicial** para voltar aos exemplos.

```powershell
npm run build
npm run test:rules
npm run test:ai
npm run lint
npm run preview
```

## Jornadas e requisitos

| Requisito | Tela |
|---|---|
| Agenda de banca, cadastro (tipo do trabalho e produto complementar), avaliadores, conflitos e alternativas | Agenda e bancas |
| Registro da realização da defesa (agendada para realizada) | Agenda e bancas |
| Convite individual, aceite/recusa, token inválido, expirado ou usado | Meus convites e caixa de saída demonstrativa |
| Ata conferida com nota e indicação da banca; versão com aval; Termo de Autorização (Anexo C) com validação automática; encaminhamento do pacote à biblioteca | Pós-banca e documentos |
| Prazo de correção de 15 dias corridos, tarefas, histórico de versões e nome de arquivo exigido | Meu trabalho |
| Aprovação vinculada a versão específica | Pós-banca e documentos |
| Prazo de correção, prazo da biblioteca (fim do semestre + 90 dias) e confirmação da assinatura do coordenador no TA | Pendências da coordenação |
| Registro da submissão no RIC-CPS por link ou comprovante | Depósito RIC-CPS (Coordenação) |
| Filtros combinados: curso, aluno, orientador, avaliador, semestre, ano e status; coluna RIC-CPS | Consulta pública |
| Diagrama de estados, eixo documental, fluxo de dados e regras do CPS | Modelo do processo |
| Sugestões de correção que aguardam revisão humana | Pós-banca e documentos |

## Dados e integrações simuladas

- Perfis de demonstração: Orientador (Camila Nunes), Convidado (Marcos Reis), Aluno (Davi Rocha) e Coordenação (Eva Ribeiro). A tela de login lista as contas de teste e aceita qualquer senha; um e-mail de conta de teste escolhe o perfil, e qualquer outro entra como Orientador. **Criar conta** só acrescenta um usuário local. O seletor **Ver como**, no topo, troca de perfil na aba. Não há perfil de biblioteca nem de visitante: no protótipo, a tela **Depósito RIC-CPS**, da Coordenação, representa a biblioteca, que a Portaria 4069/2024 encarrega de submeter o trabalho ao RIC-CPS.
- A agenda, tarefas, convites, documentos, versões, histórico e depósitos compartilham estado no navegador (`localStorage`, chave `sig-banca-demo-v2`; dados de versões anteriores não são lidos).
- Convites não são enviados por e-mail. A caixa de saída mostra conteúdo e links demonstrativos.
- Upload seleciona o arquivo no navegador e persiste apenas nome, tipo, tamanho, data e o resultado da inspeção. Os bytes não são enviados nem sobrevivem à recarga.
- O seletor de arquivos lê os bytes localmente para detectar o cabeçalho `%PDF` e a declaração `pdfaid:part` nos metadados XMP. É uma heurística e não substitui um validador como o veraPDF.
- A validação do TA (PDF, declaração PDF/A, tamanho até 1 GB, nome no padrão, campos e assinaturas) é determinística e bloqueia "Validar TA e concluir banca". Na tela do aluno, a checagem do nome e do formato é só um aviso e não bloqueia o envio.
- As assinaturas de autores e orientador são marcadas pelo orientador; a do coordenador é confirmada no perfil Coordenação. Nenhuma assinatura é verificada.
- O prazo da biblioteca usa fim de semestre de calendário demonstrativo (30/06 e 15/12); a unidade define o calendário real.
- "Concluída" significa aval da versão + TA validado. É decisão de projeto, a confirmar com a coordenação (ver "Perguntas abertas" em `PLANO.md`).
- A leitura da ata com IA chama um modelo pela OpenRouter, só a partir do servidor (veja "IA (OpenRouter)"). As tarefas de IA do cenário inicial continuam sendo exemplos fixos. Toda sugestão exige revisão do orientador.
- RIC-CPS, assinatura, validação de autenticidade e publicação institucional não têm integração. A submissão no RIC-CPS é um registro manual, feito na tela Depósito RIC-CPS da Coordenação, e o envio à biblioteca é um registro, sem e-mail.
- Atraso é aviso informativo. Não existe bloqueio automático.
- Prazo de correção: data da defesa + 15 dias corridos, definido pelo briefing do hackathon.
- A consulta pública mostra dados acadêmicos e avaliadores que aceitaram convite; esconde arquivos, e-mails e tokens.

## IA (OpenRouter)

Na etapa **Ata de Defesa** do Pós-banca, o botão **Ler ata com IA** recebe o texto da ata colada e sugere nota, indicação da banca, data, membros da banca, pedidos de correção e divergências com o cadastro (data, autores). A chamada passa por `POST /api/ata-assistant`: uma Vercel Function (`api/ata-assistant.ts`) em produção e um middleware do Vite (`vite.config.ts`) no `npm run dev`. As duas usam a mesma lógica, em `server/ata-assistant.ts`.

**Configuração local.** Crie `.env.local` na raiz (o git ignora arquivos `*.local`) e reinicie o `npm run dev`:

```
OPENROUTER_API_KEY=cole-sua-chave-aqui
# opcional; o padrão é anthropic/claude-haiku-5.5
OPENROUTER_MODEL=anthropic/claude-haiku-5.5
```

**Vercel.** Em Project Settings, Environment Variables, cadastre `OPENROUTER_API_KEY` e, se quiser trocar o modelo, `OPENROUTER_MODEL`. Faça um novo deploy. O `vercel.json` dá 30 s à função.

**A chave fica só no servidor.** Ela é lida em `process.env` dentro da função e do plugin do Vite; nunca use o prefixo `VITE_`, que exporia a variável ao navegador, e não escreva a chave em arquivos versionados. Sem a variável, o endpoint responde 503 ("IA indisponível: configure OPENROUTER_API_KEY no servidor") e a tela mostra o aviso.

**Modelo e limites.** O padrão é `anthropic/claude-haiku-5.5` (US$ 0,10 por 1 milhão de tokens de entrada e US$ 0,50 de saída, conforme a lista pública da OpenRouter em 20/10/2026), com temperatura 0,1 e até 800 tokens de resposta. O texto da ata aceita até 15.000 caracteres (acima disso, HTTP 413) e a chamada tem timeout de 25 s. O servidor valida a resposta do modelo e descarta ou normaliza campos fora do formato.

**Revisão humana.** O resultado aparece como "Sugestão de IA · confira antes de aplicar". **Usar nota e indicação** só preenche o formulário de conferência; o orientador ainda clica em **Registrar conferência**. **Adicionar N correções como tarefas** cria tarefas abertas, com origem "sugestão de IA", que aguardam revisão. Nada é aprovado automaticamente.

**Privacidade.** O texto colado é enviado à OpenRouter e ao provedor do modelo. Na demonstração, use atas fictícias (há o link "Usar texto de exemplo").

**Problemas comuns.** Em redes com proxy que inspeciona TLS (comum em escolas e empresas), o terminal do `npm run dev` mostra `SELF_SIGNED_CERT_IN_CHAIN` e a tela mostra "A IA está indisponível". Inicie o servidor com os certificados do sistema: `$env:NODE_USE_SYSTEM_CA = '1'; npm run dev` (PowerShell) ou `NODE_USE_SYSTEM_CA=1 npm run dev`. Não desligue a verificação TLS. Os testes da validação da resposta, sem rede, rodam com `npm run test:ai`.

**Revisar conformidade com IA.** Na etapa **Versão final** (versão mais recente com status "enviada", logo abaixo dos botões de aprovar) e na etapa **Termo de Autorização** (depois de liberado), o botão **Revisar conformidade com IA** abre a área "Texto do documento". Cole o texto extraído do PDF (ou use **Usar texto de exemplo**, que traz de propósito uma correção não tratada e uma seção faltando) e clique em **Revisar**. A chamada é `POST /api/compliance-review` (`server/compliance-review.ts`, `api/compliance-review.ts` e o mesmo plugin do Vite), com a mesma chave, o mesmo modelo, o limite de 15.000 caracteres e o timeout de 25 s. Entrada: `{ kind: 'versao-final' | 'termo', text, context }`; saída validada: `{ items: [{ id, rule, source, status, evidence, suggestion? }], summary, confidence }`, com `status` em Ok, Atenção, Falha ou Não verificável.

- Versão final: cada correção pedida pela banca, a estrutura acadêmica usual (ABNT NBR 14724, a conferir com o regulamento do curso), o título e os autores contra o cadastro. Termo: os campos do Anexo C, a coerência de nota, indicação e título com o cadastro e a regra do Art. 14 (texto integral só com nota ≥ 9 e indicação).
- O nome do arquivo (Portaria CEETEPS-GDS 4069/2024, Art. 6) é conferido no servidor, sem IA, e entra no mesmo resultado.
- A IA avalia só o que está no texto e marca "Não verificável" quando não dá para concluir (assinaturas, por exemplo, podem não aparecer no texto extraído). Ela nunca aprova o documento: o resultado traz o rótulo "Revisão de IA · não substitui o aval do orientador". **Criar tarefas para as falhas** cria tarefas abertas com origem "sugestão de IA", que aguardam revisão.
- O texto colado é enviado à OpenRouter e ao provedor do modelo; na demonstração, use documentos fictícios.

## Roteiro de teste

Cenário: banca "Painel de indicadores para cooperativas locais" (aluno Davi Rocha, orientadora Camila Nunes). Para recomeçar, use **Restaurar cenário inicial** no rodapé do menu. Os PDFs de amostra ficam em `public/amostras/`; `node scripts/gerar-amostras.mjs` os regenera.

**Entrada.** Na tela de login, clique em um nome em **Contas de teste** (Orientador, Convidado, Aluno ou Coordenação) ou em **Abrir os 4 perfis em abas**. Qualquer senha serve. Para trocar de perfil depois, use **Ver como**, no topo. Cada aba guarda o seu perfil, e todas compartilham o mesmo cenário. A página **Como usar** traz o mesmo roteiro, o fluxo entre perfis e um glossário; o tour guiado de cada perfil aparece na primeira visita.

Os passos abaixo são os mesmos da página **Como usar**:

1. **Orientador (Camila Nunes), Agenda e bancas.** Em uma banca agendada (por exemplo, "Acessibilidade em serviços digitais municipais"), clique em **Registrar realização**. O aviso sobre data futura é esperado e o status passa a "Realizada".
2. **Orientador, Pós-banca e documentos.** Selecione a banca do Davi. Observe as quatro etapas e que o Termo de Autorização (TA) está bloqueado.
3. **Aluno (Davi Rocha), Meu trabalho.** Veja o nome de arquivo exigido e envie uma nova versão com o PDF de amostra: o link **Baixar PDF de amostra para testar** ou `public/amostras/dsm_2026_2_davirocha_paineldeindicadoresparacooperativas.pdf`. A checagem mostra PDF, PDF/A, tamanho e nome.
4. **Orientador, Pós-banca e documentos.** Percorra as etapas em ordem:
   1. Ata: clique em **Conferir ata** (ou em **Ler ata com IA** e revise a sugestão), informe a nota (por exemplo, 8,5) e a indicação da banca, e clique em **Registrar conferência**. O status vai de "Realizada" para "Pendente de correção".
   2. Versão final: opcionalmente use **Revisar conformidade com IA** e, em **Aprovar esta versão**, dê o aval à nova versão. O TA é liberado.
   3. TA: preencha acesso, fomento, declaração de correções e assinaturas de autores e orientador. Opcional: **Baixar TA pré-preenchido** gera um rascunho em HTML. Anexe `public/amostras/termo-sem-pdfa.pdf` para ver a validação falhar (sem declaração PDF/A, nome fora do padrão) e depois `public/amostras/dsm_2026_2_davirocha_paineldeindicadoresparacooperativas_TA.pdf` para vê-la passar. Com nota abaixo de 9, o acesso integral fica indisponível.
5. **Coordenação (Eva Ribeiro), Pendências.** Em "Assinar Termos de Autorização", clique em **Confirmar assinatura**. Confira os prazos de correção e da biblioteca.
6. **Orientador, Pós-banca e documentos.** Na etapa Termo de Autorização, clique em **Validar TA e concluir banca** (a banca passa a "Concluída"). Depois, em **Encaminhar pacote à biblioteca**.
7. **Coordenação (Eva Ribeiro), Depósito RIC-CPS.** Abra o pacote (**Registrar no RIC-CPS**), informe um link ou selecione um comprovante e clique em **Registrar submissão**. No protótipo, esta tela representa a biblioteca.

**Conferência final (qualquer perfil), Consulta pública.** Filtre por status **Concluída** e confira a coluna RIC-CPS. Abra também o **Modelo do processo**, que aparece em todos os perfis.

## Organização

`src/domain` guarda tipos e regras; `src/data` traz o cenário fictício; `src/repositories` persiste metadados no navegador; `src/pages` contém jornadas; `src/components` contém elementos compartilhados; `scripts` tem os testes de regra, os testes da IA e o gerador de amostras; `server` guarda a lógica do assistente de ata e `api` a Vercel Function que a expõe. A única integração externa é a IA (OpenRouter).

O plano por incremento, modelo de dados, estados e critérios restantes ficam em [`PLANO.md`](./PLANO.md). Os documentos de pesquisa (`SIG-Banca_pesquisa_e_validacao.md`, `SIG-Banca_proposta.md` e `II_Hackathon_tema.pdf`) ficam com a equipe, fora do repositório.

## Deploy de teste

Preview atual: https://hackathon-fatec-2026-sig-banca-jzynlv2o1.vercel.app. Não contém integração institucional e foi publicado antes das mudanças de aderência à Portaria 4069/2024; republique para testar a versão atual. Para a leitura de ata com IA funcionar no deploy, configure `OPENROUTER_API_KEY` na Vercel (veja "IA (OpenRouter)"). O primeiro deploy do projeto recebeu alias de produção automático da Vercel; a URL acima é o preview separado para teste.
