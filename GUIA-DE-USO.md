# Integrae: guia de uso

Guia para quem vai usar ou avaliar o Integrae, o protótipo de gestão de bancas de TCC da Fatec Bauru feito para o desafio SIG-Banca do II Hackathon AMS Fatec Bauru/IBM. Serve à equipe, à banca avaliadora do hackathon e à coordenação.

Todos os dados e pessoas são fictícios. O protótipo mostra o ciclo de uma banca, da agenda ao depósito, e não substitui um sistema institucional. A seção [O que é simulado](#7-o-que-é-simulado) diz exatamente o que não funciona de verdade.

Marcações `TODO` indicam pontos que a equipe deve conferir antes da apresentação. A lista final está em [Pontos a conferir](#10-pontos-a-conferir).

## Sumário

1. [Como rodar](#1-como-rodar)
2. [Entrada e perfis](#2-entrada-e-perfis)
3. [Tour guiado e página "Como usar"](#3-tour-guiado-e-página-como-usar)
4. [Passo a passo por perfil](#4-passo-a-passo-por-perfil)
5. [Regras aplicadas e suas fontes](#5-regras-aplicadas-e-suas-fontes)
6. [Inteligência artificial](#6-inteligência-artificial)
7. [O que é simulado](#7-o-que-é-simulado)
8. [Roteiro de demonstração](#8-roteiro-de-demonstração)
9. [Perguntas frequentes](#9-perguntas-frequentes)
10. [Pontos a conferir](#10-pontos-a-conferir)

---

## 1. Como rodar

Requisitos: Node.js 24 ou superior e npm.

```powershell
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite (normalmente `http://localhost:5173`). Os dados do cenário ficam no `localStorage` do navegador; nada vai para um servidor, exceto o texto colado nas funções de IA (veja a [seção 6](#6-inteligência-artificial)).

Para a IA funcionar, crie um arquivo `.env.local` na raiz do projeto e reinicie o `npm run dev`:

```
OPENROUTER_API_KEY=cole-sua-chave-aqui
# opcional; o padrão é anthropic/claude-haiku-5.5
OPENROUTER_MODEL=anthropic/claude-haiku-5.5
```

A chave fica só no servidor (nunca use o prefixo `VITE_`). Sem ela, o resto do sistema funciona normalmente e as telas de IA mostram "IA indisponível: configure OPENROUTER_API_KEY no servidor".

Outros comandos:

| Comando | Para que serve |
|---|---|
| `npm run build` | Confere os tipos e gera a versão de produção. |
| `npm run test:rules` | Testa as regras de prazo, conflito, token, nome de arquivo, PDF/A e texto integral. |
| `npm run test:ai` | Testa, sem rede, a leitura e a validação das respostas da IA. |
| `npm run lint` | Verifica o código. |
| `npm run preview` | Serve a versão gerada pelo build. |

`TODO` o teste do tour (`scripts/tutorial.test.mjs`) ainda não tem script no `package.json`. Sugestão: `"test:tutorial": "node --experimental-strip-types --test scripts/tutorial.test.mjs"`.

Se a rede passa por um proxy que inspeciona TLS (comum em escolas e empresas), a IA mostra "A IA está indisponível" e o terminal exibe `SELF_SIGNED_CERT_IN_CHAIN`. Inicie com os certificados do sistema: `$env:NODE_USE_SYSTEM_CA = '1'; npm run dev` no PowerShell, ou `NODE_USE_SYSTEM_CA=1 npm run dev`. Não desligue a verificação TLS.

Para recomeçar a demonstração a qualquer momento, use **Restaurar cenário inicial** no rodapé do menu lateral.

---

## 2. Entrada e perfis

### Tela de entrada

Ao abrir uma aba nova, o Integrae mostra uma tela de **Entrar** de demonstração. Não há autenticação real:

- **E-mail** e **Senha**: qualquer senha serve. Se o e-mail for o de uma conta de teste, a aba entra naquele perfil; qualquer outro e-mail entra como Orientador.
- **Contas de teste**: lista com um botão por perfil, que entra direto.
- **Abrir os 4 perfis em abas**: abre uma aba para cada perfil. Se o navegador bloquear, a tela avisa; permita pop-ups para o endereço e tente de novo.
- **Criar conta**: pede nome, e-mail institucional e papel (Orientador, Convidado, Aluno ou Coordenação), cria a conta e entra com ela. Ela aparece como um quinto botão no seletor "Ver como". Um e-mail já cadastrado é recusado.
- **Sair**, no rodapé do menu lateral, volta à tela de entrada.

### Os quatro perfis de teste

| Perfil | Conta de teste | E-mail | Telas no menu |
|---|---|---|---|
| Orientador | Camila Nunes | camila.nunes@exemplo.edu.br | Visão geral, Agenda e bancas, Pós-banca, Caixa de saída |
| Convidado (docente convidado) | Marcos Reis | marcos.reis@exemplo.edu.br | Meus convites |
| Aluno | Davi Rocha | davi.rocha@exemplo.edu.br | Meu trabalho |
| Coordenação | Eva Ribeiro | eva.ribeiro@exemplo.edu.br | Pendências, Depósito RIC-CPS |

**Consulta pública** e **Modelo do processo** aparecem no menu de todos os perfis.

### Trocar de perfil e usar várias abas

- No topo da tela, o seletor **Ver como** troca o perfil da aba atual com um clique (em telas estreitas vira uma lista).
- Cada aba guarda o seu próprio perfil. Os dados, porém, são compartilhados entre abas do mesmo navegador: o que o Orientador faz numa aba aparece nas demais, com o aviso "Atualizado por outra aba".
- Para abrir um perfil direto, use o parâmetro `?perfil=` na URL: `?perfil=orientador`, `?perfil=convidado`, `?perfil=aluno` ou `?perfil=coordenacao`. Recarregar a aba mantém o perfil.
- Uma boa preparação para a apresentação: **Abrir os 4 perfis em abas** e alternar entre elas.

---

## 3. Tour guiado e página "Como usar"

`TODO` esta seção descreve os componentes entregues (`Tour`, `HelpPage`). Confirme que o item **Como usar** apareceu no menu depois da integração no `App.tsx`.

**Tour guiado.** Na primeira vez que alguém entra num perfil, aparece um cartão discreto no canto da tela com os botões **Ver tour de N passos** e **Agora não**. Ele não bloqueia nada. O tour tem de 3 a 4 passos curtos por perfil, destaca um elemento da tela e leva ao próximo passo com **Próximo** (e **Anterior**, **Concluir**). **Pular tour** fecha em qualquer ponto. Os passos cobrem a próxima ação do perfil e explicam o botão **Desfazer** dos avisos. O navegador lembra quais perfis já viram o tour.

**Como usar.** Página com o fluxo completo entre os perfis, a demonstração em 7 passos, um glossário (TA, RIC-CPS, PDF/A, aval por versão) e o botão **Rever o tour deste perfil**.

**Desfazer.** Depois de quase toda ação aparece um aviso no canto da tela. Quando ele traz **Desfazer**, você tem cerca de 7 segundos para restaurar o estado anterior à última ação. A resposta a um convite é a exceção: é formal e não tem Desfazer.

---

## 4. Passo a passo por perfil

Cenário inicial: o trabalho "Painel de indicadores para cooperativas locais" (aluno Davi Rocha, orientadora Camila Nunes) já passou pela defesa e espera correções. Há ainda uma banca agendada ("Acessibilidade em serviços digitais municipais"), uma realizada, outra em correção e duas concluídas.

### 4.1 Orientador (Camila Nunes)

**Visão geral** ("Suas bancas")

- A faixa de resumo mostra Agendadas, Convites sem resposta, Em correção e Documentos em aberto. Cada item leva à tela correspondente.
- **Para fazer agora** lista a próxima ação de cada banca: conferir a ata, avaliar uma versão, completar o Termo de Autorização ou encaminhar à biblioteca. Clicar abre a banca certa no Pós-banca.
- **Próximas bancas** mostra as bancas em andamento por data.
- **Trilha do trabalho** acompanha seis etapas: Agendadas, Convite aceito, Ata conferida, Versão com aval, TA validado e No RIC-CPS.
- **Nova banca** leva à Agenda e bancas.

**Agenda e bancas**

1. Clique em **Cadastrar banca**. O formulário "Nova banca de TCC" tem três partes: *Trabalho e autoria* (título, curso, orientador, tipo do trabalho, "Possui produto complementar" e aluno(s)), *Data e local* (data, início, término, modalidade e sala ou link) e *Avaliadores convidados* (cada docente mostra a disponibilidade na data escolhida).
2. Se houver problema, aparece **Conflito de agenda encontrado**, com os motivos: sala ocupada, docente convidado para outra banca no mesmo horário ou docente sem disponibilidade cadastrada para todo o intervalo. Quando existem alternativas, o sistema oferece até três botões em **Horários livres para todos**.
3. Salve com **Salvar e preparar convites**. Com conflito, o botão vira **Salvar mesmo com conflito**, para decisão humana. Os convites vão para a Caixa de saída e o aviso traz **Desfazer**.
4. Na lista **Bancas cadastradas**, filtre por Todas, Agendadas, Realizadas, Em correção ou Concluídas.
5. Depois da defesa, em uma banca agendada, clique em **Registrar realização**. O status passa a Realizada. O aviso pode lembrar que a data ainda não chegou ou que nenhum convidado aceitou; isso é só informativo.
6. Se um convidado recusou, use **Substituir convidado que recusou**, escolha o docente e clique em **Criar convite**. O convite recusado continua no histórico.
7. Em bancas já realizadas, **Abrir pós-banca** leva à etapa seguinte.

**Caixa de saída**

Lista os convites preparados, com a situação de cada um (Pendente, Aceito, Recusado ou Expirado). **Abrir convite** abre o link individual para você responder como o convidado. O envio de e-mail é simulado.

**Pós-banca** (as quatro etapas)

Escolha a banca no seletor **Banca**. O quadro **Etapas do pós-banca** mostra, em ordem, Ata de Defesa, Versão final, Termo de Autorização e Biblioteca. O topo traz os dois prazos do trabalho: "Correção até" (defesa + 15 dias) e "Biblioteca até" (fim do semestre + 90 dias). Cada etapa libera a seguinte.

1. **Ata de Defesa.** Anexe a ata (**Selecionar arquivo**, ou **Substituir arquivo**). Se o arquivo não servir, **Solicitar ajuste** e **Registrar solicitação**. Com a ata anexada, clique em **Conferir ata**, informe **Nota na ata** (0 a 10) e **Indicação para texto integral** ("Sim, a banca indicou" ou "Não indicou") e clique em **Registrar conferência**. A banca passa a Pendente de correção. Opcional: **Ler ata com IA** preenche esses campos a partir do texto da ata (veja a [seção 6](#6-inteligência-artificial)).
2. **Versão final.** Cada versão enviada pelo aluno aparece com as checagens de PDF, PDF/A, tamanho e nome. Clique em **Aprovar esta versão** para dar o aval, ou em **Solicitar ajustes** e **Registrar ajustes**. O aval vale só para a versão escolhida. As tarefas de correção aparecem aqui: **Concluir** nas da banca e **Marcar revisada** nas sugeridas por IA. Opcional: **Revisar conformidade com IA**.
3. **Termo de Autorização (TA).** Só abre depois da ata conferida e do aval de uma versão. Vem pré-preenchido com curso, tipo, orientador, data da defesa, nota e indicação. Preencha *Acesso ao texto integral*, *Embargo até* (se for o caso), *Agência de fomento*, a declaração "Autores declaram que as correções da banca foram realizadas" e as assinaturas de **Autores** e **Orientador**. A assinatura do Coordenador é confirmada pela Coordenação. **Baixar TA pré-preenchido** gera um rascunho em HTML. Anexe o PDF assinado com **Selecionar arquivo**; os links **Amostra válida** e **Amostra inválida** baixam PDFs de teste. A **Validação automática** lista o que falta. Opcional: **Revisar conformidade com IA**. Quando tudo estiver certo, clique em **Validar TA e concluir banca**; a banca passa a Concluída.
4. **Biblioteca.** Clique em **Encaminhar pacote à biblioteca**. O pacote (versão final e TA) entra na fila de Depósito RIC-CPS, com cópia do TA à Diretoria de Serviços Acadêmicos (registro demonstrativo).

### 4.2 Convidado (Marcos Reis)

**Meus convites**

1. Em **Convites disponíveis**, clique em **Abrir convite** no convite pendente. Outra forma: em **Acessar por token**, cole o token no campo **Token do convite** e clique em **Acessar**. O token de Marcos é `demo-marcos-033`.
2. Confira trabalho, data, horário, local, orientador e discentes.
3. Escolha **Aceitar participação** ou **Recusar convite** e confirme em **Confirmar** (ou desista em **Voltar**).
4. A resposta é única. O convite passa a mostrar "Resposta já registrada" e o aviso não oferece Desfazer.

Para testar os outros estados, digite estes tokens em **Acessar por token**:

| Token | Resultado |
|---|---|
| `demo-expirado-031` | Convite expirado: "Este convite expirou." |
| `demo-ana-033` | Já aceito: não pode ser respondido de novo. |
| `demo-diego-027` | Já recusado: não pode ser respondido de novo. |
| qualquer outro valor | "Este token não existe." |

**Voltar aos convites** retorna à lista.

### 4.3 Aluno (Davi Rocha)

**Meu trabalho**

1. O quadro de **Prazo da versão corrigida** mostra a data (defesa + 15 dias corridos) e quantos dias restam. Atraso gera aviso e não bloqueia o envio.
2. Em **Enviar versão corrigida**, veja o **Nome exigido pela Portaria 4069/2024** e use **Copiar nome**. O link **Baixar PDF de amostra para testar** baixa um PDF válido.
3. Clique em **Selecionar arquivo**. As checagens mostram PDF, PDF/A, tamanho e nome. Elas são um aviso e não impedem o envio.
4. Clique em **Registrar versão definitiva**. A versão entra na lista **Versões definitivas** e o aviso traz **Desfazer**. O orientador então avalia a versão no Pós-banca.
5. **Tarefas de correção** lista o que a banca pediu. As marcadas "Sugestão de IA · aguarda revisão do orientador" vieram do assistente de IA e ainda precisam de revisão.

### 4.4 Coordenação (Eva Ribeiro)

**Pendências**

1. Os quatro indicadores filtram o **Acompanhamento** quando clicados: **TA aguardando assinatura**, **Correção em atraso** (15 dias sem versão aprovada), **Na biblioteca** e **Depositados**. **Limpar filtro** volta à lista completa.
2. Quando o orientador anexa o TA, ele aparece em **Assinar Termos de Autorização**. Confira se a assinatura do coordenador do curso consta no arquivo e clique em **Confirmar assinatura**. A conferência é manual; nenhuma assinatura é verificada. O aviso traz **Desfazer**.
3. A tabela **Acompanhamento** mostra, por trabalho, orientador, status, prazo de correção, situação do TA e do depósito (com o prazo da biblioteca). Atraso é só aviso.

**Depósito RIC-CPS**

1. Em **Aguardando submissão** ficam os pacotes encaminhados pelos orientadores, com os arquivos, o tipo de acesso escolhido no TA e o prazo.
2. Clique em **Registrar no RIC-CPS** no pacote, informe o **Link do registro no RIC-CPS** ou use **Selecionar comprovante**, acrescente uma observação se quiser e clique em **Registrar submissão**. O trabalho passa a Registrado e aparece em **Registrados**, com o link em **Abrir registro**.

`TODO` conferir: na Portaria 4069/2024 quem submete no RIC-CPS é o bibliotecário. Neste protótipo de quatro perfis, o registro fica na tela Depósito RIC-CPS da Coordenação. Confirme o texto que a equipe quer usar na apresentação.

### 4.5 Consulta pública e Modelo do processo (todos os perfis)

**Consulta de bancas.** Pesquise por texto e escolha onde buscar em **Buscar em** (Todos, Aluno, Orientador ou Avaliador). Combine com os chips de status (Agendada, Realizada, Pendente de correção, Concluída), com **Curso**, **Semestre** e **Ano**. **Limpar filtros** zera tudo. A coluna **RIC-CPS** mostra "Na biblioteca", "Registrado" ou "Ver registro". A tela mostra só dados acadêmicos e os avaliadores que aceitaram o convite; não mostra arquivos, e-mails nem tokens.

**Modelo do processo.** Diagrama de estados da banca, dimensões acompanhadas em paralelo (convite, documento, versão e depósito), eixo documental, fluxo de dados e a tabela de regras do CPS automatizadas.

---

## 5. Regras aplicadas e suas fontes

| Regra | Como o Integrae aplica | Fonte |
|---|---|---|
| Prazo de correção de 15 dias | Data da defesa + 15 dias corridos. Aparece para o aluno, no Pós-banca e na Coordenação. Atraso é aviso, sem bloqueio. | Tema do hackathon (briefing). Não consta na Portaria; a regra local completa precisa de confirmação. |
| Prazo da biblioteca de 90 dias | Fim do semestre + 90 dias. Usa um calendário demonstrativo: fim do 1º semestre em 30/06 e do 2º em 15/12. Para 2026/2 o prazo é 15/03/2027. | Portaria CEETEPS-GDS 4069/2024, Art. 10, §2º. A unidade define o calendário real. |
| Nome do arquivo | `curso_ano_semestre_primeiroautor_titulo.pdf`, sem espaços, acentos, caracteres especiais ou maiúsculas, com até as 5 primeiras palavras do título. O TA recebe o sufixo `_TA`. Exemplo: `dsm_2026_2_davirocha_paineldeindicadoresparacooperativas.pdf`. | Portaria 4069/2024, Art. 6 |
| PDF/A e tamanho | O arquivo deve ser PDF e declarar PDF/A nos metadados. Trabalho até 10 GB; TA até 1 GB. A checagem lê o cabeçalho `%PDF` e a marca `pdfaid:part` no navegador. É uma heurística e não substitui um validador como o veraPDF. | Portaria 4069/2024, Art. 6 |
| Texto integral | O acesso integral só fica disponível com nota igual ou superior a 9 **e** indicação da banca. Caso contrário restam "embargo até uma data" e "não autoriza texto integral (resumo e registro públicos)". | Portaria 4069/2024, Art. 14 e Anexo C |
| Termo de Autorização | Só libera depois da ata conferida e do aval de uma versão, porque traz nota, indicação e a declaração de correções. A validação bloqueia **Validar TA e concluir banca** até que PDF, PDF/A, tamanho, nome `_TA`, campos e as três assinaturas estejam ok. | Portaria 4069/2024, Anexo C |
| Responsáveis | O orientador reúne e encaminha o pacote à biblioteca, com cópia do TA à Diretoria de Serviços Acadêmicos; a submissão no RIC-CPS é um registro à parte. | Portaria 4069/2024, Arts. 10 e 11 |
| Consulta pública | Livre, sem cadastro, sem documentos, e-mails ou tokens. | Portaria 4069/2024, Art. 15 |
| Aval por versão | O aval vale para uma versão específica e não se estende às enviadas depois. | Decisão de projeto |
| "Concluída" | Banca concluída = aval de uma versão + TA validado. | Decisão de projeto, a confirmar com a coordenação |
| Convite | Token individual, resposta única; estados Pendente, Aceito, Recusado e Expirado. | Decisão de projeto |

O que a Portaria e a pesquisa não definem (composição mínima da banca, modelo oficial de ata, fonte normativa dos 15 dias) não é afirmado pelo protótipo. As perguntas abertas estão em `PLANO.md`.

---

## 6. Inteligência artificial

As duas funções de IA seguem o mesmo princípio: **a IA sugere, o orientador decide**. Nada é registrado, aprovado ou assinado automaticamente, e cada sugestão pede revisão humana.

### 6.1 Assistente da ata

Onde: Pós-banca, etapa **Ata de Defesa**, depois de anexar a ata e antes de conferi-la.

1. Clique em **Ler ata com IA**. Abre a área **Texto da ata**.
2. Cole o texto da ata (até 15.000 caracteres; o contador mostra o uso). Para testar sem uma ata real, use o link **Usar texto de exemplo**, que insere uma ata fictícia com nota 8,5, indicação da banca e três pedidos de correção.
3. Clique em **Analisar**. O botão mostra "Analisando…" enquanto a IA responde.
4. O resultado aparece marcado como "Sugestão de IA · confira antes de aplicar", com a **Confiança** (alta, média ou baixa), e mostra:
   - **Nota**, **Indicação da banca**, **Data da defesa** e **Banca** (membros citados), ou "Não identificada" quando o texto não traz o dado;
   - **Divergências com o cadastro** (por exemplo, a data da ata diferente da data cadastrada) ou a mensagem "Nenhuma divergência com o cadastro encontrada";
   - **Correções pedidas pela banca**, cada uma com título curto e detalhe.
5. **Usar nota e indicação** apenas preenche o formulário de conferência. Você ainda precisa clicar em **Registrar conferência**.
6. **Adicionar N correções como tarefas** cria tarefas abertas com origem "sugestão de IA". Elas aparecem na etapa **Versão final** (**Marcar revisada**) e para o aluno em **Tarefas de correção**.

### 6.2 Revisão de conformidade dos documentos

Onde: Pós-banca, no botão **Revisar conformidade com IA**, em duas etapas: **Versão final** (na versão enviada que aguarda avaliação) e **Termo de Autorização**.

1. Clique em **Revisar conformidade com IA** e cole o texto do documento na área **Texto do documento** (até 15.000 caracteres). **Usar texto de exemplo** insere um texto fictício.
2. Clique em **Revisar**.
3. O resultado, marcado como "Revisão de IA · não substitui o aval do orientador", traz um resumo, a confiança e uma lista de itens. Cada item tem uma situação (**Ok**, **Atenção**, **Falha** ou **Não verificável**), a evidência encontrada, uma sugestão e a fonte da regra.
4. **Criar tarefas para as falhas** transforma os itens com falha em tarefas de correção com origem "sugestão de IA".

O que é conferido:

- **Versão final**: se cada correção pedida pela banca aparece tratada no texto; estrutura do trabalho (título, autores, resumo, palavras-chave, introdução, metodologia, conclusão e referências, conforme a estrutura usual da ABNT NBR 14724, a conferir com o regulamento do curso); título e autores conferem com o cadastro; nome do arquivo.
- **Termo de Autorização**: presença dos campos do Anexo C (identificação, defesa, nota e indicação, acesso, fomento, declaração de correções e assinaturas), coerência da nota e da indicação com o cadastro, regra do texto integral (Art. 14) e nome do arquivo.
- O **nome do arquivo** é comparado de forma exata no servidor, **sem IA**.

`TODO` conferir: os nomes dos botões e das seções da revisão de conformidade foram lidos de `src/components/ComplianceReview.tsx`. Essa função foi integrada por outro agente em 20/10/2026; confira se os rótulos continuam iguais e onde ela aparece na tela.

### 6.3 Como funciona por dentro

- A chamada passa por um servidor: `POST /api/ata-assistant` e `POST /api/compliance-review`. Em desenvolvimento, um middleware do Vite as atende; em produção, funções da Vercel. A lógica está em `server/`.
- O modelo padrão é `anthropic/claude-haiku-5.5`, acessado pela OpenRouter. Dá para trocar com `OPENROUTER_MODEL`.
- A chave `OPENROUTER_API_KEY` fica só no servidor. Nunca chega ao navegador, a mensagens de erro ou ao código versionado.
- O servidor valida a resposta do modelo e descarta ou ajusta campos fora do formato. A temperatura é baixa (0,1) e o tempo limite é de 25 segundos.
- A IA lê apenas o **texto colado**. Ela não abre o PDF anexado.

### 6.4 Privacidade e limites

- O texto colado é enviado à OpenRouter e ao provedor do modelo. Na demonstração, use atas e documentos fictícios.
- A IA pode errar. Por isso os resultados mostram confiança, citam evidências e nunca aprovam nada.
- A IA não valida assinaturas, não substitui um validador de PDF/A e não decide a nota.
- Se a IA falhar (chave ausente, limite de uso, tempo esgotado), a tela mostra a mensagem de erro e o fluxo manual continua disponível.

---

## 7. O que é simulado

- **Dados e pessoas**: fictícios. O cenário vive no `localStorage` do navegador (chave `sig-banca-demo-v2`) e é compartilhado entre as abas.
- **Login**: não existe autenticação. Qualquer senha entra; "Criar conta" só acrescenta um usuário local.
- **E-mail**: os convites não são enviados. A Caixa de saída mostra o conteúdo e o link demonstrativo.
- **Arquivos**: o navegador lê o PDF localmente para checar cabeçalho e PDF/A. Só nome, tipo, tamanho, data e o resultado da checagem são guardados; os bytes não são enviados nem sobrevivem à recarga.
- **PDF/A**: heurística pela marca nos metadados. Não substitui o veraPDF.
- **Assinaturas**: as de autores e orientador são marcadas pelo orientador; a do coordenador é confirmada pela Coordenação. Nenhuma assinatura é verificada.
- **RIC-CPS**: não há integração nem API conhecida. A submissão e o encaminhamento à biblioteca são registros manuais e locais, sem e-mail.
- **Calendário do semestre**: demonstrativo (30/06 e 15/12). A unidade define o real.
- **Prazos**: atraso é aviso informativo, sem bloqueio automático.
- **Tarefas de IA do cenário inicial**: são exemplos fixos. Já a leitura da ata e a revisão de conformidade chamam um modelo de verdade, desde que `OPENROUTER_API_KEY` esteja configurada.
- **Consulta pública**: mostra dados acadêmicos fictícios; os metadados públicos reais dependem da coordenação.

---

## 8. Roteiro de demonstração

Antes de começar, use **Restaurar cenário inicial**. Os PDFs de amostra estão em `public/amostras/` e têm links dentro do sistema.

1. **Orientador, Agenda e bancas.** Em uma banca agendada, clique em **Registrar realização**. O status passa a Realizada.
2. **Orientador, Pós-banca.** Selecione a banca do Davi. Veja as quatro etapas e o TA bloqueado.
3. **Aluno, Meu trabalho.** Veja o nome de arquivo exigido e envie uma versão com o PDF de amostra.
4. **Orientador, Pós-banca.** Etapa Ata: **Conferir ata** (ou **Ler ata com IA**), nota e indicação, **Registrar conferência**. Etapa Versão final: **Aprovar esta versão**. Etapa Termo de Autorização: preencha os campos, anexe a amostra inválida para ver a validação falhar e depois a válida. Com nota abaixo de 9, o acesso integral fica indisponível; com nota 9 ou mais e indicação, ele libera.
5. **Coordenação, Pendências.** **Confirmar assinatura**.
6. **Orientador, Pós-banca.** **Validar TA e concluir banca** e depois **Encaminhar pacote à biblioteca**.
7. **Coordenação, Depósito RIC-CPS.** **Registrar no RIC-CPS** e **Registrar submissão**.
8. **Qualquer perfil, Consulta pública.** Filtre por Concluída e confira a coluna RIC-CPS. Abra também o **Modelo do processo**.

Dica para o tempo curto: mantenha uma aba por perfil (**Abrir os 4 perfis em abas**) e alterne entre elas. As mudanças aparecem em todas.

`TODO` o `README.md` ainda lista seis perfis e um passo do Bibliotecário no roteiro. Alinhe o README a este roteiro de quatro perfis.

---

## 9. Perguntas frequentes

**O convite envia e-mail de verdade?**
Não. A Caixa de saída mostra o conteúdo e o link. O link serve para responder como o convidado.

**O sistema deposita o TCC no RIC-CPS?**
Não. O orientador encaminha o pacote e a Coordenação registra o link ou o comprovante da submissão. Não existe integração.

**Quem faz a submissão no RIC-CPS?**
Pela Portaria 4069/2024, o bibliotecário. No protótipo de quatro perfis, essa etapa está na tela Depósito RIC-CPS do perfil Coordenação. Veja o `TODO` da seção 4.4.

**Os 15 dias são uma regra institucional?**
Não confirmada. É o prazo definido pelo briefing do hackathon, contado a partir da data da defesa. A pesquisa também aponta o prazo de até 90 dias após o fim do semestre para a biblioteca; são prazos de etapas diferentes.

**A IA aprova o trabalho ou a ata?**
Nunca. Ela sugere nota, indicação, correções e pontos de conformidade, sempre marcados como sugestão. A conferência, o aval e a validação continuam sendo ações do orientador.

**A IA lê o meu PDF?**
Não. Ela lê somente o texto que você cola na área de texto.

**Para onde vai o texto que eu colo na IA?**
Para a OpenRouter e o provedor do modelo, através do servidor do projeto. Use textos fictícios na demonstração.

**A tela diz "IA indisponível". O que fazer?**
Confira se `OPENROUTER_API_KEY` está no `.env.local` (ou na Vercel) e reinicie o servidor. Em rede com proxy, veja a dica de `NODE_USE_SYSTEM_CA` na seção 1. O fluxo manual continua funcionando.

**O arquivo que eu seleciono fica guardado?**
Não. O navegador lê o conteúdo para a checagem e guarda apenas nome, tipo, tamanho, data e o resultado.

**Qual senha eu uso no login?**
Qualquer uma. Digite o e-mail de uma conta de teste (por exemplo, `davi.rocha@exemplo.edu.br`) para entrar nela, ou clique no nome da conta.

**Troquei de perfil e a banca não mudou. É defeito?**
Não. Os perfis compartilham o mesmo cenário. Cada perfil só enxerga as telas e as ações do seu papel.

**Um botão de ação está bloqueado. Por quê?**
O fluxo tem dependências. O TA só abre depois da ata conferida e do aval de uma versão, e **Validar TA e concluir banca** só habilita quando a validação automática não tem pendências. Os itens que faltam aparecem na tela.

**Errei uma ação. Como volto?**
Clique em **Desfazer** no aviso, em até cerca de 7 segundos. Ele restaura o estado anterior à última ação. Para recomeçar tudo, use **Restaurar cenário inicial**.

**Perdi os dados ou o navegador avisa que o armazenamento foi bloqueado.**
O cenário depende do `localStorage`. Em janela anônima ou com dados de site bloqueados, as alterações podem não sobreviver a uma recarga. Use uma janela normal.

**Dá para usar dois perfis ao mesmo tempo?**
Sim. Abra uma aba por perfil (**Abrir os 4 perfis em abas** ou `?perfil=aluno`, por exemplo). Os dados são compartilhados e atualizam entre as abas.

**Posso ver o tour de novo?**
Sim. Em **Como usar**, clique em **Rever o tour deste perfil**.

**A consulta pública mostra documentos ou e-mails?**
Não. Mostra apenas dados acadêmicos e os avaliadores que aceitaram o convite.

---

## 10. Pontos a conferir

- [ ] Item **Como usar** no menu e o `<Tour>` montado no `App.tsx` (veja o trecho de integração entregue junto com os componentes).
- [ ] Script `test:tutorial` no `package.json`.
- [ ] Rótulos e posição da **revisão de conformidade com IA** (seção 6.2), integrada por outro agente.
- [ ] Texto sobre quem registra a submissão no RIC-CPS (seções 4.4 e 9).
- [ ] `README.md` e `PITCH.md` ainda citam seis perfis e o Bibliotecário.
- [ ] Textos do tour que citam botões (Registrar submissão, Confirmar assinatura, Registrar versão definitiva, Depósito RIC-CPS) se os rótulos mudarem.
