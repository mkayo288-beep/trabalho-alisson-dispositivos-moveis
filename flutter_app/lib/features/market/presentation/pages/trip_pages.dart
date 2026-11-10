import 'package:flutter/material.dart';
import '../../../../shared/widgets/common.dart';
import '../../domain/models.dart';
import '../state/market_controller.dart';
import 'shipment_pages.dart';

class SearchPage extends StatelessWidget {
  const SearchPage({super.key, required this.controller});
  final MarketController controller;
  @override
  Widget build(BuildContext context) => PageBody(
    children: [
      const SectionTitle(
        'Uma viagem. Muitas possibilidades.',
        eyebrow: 'Enviar encomenda',
        subtitle: 'Encontre espaço para o que precisa chegar mais longe.',
      ),
      Panel(
        child: Fields(
          initial: {
            'origin': cities[0],
            'destination': cities[1],
            'date': controller.market.trips.isNotEmpty
                ? controller.market.trips.first.date
                : today(),
            'weight': '2',
            'itemType': itemTypes.first,
          },
          labels: const {
            'origin': 'De onde?',
            'destination': 'Para onde?',
            'date': 'Data da viagem',
            'weight': 'Peso aproximado (kg)',
            'itemType': 'Tipo de mercadoria',
          },
          choices: const {'itemType': itemTypes},
          numbers: const ['weight'],
          submit: 'Buscar viagens',
          onSave: (v) async {
            validateRoute(
              v['origin']!,
              v['destination']!,
              v['date']!,
              number(v['weight']!),
            );
            await controller.refresh();
            if (context.mounted) {
              openPage(context, ResultsPage(controller: controller, search: v));
            }
          },
        ),
      ),
      const Panel(
        child: Text(
          'Confira o conteúdo, as regras do destino e os documentos necessários antes de combinar o transporte. Não são aceitas mercadorias proibidas.',
        ),
      ),
    ],
  );
}

class ResultsPage extends StatefulWidget {
  const ResultsPage({
    super.key,
    required this.controller,
    required this.search,
  });
  final MarketController controller;
  final Map<String, String> search;
  @override
  State<ResultsPage> createState() => _ResultsPageState();
}

class _ResultsPageState extends State<ResultsPage> {
  String sort = 'rating';
  @override
  Widget build(BuildContext context) => DetailPage(
    title: 'Viagens disponíveis',
    controller: widget.controller,
    builder: (context) {
      final m = widget.controller.market, s = widget.search;
      final results = m.search(
        s['origin']!,
        s['destination']!,
        s['date']!,
        number(s['weight']!),
        s['itemType']!,
      );
      results.sort(
        (a, b) => sort == 'price'
            ? a.price.compareTo(b.price)
            : sort == 'space'
            ? m.remaining(b).compareTo(m.remaining(a))
            : m.rating(b).compareTo(m.rating(a)),
      );
      return PageBody(
        children: [
          SectionTitle(
            '${city(s['origin']!)} → ${city(s['destination']!)}',
            eyebrow: '${results.length} viagem(ns)',
            subtitle:
                '${dateLabel(s['date']!)} · ${s['weight']} kg · ${s['itemType']}',
          ),
          Wrap(
            spacing: 8,
            children: [
              for (final e in {
                'rating': 'Melhor avaliação',
                'price': 'Menor preço',
                'space': 'Mais espaço',
              }.entries)
                ChoiceChip(
                  label: Text(e.value),
                  selected: sort == e.key,
                  onSelected: (_) => setState(() => sort = e.key),
                ),
            ],
          ),
          if (results.isEmpty)
            const EmptyState(
              'Nenhuma viagem compatível. Volte e ajuste os filtros.',
            ),
          for (final t in results)
            TripCard(
              controller: widget.controller,
              trip: t,
              onTap: () => openPage(
                context,
                TripPage(
                  controller: widget.controller,
                  id: t.id,
                  weight: s['weight']!,
                  type: s['itemType']!,
                ),
              ),
            ),
        ],
      );
    },
  );
}

