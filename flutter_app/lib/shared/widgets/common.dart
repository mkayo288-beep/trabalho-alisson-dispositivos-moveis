import 'dart:convert';
import 'package:file_selector/file_selector.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../features/market/domain/models.dart';
import '../../features/market/presentation/state/market_controller.dart';

Future<bool> perform(
  BuildContext context,
  Future<void> Function() action, [
  String? success,
]) async {
  try {
    await action();
    if (context.mounted && success != null) {
      ScaffoldMessenger.of(context)
        ..clearSnackBars()
        ..showSnackBar(SnackBar(content: Text(success)));
    }
    return true;
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Bad state: ', '')),
          backgroundColor: Theme.of(context).colorScheme.error,
          duration: const Duration(seconds: 6),
        ),
      );
    }
    return false;
  }
}

Future<bool> confirm(BuildContext context, String title, String text) async =>
    await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(text),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Voltar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    ) ??
    false;
Future<void> exportJson(String name, Object data) async {
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    await const MethodChannel('br.com.levacomigo/export').invokeMethod<void>(
      'saveJson',
      {
        'name': name,
        'content': const JsonEncoder.withIndent('  ').convert(data),
      },
    );
    return;
  }
  final file = XFile.fromData(
    Uint8List.fromList(
      utf8.encode(const JsonEncoder.withIndent('  ').convert(data)),
    ),
    mimeType: 'application/json',
    name: name,
  );
  if (kIsWeb) {
    await file.saveTo(name);
    return;
  }
  final location = await getSaveLocation(
    suggestedName: name,
    acceptedTypeGroups: [
      const XTypeGroup(label: 'JSON', extensions: ['json']),
    ],
  );
  if (location != null) await file.saveTo(location.path);
}

Future<void> importJson(MarketController controller) async {
  final file = await openFile(
    acceptedTypeGroups: [
      const XTypeGroup(
        label: 'JSON',
        extensions: ['json'],
        mimeTypes: ['application/json'],
      ),
    ],
  );
  if (file == null) return;
  require(await file.length() <= 20 * 1024 * 1024, 'O arquivo excede 20 MB.');
  await controller.importBackup(jsonDecode(await file.readAsString()) as Json);
}

void openPage(BuildContext context, Widget page) =>
    Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => page));

class PageBody extends StatelessWidget {
  const PageBody({super.key, required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
    padding: const EdgeInsets.all(24),
    child: Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1080),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: children
              .expand((w) => [w, const SizedBox(height: 18)])
              .toList(),
        ),
      ),
    ),
  );
}

class DetailPage extends StatelessWidget {
  const DetailPage({
    super.key,
    required this.title,
    required this.controller,
    required this.builder,
  });
  final String title;
  final MarketController controller;
  final Widget Function(BuildContext) builder;
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: controller,
    builder: (context, _) => Scaffold(
      appBar: AppBar(
        title: Text(title),
        bottom: controller.busy
            ? const PreferredSize(
                preferredSize: Size.fromHeight(3),
                child: LinearProgressIndicator(),
              )
            : null,
      ),
      body: SafeArea(child: builder(context)),
    ),
  );
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.title, {super.key, this.eyebrow, this.subtitle});
  final String title;
  final String? eyebrow, subtitle;
  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      if (eyebrow != null)
        Text(
          eyebrow!.toUpperCase(),
          style: TextStyle(
            color: Theme.of(context).colorScheme.primary,
            letterSpacing: 2,
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
        ),
      const SizedBox(height: 8),
      Text(title, style: Theme.of(context).textTheme.headlineMedium),
      if (subtitle != null)
        Padding(
          padding: const EdgeInsets.only(top: 10),
          child: Text(subtitle!, style: Theme.of(context).textTheme.bodyLarge),
        ),
    ],
  );
}

