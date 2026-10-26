# Auditoria de design: o que mudou e por quê

Data: 20/10/2026. Escopo: todas as telas do Integrae (visão geral, agenda, pós-banca, convites, aluno, coordenação, depósito, consulta, modelo do processo), o menu e o seletor de perfil. Guias usados: impeccable 4.7.0 (modo Operate), design-taste-frontend (regras de app screens), frontend-design e design-dna. O DNA completo está em `docs/design-dna.json`, e o sistema para agentes em `DESIGN.md`.

## Direção escolhida: "a pasta de processo"

Cada TCC é um processo da secretaria acadêmica: uma pasta cujos documentos (ata, versão final, Termo de Autorização, depósito) são tomados em ordem e assinados em caneta azul.

A direção saiu do sorteio do impeccable (`concept-seed`, seed:b857d15c193985b9), que atribuiu o 7º item da lista de candidatos ancorados no mundo da Fatec. Ela coincide com a direção 2 da pesquisa ("Campus Neutro": superfícies tonais, barra lateral um tom acima do conteúdo, cor só onde há decisão ou estado). Por isso foi escolhida no lugar de "Registro" (serifa e hairlines, que é o visual editorial genérico de IA) e de "Cidadania Legível" (alto contraste e azul institucional, mais próximo do gov.br, mas sem traço próprio).

A logo oficial chegou no meio do trabalho, e a identidade passou a conversar com ela: a marca é tinta preta quase pura (#111513), geométrica, num arco que ecoa o arco da logo.

| Papel | Antes | Agora | Por quê |
| --- | --- | --- | --- |
| Fundo e menu | Menu azul-marinho escuro sobre fundo creme acinzentado | Mesa #f4f6f5 e menu na cor da capa #e8eeeb | Menu escuro sobre canvas claro é o primeiro sinal de template de dashboard (0 de 17 telas estudadas). A profundidade agora vem do tom. |
| Ação | Vermelho institucional em todo botão, link, data e ícone | Uma cor só, a caneta azul #1f4bb0, e só em ação, foco e seleção | O vermelho estava na cromática inteira e competia com o vermelho de erro. Atas são assinadas em caneta azul. |
| Status | Agendada âmbar, pendente de correção vermelho, dois azuis | Cinco pares fixos (neutro, informação, atenção, sucesso, erro) | Vermelho fica só para erro e atraso; pendência é âmbar. O mesmo status tem a mesma cor em todas as telas. |
| Tipografia | IBM Plex Sans, com h1 fluido | Public Sans (Fontsource), escala fixa: 26, 17, 15, 13, 12 | IBM Plex está na lista de fontes-padrão de IA do impeccable. Public Sans foi feita para interfaces de serviço público, e os algarismos tabulares foram conferidos no navegador. |

## Sinais de "cara de IA" removidos

1. Ícone em quadradinho colorido em cada contagem da visão geral e em cada item de "Para fazer agora". Agora é rótulo e número, e o ícone de linha é cinza, sem caixa.
2. Rótulos em maiúsculas espaçadas ("PRAZO DA VERSÃO CORRIGIDA", "NOME EXIGIDO…", "CONVITE INDIVIDUAL", "DSM · PROTÓTIPO", campos do TA, cabeçalhos de tabela). Agora estão em caixa normal, e o rótulo-sobrancelha passou para baixo do título.
3. Faixa vermelha grossa na borda esquerda do resumo do aluno e sombra inset vermelha no item ativo do menu.
4. Pílulas demais: checagens de arquivo (4 por versão), prazos do pós-banca, convidados da agenda e a etiqueta "simulado" eram pílulas. Viraram texto com marca (✓/✕ ou ponto de status). Pílula ficou só para status.
5. Caixas dentro de caixas: no Modelo do processo, cada item do eixo e do fluxo de dados era uma caixa com borda dentro de outra. Viraram lista numerada e colunas de texto num poço.
6. Discos numerados coloridos (etapas do cadastro, eixo documental, trilha), selo "v2" com borda, quadradinho roxo de "sugestão de IA" (violeta é sinal clássico) e data em caixa vermelha na agenda.
7. Desfoque (backdrop-filter) na barra superior, animação de entrada em todo título e sombra em hover de controle.
8. Bug que dava cara de template: o botão de menu e o X apareciam no desktop, porque `.icon-button` vinha depois da regra que os escondia.

## Hierarquia, contraste e estados

- **Contraste:** todo texto passa de 4,5:1. O texto discreto (`--quiet`) foi de #75818a (4,0:1) para #5f6b65 (5,6:1 no branco, 4,7:1 na capa). A borda de campo tem 3,3:1.
- **Hierarquia:** o h1 é um substantivo a 26px fixo; uma única ação primária azul por tela; as contagens usam algarismos tabulares a 30px.
- **Estados:** hover por tom, foco com anel azul de 2px em tudo (inclusive nas linhas clicáveis), selecionado em azul suave. O desabilitado é cinza legível, sem opacidade de 55%. O vazio é caixa tracejada dentro da folha, com frase de ação. A etapa bloqueada é tracejada com cadeado. O aviso flutuante é o único elemento com sombra.
- **Assinatura:** as etapas do pós-banca são abas de pasta unidas à folha aberta. Abaixo de 760px viram grade 2×2.
- **Texto mais curto:** títulos e descrições da Coordenação e do Depósito no RIC-CPS foram encurtados para a demo de cinco minutos.

## Verificação

`npm run build` e `npm run test:rules` (10/10) passam. O fluxo ponta a ponta termina com todos os passos ✔, sem erros no console, e com 0px de estouro em 390px. O detector do impeccable não encontrou nada nas fontes nem na página publicada. A revisão final foi feita em linha, porque não há subagente do impeccable aqui; o veredito foi `fix` com dois itens: a quebra do horário na agenda, já corrigida, e o login, que pertence a outro agente.

## Pendências fora do meu escopo

- **Tela de login** (`LoginPage.css`): tem o rótulo "CONTAS DE TESTE" em maiúsculas espaçadas, avatares tingidos de azul (azul só para ação) e sombra na folha.
- **IBM Plex:** `src/main.tsx` ainda importa a IBM Plex, que não é mais usada. Remover a linha poupa cerca de 160 KB de fontes no build.
