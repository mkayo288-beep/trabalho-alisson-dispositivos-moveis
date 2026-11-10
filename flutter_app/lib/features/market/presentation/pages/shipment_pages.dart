import 'package:flutter/material.dart';
import '../../../../app/theme/app_theme.dart';
import '../../../../shared/widgets/common.dart';
import '../../domain/models.dart';
import '../state/market_controller.dart';

class ShipmentTile extends StatelessWidget {
  const ShipmentTile({
    super.key,
    required this.controller,
    required this.shipment,
  });
  final MarketController controller;
  final Shipment shipment;
  @override
  Widget build(BuildContext context) {
    final t = controller.market.trip(shipment.tripId);
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () => openPage(
          context,
          ShipmentPage(controller: controller, id: shipment.id),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '#${shipment.id} · ${shipment.itemType}',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: muted,
                  letterSpacing: .3,
                ),
              ),
              const SizedBox(height: 14),
              Text(
                '${city(t.origin)} → ${city(t.destination)}',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              const Divider(height: 20),
              Wrap(
                spacing: 12,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  StatusChip(shipment.status),
                  Text(
                    '${shipment.weight} kg · ${money(shipment.price)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                  Text(
                    shipment.senderId == controller.email
                        ? 'Viajante: ${t.name}'
                        : 'Remetente: ${shipment.sender}',
                    style: const TextStyle(fontSize: 12, color: muted),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ShipmentPage extends StatelessWidget {
  const ShipmentPage({super.key, required this.controller, required this.id});
  final MarketController controller;
  final String id;
  @override
  Widget build(BuildContext context) => DetailPage(
    title: 'Acompanhar encomenda',
    controller: controller,
    builder: (context) {
      final s = controller.market.shipment(id),
          t = controller.market.trip(controller.market.shipment(id).tripId);
      final sender = s.senderId == controller.email;
      final sample =
          (t.sample && sender) ||
          (s.senderId == 'sample-sender' && t.ownerId == controller.email);
      const actions = {
        'accepted': 'Aceitar solicitação',
        'received': 'Confirmar coleta da mercadoria',
        'in_transit': 'Iniciar viagem',
        'arrived': 'Marcar chegada ao destino',
        'completed': 'Confirmar recebimento',
      };
      return PageBody(
        children: [
          SectionTitle(
            '#${s.id}',
            eyebrow: 'Sua encomenda',
            subtitle: s.status == 'completed'
                ? 'Viagem concluída'
                : statusLabels[s.status],
          ),
          StatusChip(s.status),
          RouteSummary(t),
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Cada etapa, mais perto.',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 20),
                for (final entry in statusLabels.entries.where(
                  (e) => !['refused', 'cancelled'].contains(e.key),
                ))
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(
                      s.events.containsKey(entry.key)
                          ? Icons.check_circle
                          : Icons.radio_button_unchecked,
                      color: s.events.containsKey(entry.key)
                          ? Theme.of(context).colorScheme.primary
                          : Colors.grey,
                    ),
                    title: Text(entry.value),
                    subtitle: Text(
                      s.events.containsKey(entry.key)
                          ? '${dateLabel(s.events[entry.key])} · ${DateTime.parse(s.events[entry.key]).toLocal().toString().substring(11, 16)}'
                          : 'Aguardando',
                    ),
                  ),
              ],
            ),
          ),
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Detalhes do transporte',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 14),
                Text(
                  '${s.data['description']}\n\n${s.weight} kg · ${s.itemType}\nValor declarado: ${money(s.data['declaredValue'])}\nTotal combinado: ${money(s.price)}\nViajante: ${t.name}\nRemetente: ${s.sender}',
                ),
              ],
            ),
          ),
          if (sample)
            const Text(
              'Demonstração: as ações identificadas como “Simular” representam o outro participante.',
            ),
          for (final next in (transitions[s.status] ?? <String>[]))
            if (controller.allowed(controller.market, s, next))
              FilledButton(
                onPressed: controller.busy
                    ? null
                    : () async {
                        if (next == 'completed') {
                          openPage(
                            context,
                            DeliveryPage(controller: controller, id: id),
                          );
                          return;
                        }
                        if (['refused', 'cancelled'].contains(next) &&
                            !await confirm(
                              context,
                              statusLabels[next]!,
                              'Esta ação libera o espaço reservado e não pode ser desfeita.',
                            )) {
                          return;
                        }
                        if (context.mounted) {
                          await perform(
                            context,
                            () => controller.status(id, next),
                            'Encomenda: ${statusLabels[next]}.',
                          );
                        }
                      },
                child: Text(
                  '${sample && (next != 'completed' || !sender) ? 'Simular: ' : ''}${next == 'refused'
                      ? 'Recusar solicitação'
                      : next == 'cancelled'
                      ? 'Cancelar solicitação'
                      : actions[next]}',
                ),
              ),
          if (s.status == 'arrived' && !sender && !sample)
            const Text('Aguardando a confirmação do remetente.'),
          if (s.status == 'completed' && sender)
            OutlinedButton.icon(
              onPressed: () =>
                  openPage(context, ReviewPage(controller: controller, id: id)),
              icon: const Icon(Icons.star_outline),
              label: Text(
                controller.market
                        .rows('reviews')
                        .any((r) => r['shipmentId'] == id)
                    ? 'Ver avaliação'
                    : 'Avaliar transporte',
              ),
            ),
          OutlinedButton.icon(
            onPressed: () =>
                openPage(context, ChatPage(controller: controller, id: id)),
            icon: const Icon(Icons.chat_bubble_outline),
            label: const Text('Conversar / pedir ajuda'),
          ),
        ],
      );
    },
  );
}

