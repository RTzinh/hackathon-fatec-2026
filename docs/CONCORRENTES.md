# Integrae frente aos concorrentes e alternativas

Síntese de duas pesquisas feitas em 20/10/2026: sistemas brasileiros (SIGAA, SIGA, RIC-CPS, Cobalto, TOTVS e outros) e ferramentas internacionais ou genéricas (Vireo, ProQuest, Calendly, Forms, DocuSign, Turnitin e outras). Serve de base para o `PITCH.md`. Os IDs entre colchetes ([S7], [I-3]...) apontam para a seção "Fontes" no fim.

## Como ler

- **Fato** tem fonte. **Parcial** é o recurso encontrado só em parte. **Sem evidência pública** quer dizer que as buscas não acharam o recurso; não prova que ele não existe.
- **[I]** é inferência nossa, não afirmação da fonte.
- Vários detalhes vêm de trechos de resultado de busca, e não de manuais abertos por inteiro. Isso está dito onde importa.
- **Limites da pesquisa.** A Portaria CEETEPS-GDS 4069/2024 e a política do RIC-CPS não abriram (HTTP 404) [S2, S3]. As regras da Portaria que o Integrae aplica vêm da pesquisa própria da equipe (`SIG-Banca_pesquisa_e_validacao.md`), não destas buscas. O Lyceum (HTTP 402) e o boletim TOTVS (HTTP 403) também não abriram. Nenhum fornecedor brasileiro de SaaS para gestão de TCC apareceu em cerca de oito buscas. Não sabemos como a Fatec Bauru faz hoje; a hipótese (formulário, e-mail e planilha) precisa ser confirmada com uma coordenação.
- **Preços.** Só entram valores com página oficial ou com fonte citada. Onde não há, está escrito "sem preço público". O Integrae é um protótipo e não tem preço.

## 1. Resumo honesto

1. Quem já resolve parte do problema existe e é forte. O **SIGAA** cadastra banca, valida pela coordenação e gera ou registra ata e resultado nas federais [S7–S10]. O **RIC-CPS** (DSpace) já tem consulta pública com cerca de 45 mil arquivos e é onde o depósito acontece, regido pela Portaria 4069/2024 [S1, S2].
2. O que **não encontramos** em nenhum deles: convite com token de uso único, aval do orientador por versão, regras do depósito checadas antes de o aluno chegar à biblioteca, e IA lendo a ata com revisão humana.
3. O diferencial do Integrae não é fazer melhor do que o SIGAA o que o SIGAA faz. É juntar, num só lugar e com as regras do CPS embutidas, o que hoje fica em sistemas e papéis separados, do convite ao registro do depósito.
4. O Integrae é um protótipo com dados fictícios. Não integra com SIGA, SIGAA nem RIC-CPS, e o e-mail é simulado. A única integração real é a IA.

## 2. Tabela comparativa

Colunas: SIGAA (e outros sistemas acadêmicos); RIC-CPS/DSpace; Vireo e ProQuest; ferramentas genéricas (Calendly, Microsoft Bookings, Google Forms ou Microsoft Forms com Drive ou Power Automate, DocuSign); Turnitin e Gradescope; Integrae.

