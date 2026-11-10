import 'dart:convert';
import 'dart:math';
import 'package:cryptography/cryptography.dart';
import 'package:flutter/foundation.dart';
import '../../../../core/services/local_repository.dart';
import '../../../../core/services/tab_session.dart';
import '../../domain/models.dart';

String uid(String prefix) =>
    '$prefix${List.generate(16, (_) => Random.secure().nextInt(16).toRadixString(16)).join().toUpperCase()}';
Future<String> passwordHash(String password, String salt) => kIsWeb
    ? _derivePassword([password, salt])
    : compute(_derivePassword, [password, salt]);
Future<String> _derivePassword(List<String> values) async {
  final password = values[0], salt = values[1];
  final key =
      await Pbkdf2(
        macAlgorithm: Hmac.sha256(),
        iterations: 120000,
        bits: 256,
      ).deriveKey(
        secretKey: SecretKey(utf8.encode(password)),
        nonce: utf8.encode(salt),
      );
  return (await key.extractBytes())
      .map((b) => b.toRadixString(16).padLeft(2, '0'))
      .join();
}

class MarketController extends ChangeNotifier {
  MarketController(this.repository);
  final Repository repository;
  Market market = Market.empty();
  String? email;
  bool demo = false;
  bool busy = false;
  int _revision = 0;
  String? startupError;
  Json get profile => market.data['profiles'][email] as Json;
  List<Shipment> get myShipments => market.forUser(email!);
  Future<void> initialize() async {
    try {
      market = await repository.load();
      final session = readTabSession() ?? market.data['session'];
      if (session is Map && market.data['profiles'][session['email']] != null) {
        email = session['email'];
        demo = session['demo'] == true;
      }
      startupError = null;
    } catch (e) {
      startupError = e.toString();
    }
    notifyListeners();
  }

  Future<void> refresh() async {
    if (busy) return;
    final revision = _revision;
    final updated = await repository.load();
    if (busy || revision != _revision) return;
    market = updated;
    notifyListeners();
  }