class Panel extends StatelessWidget {
  const Panel({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(padding: const EdgeInsets.all(24), child: child),
  );
}

class EmptyState extends StatelessWidget {
  const EmptyState(
    this.text, {
    super.key,
    this.icon = Icons.inventory_2_outlined,
  });
  final String text;
  final IconData icon;
  @override
  Widget build(BuildContext context) => Panel(
    child: Column(
      children: [
        Icon(icon, size: 44, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 16),
        Text(
          text,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleMedium,
        ),
      ],
    ),
  );
}

class StatusChip extends StatelessWidget {
  const StatusChip(this.status, {super.key});
  final String status;
  @override
  Widget build(BuildContext context) => Chip(
    avatar: Icon(
      terminal(status) ? Icons.check_circle_outline : Icons.schedule,
      size: 16,
    ),
    label: Text(statusLabels[status] ?? status),
    backgroundColor: status == 'completed' ? const Color(0xFFE2F2D8) : null,
    side: BorderSide.none,
  );
}

class RouteSummary extends StatelessWidget {
  const RouteSummary(this.trip, {super.key});
  final Trip trip;
  @override
  Widget build(BuildContext context) => Panel(
    child: Wrap(
      alignment: WrapAlignment.spaceBetween,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 20,
      runSpacing: 12,
      children: [
        Text(city(trip.origin), style: Theme.of(context).textTheme.titleLarge),
        const Icon(Icons.flight_takeoff),
        Text(
          city(trip.destination),
          style: Theme.of(context).textTheme.titleLarge,
        ),
        Text(dateLabel(trip.date)),
      ],
    ),
  );
}

class Fields extends StatefulWidget {
  const Fields({
    super.key,
    required this.initial,
    required this.labels,
    required this.onSave,
    this.passwords = const [],
    this.numbers = const [],
    this.optional = const [],
    this.multiline = const [],
    this.choices = const {},
    this.footer,
    this.submit = 'Salvar',
    this.enabled = true,
  });
  final Map<String, String> initial, labels;
  final Map<String, List<String>> choices;
  final List<String> passwords, numbers, optional, multiline;
  final Future<void> Function(Map<String, String>) onSave;
  final Widget? footer;
  final String submit;
  final bool enabled;
  @override
  State<Fields> createState() => _FieldsState();
}

class _FieldsState extends State<Fields> {
  final form = GlobalKey<FormState>();
  late final Map<String, TextEditingController> inputs = widget.initial.map(
    (k, v) => MapEntry(k, TextEditingController(text: v)),
  );
  bool saving = false;
  @override
  void dispose() {
    for (final c in inputs.values) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Form(
    key: form,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.labels.containsKey('origin') &&
            widget.labels.containsKey('destination'))
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: saving
                  ? null
                  : () {
                      final origin = inputs['origin']!.text;
                      inputs['origin']!.text = inputs['destination']!.text;
                      inputs['destination']!.text = origin;
                    },
              icon: const Icon(Icons.swap_vert),
              label: const Text('Inverter origem e destino'),
            ),
          ),
        for (final entry in widget.labels.entries)
          Padding(
            padding: const EdgeInsets.only(bottom: 18),
            child: widget.choices.containsKey(entry.key)
                ? DropdownButtonFormField<String>(
                    initialValue: inputs[entry.key]!.text,
                    decoration: InputDecoration(labelText: entry.value),
                    isExpanded: true,
                    items: widget.choices[entry.key]!
                        .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                        .toList(),
                    onChanged: (v) => inputs[entry.key]!.text = v!,
                  )
                : TextFormField(
                    controller: inputs[entry.key],
                    decoration: InputDecoration(
                      labelText: entry.value,
                      suffixIcon: entry.key == 'date'
                          ? IconButton(
                              tooltip: 'Escolher data',
                              icon: const Icon(Icons.calendar_today_outlined),
                              onPressed: () async {
                                final parsed = DateTime.tryParse(
                                      inputs[entry.key]!.text,
                                    ),
                                    first = DateTime.parse(today());
                                final chosen = await showDatePicker(
                                  context: context,
                                  initialDate:
                                      parsed != null && !parsed.isBefore(first)
                                      ? parsed
                                      : first,
                                  firstDate: first,
                                  lastDate: DateTime(first.year + 10),
                                );
                                if (chosen != null) {
                                  inputs[entry.key]!.text = chosen
                                      .toIso8601String()
                                      .substring(0, 10);
                                }
                              },
                            )
                          : [
                              'origin',
                              'destination',
                              'city',
                            ].contains(entry.key)
                          ? PopupMenuButton<String>(
                              tooltip: 'Sugestões de cidades',
                              icon: const Icon(Icons.location_on_outlined),
                              onSelected: (value) =>
                                  inputs[entry.key]!.text = value,
                              itemBuilder: (_) => cities
                                  .map(
                                    (value) => PopupMenuItem(
                                      value: value,
                                      child: Text(value),
                                    ),
                                  )
                                  .toList(),
                            )
                          : null,
                    ),
                    obscureText: widget.passwords.contains(entry.key),
                    keyboardType: widget.numbers.contains(entry.key)
                        ? const TextInputType.numberWithOptions(decimal: true)
                        : entry.key == 'email'
                        ? TextInputType.emailAddress
                        : TextInputType.text,
                    maxLines: widget.multiline.contains(entry.key) ? 3 : 1,
                    validator: (v) =>
                        !widget.optional.contains(entry.key) &&
                            (v ?? '').trim().isEmpty
                        ? 'Preencha este campo.'
                        : null,
                  ),
          ),
        if (widget.footer != null) widget.footer!,
        const SizedBox(height: 12),
        FilledButton(
          onPressed: saving || !widget.enabled
              ? null
              : () async {
                  if (!form.currentState!.validate()) return;
                  setState(() => saving = true);
                  await perform(
                    context,
                    () => widget.onSave(
                      inputs.map((k, v) => MapEntry(k, v.text)),
                    ),
                  );
                  if (mounted) setState(() => saving = false);
                },
          child: saving
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(widget.submit),
        ),
      ],
    ),
  );
}
