---
name: Integrae
description: Gestão de bancas de TCC da Fatec Bauru, desenhada como a pasta de processo da secretaria.
colors:
  ground: "#f4f6f5"
  shell: "#e8eeeb"
  surface: "#ffffff"
  raised: "#f7f9f8"
  hover: "#f1f4f2"
  border: "#dde3e0"
  rule: "#ebefed"
  control: "#85908a"
  ink: "#161c1a"
  muted: "#4a5751"
  quiet: "#5f6b65"
  mark: "#111513"
  action: "#1f4bb0"
  action-hover: "#183c8f"
  action-soft: "#e8eefb"
  status-neutral: "#3b4a5a"
  status-neutral-bg: "#e9edf1"
  status-info: "#0e5a63"
  status-info-bg: "#dff0f0"
  status-warn: "#7a4a06"
  status-warn-bg: "#fbefd6"
  status-ok: "#1d5e3a"
  status-ok-bg: "#dcf1e3"
  status-error: "#9a2a2a"
  status-error-bg: "#fbe5e3"
typography:
  title:
    fontFamily: "Public Sans Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 680
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  section:
    fontFamily: "Public Sans Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  item:
    fontFamily: "Public Sans Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Public Sans Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: "Public Sans Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  meta:
    fontFamily: "Public Sans Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
  figure:
    fontFamily: "Public Sans Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 620
    lineHeight: 1.1
    letterSpacing: "-0.02em"
rounded:
  control: "6px"
  tab: "9px"
  sheet: "10px"
  chip: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  pad: "20px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "38px"
    padding: "0 14px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "38px"
    padding: "0 14px"
  button-small:
    height: "32px"
    padding: "0 11px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "38px"
  nav-item-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "8px"
    height: "40px"
  status-pill:
    backgroundColor: "{colors.status-neutral-bg}"
    textColor: "{colors.status-neutral}"
    rounded: "{rounded.chip}"
    height: "24px"
    padding: "0 10px"
  filter-chip-selected:
    backgroundColor: "{colors.action-soft}"
    textColor: "{colors.action}"
    rounded: "{rounded.chip}"
    height: "34px"
  step-tab-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tab}"
---

# Design System: Integrae

## Overview

**Creative North Star: "A pasta de processo"**

Cada TCC é um processo da secretaria acadêmica: uma pasta cujos documentos (ata, versão final, Termo de Autorização, depósito) são tomados em ordem e assinados em caneta azul. A interface é uma tela de trabalho, não uma vitrine: a mesa é cinza-esverdeada, a capa da pasta (menu lateral) é um tom acima, cada documento é uma folha branca sem sombra. A logo, um corvo preto sobre um "i" e um arco, dá a tinta: preto quase puro, traço geométrico, sem cor.

A cor só aparece com função. A caneta azul marca o que se preenche, assina ou clica. Cinco pares de tinta e tom codificam os status. O resto é tinta e papel.

**Key Characteristics:**
- Fundo tingido e menu na cor da capa; folhas brancas separadas por uma borda de 1px, nunca por sombra.
- Um único azul de ação; nenhum botão, ícone ou número em cor decorativa.
- Status em pílulas claras com tinta escura do mesmo matiz.
- Uma família tipográfica (Public Sans) com algarismos tabulares.
- Etapas do pós-banca como abas de pasta que se unem à folha aberta.

## Colors

### Primary
- **Caneta azul** (action): o botão primário, links, botões de texto, foco, filtro selecionado e o indicador da aba ativa. Sobre branco, 7,8:1. Na versão suave (action-soft) é o fundo de seleção.

### Neutral
- **Mesa** (ground): fundo da página e da barra superior.
- **Capa** (shell): menu lateral, trilho dos seletores segmentados e abas de etapa inativas.
- **Folha** (surface) e **Poço** (raised): painéis e áreas internas (dados pré-preenchidos, nome de arquivo, formulário em linha).
- **Tinta** (ink), **Secundária** (muted, 7,6:1) e **Discreta** (quiet, 5,6:1 no branco e 4,7:1 na capa): os três níveis de texto. Nenhum texto fica abaixo de 4,5:1.
- **Tinta da marca** (mark): só a marca e as barras de andamento da trilha.

### Status
- **Neutro** (agendada, não encaminhado), **Informação** (realizada, enviada, encaminhado), **Atenção** (pendente, pendente de correção, ajustes solicitados, aberta), **Sucesso** (concluída, aceito, aprovado, registrado) e **Erro** (recusado, expirado, atraso). Cada par passa de 6:1.

### Named Rules
**The Caneta Azul Rule.** O azul de ação aparece só onde algo pode ser feito. Se não é clicável, preenchível ou selecionado, não é azul.

**The One Ink Per Status Rule.** Um status tem a mesma cor em todas as telas. Atraso é vermelho; pendência é âmbar; concluído é verde. Vermelho nunca é decoração.

## Typography

**Body Font:** Public Sans Variable (Fontsource), com Segoe UI e system-ui como fallback. Uma família só, desenhada para interfaces de serviço público.

**Character:** neutra, legível e séria, com algarismos tabulares de verdade (medidos: "1111" e "0000" têm a mesma largura com `tabular-nums`).