  Future<void> mutate(void Function(Market) action) async {
    require(!busy, 'Aguarde a operação atual.');
    busy = true;
    notifyListeners();
    try {
      final next = (await repository.load()).copy();
      action(next);
      next.reconcile();
      await repository.save(next);
      market = next;
      _revision++;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  String cleanEmail(String value) => value.trim().toLowerCase();
  Json? account(Market m, String value) {
    for (final a in m.rows('accounts')) {
      if (a['email'] == value) return a;
    }
    return null;
  }

  Future<String> register(
    String name,
    String value,
    String password,
    String confirmation,
  ) async {
    final address = cleanEmail(value);
    require(name.trim().length >= 3, 'Informe seu nome completo.');
    require(
      RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(address),
      'Informe um e-mail válido.',
    );
    require(
      password.length >= 6 && password == confirmation,
      'Use pelo menos 6 caracteres e confirme a mesma senha.',
    );
    final salt = uid('S'), recovery = uid('R');
    final hash = await passwordHash(password, salt),
        recoveryHash = await passwordHash(recovery, salt);
    await mutate((m) {
      require(
        account(m, address) == null && address != 'teste@exemplo.com',
        'Este e-mail já possui uma conta.',
      );
      m.rows('accounts').add({
        'name': name.trim(),
        'email': address,
        'salt': salt,
        'hash': hash,
        'recoveryHash': recoveryHash,
      });
      m.data['profiles'][address] = {
        'name': name.trim(),
        'email': address,
        'phone': '',
        'city': cities.first,
        'notifications': true,
      };
    });
    return recovery;
  }

  Future<void> login(
    String value,
    String password,
    bool remember, {
    bool explore = false,
  }) async {
    final address = explore ? 'teste@exemplo.com' : cleanEmail(value);
    final isDemo =
        explore || (address == 'teste@exemplo.com' && password == '123456');
    final current = await repository.load();
    if (!isDemo) {
      final a = account(current, address);
      require(
        a != null && await passwordHash(password, a['salt']) == a['hash'],
        'E-mail ou senha incorretos.',
      );
    }
    await mutate((m) {
      m.data['profiles'][address] ??= {
        'name': isDemo ? 'João Silva' : account(m, address)!['name'],
        'email': address,
        'phone': '',
        'city': cities.first,
        'notifications': true,
      };
      if (isDemo) seedDemo(m);
      m.data['session'] = remember ? {'email': address, 'demo': isDemo} : null;
    });
    saveTabSession(remember ? null : {'email': address, 'demo': isDemo});
    email = address;
    demo = isDemo;
    notifyListeners();
  }

  void seedDemo(Market m) {
    if (m.data['demoSeeded'] == true) return;
    final date = today().compareTo('2026-11-15') > 0 ? today() : '2026-11-15';
    for (final t in [
      {
        'id': 'T-MARIA',
        'ownerId': 'sample-maria',
        'name': 'Maria Silva',
        'origin': cities[0],
        'destination': cities[1],
        'space': 7,
        'price': 40,
        'rating': 4.9,
      },
      {
        'id': 'T-RAFAEL',
        'ownerId': 'sample-rafael',
        'name': 'Rafael Costa',
        'origin': cities[2],
        'destination': cities[3],
        'space': 3,
        'price': 35,
        'rating': 4.7,
      },
    ]) {
      if (!m.trips.any((existing) => existing.id == t['id'])) {
        m.rows('trips').add({
          ...t,
          'date': date,
          'active': true,
          'notes': 'Viagem de exemplo. Retirada e entrega a combinar.',
        });
      }
    }
    if (!m.shipments.any((s) => s.id == 'BG28491')) {
      final legacy = m.data['legacyDelivery'] as Map?;
      final legacyStatus = legacy?['status'];
      final restored = ['arrived', 'completed'].contains(legacyStatus);
      final at = restored
          ? (legacy?['arrivedAt'] ?? legacy?['completedAt'] ?? now()) as String
          : now();
      m.rows('shipments').add({
        'id': 'BG28491',
        'tripId': 'T-MARIA',
        'senderId': 'teste@exemplo.com',
        'sender': 'João Silva',
        'itemType': 'Eletrônico',
        'weight': 2,
        'description': 'Fone de ouvido na embalagem original',
        'declaredValue': 800,
        'status': restored ? legacyStatus : 'in_transit',
        'createdAt': at,
        'events': {
          'pending': at,
          'accepted': at,
          'received': at,
          'in_transit': at,
          if (restored) 'arrived': legacy?['arrivedAt'] ?? at,
          if (legacyStatus == 'completed')
            'completed': legacy?['completedAt'] ?? at,
        },
        'price': 80,
      });
    }
    m.data['demoSeeded'] = true;
  }

  Future<void> logout() async {
    await mutate((m) {
      m.data['session'] = null;
    });
    saveTabSession(null);
    email = null;
    demo = false;
    notifyListeners();
  }

  Future<void> resetPassword(
    String value,
    String code,
    String password,
    String confirmation,
  ) async {
    require(
      password.length >= 6 && password == confirmation,
      'Confirme a senha com pelo menos 6 caracteres.',
    );
    final address = cleanEmail(value), current = await repository.load();
    final a = account(current, address);
    require(
      a != null &&
          await passwordHash(code.trim(), a['salt']) == a['recoveryHash'],
      'E-mail ou código de recuperação inválido.',
    );
    final hash = await passwordHash(password, a!['salt']);
    await mutate((m) {
      account(m, address)!['hash'] = hash;
    });
  }

  Future<void> changePassword(String old, String password) async {
    final a = account(market, email!);
    require(
      !demo && a != null && await passwordHash(old, a['salt']) == a['hash'],
      'Senha atual incorreta.',
    );
    require(
      password.length >= 6,
      'A nova senha precisa ter pelo menos 6 caracteres.',
    );
    final hash = await passwordHash(password, a!['salt']);
    await mutate((m) {
      account(m, email!)!['hash'] = hash;
    });
  }

  Future<void> saveProfile(String name, String phone, String city) => mutate((
    m,
  ) {
    require(
      name.trim().length >= 3,
      'Informe um nome com pelo menos 3 caracteres.',
    );
    final p = m.data['profiles'][email] as Json;
    p.addAll({'name': name.trim(), 'phone': phone.trim(), 'city': city.trim()});
    for (final t in m.trips.where((t) => t.ownerId == email)) {
      t.data['name'] = name.trim();
    }
    for (final s in m.shipments.where((s) => s.senderId == email)) {
      s.data['sender'] = name.trim();
    }
    account(m, email!)?['name'] = name.trim();
  });
  Future<void> preferences(bool enabled) => mutate((m) {
    m.data['profiles'][email]['notifications'] = enabled;
  });
  Future<void> verification(String status, String document) => mutate((m) {
    final p = m.data['profiles'][email] as Json;
    final previous = p['verification'] as Map? ?? {};
    final before = previous['status'] ?? 'pending';
    require(
      (['pending', 'rejected'].contains(before) && status == 'review') ||
          (before == 'review' && ['approved', 'rejected'].contains(status)),
      'Etapa de verificação inválida.',
    );
    p['verification'] = {
      ...previous,
      'status': status,
      'documentType': document,
      'submittedAt': status == 'review' ? now() : previous['submittedAt'],
      'updatedAt': now(),
      if (status == 'rejected')
        'reason': 'Reprovação simulada. Confira e envie novamente.',
    };
  });
  Future<String> publish(Json data) async {
    final id = uid('T');
    await mutate((m) {
      validateRoute(
        data['origin'],
        data['destination'],
        data['date'],
        (data['space'] as num).toDouble(),
      );
      require(
        (data['price'] as num).isFinite &&
            data['price'] > 0 &&
            (data['acceptedTypes'] as List).isNotEmpty,
        'Informe preço positivo e categorias aceitas.',
      );
      m.rows('trips').add({
        ...data,
        'id': id,
        'ownerId': email,
        'name': profile['name'],
        'rating': 0,
        'active': true,
      });
    });
    return id;
  }

  Future<void> editTrip(
    String id,
    double space,
    double price,
    String notes,
  ) => mutate((m) {
    final t = m.trip(id);
    require(
      t.ownerId == email && t.active,
      'Você não pode editar esta viagem.',
    );
    require(
      space.isFinite &&
          space >= .1 &&
          space <= 30 &&
          space >= t.space - m.remaining(t) &&
          price.isFinite &&
          price > 0,
      'Capacidade deve comportar as reservas (até 30 kg) e preço deve ser positivo.',
    );
    t.data.addAll({'space': space, 'price': price, 'notes': notes.trim()});
  });
  Future<void> closeTrip(String id) => mutate((m) {
    final t = m.trip(id);
    require(t.ownerId == email, 'Viagem de outra conta.');
    t.data['active'] = false;
  });
  Future<String> request(
    String tripId,
    String type,
    double weight,
    String description,
    double declaredValue, {
    bool sample = false,
  }) async {
    final id = uid('BG');
    await mutate((m) {
      final t = m.trip(tripId);
      require(
        t.active &&
            t.date.compareTo(today()) >= 0 &&
            (sample ? t.ownerId == email : t.ownerId != email),
        'Esta viagem não está disponível.',
      );
      require(
        weight.isFinite &&
            weight >= .1 &&
            weight <= 30 &&
            weight <= m.remaining(t),
        'Peso inválido ou capacidade insuficiente.',
      );
      require(
        t.acceptedTypes.contains(type) &&
            description.trim().isNotEmpty &&
            declaredValue.isFinite &&
            declaredValue >= 0,
        'Confira categoria, descrição e valor declarado.',
      );
      final at = now();
      m.rows('shipments').add({
        'id': id,
        'tripId': tripId,
        'senderId': sample ? 'sample-sender' : email,
        'sender': sample ? 'Ana Costa (exemplo)' : profile['name'],
        'itemType': type,
        'weight': weight,
        'description': description.trim(),
        'declaredValue': declaredValue,
        'status': 'pending',
        'createdAt': at,
        'events': {'pending': at},
        'price': weight * t.price,
      });
    });
    return id;
  }

  bool allowed(Market m, Shipment s, String next) {
    if (!(transitions[s.status] ?? []).contains(next)) return false;
    final t = m.trip(s.tripId),
        sender = s.senderId == email,
        traveler = m.trip(s.tripId).ownerId == email;
    if (next == 'completed') {
      return sender || (traveler && s.senderId == 'sample-sender');
    }
    if (next == 'cancelled') return sender || traveler;
    return traveler || (sender && t.sample);
  }

  Future<void> status(String id, String next) => mutate((m) {
    final s = m.shipment(id);
    require(
      allowed(m, s, next),
      'Esta ação não é permitida nesta etapa ou conta.',
    );
    final at = now();
    s.data['status'] = next;
    s.data['events'][next] = at;
    m.rows('messages').add({
      'id': uid('M'),
      'shipmentId': id,
      'text': 'Status atualizado: ${statusLabels[next]}.',
      'at': at,
      'author': 'system',
    });
  });
  Future<void> message(String id, String text) => mutate((m) {
    require(m.forUser(email!).any((s) => s.id == id), 'Conversa indisponível.');
    require(
      text.trim().isNotEmpty && text.trim().length <= 2000,
      'Use uma mensagem de 1 a 2000 caracteres.',
    );
    m.rows('messages').add({
      'id': uid('M'),
      'shipmentId': id,
      'text': text.trim(),
      'at': now(),
      'author': 'user',
      'authorId': email,
    });
  });
  Future<void> review(String id, int score, Json criteria, String comment) =>
      mutate((m) {
        final s = m.shipment(id);
        require(
          s.senderId == email && s.status == 'completed',
          'Somente o remetente pode avaliar após a conclusão.',
        );
        require(
          !m.rows('reviews').any((r) => r['shipmentId'] == id),
          'Esta encomenda já foi avaliada.',
        );
        require(
          score >= 1 &&
              score <= 5 &&
              criteria.values.every((v) => v is int && v >= 1 && v <= 5),
          'Escolha notas entre 1 e 5.',
        );
        m.rows('reviews').add({
          'shipmentId': id,
          'score': score,
          'criteria': criteria,
          'comment': comment.trim(),
          'at': now(),
        });
      });
  Future<void> markRead() => mutate((m) {
    m.data['readAt'][email] = now();
  });
  bool get unread => myShipments.any(
    (s) => s.events.values.any(
      (v) => (v as String).compareTo(market.data['readAt'][email] ?? '') > 0,
    ),
  );
  Json exportPersonal() {
    final ids = myShipments.map((s) => s.id).toSet();
    return {
      'profile': profile,
      'trips': market
          .rows('trips')
          .where(
            (t) =>
                t['ownerId'] == email ||
                myShipments.any((s) => s.tripId == t['id']),
          )
          .toList(),
      'shipments': myShipments.map((s) => s.data).toList(),
      'reviews': market
          .rows('reviews')
          .where((r) => ids.contains(r['shipmentId']))
          .toList(),
      'messages': market
          .rows('messages')
          .where((m) => ids.contains(m['shipmentId']))
          .toList(),
    };
  }

  Future<void> importBackup(Json backup) => mutate((m) {
    // Accept a complete migration archive or a personal export from React.
    final source = backup['market'] is Map
        ? Map<String, dynamic>.from(backup['market'])
        : backup;
    final probe = m.copy();
    for (final key in ['trips', 'shipments', 'reviews', 'messages']) {
      require(source[key] is List, 'Arquivo inválido: $key ausente.');
      for (final raw in source[key]) {
        require(raw is Map, 'Registro inválido em $key.');
        final row = Map<String, dynamic>.from(raw as Map);
        final identity = key == 'reviews' ? 'shipmentId' : 'id';
        require(row[identity] is String, 'Registro sem identificador.');
        // Existing records win: an old archive never rolls back local progress.
        if (!probe.rows(key).any((r) => r[identity] == row[identity])) {
          probe.rows(key).add(row);
        }
      }
    }
    for (final t in probe.trips) {
      require(
        t.space.isFinite &&
            t.space >= .1 &&
            t.space <= 30 &&
            t.price.isFinite &&
            t.price > 0 &&
            t.origin.isNotEmpty &&
            t.destination.isNotEmpty &&
            DateTime.tryParse(t.date) != null,
        'Viagem inválida no arquivo.',
      );
    }
    for (final s in probe.shipments) {
      require(
        probe.trips.any((t) => t.id == s.tripId) &&
            statusLabels.containsKey(s.status) &&
            s.weight.isFinite &&
            s.weight > 0 &&
            s.price.isFinite &&
            s.senderId.isNotEmpty &&
            s.events[s.status] is String,
        'Encomenda inválida no arquivo.',
      );
    }
    for (final key in ['messages', 'reviews']) {
      for (final r in probe.rows(key)) {
        require(
          probe.shipments.any((s) => s.id == r['shipmentId']),
          'Registro sem encomenda em $key.',
        );
      }
    }
    final profiles = backup['profiles'] as Map? ?? {};
    if (backup['profile'] is Map) {
      final p = backup['profile'] as Map;
      profiles[p['email']] = p;
    }
    for (final entry in profiles.entries) {
      final p = Map<String, dynamic>.from(entry.value as Map);
      require(
        p['email'] == entry.key && p['name'] is String,
        'Perfil inválido.',
      );
      probe.data['profiles'].putIfAbsent(entry.key, () => p);
    }
    for (final raw in (backup['accounts'] as List? ?? [])) {
      final a = Map<String, dynamic>.from(raw as Map);
      require(
        [
          'name',
          'email',
          'salt',
          'hash',
          'recoveryHash',
        ].every((k) => a[k] is String),
        'Conta inválida.',
      );
      if (account(probe, a['email']) == null) probe.rows('accounts').add(a);
    }
    if (backup['legacyDelivery'] is Map) {
      final legacy = Map<String, dynamic>.from(backup['legacyDelivery']);
      require(legacy['status'] is String, 'Progresso legado inválido.');
      for (final key in ['arrivedAt', 'completedAt']) {
        require(
          legacy[key] == null ||
              (legacy[key] is String && DateTime.tryParse(legacy[key]) != null),
          'Data legada inválida.',
        );
      }
      probe.data.putIfAbsent('legacyDelivery', () => legacy);
    }
    probe.validate();
    m.data.addAll(probe.data);
  });
}
