# Apresentação do Integrae

Roteiro de fala do Integrae para o pitch do II Hackathon AMS Fatec Bauru/IBM, em resposta ao desafio SIG-Banca. O tema não fixa duração; este texto foi pensado para aproximadamente 4 minutos, incluindo uma demonstração breve. Ajustar ao limite informado pela organização.

## Título

**Integrae — da agenda ao depósito, com cada etapa visível.**

## Fala

Uma banca de TCC parece durar algumas horas. Mas o trabalho começa muito antes da defesa e continua depois dela: combinar agenda, convidar avaliadores, registrar a ata, acompanhar correções, aprovar a versão definitiva e preparar o depósito institucional.

Quando cada etapa fica em um lugar diferente, surgem cobranças manuais, documentos difíceis de localizar e dúvidas sobre o que ainda falta. Esse é o problema apresentado no tema do hackathon.

Por isso criamos o Integrae: um fluxo compartilhado para acompanhar o ciclo da banca do agendamento ao registro do depósito. Na demonstração, cada perfil mostra a etapa correspondente e a próxima ação necessária.

Vamos percorrer esse fluxo.

No perfil do orientador, cadastramos o trabalho, os alunos, o horário, o local e os docentes convidados. O sistema aponta conflito de sala, sobreposição de horário e falta de disponibilidade cadastrada. Quando há conflito, sugere horários que cabem nas disponibilidades registradas.

O convidado abre seu link e responde à participação. O sistema demonstra estados de convite pendente, aceito, recusado e expirado, além de impedir uma segunda resposta ao mesmo convite. A caixa de saída deixa claro que o envio de e-mail é simulado nesta versão.

Depois da defesa, o orientador registra a realização e confere a Ata, anotando a nota e a indicação da banca. O Termo de Autorização só é liberado depois da ata conferida e do aval de uma versão final, porque ele traz a nota, a indicação e a declaração de que as correções foram feitas. O Integrae pré-preenche o termo e aplica as regras da Portaria 4069/2024: gera o nome de arquivo no padrão, confere se o PDF declara PDF/A nos metadados, checa o tamanho e só oferece texto integral com nota igual ou superior a 9 e indicação da banca. Essa checagem de PDF/A é heurística e a autenticidade das assinaturas não é verificada. Os documentos mantêm estado próprio, separado do estado acadêmico da banca.

No perfil do aluno, aparecem a banca, as tarefas e o prazo de demonstração: data da defesa mais 15 dias corridos, como definido no briefing. O aluno registra novas versões. O orientador avalia uma versão específica; a decisão não aprova automaticamente uma versão enviada depois. Se o prazo passar, o sistema avisa, sem bloquear o aluno. A pesquisa também aponta outro prazo: até 90 dias após o fim do semestre para encaminhar o trabalho à biblioteca. O Integrae calcula esse segundo prazo usando um fim de semestre demonstrativo.

Na consulta, combinamos filtros por curso, aluno, orientador, avaliador, semestre, ano e status: agendada, realizada, pendente de correção ou concluída, como no tema. A tela pública mostra dados acadêmicos e não expõe documentos, e-mails ou tokens. A coordenação acompanha os dois prazos e confirma a assinatura do coordenador no Termo de Autorização. Seguindo a Portaria, o orientador encaminha o pacote à biblioteca, com cópia do termo à Diretoria de Serviços Acadêmicos, e o bibliotecário registra a submissão no RIC-CPS por link ou comprovante. O protótipo não envia esse material: o registro é local.

Também preparamos uma área para sugestões de correção revisadas pelo orientador. Nesta versão, as sugestões são exemplos fixos; nenhum modelo de IA é chamado. Como próximo passo, propomos usar IA para extrair campos da ata e apontar divergências para conferência humana, sem validar assinaturas nem aprovar o trabalho.

O protótipo usa dados fictícios e persiste o cenário no navegador. Selecionar um arquivo guarda seus metadados e o resultado da checagem, mas não envia nem persiste o conteúdo. O envio de e-mail, a validação de assinatura e a integração com o RIC-CPS não estão ativos. O registro de depósito é local, não uma submissão institucional.

Esse limite é deliberado: queremos mostrar o fluxo e suas responsabilidades sem afirmar que uma integração ou regra ainda não confirmada já funciona. A pesquisa disponível não encontrou uma API do RIC-CPS nem o regulamento local que esclareça todos os detalhes do prazo de correção. Por isso identificamos os 15 dias como premissa da demonstração, calculamos os 90 dias com um calendário demonstrativo e deixamos integrações para validação institucional.

