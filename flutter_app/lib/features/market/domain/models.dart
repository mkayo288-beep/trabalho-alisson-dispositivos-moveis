import 'dart:convert';

typedef Json = Map<String, dynamic>;

const itemTypes = [
  'Eletrônico',
  'Documentos',
  'Roupas e acessórios',
  'Livros',
  'Presentes',
  'Outros',
];
const cities = [
  'Recife, Brasil',
  'Lisboa, Portugal',
  'São Paulo, Brasil',
  'Porto, Portugal',
  'Rio de Janeiro, Brasil',
  'Brasília, Brasil',
  'Salvador, Brasil',
  'Fortaleza, Brasil',
  'Belo Horizonte, Brasil',
  'Curitiba, Brasil',
  'Madrid, Espanha',
  'Paris, França',
  'Londres, Reino Unido',
];
const statusLabels = {
  'pending': 'Aguardando aceite',
  'accepted': 'Solicitação aceita',
  'received': 'Mercadoria recebida',
  'in_transit': 'Em viagem',
  'arrived': 'Aguardando recebimento',
  'completed': 'Concluída',
  'refused': 'Recusada',
  'cancelled': 'Cancelada',
};
const transitions = {
  'pending': ['accepted', 'refused', 'cancelled'],
  'accepted': ['received', 'cancelled'],
  'received': ['in_transit'],
  'in_transit': ['arrived'],
  'arrived': ['completed'],
};
bool terminal(String status) =>
    ['completed', 'refused', 'cancelled'].contains(status);
String today() => DateTime.now().toIso8601String().substring(0, 10);
String now() => DateTime.now().toUtc().toIso8601String();
String city(String value) => value.split(',').first;
String normalize(String value) {
  var result = city(value).trim().toLowerCase();
  const accents = 'áàâãäéèêëíìîïóòôõöúùûüç';
  const plain = 'aaaaaeeeeiiiiooooouuuuc';
  for (var i = 0; i < accents.length; i++) {
    result = result.replaceAll(accents[i], plain[i]);
  }
  return result;
}

String money(num value) =>
    'R\$ ${value.toStringAsFixed(2).replaceAll('.', ',')}';
String dateLabel(String value) {
  final date = DateTime.tryParse(value)?.toLocal();
  if (date == null) return 'Aguardando';
  return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
}

double number(String value) =>
    double.tryParse(value.replaceAll(',', '.')) ?? double.nan;
void require(bool condition, String message) {
  if (!condition) throw StateError(message);
}

void validateRoute(
  String origin,
  String destination,
  String date,
  double weight,
) {
  require(
    origin.trim().isNotEmpty && destination.trim().isNotEmpty,
    'Informe origem e destino.',
  );
  require(
    normalize(origin) != normalize(destination),
    'Escolha um destino diferente da origem.',
  );
  final parsed = DateTime.tryParse(date);
  require(
    parsed != null &&
        parsed.toIso8601String().substring(0, 10) == date &&
        date.compareTo(today()) >= 0,
    'Escolha uma data válida de hoje em diante.',
  );
  require(
    weight.isFinite && weight >= .1 && weight <= 30,
    'Informe um peso entre 0,1 e 30 kg.',
  );
}

class Trip {
  Trip(this.data);
  final Json data;
  String get id => data['id'];
  String get ownerId => data['ownerId'];
  String get name => data['name'];
  String get origin => data['origin'];
  String get destination => data['destination'];
  String get date => data['date'];
  double get space => (data['space'] as num).toDouble();
  double get price => (data['price'] as num).toDouble();
  double get rating => (data['rating'] as num? ?? 0).toDouble();
  String get notes => data['notes'] ?? '';
  bool get active => data['active'] == true;
  List<String> get acceptedTypes =>
      List<String>.from(data['acceptedTypes'] ?? itemTypes);
  bool get sample => ownerId.startsWith('sample');
}