### Hierarchy
- **Title** (680, 26px, 1,2): o h1 de cada tela, um substantivo ("Suas bancas", "Pós-banca"). No celular, 22px.
- **Section** (650, 17px): título de painel. O título de uma etapa do pós-banca usa 19px.
- **Item** (600, 15px): título de linha, nome do trabalho.
- **Body** (400, 15px, 1,5): texto corrido, até 70ch.
- **Small** (13px) e **Meta** (12px): metadados, prazos e notas. Nada abaixo de 12px.
- **Figure** (620, 30px, tabular): as contagens da faixa de resumo.

### Named Rules
**The Sentence Case Rule.** Nenhum rótulo em maiúsculas espaçadas. Rótulo pequeno fica em caixa normal e cinza legível.

**The Tabular Rule.** Todo número que se compara (datas, contagens, prazos, tamanhos) usa `font-variant-numeric: tabular-nums`.

## Layout

Menu lateral fixo de 248px (224px abaixo de 1200px) sobre a cor da capa; conteúdo com no máximo 1320px e 40px de margem lateral (28px abaixo de 1200px, 16px no celular). Uma medida de espaço entre blocos: 16px. Folhas com 20px de recuo interno.

A visão geral é uma faixa de quatro contagens, duas colunas iguais ("Para fazer agora" e "Próximas bancas") e a trilha de seis etapas. Telas de um objeto só (pós-banca, convite) limitam a coluna a 980px e 720px.

Abaixo de 980px a faixa de contagens vira 2×2 e as colunas empilham. Abaixo de 700px o menu vira gaveta com fundo escurecido e a barra superior mostra o botão de menu. Em 390px não há rolagem horizontal; tabelas rolam dentro da própria folha.

## Elevation & Depth

Plana. A profundidade vem do tom: mesa, capa, folha. Bordas de 1px (border) separam folhas; regras mais claras (rule) separam linhas.

### Shadow Vocabulary
- **Flutuante** (`0 10px 28px rgb(20 33 28 / 14%), 0 2px 6px rgb(20 33 28 / 8%)`): só o aviso com "Desfazer" e a gaveta do menu no celular.

### Named Rules
**The Flat Sheet Rule.** Nada em repouso tem sombra. Se precisa se destacar, muda o tom ou ganha borda, nunca as duas coisas.

## Shapes

Controles com 6px; folhas com 10px; abas de etapa com 9px só nos cantos de cima; pílulas e filtros totalmente arredondados. A marca é um arco: um quadrado preto com o topo em semicírculo, ecoando o arco da logo.

## Components

### Buttons
- **Primário:** caneta azul sólida, texto branco, 38px (32px no pequeno), 6px. Um por tela, na ação principal.
- **Secundário:** folha branca com borda de controle (3,3:1) e tinta; ao passar o mouse, a borda escurece até a tinta.
- **Texto:** azul, sem caixa, sublinhado ao passar o mouse.
- **Perigo:** contorno vermelho, preenchido ao passar o mouse.
- **Desabilitado:** poço cinza, borda clara e texto discreto, legível, sem opacidade.

### Chips
- **Status:** pílula de 24px, tom claro e tinta escura do mesmo matiz, sem ponto.
- **Filtro:** pílula branca com borda; selecionado em caneta azul suave.
- **Checagem de arquivo:** texto com ✓ ou ✕ na cor do resultado, sem fundo.

### Cards / Containers
Folha branca, borda de 1px, 10px, sem sombra. Cabeçalho sem divisória; linhas internas separadas por regra clara. Nunca uma folha dentro de outra folha: dentro de uma folha, use o poço (raised).

### Inputs / Fields
38px, branco, borda de controle, 6px; foco com borda azul e anel azul de 2px. Rótulo acima do campo, 14px/600.

### Navigation
Itens de 40px (44px no celular), ícone de 18px em cinza e rótulo de 15px. O item ativo é a folha branca puxada à frente, com borda de 1px e peso 650. O seletor "Ver como" usa a mesma linguagem: trilho na cor da capa e perfil ativo em branco.

### Abas de etapa (pós-banca)
A assinatura do sistema. As quatro etapas são abas de pasta sobre a folha da etapa aberta. Inativa: tom da capa. Ativa: folha branca, unida à folha de baixo, número em azul. Concluída: marca ✓ e resumo em verde. Bloqueada: contorno tracejado com cadeado. Abaixo de 760px viram uma grade 2×2 de etapas separadas; a ativa ganha uma faixa azul de 3px no topo.

## Do's and Don'ts

### Do:
- **Do** usar a caneta azul só em ação, link, foco e seleção.
- **Do** mostrar a próxima ação em texto direto ("Conferir a ata") com seta azul.
- **Do** imprimir zero como zero e dado ausente como travessão cinza.
- **Do** manter os estados vazios dentro da folha, com borda tracejada e uma frase que diz o que fazer.
- **Do** usar a marca e o preto da logo como a única tinta de identidade.

### Don't:
- **Don't** pôr ícone em quadradinho colorido em contagens, ações ou listas.
- **Don't** usar rótulo em maiúsculas espaçadas acima de títulos.
- **Don't** colocar sombra em folha em repouso, nem usar faixa colorida grossa na borda esquerda.
- **Don't** usar vermelho fora de erro e atraso.
- **Don't** usar degradê, vidro, desfoque ou violeta.
