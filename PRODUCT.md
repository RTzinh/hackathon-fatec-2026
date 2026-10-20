# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React, TypeScript, Vite; stack specified by the user.

## Users

- Orientadores cadastram bancas, acompanham convites, conferem documentos e aprovam uma versão final específica.
- Docentes convidados respondem individualmente a convites.
- Alunos acompanham a banca, tarefas de correção e envio de versões finais.
- Comunidade acadêmica consulta metadados públicos; coordenação acompanha pendências e depósito.

## Product Purpose

Integrae centraliza o ciclo de uma banca de TCC, do agendamento ao aval do orientador e ao registro manual do depósito institucional. É a proposta da equipe para o desafio SIG-Banca. Sucesso na demonstração significa conseguir percorrer as quatro jornadas conectadas e entender a próxima ação e as pendências.

## Positioning

Um fluxo compartilhado mantém agenda, convites, documentos, correções, aprovações por versão e depósito no mesmo histórico.

## Operating Context

- Demonstração do II Hackathon AMS Fatec Bauru/IBM, em 20/10/2026.
- O prazo demonstrativo para a versão corrigida é a data da defesa mais 15 dias corridos, conforme pedido do usuário.
- A pesquisa local descreve encaminhamento manual ao RIC-CPS; o protótipo registra o depósito, sem afirmar integração.
- O convite por e-mail será demonstrativo, com caixa de saída e link individual por token.
- Dados exibidos serão fictícios e identificados como demonstração.

## Capabilities and Constraints

- Persistir dados demonstrativos entre recargas e permitir restaurar o cenário inicial.
- Manter estados da banca, do convite e dos documentos separados.
- Vincular aval do orientador a uma versão específica.
- Exibir pendências e atraso sem bloqueio automático.
- Permitir selecionar arquivos e persistir seus metadados; os bytes dos arquivos não persistem após recarga.
- Consulta pública omite documentos internos, e-mails e tokens.
- Regras de composição obrigatória da banca, atraso, assinatura, conclusão e publicação não foram confirmadas; não inventar.
- Disponibilidades, token, e-mail, uploads, revisão documental e registro do depósito são simulações locais, sem serviços externos.
- Sugestões de correção por IA são dados de demonstração sujeitos à revisão do orientador.

## Evidence on Hand

- `C:\Users\RT\Downloads\II_Hackathon_tema.pdf`: tema oficial e requisitos do evento.
- `C:\Users\RT\Downloads\SIG-Banca_pesquisa_e_validacao.md`: pesquisa e validação local; registra limites de fontes e questões ainda abertas.
- `C:\Users\RT\Downloads\SIG-Banca_proposta.md`: proposta de fluxo, explicitamente distinta de regra institucional.
- Não há API do RIC-CPS, serviço de e-mail, armazenamento de arquivos ou identidade visual oficial confirmados para esta demonstração.

## Product Principles

- Tornar visível a próxima ação e o motivo de cada pendência.
- Separar andamento acadêmico, resposta a convite, estado documental e depósito.
- Mostrar a origem demonstrativa de dados e regras.
- Registrar decisões por versão e preservar histórico.
- Manter consulta pública sem dados internos.

## Accessibility & Inclusion

- Interface em português, navegável por teclado, com contraste legível e adaptação a computador e celular.