class DeliveryPage extends StatefulWidget {
  const DeliveryPage({super.key, required this.controller, required this.id});
  final MarketController controller;
  final String id;
  @override
  State<DeliveryPage> createState() => _DeliveryPageState();
}

class _DeliveryPageState extends State<DeliveryPage> {
  bool confirmed = false;
  @override
  Widget build(BuildContext context) => DetailPage(
    title: 'Confirmar recebimento',
    controller: widget.controller,
    builder: (context) {
      final s = widget.controller.market.shipment(widget.id);
      return PageBody(
        children: [
          const Icon(Icons.inventory_2_outlined, size: 64),
          const SectionTitle(
            'Sua encomenda chegou.',
            subtitle:
                'Confirme apenas depois de receber e conferir a mercadoria.',
          ),
          if (s.senderId == 'sample-sender')
            const Text('Simulação da confirmação do remetente de exemplo.'),
          CheckboxListTile(
            value: confirmed,
            onChanged: (v) => setState(() => confirmed = v!),
            title: const Text('Recebi e conferi minha encomenda.'),
          ),
          FilledButton(
            onPressed: !confirmed || widget.controller.busy
                ? null
                : () async {
                    final saved = await perform(
                      context,
                      () => widget.controller.status(widget.id, 'completed'),
                    );
                    if (context.mounted && saved) Navigator.pop(context);
                  },
            child: const Text('Confirmar recebimento'),
          ),
        ],
      );
    },
  );
}

class ReviewPage extends StatefulWidget {
  const ReviewPage({super.key, required this.controller, required this.id});
  final MarketController controller;
  final String id;
  @override
  State<ReviewPage> createState() => _ReviewPageState();
}

