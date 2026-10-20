# SIG-Banca

MVP navegável para o II Hackathon AMS Fatec Bauru/IBM. Dados e pessoas são fictícios. Protótipo demonstra o ciclo de uma banca; não substitui sistema institucional.

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
| Agenda de banca, cadastro, avaliadores, conflitos e alternativas | Agenda e bancas |
| Convite individual, aceite/recusa, token inválido, expirado ou usado | Meus convites e caixa de saída demonstrativa |
| Ata e autorização RIC-CPS, análise documental, pedido de ajuste e checklist | Pós-banca e documentos |
| Prazo de correção de 15 dias corridos, tarefas e histórico de versões | Meu trabalho |
| Aprovação vinculada a versão específica | Pós-banca e documentos |
| Filtros combinados: curso, aluno, orientador, avaliador, semestre, ano e status | Consulta de bancas |
| Pendências e registro de depósito por link ou comprovante | Pendências da coordenação |
| Sugestões de correção que aguardam revisão humana | Pós-banca e documentos |

## Dados e integrações simuladas

- Perfis: orientador, docente convidado, aluno, coordenação e visitante público. O seletor identifica o perfil de demonstração.
- A agenda, tarefas, convites, documentos, versões, histórico e depósitos compartilham estado no navegador.
- Convites não são enviados por e-mail. A caixa de saída mostra conteúdo e links demonstrativos.
- Upload seleciona o arquivo no navegador e persiste apenas nome, tipo, tamanho e data. Os bytes não são enviados nem sobrevivem à recarga.
- Sugestões de IA são exemplos fixos. Nenhum modelo externo é chamado.
- RIC-CPS, assinatura, validação de autenticidade e publicação institucional não têm integração.
- Atraso é aviso informativo. Não existe bloqueio automático.
- Prazo de demonstração: data da defesa + 15 dias corridos, definido pelo briefing do hackathon.
- A consulta pública mostra dados acadêmicos e avaliadores que aceitaram convite; esconde arquivos, e-mails e tokens.

## Organização

`src/domain` guarda tipos e regras; `src/data` traz o cenário fictício; `src/repositories` persiste metadados no navegador; `src/pages` contém jornadas; `src/components` contém elementos compartilhados. Integrações externas não foram configuradas.

O plano por incremento, modelo de dados, estados e critérios restantes ficam em [`PLANO.md`](./PLANO.md). A pesquisa usada está em `C:\Users\RT\Downloads\SIG-Banca_pesquisa_e_validacao.md`, `SIG-Banca_proposta.md` e `II_Hackathon_tema.pdf`.

## Deploy de teste

Preview atual: https://hackathon-fatec-2026-sig-banca-jzynlv2o1.vercel.app. Não contém integração institucional. O primeiro deploy do projeto recebeu alias de produção automático da Vercel; a URL acima é o preview separado para teste.
