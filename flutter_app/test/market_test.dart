import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:leva_comigo/core/services/local_repository.dart';
import 'package:leva_comigo/features/market/domain/models.dart';
import 'package:leva_comigo/features/market/presentation/state/market_controller.dart';

class MemoryRepository implements Repository {
  Market stored = Market.empty();
  bool fail = false;
  @override
  Future<Market> load() async => stored.copy();
  @override
  Future<void> save(Market market) async {
    if (fail) throw StateError('Disco indisponível');
    stored = market.copy();
  }
}

Json tripData() => {
  'origin': 'São Paulo, Brasil',
  'destination': 'Recife, Brasil',
  'date': today(),
  'space': 5.0,
  'price': 25.5,
  'notes': '',
  'acceptedTypes': ['Documentos'],
};
void main() {
  test(
    'progresso legado é preservado e aplicado ao abrir a demonstração',
    () async {
      final c = MarketController(MemoryRepository());
      await c.importBackup({
        'market': {'trips': [], 'shipments': [], 'reviews': [], 'messages': []},
        'legacyDelivery': {
          'status': 'completed',
          'completedAt': '2026-11-01T12:00:00.000Z',
        },
      });
      await c.login('', '', false, explore: true);
      expect(c.market.shipment('BG28491').status, 'completed');
      expect(
        c.market.shipment('BG28491').events['completed'],
        '2026-11-01T12:00:00.000Z',
      );
      expect(c.market.trip('T-MARIA').active, false);
      c.dispose();
    },
  );
  test('PBKDF2 mantém compatibilidade com Node/WebCrypto original', () async {
    expect(
      await passwordHash('senha123', 'salt-original'),
      'c8312a10c8d41cd8db68e210b8f96124334c55c1a497d2662adfca7cc186d7ea',
    );
  });
  test(
    'datas impossíveis, origem igual e valores não finitos são recusados',
    () {
      expect(
        () => validateRoute('São Paulo', 'sao paulo', today(), 1),
        throwsStateError,
      );
      expect(() => validateRoute('A', 'B', '2099-02-31', 1), throwsStateError);
      for (final weight in [double.nan, double.infinity, 0.0, .01, 31.0]) {
        expect(
          () => validateRoute('A', 'B', today(), weight),
          throwsStateError,
        );
      }
      validateRoute('A', 'B', today(), .1);
    },
  );
  test(
    'duas contas: capacidade, permissões, conversa, conclusão, preço e reputação',
    () async {
      final repository = MemoryRepository();
      final c = MarketController(repository);
      await c.initialize();
      await c.register(
        'Maria Silva',
        'maria@exemplo.com',
        'senha123',
        'senha123',
      );
      await c.login('maria@exemplo.com', 'senha123', true);
      final tripId = await c.publish(tripData());
      await c.logout();
      await c.register(
        'Lucas Almeida',
        'lucas@exemplo.com',
        'senha123',
        'senha123',
      );
      await c.login('lucas@exemplo.com', 'senha123', false);
      expect(c.myShipments, isEmpty);
      expect(
        c.market.search('sao paulo', 'RECIFE', today(), 1.2, 'Documentos'),
        hasLength(1),
      );
      expect(
        c.market.search('sao paulo', 'RECIFE', today(), 1.2, 'Livros'),
        isEmpty,
      );
      final id = await c.request(
        tripId,
        'Documentos',
        1.2,
        'Envelope lacrado',
        120,
      );
      expect(c.market.remaining(c.market.trip(tripId)), 3.8);
      expect(c.market.shipment(id).price, closeTo(30.6, .0001));
      await expectLater(c.status(id, 'accepted'), throwsStateError);
      await expectLater(c.status(id, 'completed'), throwsStateError);
      await expectLater(
        c.request(tripId, 'Documentos', 4, 'Envelope', 1),
        throwsStateError,
      );
      await expectLater(
        c.request(tripId, 'Livros', 1, 'Livro', 1),
        throwsStateError,
      );
      await c.message(id, 'Podemos nos encontrar no aeroporto?');
      await c.logout();
      await c.login('maria@exemplo.com', 'senha123', true);
      expect(c.myShipments, hasLength(1));
      expect(c.market.rows('messages').first['authorId'], 'lucas@exemplo.com');
      await expectLater(c.editTrip(tripId, 1, 30, ''), throwsStateError);
      await c.editTrip(tripId, 5, 30, 'Novas condições');
      expect(c.market.shipment(id).price, closeTo(30.6, .0001));
      for (final status in ['accepted', 'received', 'in_transit', 'arrived']) {
        await c.status(id, status);
      }
      await expectLater(c.status(id, 'completed'), throwsStateError);
      await expectLater(c.status(id, 'cancelled'), throwsStateError);
      await c.logout();
      await c.login('lucas@exemplo.com', 'senha123', false);
      await c.status(id, 'completed');
      expect(c.market.trip(tripId).active, isFalse);
      expect(c.market.tripState(c.market.trip(tripId)), 'Concluída');
      expect(c.market.remaining(c.market.trip(tripId)), 3.8);
      await c.review(id, 4, {'Comunicação': 5}, 'Muito cuidado.');
      await expectLater(c.review(id, 5, {}, ''), throwsStateError);
      expect(c.market.receivedReviews('maria@exemplo.com').single['score'], 4);
      expect(c.market.receivedReviews('lucas@exemplo.com'), isEmpty);
      await c.markRead();
      expect(c.unread, isFalse);
      final restored = MarketController(repository);
      await restored.initialize();
      expect(restored.email, isNull, reason: 'sessão temporária não persiste');
      await c.login('maria@exemplo.com', 'senha123', true);
      await restored.initialize();
      expect(restored.email, 'maria@exemplo.com');
      expect(jsonEncode(restored.market.data), jsonEncode(c.market.data));
      c.dispose();
      restored.dispose();
    },
  );
  test(
    'recusa/cancelamento liberam espaço; encerramento preserva encomendas',
    () async {
      final c = MarketController(MemoryRepository());
      await c.initialize();
      await c.login('', '', false, explore: true);
      final id = await c.publish(tripData());
      final first = await c.request(
        id,
        'Documentos',
        1.5,
        'Exemplo',
        0,
        sample: true,
      );
      await c.status(first, 'refused');
      expect(c.market.remaining(c.market.trip(id)), 5);
      final second = await c.request(
        id,
        'Documentos',
        2,
        'Exemplo',
        0,
        sample: true,
      );
      await c.status(second, 'accepted');
      await c.status(second, 'cancelled');
      expect(c.market.remaining(c.market.trip(id)), 5);
      await c.closeTrip(id);
      await expectLater(
        c.request(id, 'Documentos', 1, 'Exemplo', 0, sample: true),
        throwsStateError,
      );
      expect(c.market.shipments.where((s) => s.tripId == id), hasLength(2));
      c.dispose();
    },
  );
  test(
    'recuperação, senha, perfil e verificação preservam isolamento',
    () async {
      final c = MarketController(MemoryRepository());
      final code = await c.register(
        'Carla Souza',
        'CARLA@EXEMPLO.COM',
        'senha123',
        'senha123',
      );
      await expectLater(
        c.login('carla@exemplo.com', 'errada', true),
        throwsStateError,
      );
      await expectLater(
        c.resetPassword('carla@exemplo.com', 'errado', 'nova123', 'nova123'),
        throwsStateError,
      );
      await c.resetPassword('carla@exemplo.com', code, 'nova123', 'nova123');
      await c.login('carla@exemplo.com', 'nova123', true);
      await c.changePassword('nova123', 'maisnova123');
      await c.saveProfile('Carla Lima', '81999999999', 'Recife');
      await c.verification('review', 'CNH');
      await c.verification('rejected', 'CNH');
      await c.verification('review', 'CNH');
      await c.verification('approved', 'CNH');
      await c.preferences(false);
      expect(c.profile['notifications'], false);
      await c.logout();
      await c.register(
        'Outra Pessoa',
        'outra@exemplo.com',
        'senha123',
        'senha123',
      );
      await c.login('outra@exemplo.com', 'senha123', true);
      expect(c.profile['phone'], '');
      expect(c.profile['verification'], isNull);
      await c.logout();
      await c.login('carla@exemplo.com', 'maisnova123', true);
      expect(c.profile['name'], 'Carla Lima');
      expect(c.profile['verification']['status'], 'approved');
      c.dispose();
    },
  );
  test(
    'falha de persistência não confirma operação nem altera estado',
    () async {
      final repo = MemoryRepository();
      final controller = MarketController(repo);
      await controller.login('', '', true, explore: true);
      final before = jsonEncode(controller.market.data);
      repo.fail = true;
      await expectLater(controller.publish(tripData()), throwsStateError);
      expect(jsonEncode(controller.market.data), before);
      expect(controller.busy, false);
      controller.dispose();
    },
  );
  test(
    'arquivo React e backup são importados sem reverter registros; inválidos são atômicos',
    () async {
      final source = MarketController(MemoryRepository());
      await source.login('', '', false, explore: true);
      final backup = source.market.copy().data;
      final target = MarketController(MemoryRepository());
      await target.importBackup({
        'market': {
          for (final key in ['trips', 'shipments', 'reviews', 'messages'])
            key: backup[key],
        },
        'profiles': backup['profiles'],
        'accounts': [],
      });
      expect(target.market.shipments.single.id, 'BG28491');
      await target.login('', '', false, explore: true);
      await target.status('BG28491', 'arrived');
      await target.importBackup(backup);
      expect(target.market.shipment('BG28491').status, 'arrived');
      final before = jsonEncode(target.market.data),
          bad = source.market.copy().data;
      bad['shipments'][0]['tripId'] = 'inexistente';
      bad['shipments'][0]['id'] = 'NEW';
      await expectLater(target.importBackup(bad), throwsStateError);
      expect(jsonEncode(target.market.data), before);
      final brokenTrip = source.market.copy().data;
      brokenTrip['trips'][0]['id'] = 'INVALID-TRIP';
      (brokenTrip['trips'][0] as Map).remove('ownerId');
      await expectLater(target.importBackup(brokenTrip), throwsStateError);
      expect(jsonEncode(target.market.data), before);
      source.dispose();
      target.dispose();
    },
  );
}
