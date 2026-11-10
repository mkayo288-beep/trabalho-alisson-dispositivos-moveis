# Diagnóstico e estratégia — LevaComigo

O código original permanece em `src/`, com seus testes em `tests/`. A nova aplicação está em `flutter_app/`.

## Inventário anterior à implementação

Foram examinados `Workspace.tsx`, `domain.ts`, `ui.tsx`, estilos, entrada, dependências, README e testes. A aplicação contém acesso/cadastro/recuperação, início, busca/resultados, perfil de viajante, solicitação, publicação/edição/encerramento de viagem, painel com filtros, rastreamento, confirmação, avaliação, mensagens, perfil, histórico, reputação, verificação simulada e preferências/notificações.

Não existem APIs, servidor ou integrações externas. React Context e useState coordenam a interface; localStorage guarda contas PBKDF2 SHA-256 (120.000 iterações), perfis por e-mail, mercado compartilhado, leitura de notificações e sessão opcional. SessionStorage guarda sessões temporárias. Não há pagamentos, GPS, envio de e-mail ou análise real de documentos.

Modelos: Profile, Trip, Shipment, Review, Message, Account e Session. A capacidade é reservada desde pending e só liberada em refused/cancelled, inclusive após completed continua consumida. Transições: pending → accepted/refused/cancelled; accepted → received/cancelled; received → in_transit → arrived → completed. Viajante controla transporte e remetente confirma e avalia. Exemplos permitem simulação explícita. Ao concluir todas as encomendas com pelo menos uma concluída, a viagem é encerrada. Alterar preço não altera solicitações anteriores.

Problemas identificados: validação de datas apenas por expressão regular; números não finitos em algumas entradas; persistência posterior à atualização visual; ausência de transporte de dados entre plataformas; autenticação é exclusivamente local. A versão Flutter valida antes de persistir e publica alterações apenas após escrita bem-sucedida. Não adiciona serviços fictícios.

## Estratégia

1. Preservar arquivos e dados originais.
2. Implementar domínio Dart, repositório local e controlador observável separado das telas.
3. Manter nomes de campos e valores de status para importar JSON original.
4. Usar Material 3, cores verde-lima/grafite, navegação adaptável e formulários com validação.
5. Oferecer exportação/importação explícita: Android não pode ler o localStorage do navegador automaticamente.
6. Cobrir regras e fluxo entre duas contas com testes Flutter; registrar resultados reais ao final.

O armazenamento local mantém os mesmos limites de segurança e sincronização do original. A aplicação não promete comunicação entre dispositivos.

## Entrega e resultados de validação

Implementado em Flutter: autenticação local e recuperação compatível com PBKDF2 original, perfis, busca e ordenação, publicação e edição, solicitações e capacidade, rastreamento com permissões por papel, confirmação, conversas/eventos, avaliações e reputação, histórico, notificações e preferências, verificação simulada e exportação/importação. A implementação original continua disponível. A demonstração é optativa em novas instalações, evitando confundir exemplos com publicações reais.

A interface usa Material 3, verde-lima/grafite, cards, hierarquia tipográfica, estados vazios, feedback e progresso, formulários validados, áreas seguras, confirmação de ações destrutivas, navegação inferior no celular e lateral em telas maiores. Navigator oferece retorno entre detalhes; voltar no painel retorna ao início antes de sair.

Correções: datas reais e pesos mínimos consistentes, rejeição de valores não finitos, validação de arquivos e referências antes de importar, escrita confirmada antes de atualizar o estado, bloqueio de envios repetidos, proteção contra leituras antigas após alterações, preservação dos preços combinados, sessões temporárias por aba na Web e derivação de senha fora da thread visual nas plataformas nativas.

Validações executadas em 09/11/2026, com Flutter 3.47.9 stable / Dart 3.13.7:

| Verificação | Resultado |
| --- | --- |
| `flutter pub get` | Passou; versões resolvidas em pubspec.lock |
| `dart format lib test` | Executado |
| `flutter analyze` | Passou, sem apontamentos |
| `flutter test` | 12 testes passaram |
| `flutter build web --release --no-web-resources-cdn` | Passou, com recursos de renderização locais |
| TypeScript original | Passou |
| Build Vite original | Passou |
| Playwright original e exportação | 14 testes passaram, desktop e celular |
| Migração React → Flutter no Edge | Conta criada no React, arquivo exportado/importado, acesso com a senha original e sessão após recarregar passaram; sem erros JavaScript |
| `flutter build apk --debug` | Bloqueado: `No Android SDK found`; APK não gerado |

Os testes Flutter cobrem compatibilidade de hash com Node/WebCrypto, validações, fluxo entre duas contas, capacidade decimal, categoria, preço já combinado, permissões e transições inválidas, liberação de reservas, conclusão e fechamento, mensagens, avaliação única e reputação por papel, notificações, sessão persistente/temporária, recuperação e troca de senha, perfil e identidade simulada, importação idempotente/atômica e falha de gravação. Testes de widgets exercitam acesso/navegação/perfil em 320, 390 e 1280 pixels e transporte → confirmação → avaliação.

Na primeira execução dos testes React, o servidor indicado não estava ativo. Ele foi iniciado e a suíte completa passou. Expectativas ambíguas dos testes de widgets e sincronização do preenchimento via acessibilidade no navegador foram ajustadas; as verificações foram repetidas. Nenhum teste Android em dispositivo foi executado.

## Pendências e execução

O Android SDK não está disponível e Java não foi encontrado no PATH. Instale/configure o toolchain, revise as licenças e execute `flutter doctor`, `flutter test` e `flutter build apk --debug`. A ponte Kotlin de exportação e o layout/comportamento em Android real precisam dessa validação. Não há evidência para afirmar que o APK está pronto.

O sistema continua local, como o original. Backend, sincronização remota, pagamentos, e-mail, GPS, push e verificação real não existiam e não foram apresentados como integrações prontas. Gravações simultâneas em várias abas/processos continuam sujeitas a conflitos; produção exige persistência transacional e autorização no servidor.

Instruções completas de execução, transferência de dados e geração do APK estão em [flutter_app/README.md](../flutter_app/README.md). Na raiz, o React continua em 8443. A compilação Flutter pode ser servida em 8450 usando o comando documentado. A entrega Flutter não substitui automaticamente o servidor Vite original.