| Recurso | SIGAA | RIC-CPS / DSpace | Vireo / ProQuest | Genéricas | Turnitin / Gradescope | Integrae |
|---|---|---|---|---|---|---|
| Cadastro de banca e agenda | **Parcial, forte:** data, hora, local e membros; coordenação valida [S7, S8] | Fora do escopo | Sem evidência (Vireo: nenhuma menção a defesa) [I-1] | Agendam reuniões. Calendly: sem evidência de cruzar a agenda de vários avaliadores [I-2]. Doodle é enquete [I-3] | Fora do escopo | Sim: cadastro, tipo de trabalho, produto complementar |
| Conflito de agenda e sugestão de horário | Sem evidência de verificação de conflito [S7] | Fora do escopo | Sem evidência | Bookings: sem evidência de sugestão para várias pessoas [I-4]. OpenEduCat diz ter scheduler, só em página de fornecedor [I-5] | Fora do escopo | Sim: sala, horário e disponibilidade cadastrada |
| Convite individual com token e resposta única | Sem evidência | Fora do escopo | Sem evidência | Não verificado em Calendly, Doodle e Bookings | Fora do escopo | Sim: pendente, aceito, recusado, expirado; e-mail simulado |
| Ata e nota | **Parcial, forte:** "Gerar Ata" e "Inserir resultado de banca" [S9, S10] | Não | Sem evidência | Forms recebe o arquivo; DocuSign assina; nenhum confere conteúdo | Fora do escopo | Sim: ata, nota e indicação da banca |
| Prazo de correção | Sem evidência | Não | Sem evidência | Nenhuma trata prazo de correção [I-6] | Fora do escopo | Sim: 15 dias corridos (premissa do briefing) e aviso de atraso |
| Aval do orientador por versão | Sem evidência | Não | Sem evidência (Vireo: revisão da graduate office) | Sem evidência; Forms não tem aprovação nativa [I-7] | Fora do escopo | Sim: o aval pertence a uma versão |
| Termo de Autorização e regras do depósito (nome, PDF/A, nota 9) | Sem evidência | **Forte:** o depósito é regido pela Portaria 4069/2024; detalhes não verificados por nós [S1, S2] | Vireo: regras de arquivo por instituição, PDF/A sem evidência. ProQuest: revisão pelo administrador da escola [I-1, I-8] | DocuSign assina; nenhuma fonte cita PDF/A, nome padronizado ou nota [I-9]. veraPDF valida PDF/A, mas não nome nem nota [I-10] | Fora do escopo | Sim: TA pré-preenchido; checa nome, PDF/A declarado, tamanho, nota e assinaturas marcadas |
| Encaminhamento à biblioteca e registro do bibliotecário | Sem evidência | O depósito acontece aqui; o registro de andamento antes dele, sem evidência | Vireo: revisão antes do depósito [I-1] | Sem evidência de registro único (e-mail, planilha) [I-11] | Fora do escopo | Sim: pacote, fila da biblioteca, link ou comprovante (registro local) |
| Consulta pública | Sem evidência | **Forte:** busca por texto; navegação por data, autor, título, assunto e patrocinador [S1] | Via repositório | Não | Não | Sim: sete filtros sobre o andamento (curso, aluno, orientador, avaliador, semestre, ano, status). Só dados fictícios |
| IA sobre a ata, com revisão humana | Sem evidência | Sem evidência | Sem evidência | Textract e Azure extraem campos, sem regra de banca nem tela de revisão [I-12] | Turnitin: similaridade e detecção de IA, e o índice "não deve ser prova única" [I-13]. Gradescope agrupa respostas de provas e o instrutor confere [I-14] | Sim: lê a ata, sugere nota, indicação e correções, aponta divergências; o orientador confere |
| Preço ou licença | Sem preço público; adoção por cooperação entre instituições [S13] | DSpace é código aberto (BSD) [S48]; custo interno da CPS | Vireo: código aberto, licença em conflito (GPL-2.0 no GitHub, New BSD em 2010) [I-1]. ProQuest: sem taxa básica desde 2010; taxas por escola entre US$ 30 e US$ 100 em 2026 [I-8] | Calendly Standard US$ 10 e Teams US$ 16 por assento, período de cobrança não indicado [I-2]. DocuSign R$ 45, R$ 105 e R$ 170 por mês (Personal, Standard, Business Pro) [I-15]. Power Automate Premium US$ 15 por usuário por mês [I-16] | Sem preço público; cotação avulsa de US$ 3,50 por aluno em carta de vendas [I-13] | Protótipo, sem preço. A IA custa por chamada (valores no README) |

O que a tabela diz sobre o Integrae vale para o protótipo. O que ele **não** faz está na seção 6.

## 3. Onde o incumbente é forte

Não vale apresentar o Integrae como substituto de tudo.

- **SIGAA.** Nas federais já cobre cadastro de banca, validação pela coordenação e ata [S7–S10]. Se uma instituição já usa SIGAA, o Integrae deve ser camada ou complemento, não concorrente [I]. Não há evidência de que a CPS use SIGAA: o sistema do aluno é o SIGA, e não achamos fonte pública de módulo de banca nele [S6].
- **RIC-CPS.** Já oferece consulta pública a cerca de 45 mil arquivos e é o destino final do depósito [S1]. O Integrae não substitui o repositório: ele prepara o pacote e registra que o bibliotecário submeteu. Não há API conhecida do RIC-CPS.
- **Vireo e ETDs americanos.** Têm workflow de submissão configurável e revisão administrativa maduros [I-1].
- **Ferramentas genéricas.** Calendly, DocuSign e o par Forms com Power Automate são produtos consolidados, com preço público e suporte. O ganho do Integrae nesse grupo é juntar os passos, não superar cada um.
- **Turnitin e CopySpider.** Resolvem similaridade e plágio, que o Integrae não trata. O CopySpider é exigido antes da defesa em algumas instituições [S33].
- **Protótipos acadêmicos parecidos.** TCC Mentor (CPS Praia Grande, 2025), sistema de bancas da UTFPR Pato Branco (2013) e a proposta da UFC Russas (2026) mostram que o problema é conhecido [S5, S27, S28]. Nenhum, nas fontes, faz o ciclo completo com ata, aval por versão e Termo.

