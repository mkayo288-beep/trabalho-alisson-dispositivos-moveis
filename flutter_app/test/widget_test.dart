import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:leva_comigo/app/app.dart';
import 'package:leva_comigo/core/services/local_repository.dart';
import 'package:leva_comigo/features/market/presentation/state/market_controller.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  for (final width in [320.0, 390.0, 1280.0]) {
    testWidgets('acesso, navegação e perfil em largura $width', (tester) async {
      tester.view.physicalSize = Size(width, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      SharedPreferences.setMockInitialValues({});
      final c = MarketController(
        LocalRepository(await SharedPreferences.getInstance()),
      );
      await c.initialize();
      await tester.pumpWidget(LevaApp(controller: c));
      expect(find.text('Boas viagens começam aqui.'), findsOneWidget);
      await tester.ensureVisible(find.text('Explorar demonstração'));
      await tester.tap(find.text('Explorar demonstração'));
      await tester.pumpAndSettle();
      expect(find.text('O que vamos conectar hoje?'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.tap(find.text('Buscar').last);
      await tester.pumpAndSettle();
      expect(find.text('Uma viagem. Muitas possibilidades.'), findsOneWidget);
      await tester.tap(find.text('Perfil').last);
      await tester.pumpAndSettle();
      expect(find.text('João Silva'), findsNWidgets(2));
      await tester.tap(find.text('Verificação de identidade'));
      await tester.pumpAndSettle();
      expect(find.text('Pendente'), findsOneWidget);
      expect(tester.takeException(), isNull);
      await tester.pumpWidget(const SizedBox.shrink());
      c.dispose();
    });
  }
  testWidgets('interface percorre transporte, confirmação e avaliação', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    SharedPreferences.setMockInitialValues({});
    final c = MarketController(
      LocalRepository(await SharedPreferences.getInstance()),
    );
    await c.initialize();
    await c.login('', '', false, explore: true);
    final id = await c.request(
      'T-MARIA',
      'Documentos',
      1,
      'Envelope lacrado',
      50,
    );
    await tester.pumpWidget(LevaApp(controller: c));
    await tester.tap(find.text('Viagens').last);
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('#$id · Documentos'));
    await tester.tap(find.text('#$id · Documentos'));
    await tester.pumpAndSettle();
    for (final label in [
      'Simular: Aceitar solicitação',
      'Simular: Confirmar coleta da mercadoria',
      'Simular: Iniciar viagem',
      'Simular: Marcar chegada ao destino',
      'Confirmar recebimento',
    ]) {
      await tester.ensureVisible(find.text(label));
      await tester.tap(find.text(label));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    }
    expect(find.text('Sua encomenda chegou.'), findsOneWidget);
    expect(
      tester
          .widget<FilledButton>(
            find.widgetWithText(FilledButton, 'Confirmar recebimento'),
          )
          .onPressed,
      isNull,
    );
    await tester.tap(find.byType(CheckboxListTile));
    await tester.pumpAndSettle();
    await tester.tap(
      find.widgetWithText(FilledButton, 'Confirmar recebimento'),
    );
    await tester.pumpAndSettle();
    expect(c.market.shipment(id).status, 'completed');
    await tester.ensureVisible(find.text('Avaliar transporte'));
    await tester.tap(find.text('Avaliar transporte'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Nota geral: 4 estrelas'));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(seconds: 5));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Enviar avaliação'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Enviar avaliação'));
    await tester.pumpAndSettle();
    expect(c.market.rows('reviews').single['score'], 4);
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox.shrink());
    c.dispose();
  });
}
