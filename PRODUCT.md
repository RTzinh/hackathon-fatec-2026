# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React, TypeScript, Vite; stack specified by the user.

## Users

- Orientadores cadastram bancas, acompanham convites, registram a realização, conferem a ata, aprovam uma versão final específica, completam o Termo de Autorização e encaminham o pacote à biblioteca.
- Docentes convidados respondem individualmente a convites.
- Alunos acompanham a banca, tarefas de correção e envio de versões finais.
- Coordenação acompanha prazos e pendências e confirma a assinatura do coordenador no Termo de Autorização.
- Bibliotecários recebem os pacotes encaminhados e registram a submissão no RIC-CPS.
- Comunidade acadêmica consulta metadados públicos.

## Product Purpose

SIG-Banca centraliza o ciclo de uma banca de TCC, do agendamento ao aval do orientador, ao Termo de Autorização e ao registro manual da submissão no RIC-CPS pelo bibliotecário, na ordem da Portaria CEETEPS-GDS nº 4069/2024. Sucesso na demonstração significa conseguir percorrer as jornadas conectadas (orientador, aluno, coordenação, bibliotecário e consulta pública) e entender a próxima ação e as pendências.

## Positioning

Um fluxo compartilhado mantém agenda, convites, documentos, correções, aprovações por versão e depósito no mesmo histórico.

## Operating Context

- Demonstração do II Hackathon AMS Fatec Bauru/IBM, em 20/10/2026.
- O prazo demonstrativo para a versão corrigida é a data da defesa mais 15 dias corridos, conforme pedido do usuário.
- A pesquisa local descreve encaminhamento manual ao RIC-CPS: o orientador envia o pacote à biblioteca e o bibliotecário submete. O protótipo registra essas etapas, sem afirmar integração.
- O convite por e-mail será demonstrativo, com caixa de saída e link individual por token.
- Dados exibidos serão fictícios e identificados como demonstração.

## Capabilities and Constraints

- Persistir dados demonstrativos entre recargas e permitir restaurar o cenário inicial.
- Manter estados da banca, do convite, dos documentos e do depósito separados.
- Vincular aval do orientador a uma versão específica.
- Ordenar o pós-banca como a Portaria: ata conferida (nota e indicação da banca), aval de uma versão, Termo de Autorização (Anexo C) e pacote à biblioteca com cópia do TA à Diretoria de Serviços Acadêmicos.
- Validar o TA de forma determinística e bloqueante: PDF, declaração PDF/A nos metadados, tamanho até 1 GB, nome no padrão, nível de acesso (integral só com nota >= 9 e indicação, Art. 14), declaração de correções e assinaturas de autores, orientador e coordenador.
- Exibir ao aluno o nome de arquivo exigido e a checagem, sem bloquear o envio.
- Coordenação confirma a assinatura do coordenador no TA e acompanha os prazos de correção (15 dias) e da biblioteca (fim do semestre + 90 dias, Art. 10 §2º, com fim de semestre de calendário demonstrativo: 30/06 e 15/12).
- Bibliotecário registra a submissão no RIC-CPS por link ou comprovante; a coordenação não registra depósito.
- Explicar o processo na página "Modelo do processo": estados, eixo documental, fluxo de dados e regras do CPS.
- Exibir pendências e atraso sem bloqueio automático.
- Permitir selecionar arquivos, ler seus bytes localmente para detectar PDF e PDF/A (heurística; não substitui o veraPDF) e persistir só metadados e o resultado da inspeção; os bytes não persistem após recarga.
- Consulta pública omite documentos internos, e-mails e tokens.
- "Concluída" = aval da versão + TA validado é decisão de projeto, a confirmar com a coordenação.
- Composição mínima da banca, modelo oficial de ata, fonte normativa do prazo de 15 dias, metadados públicos e registro do encaminhamento à biblioteca não foram confirmados (ver "Perguntas abertas" em PLANO.md); não inventar.
- Disponibilidades, token, e-mail, uploads, revisão documental e registro do depósito são simulações locais, sem serviços externos.
- Sugestões de correção por IA são dados de demonstração sujeitos à revisão do orientador.

## Evidence on Hand

- `II_Hackathon_tema.pdf`: tema oficial e requisitos do evento.
- `SIG-Banca_pesquisa_e_validacao.md`: pesquisa e validação local, incluindo as regras da Portaria CEETEPS-GDS nº 4069/2024; registra limites de fontes e questões ainda abertas.
- `SIG-Banca_proposta.md`: proposta de fluxo, explicitamente distinta de regra institucional.
- Esses documentos ficam com a equipe, fora do repositório.
- Não há API do RIC-CPS, serviço de e-mail, armazenamento de arquivos ou identidade visual oficial confirmados para esta demonstração.

## Product Principles

- Tornar visível a próxima ação e o motivo de cada pendência.
- Separar andamento acadêmico, resposta a convite, estado documental e depósito.
- Mostrar a origem demonstrativa de dados e regras.
- Registrar decisões por versão e preservar histórico.
- Manter consulta pública sem dados internos.

## Accessibility & Inclusion

- Interface em português, navegável por teclado, com contraste legível e adaptação a computador e celular.
