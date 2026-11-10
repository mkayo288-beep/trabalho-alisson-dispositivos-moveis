# LevaComigo — Flutter

Migração do LevaComigo existente, preservado em `../src`. Flutter 3.47.9 stable e Dart 3.13.7 foram usados na validação. Plataformas geradas: Android e Web. Não há servidor ou API no projeto original; o mercado permanece local ao dispositivo/navegador.

## Executar

Para visualizar com moldura de celular, execute na raiz `node scripts/preview-mobile.mjs` e abra http://127.0.0.1:8451/mobile. É possível escolher o tamanho e girar a tela. A prévia usa a compilação Flutter Web existente; não é um emulador Android.

Com Flutter no PATH:

```powershell
cd flutter_app
flutter pub get
flutter run -d chrome
# Com um dispositivo/emulador Android conectado:
flutter run -d <id-do-dispositivo>
```

O SDK preparado neste ambiente está em `../.tools/flutter` (ignorado pelo Git). Sem alterar o PATH, dentro de `flutter_app` use `..\.tools\flutter\bin\flutter.bat` no lugar de `flutter`. Consulte `flutter devices` para os IDs.

A aplicação React original continua no Vite na porta 8443. A prévia compilada Flutter pode ser servida, na raiz, por:

```powershell
node node_modules/vite/bin/vite.js preview --outDir flutter_app/build/web --port 8450 --host 127.0.0.1
```

Abra http://127.0.0.1:8450. O painel Vite original não executa Dart: abra a prévia Flutter nesse endereço.

## Android / APK

Instale Android Studio, Android SDK e JDK compatível com a versão Gradle gerada. Configure `ANDROID_HOME`/`JAVA_HOME` ou a configuração equivalente do Flutter. Revise e aceite pessoalmente as licenças necessárias com `flutter doctor --android-licenses`.

```powershell
flutter doctor -v
flutter pub get
flutter build apk --debug
```

Saída esperada: `build/app/outputs/flutter-apk/app-debug.apk`. O build Android foi tentado neste ambiente e parou em `No Android SDK found`. Nenhum APK foi produzido; a ponte nativa de exportação Android e o comportamento em dispositivo ainda precisam de validação. Distribuição de produção exige configuração de assinatura própria.

## Transferir dados do React

1. No navegador e endereço onde seus dados originais estão salvos, abra o React.
2. Entre e vá a **Perfil → Preferências e acesso → EXPORTAR MIGRAÇÃO FLUTTER**.
3. O arquivo inclui todas as contas locais, hashes PBKDF2, perfis, viagens, encomendas, mensagens e avaliações. Guarde-o em local privado.
4. Na entrada do Flutter, escolha **Importar dados do projeto original** e selecione o JSON.
5. Entre com o e-mail e senha originais. O algoritmo de senha mantém salt, SHA-256, 120.000 iterações e 256 bits.
6. Também é possível importar a exportação pessoal antiga. Ela contém o perfil e as atividades, mas não as credenciais: crie uma conta com o mesmo e-mail antes de importá-la.

A importação adiciona registros ausentes. Os registros existentes no destino prevalecem para impedir que um backup antigo reverta etapas atuais. Não sobrescreve nem apaga dados do React. Em transferências repetidas, use um destino vazio para obter uma cópia exata atualizada; a importação não resolve conflitos entre duas cópias editadas separadamente.

Android não tem acesso automático ao localStorage do navegador. Importação é explícita. O legado anterior ao workspace (`leva-comigo:delivery-progress`) é preservado no arquivo e restaurado ao abrir a demonstração no Flutter. Registros atuais da encomenda prevalecem sobre esse legado.

## Funcionalidades

- Cadastro, acesso, código de recuperação exportável, redefinição e troca de senha.
- Sessão persistente opcional. Na Web, acesso temporário usa a aba; em Android, a sessão temporária dura enquanto o processo permanece aberto.
- Busca por rota, data, categoria e capacidade; sugestões de cidades, inversão de rota, calendário e ordenação por reputação/preço/espaço.
- Publicação de viagem, categorias aceitas, edição de capacidade/preço/observações e encerramento com confirmação.
- Solicitações independentes com descrição, valor declarado, revisão do total e reserva imediata de capacidade.
- Aceite, coleta, início, chegada, recebimento confirmado pelo remetente, recusa e cancelamento antes da coleta. Permissões verificadas no controlador.
- Conversas por encomenda com mensagens e eventos; notificações locais e leitura persistida.
- Avaliações e critérios após conclusão, reputação recebida/enviada, histórico por papel e exportação.
- Perfil, preferências, verificação de identidade explicitamente simulada, exportação pessoal e backup completo.
- Demonstração identificada e solicitação de exemplo para testar publicações próprias.

Contas novas começam sem viagens de exemplo adicionadas; a demonstração é optativa. Viagens reais importadas ou publicadas permanecem disponíveis no mercado local. Essa separação impede apresentar ofertas fictícias como novas publicações reais.

## Regras preservadas e correções

O peso é reservado desde a solicitação. Recusa/cancelamento liberam a reserva; encomendas concluídas continuam consumindo a capacidade da viagem. Só o viajante avança o transporte, e só o remetente confirma e avalia, exceto simulações explicitamente indicadas. Ao finalizar todas as encomendas, com ao menos uma entrega concluída, a viagem é encerrada. Edição de preço não altera valores já combinados.

Datas impossíveis e números não finitos são rejeitados. A interface só confirma alterações após a gravação. Uma falha de gravação mantém o último estado válido e permite tentar novamente. Hashes são derivados fora da thread de interface em plataformas nativas. Leituras periódicas e retomada da aplicação atualizam o mercado; operações também recarregam os dados antes de salvar.

## Arquitetura

- `lib/app`: tema Material 3, localização pt-BR e raiz da aplicação.
- `lib/core/services`: repositório persistente e sessão por aba.
- `lib/features/market/domain`: modelos e regras de busca, capacidade e transição.
- `lib/features/market/presentation/state`: controlador observável, autorização das ações e casos de uso.
- `lib/features/market/presentation/pages`: telas e navegação por Navigator/MaterialPageRoute.
- `lib/shared/widgets`: formulários, feedback, cards, importação e exportação.
- `android`: projeto gerado pelo Flutter; exportação via seletor de documentos do Android, sem permissão ampla de armazenamento.
- `test`: regras, persistência/falhas, compatibilidade de credenciais e fluxos de interface.

## Verificar

```powershell
flutter pub get
dart format lib test
flutter analyze
flutter test
flutter build web --release --no-web-resources-cdn
flutter build apk --debug
```

Com React em 8443 e Flutter compilado em 8450, na raiz:

```powershell
node scripts/flutter-web-smoke.mjs
```

Esse teste cria uma conta em um contexto de navegador isolado, exporta pelo React, importa no Flutter e tenta o login com a senha original. Não acessa o perfil real do navegador.

## Limites preservados

Autenticação, conversas e notificações são locais. Não há proteção de servidor contra edição direta do armazenamento, sincronização remota, pagamento, e-mail, GPS, análise real de identidade ou push. SharedPreferences mantém o mercado no dispositivo; limpar dados/desinstalar pode remover os registros. Exporte backups antes de trocar de dispositivo. Operações simultâneas em abas/processos continuam sujeitas a conflitos de última gravação; não há banco transacional compartilhado. Use um backend para produção.

Não foram inventadas APIs ou credenciais. Conectividade não é necessária para operações locais após os recursos da aplicação estarem disponíveis. No navegador, o primeiro carregamento requer acesso ao servidor que fornece a compilação Web.
