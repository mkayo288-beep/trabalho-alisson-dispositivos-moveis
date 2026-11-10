import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app/app.dart';
import 'core/services/local_repository.dart';
import 'features/market/presentation/state/market_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    final controller = MarketController(
      LocalRepository(await SharedPreferences.getInstance()),
    );
    await controller.initialize();
    runApp(LevaApp(controller: controller));
  } catch (error) {
    runApp(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: SelectableText(
              'Não foi possível abrir o armazenamento. Reinicie o aplicativo. Seus dados não foram apagados.\n$error',
            ),
          ),
        ),
      ),
    );
  }
}
