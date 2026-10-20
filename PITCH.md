# Pitch do Integrae: 5 minutos, demonstração ao vivo

Roteiro para o II Hackathon AMS Fatec Bauru/IBM, desafio SIG-Banca. **Não há slides.** A peça central é o próprio sistema, aberto no navegador. Cada bloco diz o que mostrar na tela e o que falar. O tempo total é de 4 min 50 s, o que deixa 10 s de folga dentro do limite de 5 minutos.

A comparação com os concorrentes, com fontes, está em [`docs/CONCORRENTES.md`](./docs/CONCORRENTES.md). O passo a passo completo do sistema está no `README.md` e no `GUIA-DE-USO.md`.

## Quadro de tempo

| Tempo | Bloco | Duração | Tela |
|---|---|---|---|
| 0:00 a 0:30 | 1. Abertura e problema | 30 s | Tela de login (Contas de teste), depois aba do Orientador |
| 0:30 a 3:00 | 2. Demonstração guiada (banca do Davi) | 2 min 30 s | Abas Orientador, Convidado, Aluno e Coordenação |
| 3:00 a 3:45 | 3. Regras do CPS e IA | 45 s | Pós-banca, etapa 3, e Revisar conformidade com IA |
| 3:45 a 4:15 | 4. Diferencial frente aos concorrentes | 30 s | Consulta pública |
| 4:15 a 4:35 | 5. Arquitetura e estados | 20 s | Modelo do processo |
| 4:35 a 4:50 | 6. Fechamento | 15 s | Visão geral do orientador |

Se a apresentação for em dupla, uma pessoa narra e a outra opera as abas; o roteiro funciona igual.

## Antes de subir (5 minutos de preparo)

1. Servidor rodando com a chave da IA (`OPENROUTER_API_KEY` em `.env.local`). Em rede com proxy que inspeciona TLS, iniciar com `NODE_USE_SYSTEM_CA=1` (veja o README, "Problemas comuns"). Testar uma leitura de ata antes de começar.
2. Abrir `http://localhost:4173/` e clicar em **Abrir os 4 perfis em abas**. Saem quatro abas (também acessíveis por `?perfil=orientador|convidado|aluno|coordenacao`): **Orientador (Camila Nunes)**, **Convidado (Marcos Reis)**, **Aluno (Davi Rocha)** e **Coordenação (Eva Ribeiro)**. Cada aba guarda o seu perfil e compartilha o mesmo cenário; uma ação feita numa aba aparece nas outras com o aviso "Atualizado por outra aba". Mantenha a aba original, com a tela de login e o painel **Contas de teste**, para a abertura. A demo começa na aba do Orientador.
3. Usar **Restaurar cenário inicial** logo antes de começar, e só depois abrir as abas.
4. Se o app abrir um tutorial guiado na primeira visita, feche-o antes de subir.
5. Arquivos de amostra à mão, em `public/amostras/`: `termo-sem-pdfa.pdf` (inválido) e `dsm_2026_2_davirocha_paineldeindicadoresparacooperativas_TA.pdf` (válido).
6. Tirar capturas do resultado da IA (para o plano B) e deixá-las abertas fora da janela de apresentação.
7. Ensaiar com cronômetro pelo menos duas vezes. Medir quanto a IA demora de verdade; este roteiro não assume um tempo.
8. Testar a **Revisão de conformidade com IA** uma vez no Termo antes de subir (leva cerca de 8 s; na versão final, cerca de 12 s). Os nomes dos botões deste roteiro foram conferidos em 20/10/2026; revalide se a interface mudar.

## Bloco 1. Abertura e problema (0:00 a 0:30)

**Na tela.** Aba com a tela de login: mostre por alguns segundos o painel **Contas de teste** (quatro perfis, cada um com nome, papel e e-mail) e a nota "Demonstração: não há autenticação real". Passe para a aba do **Orientador**, na **Visão geral**. Não faça login ao vivo: as abas já estão abertas.

**Fala.**

> Uma banca de TCC dura uma hora. O processo dura semanas: agenda, convite aos avaliadores, ata, correções, versão final, termo de autorização e depósito no RIC-CPS. Em muitos lugares isso corre por e-mail, PDF e planilha, e ninguém enxerga o que falta. O Integrae põe o ciclo inteiro num lugar só. Vou mostrar com uma banca do cenário: o painel de indicadores para cooperativas locais, do aluno Davi.

Pontos que sustentam a fala: nas pesquisas, o SIGAA cobre banca e ata nas federais e o RIC-CPS cobre a consulta, mas o ciclo fica espalhado (`docs/CONCORRENTES.md`, seção 4, linha 2). A hipótese de que a Fatec use e-mail e planilha é nossa, não confirmada.