class TripCard extends StatelessWidget {
  const TripCard({
    super.key,
    required this.controller,
    required this.trip,
    required this.onTap,
  });
  final MarketController controller;
  final Trip trip;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      borderRadius: BorderRadius.circular(24),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(child: Text(trip.name.substring(0, 1))),
              title: Text(trip.name),
              subtitle: Text(
                trip.sample
                    ? 'Viagem de exemplo'
                    : 'Viagem publicada neste dispositivo',
              ),
              trailing: Text(
                '★ ${controller.market.rating(trip).toStringAsFixed(1)}',
              ),
            ),
            const Divider(height: 30),
            Text(
              '${city(trip.origin)} → ${city(trip.destination)}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 20,
              runSpacing: 10,
              children: [
                Text(dateLabel(trip.date)),
                Text('${controller.market.remaining(trip)} kg disponíveis'),
                Text(
                  '${money(trip.price)}/kg',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: onTap,
              icon: const Icon(Icons.arrow_forward),
              label: const Text('Ver viagem'),
            ),
          ],
        ),
      ),
    ),
  );
}

class TripPage extends StatelessWidget {
  const TripPage({
    super.key,
    required this.controller,
    required this.id,
    this.weight = '1',
    this.type = 'Documentos',
  });
  final MarketController controller;
  final String id, weight, type;
  @override
  Widget build(BuildContext context) => DetailPage(
    title: 'Detalhes da viagem',
    controller: controller,
    builder: (context) {
      final t = controller.market.trip(id),
          reviews = controller.market.receivedReviews(
            controller.market.trip(id).ownerId,
          );
      return PageBody(
        children: [
          SectionTitle(
            t.name,
            eyebrow: t.sample ? 'Viajante de exemplo' : 'Viajante',
            subtitle:
                '★ ${controller.market.rating(t).toStringAsFixed(1)} · ${controller.market.remaining(t)} kg disponíveis',
          ),
          RouteSummary(t),
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Sobre o transporte',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                Text(
                  t.notes.isEmpty
                      ? 'Combine retirada e entrega pela conversa.'
                      : t.notes,
                ),
                const SizedBox(height: 12),
                Text('Mercadorias aceitas: ${t.acceptedTypes.join(', ')}'),
                const SizedBox(height: 20),
                Text(
                  '${money(t.price)} por kg',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ],
            ),
          ),
          FilledButton(
            onPressed:
                controller.busy ||
                    !t.active ||
                    t.ownerId == controller.email ||
                    t.date.compareTo(today()) < 0 ||
                    controller.market.remaining(t) <= 0
                ? null
                : () => openPage(
                    context,
                    RequestPage(
                      controller: controller,
                      tripId: id,
                      weight: weight,
                      type: t.acceptedTypes.contains(type)
                          ? type
                          : t.acceptedTypes.first,
                    ),
                  ),
            child: Text(
              t.ownerId == controller.email
                  ? 'Sua viagem'
                  : 'Solicitar transporte',
            ),
          ),
          const SectionTitle('Avaliações do viajante'),
          if (reviews.isEmpty)
            const EmptyState('Nenhuma avaliação registrada.'),
          for (final r in reviews)
            Panel(
              child: Text(
                '★ ${r['score']}/5 · ${controller.market.shipment(r['shipmentId']).sender}\n${r['comment']}',
              ),
            ),
        ],
      );
    },
  );
}

class RequestPage extends StatefulWidget {
  const RequestPage({
    super.key,
    required this.controller,
    required this.tripId,
    required this.weight,
    required this.type,
  });
  final MarketController controller;
  final String tripId, weight, type;
  @override
  State<RequestPage> createState() => _RequestPageState();
}

class _RequestPageState extends State<RequestPage> {
  bool agreed = false;
  @override
  Widget build(BuildContext context) => DetailPage(
    title: 'Solicitar transporte',
    controller: widget.controller,
    builder: (context) {
      final t = widget.controller.market.trip(widget.tripId);
      return PageBody(
        children: [
          RouteSummary(t),
          Panel(
            child: Fields(
              initial: {
                'itemType': widget.type,
                'weight': widget.weight,
                'description': '',
                'declaredValue': '0',
              },
              labels: const {
                'itemType': 'Tipo de mercadoria',
                'weight': 'Peso (kg)',
                'description': 'Descrição da mercadoria',
                'declaredValue': 'Valor declarado (R\$)',
              },
              choices: {'itemType': t.acceptedTypes},
              numbers: const ['weight', 'declaredValue'],
              multiline: const ['description'],
              footer: Column(
                children: [
                  Text(
                    'Preço: ${money(t.price)}/kg. O total é confirmado antes do envio. Não há cobrança no aplicativo.',
                  ),
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text(
                      'Li as regras e confirmo que o conteúdo é permitido.',
                    ),
                    value: agreed,
                    onChanged: (v) => setState(() => agreed = v!),
                  ),
                ],
              ),
              enabled: agreed && !widget.controller.busy,
              submit: 'Revisar e enviar solicitação',
              onSave: (v) async {
                final weight = number(v['weight']!),
                    declared = number(v['declaredValue']!);
                require(
                  weight.isFinite && declared.isFinite,
                  'Informe peso e valor válidos.',
                );
                if (!await confirm(
                  context,
                  'Confirmar solicitação',
                  'Total combinado: ${money(weight * t.price)} para $weight kg. Enviar ao viajante?',
                )) {
                  return;
                }
                final id = await widget.controller.request(
                  t.id,
                  v['itemType']!,
                  weight,
                  v['description']!,
                  declared,
                );
                if (context.mounted) {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) =>
                          ShipmentPage(controller: widget.controller, id: id),
                    ),
                  );
                }
              },
            ),
          ),
        ],
      );
    },
  );
}