class Shipment {
  Shipment(this.data);
  final Json data;
  String get id => data['id'];
  String get tripId => data['tripId'];
  String get senderId => data['senderId'];
  String get sender => data['sender'];
  String get status => data['status'];
  String get itemType => data['itemType'];
  double get weight => (data['weight'] as num).toDouble();
  double get price => (data['price'] as num).toDouble();
  Json get events => Map<String, dynamic>.from(data['events']);
}

class Market {
  Market(this.data);
  final Json data;
  factory Market.empty() => Market({
    'accounts': <Json>[],
    'profiles': <String, dynamic>{},
    'trips': <Json>[],
    'shipments': <Json>[],
    'reviews': <Json>[],
    'messages': <Json>[],
    'readAt': <String, dynamic>{},
  });
  Market copy() => Market(jsonDecode(jsonEncode(data)) as Json);
  void validate() {
    require(
      data['profiles'] is Map && data['readAt'] is Map,
      'Estrutura de perfis inválida.',
    );
    bool text(Json row, String key) => row[key] is String;
    bool finite(Json row, String key) =>
        row[key] is num && (row[key] as num).isFinite;
    for (final key in [
      'accounts',
      'trips',
      'shipments',
      'reviews',
      'messages',
    ]) {
      require(
        data[key] is List &&
            (data[key] as List).every((row) => row is Map<String, dynamic>),
        'Estrutura inválida: $key.',
      );
      final identity = key == 'accounts'
          ? 'email'
          : key == 'reviews'
          ? 'shipmentId'
          : 'id';
      final ids = rows(key).map((r) => r[identity]).toList();
      require(
        ids.every((id) => id is String && id.isNotEmpty) &&
            ids.toSet().length == ids.length,
        'Identificadores inválidos ou repetidos em $key.',
      );
    }
    for (final a in rows('accounts')) {
      require(
        [
              'name',
              'email',
              'salt',
              'hash',
              'recoveryHash',
            ].every((key) => text(a, key)) &&
            RegExp(r'^[a-fA-F0-9]{64}$').hasMatch(a['hash']) &&
            RegExp(r'^[a-fA-F0-9]{64}$').hasMatch(a['recoveryHash']),
        'Credenciais inválidas no arquivo.',
      );
    }
    for (final entry in (data['profiles'] as Map).entries) {
      require(entry.value is Map<String, dynamic>, 'Perfil inválido.');
      final p = entry.value as Json;
      require(
        p['email'] == entry.key &&
            ['name', 'email', 'phone', 'city'].every((key) => text(p, key)) &&
            p['notifications'] is bool,
        'Campos do perfil inválidos.',
      );
    }
    for (final row in rows('trips')) {
      require(
        [
              'id',
              'ownerId',
              'name',
              'origin',
              'destination',
              'date',
              'notes',
            ].every((key) => text(row, key)) &&
            row['name'].isNotEmpty &&
            row['ownerId'].isNotEmpty &&
            row['active'] is bool &&
            finite(row, 'space') &&
            row['space'] >= .1 &&
            row['space'] <= 30 &&
            finite(row, 'price') &&
            row['price'] > 0 &&
            finite(row, 'rating') &&
            DateTime.tryParse(row['date']) != null,
        'Campos da viagem inválidos.',
      );
      require(
        row['acceptedTypes'] == null ||
            (row['acceptedTypes'] is List &&
                (row['acceptedTypes'] as List).isNotEmpty &&
                (row['acceptedTypes'] as List).every(itemTypes.contains)),
        'Categorias da viagem inválidas.',
      );
    }
    for (final row in rows('shipments')) {
      require(
        [
              'id',
              'tripId',
              'senderId',
              'sender',
              'itemType',
              'description',
              'createdAt',
              'status',
            ].every((key) => text(row, key)) &&
            finite(row, 'weight') &&
            row['weight'] >= .1 &&
            row['weight'] <= 30 &&
            finite(row, 'price') &&
            row['price'] >= 0 &&
            finite(row, 'declaredValue') &&
            row['declaredValue'] >= 0 &&
            statusLabels.containsKey(row['status']) &&
            row['events'] is Map &&
            row['events'][row['status']] is String &&
            (row['events'] as Map).values.every(
              (at) => at is String && DateTime.tryParse(at) != null,
            ) &&
            trips.any((t) => t.id == row['tripId']),
        'Campos da encomenda inválidos.',
      );
    }
    for (final row in rows('reviews')) {
      require(
        row['score'] is int &&
            row['score'] >= 1 &&
            row['score'] <= 5 &&
            row['criteria'] is Map &&
            (row['criteria'] as Map).values.every(
              (v) => v is int && v >= 1 && v <= 5,
            ) &&
            text(row, 'comment') &&
            text(row, 'at') &&
            shipments.any((s) => s.id == row['shipmentId']),
        'Avaliação inválida.',
      );
    }
    for (final row in rows('messages')) {
      require(
        text(row, 'text') &&
            text(row, 'at') &&
            ['user', 'system'].contains(row['author']) &&
            (row['authorId'] == null || text(row, 'authorId')) &&
            shipments.any((s) => s.id == row['shipmentId']),
        'Mensagem inválida.',
      );
    }
  }

