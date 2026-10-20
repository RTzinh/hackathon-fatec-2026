# Integrae

MVP navegável do Integrae, proposta para o desafio SIG-Banca no II Hackathon AMS Fatec Bauru/IBM. Dados e pessoas são fictícios. Protótipo demonstra o ciclo de uma banca; não substitui sistema institucional.

Roteiro escrito do pitch e guia de demonstração: [PITCH.md](./PITCH.md).

## Rodar local

Requisitos: Node.js 24+ e npm.

```powershell
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite. O cenário persiste no `localStorage`; use **Restaurar cenário inicial** para voltar aos exemplos.

```powershell
npm run build
npm run test:rules
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
| Registro da submissão no RIC-CPS por link ou comprovante | Fila da biblioteca |
| Filtros combinados: curso, aluno, orientador, avaliador, semestre, ano e status; coluna RIC-CPS | Consulta de bancas |
| Diagrama de estados, eixo documental, fluxo de dados e regras do CPS | Modelo do processo |
| Sugestões de correção que aguardam revisão humana | Pós-banca e documentos |

## Dados e integrações simuladas

- Perfis: orientador, docente convidado, aluno, coordenação, bibliotecário (Renata Prado) e visitante público. O seletor identifica o perfil de demonstração.
- A agenda, tarefas, convites, documentos, versões, histórico e depósitos compartilham estado no navegador (`localStorage`, chave `sig-banca-demo-v2`; dados de versões anteriores não são lidos).
- Convites não são enviados por e-mail. A caixa de saída mostra conteúdo e links demonstrativos.
- Upload seleciona o arquivo no navegador e persiste apenas nome, tipo, tamanho, data e o resultado da inspeção. Os bytes não são enviados nem sobrevivem à recarga.
- O seletor de arquivos lê os bytes localmente para detectar o cabeçalho `%PDF` e a declaração `pdfaid:part` nos metadados XMP. É uma heurística e não substitui um validador como o veraPDF.
- A validação do TA (PDF, declaração PDF/A, tamanho até 1 GB, nome no padrão, campos e assinaturas) é determinística e bloqueia "Validar TA e concluir banca". Na tela do aluno, a checagem do nome e do formato é só um aviso e não bloqueia o envio.
- As assinaturas de autores e orientador são marcadas pelo orientador; a do coordenador é confirmada no perfil Coordenação. Nenhuma assinatura é verificada.
- O prazo da biblioteca usa fim de semestre de calendário demonstrativo (30/06 e 15/12); a unidade define o calendário real.
- "Concluída" significa aval da versão + TA validado. É decisão de projeto, a confirmar com a coordenação (ver "Perguntas abertas" em `PLANO.md`).
- Sugestões de IA são exemplos fixos. Nenhum modelo externo é chamado.
- RIC-CPS, assinatura, validação de autenticidade e publicação institucional não têm integração. A submissão no RIC-CPS é um registro manual do bibliotecário, e o envio à biblioteca é um registro, sem e-mail.
- Atraso é aviso informativo. Não existe bloqueio automático.
- Prazo de correção: data da defesa + 15 dias corridos, definido pelo briefing do hackathon.
- A consulta pública mostra dados acadêmicos e avaliadores que aceitaram convite; esconde arquivos, e-mails e tokens.

## Roteiro de teste

Cenário: banca "Painel de indicadores para cooperativas locais" (aluno Davi Rocha, orientadora Camila Nunes). Troque de perfil no seletor "Perfil de demonstração". Para recomeçar, use **Restaurar cenário inicial** no rodapé. Os PDFs de amostra ficam em `public/amostras/`; `node scripts/gerar-amostras.mjs` os regenera.

1. **Orientador (Camila Nunes), Agenda e bancas.** Em uma banca agendada (por exemplo, "Acessibilidade em serviços digitais municipais"), clique em **Registrar realização** e confirme. O aviso sobre data futura é esperado. O status passa a "Realizada".
2. **Orientador, Pós-banca e documentos.** Selecione a banca do Davi. Observe as quatro etapas e que o TA está bloqueado.
3. **Aluno (Davi Rocha), Meu trabalho.** Veja o nome de arquivo exigido e envie uma nova versão com `public/amostras/dsm_2026_2_davirocha_paineldeindicadoresparacooperativas.pdf`. A checagem mostra PDF, PDF/A, tamanho e nome.
4. **Orientador, Pós-banca e documentos.**
   1. Etapa 1: clique em **Conferir ata**, informe a nota (por exemplo, 8,5) e a indicação da banca. O status vai de "Realizada" para "Pendente de correção".
   2. Etapa 2: em **Aprovar esta versão**, dê o aval à nova versão. O TA é liberado.
   3. Etapa 3: preencha o TA (acesso, fomento, declaração de correções, assinaturas de autores e orientador). Opcional: **Baixar TA pré-preenchido** gera um rascunho em HTML.
   4. Anexe `public/amostras/termo-sem-pdfa.pdf` para ver a validação falhar (sem declaração PDF/A, nome fora do padrão), depois substitua por `public/amostras/dsm_2026_2_davirocha_paineldeindicadoresparacooperativas_TA.pdf`. Com nota abaixo de 9, o nível integral fica indisponível.
5. **Coordenação (Eva Ribeiro), Pendências.** Em "Assinar Termos de Autorização", clique em **Confirmar assinatura**. Confira os prazos de correção e da biblioteca.
6. **Orientador, Pós-banca e documentos.** Etapa 3: **Validar TA e concluir banca** (a banca passa a "Concluída"). Etapa 4: **Encaminhar pacote à biblioteca**.
7. **Bibliotecário (Renata Prado), Fila da biblioteca.** Selecione o pacote, informe um link ou selecione um comprovante e clique em **Registrar submissão**.
8. **Consulta pública.** Filtre por status **Concluída** e confira a coluna RIC-CPS.

Também vale abrir **Modelo do processo** (perfis Orientador, Coordenação e Consulta pública).

## Organização

`src/domain` guarda tipos e regras; `src/data` traz o cenário fictício; `src/repositories` persiste metadados no navegador; `src/pages` contém jornadas; `src/components` contém elementos compartilhados; `scripts` tem os testes de regra e o gerador de amostras. Integrações externas não foram configuradas.

O plano por incremento, modelo de dados, estados e critérios restantes ficam em [`PLANO.md`](./PLANO.md). Os documentos de pesquisa (`SIG-Banca_pesquisa_e_validacao.md`, `SIG-Banca_proposta.md` e `II_Hackathon_tema.pdf`) ficam com a equipe, fora do repositório.

## Deploy de teste

Preview atual: https://hackathon-fatec-2026-sig-banca-jzynlv2o1.vercel.app. Não contém integração institucional e foi publicado antes das mudanças de aderência à Portaria 4069/2024; republique para testar a versão atual. O primeiro deploy do projeto recebeu alias de produção automático da Vercel; a URL acima é o preview separado para teste.
