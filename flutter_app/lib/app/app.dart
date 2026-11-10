import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import '../features/market/presentation/state/market_controller.dart';
import '../features/market/presentation/pages/auth_page.dart';
import '../features/market/presentation/pages/shell_page.dart';
import 'theme/app_theme.dart';

class LevaApp extends StatelessWidget {
  const LevaApp({super.key, required this.controller});
  final MarketController controller;
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: controller,
    builder: (context, _) => MaterialApp(
      key: ValueKey(controller.email),
      title: 'LevaComigo',
      debugShowCheckedModeBanner: false,
      theme: appTheme(),
      locale: const Locale('pt', 'BR'),
      supportedLocales: const [Locale('pt', 'BR')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      home: controller.startupError != null
          ? Scaffold(
              body: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Não foi possível ler seus dados. Nenhum registro foi apagado.',
                      ),
                      SelectableText(controller.startupError!),
                      FilledButton(
                        onPressed: controller.initialize,
                        child: const Text('Tentar novamente'),
                      ),
                    ],
                  ),
                ),
              ),
            )
          : controller.email == null
          ? AuthPage(controller: controller)
          : ShellPage(controller: controller),
    ),
  );
}
