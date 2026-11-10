import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../features/market/domain/models.dart';

abstract class Repository {
  Future<Market> load();
  Future<void> save(Market market);
}

class LocalRepository implements Repository {
  LocalRepository(this.preferences);
  final SharedPreferences preferences;
  static const key = 'leva:flutter:v1';
  @override
  Future<Market> load() async {
    await preferences.reload();
    final raw = preferences.getString(key);
    if (raw == null) return Market.empty();
    final market = Market(jsonDecode(raw) as Json);
    require(
      market.data['profiles'] is Map && market.data['readAt'] is Map,
      'Armazenamento de perfis inválido. Seus dados foram mantidos.',
    );
    for (final field in [
      'accounts',
      'trips',
      'shipments',
      'reviews',
      'messages',
    ]) {
      require(
        market.data[field] is List,
        'Armazenamento inválido: $field. Exporte os dados antes de recuperar.',
      );
    }
    market.validate();
    return market;
  }

  @override
  Future<void> save(Market market) async {
    final saved = await preferences.setString(key, jsonEncode(market.data));
    require(
      saved,
      'Não foi possível salvar. Verifique o espaço disponível e tente novamente.',
    );
  }
}