## Bloco 2. Demonstração guiada (0:30 a 3:00)

Cenário: banca "Painel de indicadores para cooperativas locais", aluno Davi Rocha, orientadora Camila Nunes. Defesa em 07/10; o prazo de correção vai a 22/10. A versão 1 teve ajustes pedidos e a versão 2 foi enviada hoje.

### 2.1 Convite com token (0:30 a 0:50, 20 s)

1. Aba **Orientador** > **Caixa de saída**. Aponte o convite pendente de Marcos Reis.
2. Aba **Convidado** > **Meus convites**. Aceite o convite.

> Cada avaliador recebe um link com token próprio. Responde uma vez, e o estado aparece para o orientador: pendente, aceito, recusado ou expirado. O e-mail é simulado nesta versão.

### 2.2 O aluno vê o que falta (0:50 a 1:10, 20 s)

3. Aba **Aluno** > **Meu trabalho**. Mostre o prazo, as tarefas de correção, o nome de arquivo exigido e a versão 2 enviada.

> O Davi vê o prazo de 15 dias, as correções e o nome que o arquivo precisa ter pela Portaria 4069. Atraso é aviso, não bloqueio.

### 2.3 Ata lida pela IA, conferida pelo orientador (1:10 a 1:55, 45 s)

4. Aba **Orientador** > **Pós-banca**. Selecione a banca do Davi. Na etapa 1, **Ata de Defesa**, clique em **Ler ata com IA**.
5. Clique em **Usar texto de exemplo** e depois em **Analisar**. Enquanto carrega, comece a falar.
6. Quando o resultado aparecer ("Sugestão de IA · confira antes de aplicar"), aponte nota, indicação, banca, as três correções e a faixa de divergências com o cadastro.
7. Clique em **Usar nota e indicação**, depois em **Adicionar 3 correções como tarefas**. Clique em **Conferir ata**, confira a nota 8,5 e a indicação, e clique em **Registrar conferência**.

> A IA lê o texto da ata e sugere nota, indicação e correções, e diz o que não bate com o cadastro. Ela não registra nada. Eu confiro, aplico, e as tarefas entram marcadas como sugestão de IA, esperando revisão.

### 2.4 Aval por versão e Termo (1:55 a 2:20, 25 s)

8. Etapa 2, **Versão final**: clique em **Aprovar esta versão** na versão 2. Mostre o aviso com **Desfazer**.
9. Etapa 3, **Termo de Autorização**: já liberado e pré-preenchido. Abra "Acesso ao texto integral" e mostre que **integral** está indisponível.

> O aval vale para a versão 2. Se o Davi mandar uma versão 3, ela precisa do seu próprio aval. O Termo só abre depois da ata conferida e de uma versão aprovada. O texto integral está bloqueado: nota 8,5, e a Portaria exige 9 ou mais com indicação.

### 2.5 Revisão de conformidade com IA e coordenação (2:20 a 3:00, 40 s)

10. Ainda no Termo, clique em **Revisar conformidade com IA**. No campo **Texto do documento**, clique em **Usar texto de exemplo** e em **Revisar** (cerca de 8 s; fale enquanto carrega). Aponte o rótulo "Revisão de IA · não substitui o aval do orientador" e os selos Ok, Atenção, Falha ou Não verificável: no exemplo, a agência de fomento ausente e a assinatura do coordenador. Cada selo traz evidência, sugestão e fonte. Se sobrar tempo, clique em **Criar tarefas para as falhas**.
11. Aba **Coordenação** > **Pendências**. Mostre o Termo aguardando assinatura e os dois prazos. Se o tempo permitir, **Confirmar assinatura**.

> Uma segunda leitura por IA confere o documento contra as normas e diz o que está ok, o que merece atenção e o que falha, com evidência. Ela não aprova nada: o rótulo diz que não substitui o aval do orientador. A coordenação vê o prazo de correção e o da biblioteca e confirma a assinatura do coordenador.

**Se precisar cortar:** reduza a revisão de conformidade a 20 s, mostrando só o resultado no Termo, e faça a coordenação em 10 s. A mesma revisão existe na etapa **Versão final**, para a versão mais recente enviada, abaixo de **Aprovar esta versão** (cerca de 12 s); o nome do arquivo ali é checado por regra fixa no servidor, sem IA. Se der tempo, cite que ela apontou uma correção da banca não tratada, palavras-chave ausentes e o nome fora do padrão.

## Bloco 3. Regras do CPS e IA (3:00 a 3:45)

**Na tela.** Volte à aba do orientador, **Pós-banca**, etapa 3. Anexe `termo-sem-pdfa.pdf` em **Selecionar arquivo**: as checagens apontam falta de PDF/A e nome fora do padrão. Substitua por `dsm_2026_2_davirocha_paineldeindicadoresparacooperativas_TA.pdf`: as checagens passam.