## 4. Fraqueza observada → como o Integrae resolve

Cada linha traz a evidência da fraqueza e o lugar do sistema onde a solução aparece. "Onde" usa os nomes das telas e dos botões do app em 20/10/2026.

| # | Fraqueza observada | Evidência | Como o Integrae resolve | Onde no sistema | Ressalva |
|---|---|---|---|---|---|
| 1 | SIGAA: sem convite com token nem resposta única. Convites e agendamento são por e-mail a um responsável | Sem evidência no SIGAA [S7–S10]; e-mail a responsável designado na UFJF e no IFSC [S46, S47] | Cada convidado recebe um token individual. O link responde uma vez; estados pendente, aceito, recusado e expirado; recusado pode ser substituído | Orientador: Agenda e bancas, Caixa de saída. Convidado: Meus convites | O e-mail é simulado; os links são de demonstração |
| 2 | O ciclo fica espalhado em sistemas e papéis separados | SIGAA cobre banca e ata [S7–S10]; Cobalto cobre sessão e nota [S16, S17]; o depósito está no RIC-CPS [S1]; em vários casos o agendamento é por e-mail [S46, S47]; em Vanderbilt o resultado da defesa fica no Kuali e a tese em outra aplicação [I-17] | Um cenário compartilhado do convite ao depósito, com os mesmos dados nas telas de orientador, convidado, aluno, coordenação e bibliotecário | Visão geral (trilha de etapas), Pós-banca (4 etapas), Pendências, Fila da biblioteca | Hoje os dados ficam no navegador. Versão institucional exigiria banco e API |
| 3 | Ferramentas genéricas espalham os dados e não trazem as regras do CPS | Nas fontes de Calendly, Forms, Bookings, DocuSign, Vireo e ProQuest não achamos nome de arquivo padronizado, validação de PDF/A, regra de nota nem prazo de correção [I-6, I-9]. Forms não tem aprovação nativa de arquivo [I-7]; Bookings exige Exchange Online, Teams e licenças [I-4] | As regras da Portaria 4069/2024 ficam dentro do fluxo: nome do arquivo gerado, PDF/A, tamanho, texto integral só com nota ≥ 9 e indicação, prazo da biblioteca | Meu trabalho (nome exigido); Pós-banca etapas 2 e 3 (checagens); Modelo do processo (tabela "Regras do CPS automatizadas") | Regras vêm da pesquisa da equipe; a Portaria não abriu nesta pesquisa. PDF/A é só a declaração nos metadados |
| 4 | Aval do orientador não é por versão | Hoje é atestado assinado, em papel ou PDF [S39]. O único sistema com versionamento achado (UFPE, candidato) não tem aval por versão [S30] | O orientador avalia uma versão específica. Aprovar a v2 não aprova uma v3 enviada depois. O Termo só libera com ata conferida e uma versão aprovada | Pós-banca, etapa 2 ("Aprovar esta versão") | "Concluída" = aval da versão + TA validado é decisão de projeto, a confirmar com a coordenação |
| 5 | O prazo de correção varia entre instituições e nenhum sistema achado o calcula e alerta | 7 dias [S39–S41], 20 ou 45 dias [S42], 30 dias [S44], data fixa [S43]. O padrão de 15 dias não apareceu como comum | O sistema calcula o prazo (defesa + 15 dias corridos; biblioteca = fim do semestre + 90 dias), mostra ao aluno e à coordenação e avisa o atraso sem bloquear | Meu trabalho; Pendências | 15 dias é premissa do briefing, fixa no protótipo. Prazo configurável por curso é o próximo passo, não existe hoje |
| 6 | Turnitin e Gradescope usam IA, mas não leem ata nem sugerem com revisão humana sobre a banca | Turnitin: similaridade e detecção de IA, com a ressalva de que o índice não é prova única [I-13]. Gradescope: agrupa respostas de provas e o instrutor confere [I-14]. Nenhuma fonte achada lê ata e sugere nota [I-12, S32]. Caso TJ-PR rejeitou a nota dada por IA [S51] | A IA lê o texto da ata e sugere nota, indicação, data, banca, correções e divergências com o cadastro. Aparece como "Sugestão de IA · confira antes de aplicar". Nada é registrado sem o clique do orientador; as tarefas criadas levam a origem "sugestão de IA" e aguardam revisão | Pós-banca, etapa 1 ("Ler ata com IA") | O texto colado vai à OpenRouter e ao provedor do modelo; usar ata fictícia. Confiança alta, média ou baixa é estimada pelo modelo |
| 7 | Extração genérica de documentos não aplica regra nem tem tela de revisão | Textract e Azure extraem campos de formulário [I-12]. A regra de banca, a rubrica e a tela de revisão seriam trabalho sob medida [I] | A leitura da ata já cruza o resultado com o cadastro (data, autores) e com a regra do texto integral (nota ≥ 9) | Pós-banca etapas 1 e 3 | Inferência nossa sobre o que falta nessas ferramentas |
| 8 | Validação de PDF/A, nome e nota ficam em ferramentas distintas, ou ninguém as junta | veraPDF valida PDF/A e aceita checagens extras, mas não checa nome nem nota [I-10]. Vireo: PDF/A e nome sem evidência [I-1]. UFJF exige PDF/A [S35] | O mesmo arquivo recebe as checagens de PDF, PDF/A, tamanho e nome padronizado, ao lado da nota e da indicação, antes de chegar à biblioteca | Meu trabalho (aviso, não bloqueia); Pós-banca etapa 3 (bloqueia a conclusão) | Heurística; não substitui o veraPDF |
| 9 | Termo de Autorização é preenchido e assinado à mão; assinatura eletrônica não confere o conteúdo | Termo assinado por aluno e orientador na UFPB [S37]; assinatura gov.br aceita na UFRGS [S38]. DocuSign assina, sem evidência de validar PDF/A, nome ou aprovação por versão [I-15] | O TA vem pré-preenchido com ata e cadastro. "Validar TA e concluir banca" fica bloqueado enquanto houver item pendente | Pós-banca, etapa 3 | A autenticidade das assinaturas não é verificada; só são marcadas |
| 10 | O registro do bibliotecário não aparece ligado ao fluxo acadêmico | A coordenação ou secretaria entrega à biblioteca (UFRGS) [S38]; a biblioteca confirma por e-mail (IFES; trecho de busca, sem URL na pesquisa) | O orientador encaminha o pacote; o bibliotecário vê a fila e registra a submissão por link ou comprovante. A consulta pública mostra a coluna RIC-CPS | Pós-banca etapa 4; Fila da biblioteca; Consulta pública | Registro manual. Não há integração com o RIC-CPS |
| 11 | O repositório mostra o que foi depositado, não o andamento da banca | O RIC-CPS é navegável por metadados do documento [S1]. Que ele não mostre agenda e pendência é inferência nossa [I] | A consulta pública filtra pelo andamento (agendada, realizada, pendente de correção, concluída) e esconde e-mail, token e arquivo | Consulta pública | Dados fictícios. Que metadados podem ser públicos está em aberto (PLANO.md, pergunta 5) |
| 12 | Agendadores genéricos não cruzam as agendas de uma banca | Sem evidência de interseção de vários avaliadores em Calendly [I-2] e Bookings [I-4]. Doodle é enquete [I-3] | Detecta conflito de sala, de horário e de disponibilidade cadastrada, e sugere horários que cabem | Agenda e bancas | A disponibilidade é a cadastrada no protótipo; não lê calendário real |
| 13 | A revisão de conformidade dos documentos é manual | Instituições exigem PDF/A (UFJF Engenharia Elétrica) [S35], mas não achamos validação automática em repositório público. Que a conferência seja manual é inferência nossa [I] | Revisão de conformidade por IA da versão final e do Termo contra as normas, ao lado das checagens fixas | Pós-banca, etapas Versão final e Termo de Autorização ("Revisar conformidade com IA"; rótulo "Revisão de IA · não substitui o aval do orientador") | O texto do documento é colado, não lido do arquivo. É sugestão: o nome do arquivo é checado por regra fixa no servidor e o checklist do Termo continua sendo o que bloqueia. Texto colado vai à OpenRouter; usar documento fictício |

