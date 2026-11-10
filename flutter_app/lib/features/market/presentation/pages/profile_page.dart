import 'package:flutter/material.dart';
import '../../../../shared/widgets/common.dart';
import '../../domain/models.dart';
import '../state/market_controller.dart';
import 'shipment_pages.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key, required this.controller});
  final MarketController controller;
  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  String tab = 'profile',
      history = 'all',
      reputation = 'received',
      document = 'RG';
  bool agreed = false;
  @override
  Widget build(BuildContext context) {
    final c = widget.controller, p = widget.controller.profile;
    return PageBody(
      children: [
        SectionTitle(p['name'], eyebrow: 'Minha conta', subtitle: p['email']),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final e in {
              'profile': 'Meus dados',
              'history': 'Histórico',
              'reviews': 'Avaliações',
              'identity': 'Verificação de identidade',
              'settings': 'Preferências e acesso',
            }.entries)
              ChoiceChip(
                label: Text(e.value),
                selected: tab == e.key,
                onSelected: (_) => setState(() => tab = e.key),
              ),
          ],
        ),
        if (tab == 'profile')
          Panel(
            child: Fields(
              initial: {
                'name': p['name'],
                'phone': p['phone'] ?? '',
                'city': p['city'] ?? '',
              },
              labels: const {
                'name': 'Nome completo',
                'phone': 'Telefone (opcional)',
                'city': 'Cidade',
              },
              optional: const ['phone', 'city'],
              enabled: !c.busy,
              submit: 'Salvar alterações',
              onSave: (v) async {
                await c.saveProfile(v['name']!, v['phone']!, v['city']!);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Dados atualizados.')),
                  );
                }
              },
            ),
          ),
        if (tab == 'history') ...historyWidgets(c),
        if (tab == 'reviews') ...reviewWidgets(c),
        if (tab == 'identity') ...identityWidgets(c),
        if (tab == 'settings') ...settingsWidgets(c),
      ],
    );
  }

  List<Widget> historyWidgets(MarketController c) {
    final sent = c.myShipments.where((s) => s.senderId == c.email).toList(),
        transported = c.myShipments
            .where((s) => c.market.trip(s.tripId).ownerId == c.email)
            .toList(),
        trips = c.market.trips.where((t) => t.ownerId == c.email).toList();
    final visible = history == 'sent'
        ? sent
        : history == 'transported'
        ? transported
        : history == 'completed'
        ? c.myShipments.where((s) => s.status == 'completed').toList()
        : c.myShipments;
    return [
      const SectionTitle('Sua jornada até aqui', eyebrow: 'Histórico'),
      Panel(
        child: Wrap(
          spacing: 28,
          runSpacing: 20,
          children: [
            Text('${sent.length} enviadas'),
            Text('${transported.length} transportadas'),
            Text(
              '${trips.where((t) => c.market.tripState(t) == 'Concluída').length} viagens concluídas',
            ),
            Text(
              '${sent.where((s) => s.status == 'completed').length} recebidas',
            ),
          ],
        ),
      ),
      OutlinedButton.icon(
        onPressed: () => perform(
          context,
          () => exportJson('historico-leva-comigo.json', {
            'enviadas': sent.map((s) => s.data).toList(),
            'transportadas': transported.map((s) => s.data).toList(),
            'viagens': trips.map((t) => t.data).toList(),
            'concluidas': trips
                .where((t) => c.market.tripState(t) == 'Concluída')
                .map((t) => t.data)
                .toList(),
          }),
        ),
        icon: const Icon(Icons.download_outlined),
        label: const Text('Exportar histórico'),
      ),
      Wrap(
        spacing: 8,
        children: [
          for (final e in {
            'all': 'Todas',
            'sent': 'Enviadas',
            'transported': 'Transportadas',
            'completed': 'Finalizadas',
          }.entries)
            ChoiceChip(
              label: Text(e.value),
              selected: history == e.key,
              onSelected: (_) => setState(() => history = e.key),
            ),
        ],
      ),
      if (visible.isEmpty)
        const EmptyState('Nenhuma atividade nesta categoria.'),
      for (final s in visible.reversed)
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${s.senderId == c.email ? 'Você enviou' : 'Você transportou'} · ${dateLabel(s.data['createdAt'])} · Atualizada em ${dateLabel(s.events[s.status])}',
            ),
            ShipmentTile(controller: c, shipment: s),
          ],
        ),
      const SectionTitle('Suas viagens'),
      for (final t in trips)
        Panel(
          child: Text(
            '${t.origin} → ${t.destination}\n${dateLabel(t.date)} · ${c.market.tripState(t)}${t.data['completedAt'] != null ? '\nConcluída em ${dateLabel(t.data['completedAt'])}' : ''}',
          ),
        ),
    ];
  }

  List<Widget> reviewWidgets(MarketController c) {
    final received = c.market.receivedReviews(c.email!),
        sent = c.market
            .rows('reviews')
            .where(
              (r) => c.market.shipment(r['shipmentId']).senderId == c.email,
            )
            .toList();
    final visible = reputation == 'received' ? received : sent;
    final average = received.isEmpty
        ? '—'
        : (received.fold<double>(0, (sum, r) => sum + (r['score'] as num)) /
                  received.length)
              .toStringAsFixed(1);
    return [
      SectionTitle(
        '★ $average',
        eyebrow: 'Sua reputação como viajante',
        subtitle: '${received.length} avaliação(ões) recebida(s)',
      ),
      Wrap(
        spacing: 8,
        children: [
          ChoiceChip(
            label: Text('Recebidas (${received.length})'),
            selected: reputation == 'received',
            onSelected: (_) => setState(() => reputation = 'received'),
          ),
          ChoiceChip(
            label: Text('Enviadas (${sent.length})'),
            selected: reputation == 'sent',
            onSelected: (_) => setState(() => reputation = 'sent'),
          ),
        ],
      ),
      if (visible.isEmpty)
        const EmptyState('Nenhuma avaliação nesta categoria.'),
      for (final r in visible)
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '★ ${r['score']}/5 · ${reputation == 'received' ? 'Avaliação de ${c.market.shipment(r['shipmentId']).sender}' : 'Para ${c.market.trip(c.market.shipment(r['shipmentId']).tripId).name}'}',
              ),
              Text(r['comment'].isEmpty ? 'Sem comentário.' : r['comment']),
              Text(dateLabel(r['at'])),
              for (final entry in (r['criteria'] as Map).entries)
                Text('${entry.key}: ${entry.value}/5'),
              TextButton(
                onPressed: () => openPage(
                  context,
                  ShipmentPage(controller: c, id: r['shipmentId']),
                ),
                child: const Text('Ver encomenda avaliada'),
              ),
            ],
          ),
        ),
    ];
  }

  List<Widget> identityWidgets(MarketController c) {
    final verification = c.profile['verification'] as Map? ?? {},
        status = verification['status'] ?? 'pending';
    const names = {
      'pending': 'Pendente',
      'review': 'Em análise',
      'approved': 'Aprovado',
      'rejected': 'Reprovado',
    };
    return [
      SectionTitle(names[status]!, eyebrow: 'Verificação de identidade'),
      const Text(
        'Processo de demonstração. Nenhum documento real é solicitado ou enviado. Aprovação simulada não representa identidade validada.',
      ),
      if (verification['submittedAt'] != null)
        Text('Solicitada em ${dateLabel(verification['submittedAt'])}'),
      if (verification['updatedAt'] != null)
        Text('Atualizada em ${dateLabel(verification['updatedAt'])}'),
      if (verification['reason'] != null) Text(verification['reason']),
      if (['pending', 'rejected'].contains(status)) ...[
        DropdownButtonFormField<String>(
          initialValue: document,
          decoration: const InputDecoration(
            labelText: 'Tipo de documento (simulação)',
          ),
          items: [
            'RG',
            'CNH',
            'Passaporte',
          ].map((v) => DropdownMenuItem(value: v, child: Text(v))).toList(),
          onChanged: (v) => setState(() => document = v!),
        ),
        CheckboxListTile(
          value: agreed,
          onChanged: (v) => setState(() => agreed = v!),
          title: const Text('Entendo que esta verificação é uma simulação.'),
        ),
        FilledButton(
          onPressed: agreed && !c.busy
              ? () => perform(
                  context,
                  () => c.verification('review', document),
                  'Verificação simulada: em análise.',
                )
              : null,
          child: Text(
            status == 'rejected'
                ? 'Reenviar para análise'
                : 'Iniciar verificação',
          ),
        ),
      ],
      if (status == 'review') ...[
        FilledButton(
          onPressed: c.busy
              ? null
              : () => perform(
                  context,
                  () => c.verification(
                    'approved',
                    verification['documentType'] ?? document,
                  ),
                  'Aprovação simulada registrada.',
                ),
          child: const Text('Simular aprovação'),
        ),
        OutlinedButton(
          onPressed: c.busy
              ? null
              : () => perform(
                  context,
                  () => c.verification(
                    'rejected',
                    verification['documentType'] ?? document,
                  ),
                  'Reprovação simulada registrada.',
                ),
          child: const Text('Simular reprovação'),
        ),
      ],
    ];
  }

  List<Widget> settingsWidgets(MarketController c) => [
    const SectionTitle('Do seu jeito', eyebrow: 'Preferências e acesso'),
    SwitchListTile(
      contentPadding: EdgeInsets.zero,
      title: const Text('Exibir notificações de encomendas'),
      value: c.profile['notifications'] == true,
      onChanged: c.busy
          ? null
          : (v) => perform(context, () => c.preferences(v)),
    ),
    if (!c.demo)
      Panel(
        child: Fields(
          initial: const {'old': '', 'password': ''},
          labels: const {'old': 'Senha atual', 'password': 'Nova senha'},
          passwords: const ['old', 'password'],
          enabled: !c.busy,
          submit: 'Alterar senha',
          onSave: (v) async {
            await c.changePassword(v['old']!, v['password']!);
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Senha atualizada.')),
              );
            }
          },
        ),
      )
    else
      const Text(
        'A senha da conta de demonstração é fixa. Crie sua conta para gerenciar o acesso.',
      ),
    OutlinedButton.icon(
      onPressed: () => perform(
        context,
        () => exportJson('meus-dados-leva-comigo.json', c.exportPersonal()),
      ),
      icon: const Icon(Icons.download_outlined),
      label: const Text('Exportar meus dados'),
    ),
    OutlinedButton.icon(
      onPressed: c.busy
          ? null
          : () async {
              if (await confirm(
                    context,
                    'Importar arquivo?',
                    'Registros existentes serão mantidos. Novos registros serão adicionados. Guarde uma cópia dos seus dados antes de continuar.',
                  ) &&
                  mounted) {
                await perform(context, () => importJson(c));
              }
            },
      icon: const Icon(Icons.upload_file_outlined),
      label: const Text('Importar dados'),
    ),
    OutlinedButton.icon(
      onPressed: () => perform(
        context,
        () => exportJson('backup-leva-comigo.json', {
          ...c.market.data,
          'session': null,
        }),
      ),
      icon: const Icon(Icons.backup_outlined),
      label: const Text('Backup completo deste dispositivo'),
    ),
    const Text(
      'O backup completo inclui todas as contas locais e seus hashes de acesso. Guarde-o em local privado. Dados não são sincronizados entre dispositivos. Não há pagamentos, e-mail, GPS ou verificação real.',
    ),
    FilledButton.icon(
      onPressed: c.busy ? null : () => perform(context, c.logout),
      icon: const Icon(Icons.logout),
      label: const Text('Sair da conta'),
    ),
  ];
}