**Fala.**

> Estas regras o sistema aplica, não só explica. O nome do arquivo segue a Portaria 4069, com o sufixo _TA no termo. Ele confere PDF, PDF/A, tamanho, nota para texto integral e assinaturas, e a banca só conclui sem pendências. Calcula o prazo de 15 dias da correção e o de 90 dias da biblioteca. A IA lê, sugere e revisa; quem bloqueia são regras fixas, e quem decide é o orientador. A chave da IA fica só no servidor.

Limites a dizer, se perguntarem: o PDF/A é a declaração nos metadados, não um validador completo; as assinaturas são marcadas, não verificadas; os 15 dias vêm do briefing do hackathon.

## Bloco 4. Diferencial frente aos concorrentes (3:45 a 4:15)

**Na tela.** Clique em **Consulta pública**. Filtre por status **Concluída** e aponte a coluna RIC-CPS e os sete filtros.

**Fala.** Use as três frases abaixo (cerca de 60 palavras) e só acrescente a reserva se sobrar tempo. São as mais fortes.

1. **SIGAA.** "O SIGAA cobre banca e ata nas federais. Nas fontes públicas, não achamos convite com token nem aval por versão."
2. **Genéricas.** "Calendly, Forms e DocuSign deixam os dados espalhados e não trazem as regras do CPS."
3. **Turnitin e Gradescope.** "Turnitin e Gradescope usam IA, mas não achamos nenhuma que leia a ata e sugira com revisão do orientador."
4. *(Reserva)* **Prazo.** "O prazo de correção vai de 7 a 45 dias entre instituições. O Integrae calcula e avisa o atraso."

Se perguntarem do RIC-CPS: ele já tem busca por texto e continua sendo o repositório; a consulta do Integrae olha o andamento da banca e mostra se o trabalho já foi registrado lá.

## Bloco 5. Arquitetura e estados (4:15 a 4:35)

**Na tela.** Clique em **Modelo do processo**. Mostre, rolando devagar: a linha de status da banca (agendada, realizada, pendente de correção, concluída), as dimensões em paralelo (convite, documento, versão, depósito) e o fluxo de dados.

**Fala.**

> A banca tem quatro estados, cada um com seu gatilho. Convite, documento, versão e depósito têm estados próprios, para não misturar aprovação com papelada. A interface chama um domínio que guarda as regras. O tracejado, como API, banco e e-mail, é a versão institucional. A única chamada externa é a IA, pelo servidor.

## Bloco 6. Fechamento (4:35 a 4:50)

**Na tela.** Volte à **Visão geral** do orientador, com a trilha de etapas.

**Fala.**

> O Integrae mostra o que aconteceu, o que falta e quem age, da agenda ao depósito, com as regras do CPS dentro do fluxo e uma IA que sugere, mas não decide. Os dados são fictícios; e-mail e RIC-CPS são os próximos passos. Obrigado.

## Se algo falhar: plano B

A IA depende de rede e de um serviço externo. O resto do fluxo não depende.

**A IA não responde, demora ou dá erro** (a tela mostra "A IA está indisponível", "A IA demorou demais" ou "IA indisponível: configure OPENROUTER_API_KEY"):

1. Não repita mais de uma vez. Diga: "A IA é uma sugestão; o processo não depende dela".
2. Clique em **Cancelar** no painel da IA e siga o fluxo manual: **Conferir ata**, nota 8,5, indicação **Sim, a banca indicou**, **Registrar conferência**.
3. As tarefas de correção continuam disponíveis: o cenário já traz tarefas, entre elas sugestões demonstrativas marcadas como IA, para mostrar o selo e a revisão pelo orientador. Diga que são exemplos fixos do cenário.
4. Mostre a captura do resultado da IA, tirada no ensaio, como prova do que a tela faz quando a rede funciona.

**A revisão de conformidade por IA falha:** não repita. Siga com a checagem determinística do nome do arquivo e com o checklist do Termo (PDF, PDF/A, tamanho, nome, nota, assinaturas), que funcionam sem rede e são o que bloqueia a conclusão.

**A rede cai por completo:** o app roda no navegador com `localStorage`, então agenda, convites, aluno, aval por versão, Termo, validações, coordenação, consulta e Modelo do processo funcionam sem rede. Só a IA fica de fora. Se o servidor local cair, reinicie com `npm run dev` ou use o deploy de teste (veja o README).

**O estado ficou bagunçado:** **Restaurar cenário inicial** no rodapé e reabra as abas.

**Aperto de tempo.** Corte nesta ordem: 2.1 (convite), a confirmação de assinatura em 2.5, a explicação da arquitetura (reduza a 10 s). Mantenha sempre a leitura da ata com IA, o aval por versão e o texto integral bloqueado.

