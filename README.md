# LevaComigo

Aplicação acadêmica de transporte colaborativo de pequenas encomendas, desenvolvida com React 19, Vite 8 e Tailwind CSS 4. Remetentes encontram viagens compatíveis; viajantes publicam espaço na bagagem e gerenciam os pedidos.

## Executar

```sh
pnpm install
pnpm dev
```

Endereço padrão: http://localhost:8443. Se o servidor de desenvolvimento já estiver ativo, basta abrir o endereço.

## Acesso

Use **Explorar demonstração**, ou entre com `teste@exemplo.com` / `123456`. Também é possível cadastrar contas próprias. O cadastro exige confirmação de senha e gera um código de recuperação que pode ser baixado. A recuperação redefine a senha usando esse código; não há envio de e-mail.

As credenciais locais usam PBKDF2 com salt individual. Esta implementação é apropriada para a demonstração acadêmica: a verificação de acesso ocorre no cliente e não substitui autenticação em um servidor.

## Funcionalidades

- Busca por origem, destino, data, peso e categorias aceitas, com sugestões de cidades, calendário, campos numéricos e seleção de mercadorias.
- Resultados baseados nas viagens cadastradas, com ordenação por avaliação, preço ou espaço disponível; estados vazios para buscas sem correspondência.
- Publicação de viagens, escolha de mercadorias aceitas, edição de capacidade/preço/observações e encerramento da publicação.
- Múltiplas solicitações independentes, com códigos próprios, descrição, valor declarado, total combinado e reserva de espaço.
- Fluxo: solicitação enviada → aceite → coleta → em viagem → chegada → confirmação do remetente → conclusão.
- Recusa ou cancelamento antes da coleta, com liberação da capacidade reservada.
- Etapas controladas por papel: o viajante registra o transporte e o remetente confirma o recebimento. As viagens e solicitações de exemplo têm ações de simulação identificadas.
- Histórico, filtros por situação, notificações com marcação de leitura e avaliação após a conclusão.
- Conversas por encomenda, com registro de mensagens e eventos; mensagens entre contas locais aparecem como enviadas ou recebidas.
- Perfil editável, preferências de notificações, troca de senha, saída da conta e exportação de dados em JSON.
- Reputação calculada pelas avaliações recebidas, com visualizações distintas para avaliações recebidas e enviadas.
- Histórico por papel (remetente ou viajante), com datas, encomendas finalizadas e viagens concluídas. Entregas concluídas saem do painel de atividades em andamento.
- Verificação de identidade simulada com estados pendente, em análise, aprovado e reprovado, sem envio de documentos reais.
- Layout responsivo, navegação móvel e controles com nomes acessíveis e estados de foco.

## Testar com duas contas

1. Cadastre uma conta de viajante e publique uma viagem.
2. Saia e cadastre uma conta de remetente no mesmo navegador e endereço.
3. Busque a rota e a data publicadas, solicite o transporte e envie uma mensagem.
4. Entre como viajante para aceitar, registrar a coleta, iniciar a viagem e registrar a chegada.
5. Entre como remetente para confirmar o recebimento e avaliar.

Para testar sem criar uma segunda conta, use as viagens de exemplo ou o botão **Testar com solicitação de exemplo** de uma publicação própria.

## Persistência e limites

Perfis são separados por conta. Viagens, encomendas e conversas compartilham um mercado local em `localStorage`; as telas mostram as encomendas em que a conta é remetente ou viajante. Abas no mesmo navegador recebem atualizações por eventos de armazenamento. A sessão pode ser lembrada entre acessos ou mantida somente na aba.

Os dados permanecem após recarregar a página, mas não são sincronizados entre navegadores ou dispositivos. Limpar os dados do site remove os registros locais. Os controles locais não oferecem isolamento de segurança contra alguém com acesso ao armazenamento do navegador.

Não há servidor, banco remoto, cobrança, repasse, rastreamento por GPS, envio externo de mensagens/e-mails ou verificação de identidade. Datas e etapas de transporte são registradas pelos participantes. O valor apresentado é apenas o preço combinado. Um uso real exige implementar esses serviços no servidor.

A conclusão de `#BG28491` da versão anterior é migrada ao acessar a demonstração.

## Verificação

```sh
pnpm typecheck
pnpm build
pnpm test
```

Os testes Playwright verificam os fluxos em computador e em viewport móvel usando Microsoft Edge instalado. Em outro ambiente, instale um navegador Playwright e ajuste `channel` em `playwright.config.ts`. Os testes usam dados próprios em contextos isolados e não alteram os registros do navegador do usuário. Inicie o servidor antes de executar os testes.

## Código

- `src/App.tsx`: entrada da aplicação.
- `src/Workspace.tsx`: telas, sessão, persistência e fluxos.
- `src/domain.ts`: tipos, regras de transição, capacidade, busca e dados de exemplo.
- `src/ui.tsx`: componentes compartilhados de interface.
- `src/index.css`: estilos globais e responsividade.
- `tests/`: testes das regras e dos fluxos completos.
