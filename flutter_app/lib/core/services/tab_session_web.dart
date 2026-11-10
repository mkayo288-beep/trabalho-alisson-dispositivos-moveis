import 'dart:convert';
import 'package:web/web.dart' as web;

Map<String, dynamic>? readTabSession() {
  try {
    final raw = web.window.sessionStorage.getItem('leva:flutter:tab-session');
    return raw == null ? null : jsonDecode(raw) as Map<String, dynamic>;
  } catch (_) {
    return null;
  }
}

void saveTabSession(Map<String, dynamic>? session) {
  if (session == null) {
    web.window.sessionStorage.removeItem('leva:flutter:tab-session');
  } else {
    web.window.sessionStorage.setItem(
      'leva:flutter:tab-session',
      jsonEncode(session),
    );
  }
}