## 5. O diferencial real

O Integrae vale pelo conjunto, não por um recurso isolado. Cada item abaixo tem pelo menos um concorrente que faz parte dele; nenhum faz tudo.

1. **Ciclo completo num lugar.** Convite, ata, versão, Termo, biblioteca e consulta usam os mesmos dados.
2. **Regras do CPS embutidas.** Nome do arquivo, PDF/A, tamanho, nota ≥ 9 com indicação para texto integral, prazo de 15 dias e prazo de 90 dias da biblioteca. As ferramentas genéricas não trazem isso.
3. **Aval por versão.** O orientador aprova uma versão, não "o trabalho".
4. **Convite por token.** Resposta individual, única, com estado visível.
5. **IA sobre a ata com revisão humana.** Sugere, mostra o que não bate com o cadastro e não decide.
6. **Encaminhamento à biblioteca.** O bibliotecário registra o depósito no mesmo fluxo.

## 6. O que o Integrae não faz

Para não prometer além do que existe:

- Não envia e-mail. A caixa de saída é demonstrativa.
- Não tem login institucional nem banco. O cenário fica no navegador (`localStorage`). A tela de login de demonstração lista contas de teste e aceita qualquer valor; cada aba guarda o seu perfil.
- Não integra com SIGA, SIGAA nem RIC-CPS. O depósito é um registro manual do bibliotecário.
- Não valida assinaturas. Não substitui o veraPDF: a checagem de PDF/A é a declaração nos metadados.
- Não sugere nota com base no trabalho: a IA lê o que a banca já escreveu na ata.
- Usa dados e pessoas fictícios. As perguntas abertas (composição mínima da banca, modelo de ata da Fatec Bauru, significado de "concluída", metadados públicos) estão no `PLANO.md`.