O resultado é um processo em que orientador, convidado, aluno, coordenação e biblioteca acompanham a mesma jornada. O Integrae não para no agendamento: mostra o que aconteceu, o que falta e quem precisa agir para o trabalho seguir até o depósito.

## Guia rápido da demonstração

1. Comece no painel do orientador e mostre **Agenda e bancas**. Aponte um conflito ou crie uma banca para demonstrar a checagem de horário.
2. Abra **Caixa de saída** e siga o link do convite pendente de Marcos Reis. Mostre o estado individual do token e a resposta do convidado.
3. Troque para o perfil **Aluno**. Mostre prazo, tarefas, o nome de arquivo exigido e envie a amostra de `public/amostras/`.
4. Volte ao orientador em **Pós-banca e documentos**: confira a ata, aprove a versão e mostre o Termo de Autorização liberado e pré-preenchido. Anexe a amostra inválida para mostrar a validação falhando e depois a válida.
5. Troque para **Coordenação** e confirme a assinatura do coordenador. Volte ao orientador, valide o termo e encaminhe o pacote.
6. Troque para **Bibliotecário** e registre a submissão. Termine em **Consulta pública**, filtrando por concluída, e em **Modelo do processo**.

O passo a passo detalhado está na seção "Roteiro de teste" do `README.md`.

Use **Restaurar cenário inicial** antes de repetir a demonstração. Os perfis compartilham o mesmo cenário no navegador.

## Perguntas prováveis

**O convite envia e-mail institucional de verdade?**  
Não. A caixa de saída e os links são demonstrativos. O protótipo não se conecta a uma conta de e-mail.

**O sistema deposita o TCC no RIC-CPS?**  
Não. O orientador registra o encaminhamento e o bibliotecário registra localmente o link ou comprovante da submissão. A pesquisa em `SIG-Banca_pesquisa_e_validacao.md` descreve o orientador encaminhando o trabalho à biblioteca e o bibliotecário fazendo a submissão, conforme a Portaria 4069/2024. Não confirmamos alterações posteriores nem encontramos uma API do RIC-CPS.

**Os 15 dias são uma regra institucional confirmada?**  
Não pela pesquisa disponível. O tema menciona 15 dias corridos para correções e o briefing definiu, para esta demonstração, contar a partir da data da defesa. A pesquisa também encontrou prazo de até 90 dias após o fim do semestre para envio à biblioteca. São etapas distintas; a regra local completa precisa de confirmação.

**O que o sistema valida na autorização RIC-CPS?**  
O sistema bloqueia a validação até que estejam ok: arquivo PDF, declaração PDF/A nos metadados, tamanho de até 1 GB, nome no padrão `_TA`, nível de acesso coerente com nota e indicação, declaração de correções e as três assinaturas marcadas (a do coordenador, confirmada pela coordenação). A marca de PDF/A não substitui um validador completo, e a autenticidade das assinaturas não é verificada.

**A IA revisa o trabalho?**  
Não nesta versão. As tarefas são exemplos fixos e precisam da revisão humana do orientador.

**O arquivo selecionado fica armazenado?**  
Não. O navegador lê o conteúdo localmente para checar formato; só nome, tipo, tamanho, data e o resultado da checagem ficam nos dados locais. Nada é enviado a um servidor.

## Base e limites das afirmações

- O tema oficial pede jornadas de orientador, convidado, aluno e consulta pública/coordenação, além de demonstração de usabilidade, aderência institucional e automação: `II_Hackathon_tema.pdf` (com a equipe).
- A pesquisa e as ressalvas sobre Portaria, prazo, RIC-CPS e regras ainda não confirmadas estão em `SIG-Banca_pesquisa_e_validacao.md` (com a equipe).
- A proposta de fluxo e os critérios de apresentação estão em `SIG-Banca_proposta.md` (com a equipe).
- O estado real do MVP e as simulações estão descritos em `PLANO.md` e `README.md`.

## Princípios aplicados

O roteiro segue a skill `pitch-deck`: narrativa antes de slides, benefício antes da lista de funcionalidades, frases curtas e nenhuma métrica, integração ou vantagem sem evidência. A estrutura de pitch para investidores foi adaptada ao hackathon; não inclui mercado, receita ou rodada de investimento porque as fontes não sustentam esses tópicos.