class _ReviewPageState extends State<ReviewPage> {
  int score = 0;
  Json criteria = {};
  Widget stars(
    String label,
    int value,
    void Function(int) onChanged,
    bool enabled,
  ) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label),
      Wrap(
        children: [
          for (var n = 1; n <= 5; n++)
            IconButton(
              tooltip: '$label: $n estrelas',
              onPressed: enabled ? () => setState(() => onChanged(n)) : null,
              icon: Icon(
                n <= value ? Icons.star : Icons.star_outline,
                color: const Color(0xFF8A6412),
              ),
            ),
        ],
      ),
    ],
  );
  @override
  Widget build(BuildContext context) => DetailPage(
    title: 'Avaliar transporte',
    controller: widget.controller,
    builder: (context) {
      final reviews = widget.controller.market
              .rows('reviews')
              .where((r) => r['shipmentId'] == widget.id),
          previous = reviews.isEmpty ? null : reviews.first;
      return PageBody(
        children: [
          const SectionTitle(
            'Como foi sua experiência?',
            subtitle: 'Sua avaliação ajuda os próximos remetentes.',
          ),
          stars(
            'Nota geral',
            previous?['score'] ?? score,
            (n) => score = n,
            previous == null,
          ),
          for (final label in [
            'Comunicação',
            'Cuidado com a encomenda',
            'Pontualidade',
            'Confiabilidade',
          ])
            stars(
              label,
              previous?['criteria'][label] ?? criteria[label] ?? 0,
              (n) => criteria[label] = n,
              previous == null,
            ),
          if (previous != null)
            Panel(
              child: Text(
                previous['comment'].isEmpty
                    ? 'Sem comentário.'
                    : previous['comment'],
              ),
            )
          else
            Fields(
              initial: const {'comment': ''},
              labels: const {'comment': 'Comentário (opcional)'},
              optional: const ['comment'],
              multiline: const ['comment'],
              enabled: score > 0 && !widget.controller.busy,
              submit: 'Enviar avaliação',
              onSave: (v) async {
                await widget.controller.review(
                  widget.id,
                  score,
                  criteria,
                  v['comment']!,
                );
                if (context.mounted) Navigator.pop(context);
              },
            ),
        ],
      );
    },
  );
}

class ChatPage extends StatefulWidget {
  const ChatPage({super.key, required this.controller, required this.id});
  final MarketController controller;
  final String id;
  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final draft = TextEditingController();
  final scroll = ScrollController();
  @override
  void dispose() {
    draft.dispose();
    scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => DetailPage(
    title: 'Conversa · #${widget.id}',
    controller: widget.controller,
    builder: (context) {
      final messages = widget.controller.market
          .rows('messages')
          .where((m) => m['shipmentId'] == widget.id)
          .toList();
      return Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Conversa entre contas deste dispositivo. Combine retirada e entrega por aqui.',
            ),
          ),
          Expanded(
            child: ListView.builder(
              controller: scroll,
              padding: const EdgeInsets.all(20),
              itemCount: messages.length,
              itemBuilder: (context, i) {
                final m = messages[i],
                    system = m['author'] == 'system',
                    own = m['authorId'] == widget.controller.email;
                return Align(
                  alignment: system
                      ? Alignment.center
                      : own
                      ? Alignment.centerRight
                      : Alignment.centerLeft,
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 560),
                    padding: const EdgeInsets.all(16),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: system
                          ? Colors.transparent
                          : own
                          ? const Color(0xFFE1F4C6)
                          : Colors.white,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(m['text']),
                        const SizedBox(height: 6),
                        Text(
                          '${system
                              ? 'Evento'
                              : own
                              ? 'Você'
                              : 'Contato'} · ${dateLabel(m['at'])}',
                          style: Theme.of(context).textTheme.labelSmall,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: TextField(
                    controller: draft,
                    decoration: const InputDecoration(labelText: 'Mensagem'),
                    maxLength: 2000,
                    minLines: 1,
                    maxLines: 4,
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  tooltip: 'Salvar mensagem',
                  onPressed: widget.controller.busy || draft.text.trim().isEmpty
                      ? null
                      : () async {
                          final saved = await perform(
                            context,
                            () => widget.controller.message(
                              widget.id,
                              draft.text,
                            ),
                          );
                          if (saved && mounted) {
                            draft.clear();
                            setState(() {});
                            WidgetsBinding.instance.addPostFrameCallback((_) {
                              if (scroll.hasClients) {
                                scroll.animateTo(
                                  scroll.position.maxScrollExtent,
                                  duration: const Duration(milliseconds: 250),
                                  curve: Curves.easeOut,
                                );
                              }
                            });
                          }
                        },
                  icon: const Icon(Icons.send_outlined),
                ),
              ],
            ),
          ),
        ],
      );
    },
  );
}