## 7. O que ainda precisa de confirmação

1. Texto da Portaria 4069/2024: nome de arquivo, PDF/A, nota 9, destino na Diretoria de Serviços Acadêmicos. Não abriu nestas buscas [S2, S3].
2. Existência de módulo de banca no SIGA da CPS. Não há fonte pública.
3. Prazo de correção real da Fatec Bauru. O Integrae usa 15 dias do briefing.
4. Preços atuais: Doodle e Adobe Acrobat Sign (página oficial fora do ar na pesquisa), Turnitin (não público), OpenEduCat (só marketing). Valores de Calendly, DocuSign e Power Automate são das páginas oficiais, mas o período de cobrança do Calendly não está explícito.
5. Manual da UFRN para o SIGAA. Os detalhes vêm de outras federais.

## Fontes

### Pesquisa brasileira

- [S1] RIC-CPS, página inicial: https://ric.cps.sp.gov.br/
- [S2] Registro da Portaria 4069/2024 no RIC-CPS (404): https://ric.cps.sp.gov.br/handle/123456789/25491
- [S3] Portaria CEETEPS-GDS 4069/2024, PDF (404): https://ric.cps.sp.gov.br/bitstream/123456789/26556/1/Portaria%20CEETEPS-GDS-4069_2024%20%286%29.pdf
- [S5] TCC Mentor, ADS 2025: https://ric.cps.sp.gov.br/bitstream/123456789/44528/1/ads_2025_1_gustavogarcia_tccmentor.pdf
- [S6] AutoSIGA, ADS 2024 (descreve uso do SIGA): https://ric.cps.sp.gov.br/bitstream/123456789/29803/1/ads_2024_2_marcosgasparinijunior_autosiga.pdf
- [S7] SIGAA, cadastro de banca (UFRRJ): https://institucional.ufrrj.br/ajudasig/files/2019/09/sigaagraduacaoportal-coord-gradcadastrar_banca_tcc_monografia-atualizado.pdf
- [S8] SIGAA, orientador (UFOPA): https://www.ufopa.edu.br/media/file/site/proen/documentos/2022/85c687aa8a4a9da89a70d30f86b72f1b.pdf
- [S9] SIGAA, defesa de TCC (UFSJ): https://ufsj.edu.br/portal2-repositorio/File/cobib/TCC/Orientacao%20para%20Defesa%20de%20TCC.pdf
- [S10] Gerar ata de defesa (IFRS): https://ifrs.edu.br/wp-content/uploads/2025/03/Gerar_ata_de_defesa.pdf
- [S13] Histórico do SIGAA (UFRN): https://repositorio.ufrn.br/server/api/core/bitstreams/0739d38f-72fe-4269-a2fd-bdd9a13e9aca/content
- [S16] Resolução de TCC no Cobalto (UFPel, Química): https://wp.ufpel.edu.br/licenciaturaquimica/files/2024/04/SEI_23110.039265_2023_51.pdf
- [S17] Cartilha TCC II 2026/1 (UFPel, Administração): https://wp.ufpel.edu.br/cursodeadministracao/files/2026/06/Cartilha-TCC-II-Bancas-2026-1.pdf
- [S27] Sistema web para bancas (UTFPR Pato Branco, 2013): https://repositorio.utfpr.edu.br/jspui/bitstream/1/15598/2/PB_COADS_2013_2_06.pdf
- [S28] Plataforma para TCC (UFC Russas, 2026): https://repositorio.ufc.br/ri/handle/riufc/84962?mode=full
- [S30] Plataforma de TCC (UFPE, candidato, URL não confirmada): https://attena.ufpe.br/bitstream/123456789/67367/1/TCC%20Luiz%20Henrique.pdf
- [S32] ARAMIS (UFC, 2026): https://repositorio.ufc.br/bitstream/riufc/84630/1/2026_tcc_gcampelo.pdf
- [S33] CopySpider (UFJF Engenharia de Produção): https://www2.ufjf.br/engenhariadeproducao/?p=3257
- [S35] Defesa e publicação de TCC (UFJF Engenharia Elétrica): https://www2.ufjf.br/engenhariaeletrica/defesa-e-publicacao-de-tcc/
- [S37] Termo de autorização (UFPB): https://www.ufpb.br/bsccen/contents/documentos/termo-de-autorizacao-para-publicacao-de-tcc-em-repositorio-institucional-da-ufpb.pdf
- [S38] Entrega de TCCs (UFRGS): https://www.ufrgs.br/bibedu/servicos/orientacao-para-entrega-de-tccs/
- [S39] Calendário de TCC 2023/2 (UNIPAMPA): https://cursos.unipampa.edu.br/cursos/bachareladoemcienciasbiologicas/files/2023/09/calendario-tcc-2023-ii.pdf
- [S40] Dúvidas frequentes (UFPel Biotecnologia): https://wp.ufpel.edu.br/gbiotec/files/2023/12/DUVIDAS-FREQUENTES-TCC.pdf
- [S41] Cronograma TCC I 2024/2 (IFRS Bento Gonçalves): https://ifrs.edu.br/bento/wp-content/uploads/sites/13/2024/08/CRONOGRAMA-TCC-I-2024_2.pdf
- [S42] Regulamentação de TCC (UNIRIO, Serviço Social): https://www.unirio.br/cchs/ess/Members/rodrigo.castelo/metodologia-da-pesquisa-2019.1/regulamentacao-ess-dos-tccs
- [S43] TCC (UFJF Ciências Contábeis): https://www2.ufjf.br/contabeisgv/graduacao/trabalho-de-conclusao-de-curso/
- [S44] Entrega da versão final (IFPE Paulista): https://portal.ifpe.edu.br/paulista/wp-content/uploads/sites/22/2024/01/ORIENTACOES-PARA-A-ENTREGA-DA-VERSAO-FINAL-DO-TCC-PARA-FINS-DE-DEPOSITO-LEGAL-NO-REPOSITORIO-INSTITUCIONAL-DO-IFPE.pdf
- [S46] Protocolo de defesa remota (UFJF Administração GV, 2020): https://www2.ufjf.br/administracaogv/wp-content/uploads/sites/195/2020/11/PROTOCOLO_OPERACIONAL_DE_PROCEDIMENTOS_PARA_APRESENTA%C3%87%C3%95ES_DE_TCC_DE_FORMA_REMOTA-1.pdf
- [S47] Cronograma de TCC de especialização 2023/2 (IFSC): https://ifsc.edu.br/documents/d/campus-florianopolis-continente/cronograma-de-tcc-especializacao-2023-2-final
- [S48] DSpace, licença: https://dspace.org/faq
- [S51] Caso de nota de IA em concurso (TJ-PR): https://convergenciadigital.com.br/mercado/justica-do-parana-rejeita-acao-de-aluno-por-nota-maior-dada-pela-inteligencia-artificial/

