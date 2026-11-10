import 'package:flutter/material.dart';
import '../../../../app/theme/app_theme.dart';
import '../../../../shared/widgets/common.dart';
import '../../domain/models.dart';
import '../state/market_controller.dart';
import 'shipment_pages.dart';
import 'trip_pages.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key, required this.controller, required this.navigate});
  final MarketController controller;
  final void Function(int) navigate;

  @override
  Widget build(BuildContext context) {
    final active = controller.myShipments
        .where((s) => !terminal(s.status))
        .toList();
    final completed = controller.myShipments
        .where((s) => s.status == 'completed')
        .length;
    return PageBody(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: SectionTitle(
                'O que vamos conectar hoje?',
                eyebrow: 'Olá, ${controller.profile['name'].split(' ').first}',
                subtitle: 'Um novo caminho para o que importa.',
              ),
            ),
            const SizedBox(width: 12),
            IconButton.filledTonal(
              tooltip: 'Minha conta',
              onPressed: () => navigate(4),
              style: IconButton.styleFrom(
                backgroundColor: const Color(0xFFE5ECD9),
                minimumSize: const Size(48, 48),
              ),
              icon: Text(
                controller.profile['name'].substring(0, 1).toUpperCase(),
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 20,
                ),
              ),
            ),
          ],
        ),
        Container(
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF20382B), Color(0xFF14251D)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(28),
          ),
          child: Stack(
            children: [
              Positioned(
                right: -32,
                top: -36,
                child: ExcludeSemantics(
                  child: Icon(
                    Icons.public,
                    size: 220,
                    color: Colors.white.withValues(alpha: .045),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(26),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 7,
                            ),
                            decoration: BoxDecoration(
                              color: lime.withValues(alpha: .12),
                              borderRadius: BorderRadius.circular(30),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.near_me_outlined,
                                  color: lime,
                                  size: 15,
                                ),
                                SizedBox(width: 6),
                                Flexible(
                                  child: Text(
                                    'CONEXÕES QUE APROXIMAM',
                                    style: TextStyle(
                                      color: lime,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: .7,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 22),
                    const Text(
                      'Mais perto,\nmesmo de longe.',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 33,
                        height: 1.12,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -1.1,
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'Sua encomenda encontra espaço na viagem de alguém.',
                      style: TextStyle(
                        color: Color(0xFFBBCBBE),
                        fontSize: 15,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: () => navigate(1),
                      style: FilledButton.styleFrom(
                        backgroundColor: lime,
                        foregroundColor: ink,
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.search, size: 20),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Buscar viagens',
                              textAlign: TextAlign.center,
                            ),
                          ),
                          SizedBox(width: 8),
                          Icon(Icons.arrow_forward, size: 18),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Card(
          child: InkWell(
            borderRadius: BorderRadius.circular(22),
            onTap: () => openPage(context, OfferPage(controller: controller)),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(13),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF3E5),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.flight_takeoff, color: ink),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Vai viajar?',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Ofereça espaço na bagagem.',
                          style: TextStyle(color: muted, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward, size: 19),
                ],
              ),
            ),
          ),
        ),
        Row(
          children: [
            Expanded(
              child: _ActivityStat(
                value: active.length,
                label: 'Em andamento',
                icon: Icons.local_shipping_outlined,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _ActivityStat(
                value: completed,
                label: 'Concluídas',
                icon: Icons.task_alt,
              ),
            ),
          ],
        ),
        Row(
          children: [
            const Expanded(
              child: Text(
                'A caminho',
                style: TextStyle(
                  fontSize: 21,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -.5,
                ),
              ),
            ),
            TextButton(
              onPressed: () => navigate(2),
              child: const Text('Ver todas →'),
            ),
          ],
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
        const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.storage_outlined, size: 14, color: muted),
            SizedBox(width: 6),
            Flexible(
              child: Text(
                'Seus dados ficam neste dispositivo',
                style: TextStyle(fontSize: 11, color: muted),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _ActivityStat extends StatelessWidget {
  const _ActivityStat({
    required this.value,
    required this.label,
    required this.icon,
  });
  final int value;
  final String label;
  final IconData icon;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(17),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: const Color(0xFFE5E9E2)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 18, color: muted),
            const Spacer(),
            Text(
              '$value',
              style: const TextStyle(
                fontSize: 25,
                fontWeight: FontWeight.w800,
                color: ink,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Text(label, style: const TextStyle(fontSize: 12, color: muted)),
      ],
    ),
  );
}
