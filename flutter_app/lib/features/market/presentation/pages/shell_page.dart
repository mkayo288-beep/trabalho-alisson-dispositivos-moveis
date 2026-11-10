import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../app/theme/app_theme.dart';
import '../../../../shared/widgets/common.dart';
import '../../domain/models.dart';
import '../state/market_controller.dart';
import 'profile_page.dart';
import 'shipment_pages.dart';
import 'trip_pages.dart';

class ShellPage extends StatefulWidget {
  const ShellPage({super.key, required this.controller});
  final MarketController controller;
  @override
  State<ShellPage> createState() => _ShellPageState();
}

class _ShellPageState extends State<ShellPage> with WidgetsBindingObserver {
  int index = 0;
  Timer? refreshTimer;
  static const labels = ['Início', 'Buscar', 'Viagens', 'Mensagens', 'Perfil'];
  static const icons = [
    Icons.home_outlined,
    Icons.search,
    Icons.work_outline,
    Icons.chat_bubble_outline,
    Icons.person_outline,
  ];
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    refreshTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!widget.controller.busy) {
        widget.controller.refresh().catchError((Object _) {});
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      perform(context, widget.controller.refresh);
    }
  }

  @override
  void dispose() {
    refreshTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.controller;
    final pages = [
      HomePage(controller: c, navigate: (v) => setState(() => index = v)),
      SearchPage(controller: c),
      ActivityPage(controller: c),
      ConversationsPage(controller: c),
      ProfilePage(controller: c),
    ];
    final wide = MediaQuery.sizeOf(context).width >= 900;
    return PopScope(
      canPop: index == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) setState(() => index = 0);
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            wide ? 'LEVAComigo / ${labels[index]}' : 'LEVAComigo',
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
          actions: [
            IconButton(
              tooltip: 'Atualizar dados',
              onPressed: c.busy
                  ? null
                  : () =>
                        perform(context, c.refresh, 'Informações atualizadas.'),
              icon: const Icon(Icons.refresh),
            ),
            if (c.profile['notifications'] == true)
              IconButton(
                tooltip: 'Notificações',
                onPressed: c.busy
                    ? null
                    : () async {
                        await perform(context, c.markRead);
                        if (context.mounted) {
                          openPage(context, NoticesPage(controller: c));
                        }
                      },
                icon: Badge(
                  isLabelVisible: c.unread,
                  child: const Icon(Icons.notifications_none),
                ),
              ),
          ],
          bottom: c.busy
              ? const PreferredSize(
                  preferredSize: Size.fromHeight(3),
                  child: LinearProgressIndicator(),
                )
              : null,
        ),
        body: SafeArea(
          child: Row(
            children: [
              if (wide)
                NavigationRail(
                  extended: MediaQuery.sizeOf(context).width >= 1200,
                  selectedIndex: index,
                  onDestinationSelected: (v) => setState(() => index = v),
                  leading: const Padding(
                    padding: EdgeInsets.all(24),
                    child: Icon(Icons.route, size: 36),
                  ),
                  destinations: [
                    for (var i = 0; i < labels.length; i++)
                      NavigationRailDestination(
                        icon: Icon(icons[i]),
                        label: Text(labels[i]),
                      ),
                  ],
                ),
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 220),
                  child: KeyedSubtree(
                    key: ValueKey(index),
                    child: pages[index],
                  ),
                ),
              ),
            ],
          ),
        ),
        bottomNavigationBar: wide
            ? null
            : NavigationBar(
                selectedIndex: index,
                onDestinationSelected: (v) => setState(() => index = v),
                destinations: [
                  for (var i = 0; i < labels.length; i++)
                    NavigationDestination(
                      icon: Icon(icons[i]),
                      label: labels[i],
                    ),
                ],
              ),
      ),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key, required this.controller, required this.navigate});
  final MarketController controller;
  final void Function(int) navigate;
  @override
  Widget build(BuildContext context) {
    final active = controller.myShipments
        .where((s) => !terminal(s.status))
        .toList();
    Widget action(
      String title,
      String text,
      IconData icon,
      VoidCallback onTap,
      bool dark,
    ) => Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: dark ? ink : const Color(0xFFE8EEDC),
        borderRadius: BorderRadius.circular(28),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 40, color: dark ? lime : ink),
          const SizedBox(height: 24),
          Text(
            title,
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: dark ? Colors.white : ink,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            text,
            style: TextStyle(
              color: dark ? const Color(0xFFCAD4C4) : ink,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            style: dark
                ? FilledButton.styleFrom(
                    backgroundColor: lime,
                    foregroundColor: ink,
                  )
                : null,
            onPressed: onTap,
            icon: const Icon(Icons.arrow_forward),
            label: Text(dark ? 'Buscar viagens' : 'Publicar viagem'),
          ),
        ],
      ),
    );
    final first = action(
      'Pequena encomenda.\nGrandes conexões.',
      'Encontre alguém que já está indo para o seu destino.',
      Icons.inventory_2_outlined,
      () => navigate(1),
      true,
    );
    final second = action(
      'Sua bagagem pode\nlevar mais histórias.',
      'Compartilhe espaço na próxima viagem e combine seu preço.',
      Icons.flight_takeoff,
      () => openPage(context, OfferPage(controller: controller)),
      false,
    );
    return PageBody(
      children: [
        SectionTitle(
          'O que vamos conectar hoje?',
          eyebrow: 'Olá, ${controller.profile['name'].split(' ').first}',
          subtitle: 'Envie com cuidado. Viaje com propósito.',
        ),
        LayoutBuilder(
          builder: (context, constraints) => constraints.maxWidth > 700
              ? Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: first),
                    const SizedBox(width: 20),
                    Expanded(child: second),
                  ],
                )
              : Column(children: [first, const SizedBox(height: 16), second]),
        ),
        SectionTitle(
          'A caminho',
          eyebrow: '${active.length} envio(s) em andamento',
        ),
        if (active.isEmpty)
          const EmptyState(
            'Nenhuma encomenda em andamento. Sua próxima conexão começa na busca.',
          ),
        for (final s in active.reversed.take(4))
          ShipmentTile(controller: controller, shipment: s),
        TextButton(
          onPressed: () => navigate(2),
          child: const Text('Ver todos os envios e transportes'),
        ),
        const Text(
          'Versão local · sem cobrança, GPS ou sincronização entre dispositivos.',
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class ActivityPage extends StatefulWidget {
  const ActivityPage({super.key, required this.controller});
  final MarketController controller;
  @override
  State<ActivityPage> createState() => _ActivityPageState();
}

class _ActivityPageState extends State<ActivityPage> {
  String filter = 'active';
  @override
  Widget build(BuildContext context) {
    final c = widget.controller;
    final shipments = c.myShipments
        .where(
          (s) => filter == 'active'
              ? !terminal(s.status)
              : filter == 'completed'
              ? s.status == 'completed'
              : ['cancelled', 'refused'].contains(s.status),
        )
        .toList();
    final trips = c.market.trips.where((t) => t.ownerId == c.email).toList();
    return PageBody(
      children: [
        const SectionTitle(
          'Envios e transportes',
          eyebrow: 'Seu painel de viagens',
        ),
        FilledButton.icon(
          onPressed: () => openPage(context, OfferPage(controller: c)),
          icon: const Icon(Icons.add),
          label: const Text('Publicar viagem'),
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final e in {
              'active': 'Em andamento',
              'completed': 'Concluídas',
              'cancelled': 'Canceladas / recusadas',
            }.entries)
              ChoiceChip(
                label: Text(e.value),
                selected: filter == e.key,
                onSelected: (_) => setState(() => filter = e.key),
              ),
          ],
        ),
        if (shipments.isEmpty)
          const EmptyState('Nenhuma encomenda nesta categoria.'),
        for (final s in shipments) ShipmentTile(controller: c, shipment: s),
        const SectionTitle('Viagens que você publicou'),
        if (trips.isEmpty)
          const EmptyState(
            'Você ainda não publicou viagens.',
            icon: Icons.flight_takeoff,
          ),
        for (final t in trips)
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${city(t.origin)} → ${city(t.destination)}',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                Chip(label: Text(c.market.tripState(t))),
                Text(
                  '${dateLabel(t.date)} · ${c.market.remaining(t)} de ${t.space} kg disponíveis · ${money(t.price)}/kg',
                ),
                if (t.data['completedAt'] != null)
                  Text('Concluída em ${dateLabel(t.data['completedAt'])}'),
                Text(t.notes),
                if (t.active)
                  Padding(
                    padding: const EdgeInsets.only(top: 20),
                    child: Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        OutlinedButton(
                          onPressed: () => openPage(
                            context,
                            TripEditorPage(controller: c, id: t.id),
                          ),
                          child: const Text('Editar condições'),
                        ),
                        OutlinedButton(
                          onPressed: c.busy
                              ? null
                              : () => perform(context, () async {
                                  final id = await c.request(
                                    t.id,
                                    t.acceptedTypes.first,
                                    1,
                                    'Envelope de documentos para testar solicitações.',
                                    50,
                                    sample: true,
                                  );
                                  if (context.mounted) {
                                    openPage(
                                      context,
                                      ShipmentPage(controller: c, id: id),
                                    );
                                  }
                                }),
                          child: const Text(
                            'Testar com solicitação de exemplo',
                          ),
                        ),
                        TextButton(
                          onPressed: c.busy
                              ? null
                              : () async {
                                  if (await confirm(
                                        context,
                                        'Encerrar publicação?',
                                        'Novas solicitações serão impedidas. Encomendas em andamento continuam disponíveis.',
                                      ) &&
                                      context.mounted) {
                                    await perform(
                                      context,
                                      () => c.closeTrip(t.id),
                                      'Publicação encerrada.',
                                    );
                                  }
                                },
                          child: const Text('Encerrar publicação'),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}

class ConversationsPage extends StatelessWidget {
  const ConversationsPage({super.key, required this.controller});
  final MarketController controller;
  @override
  Widget build(BuildContext context) => PageBody(
    children: [
      const SectionTitle(
        'Conversas',
        subtitle: 'Cada encomenda tem seu espaço para combinar os detalhes.',
      ),
      if (controller.myShipments.isEmpty)
        const EmptyState(
          'Suas conversas aparecem após uma solicitação.',
          icon: Icons.chat_bubble_outline,
        ),
      for (final s in controller.myShipments.reversed)
        Card(
          child: ListTile(
            contentPadding: const EdgeInsets.all(20),
            leading: const CircleAvatar(child: Icon(Icons.chat_bubble_outline)),
            title: Text(
              s.senderId == controller.email
                  ? controller.market.trip(s.tripId).name
                  : s.sender,
            ),
            subtitle: Text('#${s.id} · ${statusLabels[s.status]}'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () =>
                openPage(context, ChatPage(controller: controller, id: s.id)),
          ),
        ),
    ],
  );
}

class NoticesPage extends StatelessWidget {
  const NoticesPage({super.key, required this.controller});
  final MarketController controller;
  @override
  Widget build(BuildContext context) => DetailPage(
    title: 'Notificações',
    controller: controller,
    builder: (context) {
      final notices = controller.myShipments.toList()
        ..sort(
          (a, b) => (b.events[b.status] as String).compareTo(
            a.events[a.status] as String,
          ),
        );
      return PageBody(
        children: [
          if (notices.isEmpty)
            const EmptyState(
              'Nenhuma notificação por enquanto.',
              icon: Icons.notifications_none,
            ),
          for (final s in notices)
            ShipmentTile(controller: controller, shipment: s),
        ],
      );
    },
  );
}