### Pesquisa internacional e genérica

- [I-1] Vireo, repositório e licença: https://github.com/TexasDigitalLibrary/vireo ; anúncio de 2010: https://www.tdl.org/2010/09/tdl-releases-vireo-etd-system-opensource-software/ ; guia UNT: https://tgs.unt.edu/new-current-students/tgs_submission_vireo_guide.pdf ; guia UH (2026): https://www.uh.edu/graduate-school/student-resources/thesis-dissertation/vireo4trainingforstudentsandetdcoordinators_mar_2026.pdf
- [I-2] Calendly, preços: https://calendly.com/pricing
- [I-3] Doodle (preços de terceiros, página oficial não abriu): https://koalendar.com/blog/doodle-pricing ; guia de defesas do Doodle (marketing): https://doodle.com/en/a-professors-guide-to-scheduling-thesis-defenses/
- [I-4] Microsoft Bookings, requisitos: https://learn.microsoft.com/en-us/microsoftteams/bookings-app-admin
- [I-5] OpenEduCat, módulo de teses (página de fornecedor): https://openeducat.org/feature-thesis-management-system/
- [I-6] Prazos de agendamento: Purdue https://www.chem.purdue.edu/academic_programs/graduate/thesisformat.html ; SDSMT https://sdsmt.edu/experience/graduate-education/assets/Defense-Approval-and-Scheduling-Form.pdf ; Carleton https://carleton.ca/scs/current-students/graduate-students/forms/comp-5905-scheduling-an-mcs-thesis-defence
- [I-7] Google Forms e Drive, limitações: https://eoi.helpscoutdocs.com/article/135-google-forms-limitations ; Power Automate, aprovações: https://learn.microsoft.com/power-automate/get-started-approvals
- [I-8] ProQuest ETD: https://about.proquest.com/en/news/2010/ProQuest-Eliminates-Fees-for-Basic-e-Submission-to-ProQuest-Dissertations-Theses/ ; taxas: https://siu.edu/admissions/graduate/academic-support/thesis-dissertation-research/etd/etd-submission.php e https://www.usf.edu/graduate-studies/students/electronic-thesis-dissertation/etd-process-requirements/etd-processing-fees.aspx
- [I-9] Ausência de PDF/A e nome padronizado: conclusão nossa a partir das páginas de [I-1], [I-8] e [I-15]
- [I-10] veraPDF: https://www.dpconline.org/dpc-home/events/digital-preservation-awards/verapdf-verapdf-consortium
- [I-11] Dados espalhados: UCL https://discovery-pp.ucl.ac.uk/id/eprint/117163/1/WorkflowAnalysis.pdf ; Caltech https://authors.library.caltech.edu/records/nxtct-fkf09
- [I-12] Extração de documentos: https://aws.amazon.com/textract/pricing/ ; https://learn.microsoft.com/en-us/answers/a/1539700
- [I-13] Turnitin: https://lead.mic.ul.ie/understanding-turnitin-s-grading-feedback-and-rubric-tools/overview-of-turnitin-s-grading-feedback-and-rubric-tools ; aviso de universidades: https://academicintegrity.unimelb.edu.au/staff-resources/turnitins-ai-writing-detection-tool ; cotação avulsa: https://www.uen.net/originalitydetection/downloads/Turnitin.pdf
- [I-14] Gradescope: https://lpt.it.miami.edu/resources/faculty-and-staff/leverage-ai-tools/ai-assisted-grading/index.html ; https://www.turnitin.ca/products/gradescope/
- [I-15] DocuSign, planos (R$): https://ecom.docusign.com/plans-and-pricing/esignature
- [I-16] Power Automate, preço: https://www.microsoft.com/en-us/power-platform/products/power-automate/pricing
- [I-17] Kuali e Vanderbilt (trecho de busca): https://vireo.library.vanderbilt.edu/ ; SIUE: https://www.siue.edu/graduate/kuali-research/

Os arquivos de trabalho das duas pesquisas ficam fora do repositório. Os trechos marcados como "trecho" na pesquisa original foram lidos em resultados de busca e merecem conferência antes de serem citados em voz alta.