class OfferPage extends StatefulWidget {
  const OfferPage({super.key, required this.controller});
  final MarketController controller;
  @override
  State<OfferPage> createState() => _OfferPageState();
}

class _OfferPageState extends State<OfferPage> {
  bool agreed = false;
  final Set<String> types = itemTypes.toSet();
  @override
  Widget build(BuildContext context) => DetailPage(
    title: 'Publicar viagem',
    controller: widget.controller,
    builder: (context) => PageBody(
      children: [
        const SectionTitle(
          'Seu caminho pode conectar pessoas.',
          eyebrow: 'Oferecer espaço',
          subtitle:
              'Defina o que levar, quanto espaço oferecer e o preço por quilo.',
        ),
        Panel(
          child: Fields(
            initial: {
              'origin': cities[0],
              'destination': cities[1],
              'date': today(),
              'space': '5',
              'price': '40',
              'notes': '',
            },
            labels: const {
              'origin': 'Origem',
              'destination': 'Destino',
              'date': 'Data da viagem',
              'space': 'Espaço disponível (kg)',
              'price': 'Preço por kg (R\$)',
              'notes': 'Observações',
            },
            optional: const ['notes'],
            multiline: const ['notes'],
            numbers: const ['space', 'price'],
            footer: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Mercadorias aceitas'),
                Wrap(
                  spacing: 8,
                  children: [
                    for (final type in itemTypes)
                      FilterChip(
                        label: Text(type),
                        selected: types.contains(type),
                        onSelected: (v) => setState(
                          () => v ? types.add(type) : types.remove(type),
                        ),
                      ),
                  ],
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text(
                    'Aceito transportar apenas mercadorias permitidas.',
                  ),
                  value: agreed,
                  onChanged: (v) => setState(() => agreed = v!),
                ),
              ],
            ),
            submit: 'Publicar viagem',
            enabled: agreed && !widget.controller.busy,
            onSave: (v) async {
              await widget.controller.publish({
                ...v,
                'space': number(v['space']!),
                'price': number(v['price']!),
                'acceptedTypes': types.toList(),
              });
              if (context.mounted) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Viagem publicada e disponível na busca.'),
                  ),
                );
              }
            },
          ),
        ),
      ],
    ),
  );
}

class TripEditorPage extends StatelessWidget {
  const TripEditorPage({super.key, required this.controller, required this.id});
  final MarketController controller;
  final String id;
  @override
  Widget build(BuildContext context) {
    final t = controller.market.trip(id);
    return DetailPage(
      title: 'Editar condições',
      controller: controller,
      builder: (context) => PageBody(
        children: [
          RouteSummary(t),
          const Text(
            'Rota e data são mantidas. Os preços já combinados das encomendas não mudam.',
          ),
          Panel(
            child: Fields(
              initial: {
                'space': '${t.space}',
                'price': '${t.price}',
                'notes': t.notes,
              },
              labels: const {
                'space': 'Capacidade total (kg)',
                'price': 'Novo preço por kg (R\$)',
                'notes': 'Observações',
              },
              numbers: const ['space', 'price'],
              multiline: const ['notes'],
              optional: const ['notes'],
              onSave: (v) async {
                await controller.editTrip(
                  id,
                  number(v['space']!),
                  number(v['price']!),
                  v['notes']!,
                );
                if (context.mounted) Navigator.pop(context);
              },
            ),
          ),
        ],
      ),
    );
  }
}