  List<Json> rows(String key) => (data[key] as List).cast<Json>();
  List<Trip> get trips => rows('trips').map(Trip.new).toList();
  List<Shipment> get shipments => rows('shipments').map(Shipment.new).toList();
  Trip trip(String id) => trips.firstWhere((t) => t.id == id);
  Shipment shipment(String id) => shipments.firstWhere((s) => s.id == id);
  double remaining(Trip trip) {
    final used = shipments
        .where(
          (s) =>
              s.tripId == trip.id &&
              !['cancelled', 'refused'].contains(s.status),
        )
        .fold(0.0, (sum, s) => sum + s.weight);
    return ((trip.space - used).clamp(0, 30) * 1000).round() / 1000;
  }

  List<Shipment> forUser(String email) => shipments
      .where((s) => s.senderId == email || trip(s.tripId).ownerId == email)
      .toList();
  List<Json> receivedReviews(String email) => rows('reviews').where((r) {
    final s = shipment(r['shipmentId']);
    return s.status == 'completed' &&
        s.senderId != email &&
        trip(s.tripId).ownerId == email;
  }).toList();
  double rating(Trip trip) {
    final reviews = receivedReviews(trip.ownerId);
    return reviews.isEmpty
        ? trip.rating
        : reviews.fold<double>(0, (sum, r) => sum + (r['score'] as num)) /
              reviews.length;
  }

  String tripState(Trip trip) {
    final related = shipments.where((s) => s.tripId == trip.id);
    if (related.any((s) => s.status == 'completed') &&
        related.every((s) => terminal(s.status))) {
      return 'Concluída';
    }
    if (related.any(
      (s) => ['received', 'in_transit', 'arrived'].contains(s.status),
    )) {
      return 'Em andamento';
    }
    return trip.active ? 'Publicada' : 'Encerrada';
  }

  void reconcile() {
    for (final t in trips) {
      if (tripState(t) == 'Concluída') {
        t.data['active'] = false;
        final dates =
            shipments
                .where((s) => s.tripId == t.id && s.status == 'completed')
                .map(
                  (s) =>
                      (s.events['completed'] ?? s.data['createdAt']) as String,
                )
                .toList()
              ..sort();
        t.data['completedAt'] ??= dates.last;
      }
    }
  }

  List<Trip> search(
    String origin,
    String destination,
    String date,
    double weight,
    String type,
  ) => trips
      .where(
        (t) =>
            t.active &&
            t.date.compareTo(today()) >= 0 &&
            normalize(t.origin) == normalize(origin) &&
            normalize(t.destination) == normalize(destination) &&
            t.date == date &&
            t.acceptedTypes.contains(type) &&
            remaining(t) >= weight,
      )
      .toList();
}