## Perguntas prováveis da banca avaliadora

**A IA é de verdade ou é simulada?**
É de verdade. O servidor chama o modelo `anthropic/claude-haiku-5.5` pela OpenRouter, valida a resposta e descarta campos fora do formato. A chave fica só no servidor. Os testes da validação rodam sem rede (`npm run test:ai`).

**A IA decide a nota ou aprova o trabalho?**
Não. Ela lê o que a banca já escreveu na ata. Nada é registrado sem o clique do orientador, e as tarefas criadas por IA aguardam revisão. Os bloqueios (Termo, texto integral, conclusão) são regras fixas, sem IA.

**E se a IA errar?**
O resultado vem rotulado como sugestão, com nível de confiança, e o orientador confere antes de aplicar. A nota e a indicação só vão ao formulário; o registro é um segundo clique.

**E a privacidade? A ata vai para fora?**
O texto colado é enviado à OpenRouter e ao provedor do modelo. Na demonstração usamos ata fictícia. Em uso real, isso exige acordo institucional e uma decisão sobre o que pode sair; não afirmamos que está resolvido.

**Quanto custa a IA?**
Pelo README, o modelo custa US$ 0,10 por milhão de tokens de entrada e US$ 0,50 por milhão de saída (lista pública da OpenRouter em 20/10/2026). A ata aceita até 15 mil caracteres e a resposta é limitada a 800 tokens, então o custo por ata é uma fração de centavo. É estimativa nossa, não medida.

**Por que não usar o SIGAA?**
O SIGAA cobre cadastro de banca e ata nas federais e é forte nisso. Não achamos evidência de que a CPS o use; o sistema do aluno é o SIGA, e não achamos módulo de banca nele. E nas fontes públicas não achamos convite por token, aval por versão nem as regras de depósito do CPS. O Integrae pode ser uma camada, não um substituto (veja `docs/CONCORRENTES.md`).

**Integra com SIGA ou RIC-CPS?**
Não. Não há API do RIC-CPS conhecida. O bibliotecário registra a submissão por link ou comprovante. A integração é um próximo passo que depende da CPS.

**O e-mail sai de verdade?**
Não. A caixa de saída e os links são demonstrativos.

**Os 15 dias são regra oficial?**
É a premissa do briefing do hackathon, contada a partir da defesa. Outras instituições usam de 7 a 45 dias, então o prazo deveria ser configurável por curso; hoje ele é fixo. O prazo da biblioteca (fim do semestre mais 90 dias) vem da Portaria e usa um calendário demonstrativo.

**As regras vêm da Portaria 4069/2024?**
Vêm da pesquisa da equipe sobre a Portaria. O texto não abriu nas buscas de concorrência, então vale validar com a coordenação. As perguntas abertas estão no `PLANO.md`.

**A checagem de PDF/A é confiável?**
Ela detecta a declaração de PDF/A nos metadados. Não substitui um validador como o veraPDF, e dizemos isso no README.

**Como é o login? É seguro?**
É um login de demonstração: a tela lista contas de teste e aceita qualquer valor. A tela diz que não há autenticação real. Cada aba guarda o seu perfil. Os tokens de convite são de demonstração, não credenciais de produção. Autenticação institucional é um próximo passo.

**Os dados são reais? Escala?**
Fictícios, guardados no navegador. Banco, API e armazenamento de arquivos entram na versão institucional.

**Onde estão os critérios de avaliação na demonstração?**

| Critério | Onde aparece |
|---|---|
| Design e UI/UX | Perfis em abas sincronizadas, próxima ação por perfil, avisos com Desfazer, bloqueios explicados na própria tela |
| Adequação ao tema | Convite, aceite, ata, prazo de 15 dias, aval por versão, Termo, biblioteca, consulta com os filtros do tema |
| Estrutura do sistema e IA | Modelo do processo (estados, dados) e a leitura da ata com IA, com revisão humana |
| Apresentação | Demonstração com um caso único, do convite ao Termo |

## Base e limites

- Todo número e regra citados aqui vêm do `README.md`, do `PLANO.md` e do `docs/CONCORRENTES.md`. O que é premissa está marcado como premissa.
- O protótipo usa dados e pessoas fictícios, guarda o cenário no navegador e não envia e-mail, não verifica assinaturas e não se integra ao RIC-CPS.
- Selecionar um arquivo guarda nome, tipo, tamanho, data e o resultado da checagem; o conteúdo não é enviado nem guardado.
- O login de demonstração e a revisão de conformidade por IA estão no roteiro com os nomes reais da interface. A revisão de IA sugere; quem bloqueia a conclusão do Termo continua sendo o checklist fixo.
