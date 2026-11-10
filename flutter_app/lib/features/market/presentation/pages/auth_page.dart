import 'package:flutter/material.dart';
import '../../../../shared/widgets/common.dart';
import '../state/market_controller.dart';

class AuthPage extends StatefulWidget {
  const AuthPage({super.key, required this.controller});
  final MarketController controller;
  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  String mode = 'login';
  bool remember = true;
  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: PageBody(
        children: [
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 32),
                  const Icon(Icons.route, size: 48),
                  const SizedBox(height: 12),
                  const Text(
                    'LEVAComigo',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 32),
                  SectionTitle(
                    mode == 'login'
                        ? 'Boas viagens começam aqui.'
                        : mode == 'signup'
                        ? 'Vamos nos conhecer?'
                        : 'Recupere seu acesso',
                    eyebrow: 'Transporte colaborativo',
                    subtitle:
                        'Conecte sua encomenda à próxima viagem. Dados locais neste dispositivo.',
                  ),
                  const SizedBox(height: 24),
                  Panel(
                    child: Fields(
                      key: ValueKey(mode),
                      initial: const {
                        'name': '',
                        'email': '',
                        'password': '',
                        'confirmation': '',
                        'code': '',
                      },
                      labels: {
                        if (mode == 'signup') 'name': 'Nome completo',
                        'email': 'E-mail',
                        if (mode == 'forgot') 'code': 'Código de recuperação',
                        'password': mode == 'forgot' ? 'Nova senha' : 'Senha',
                        if (mode != 'login') 'confirmation': 'Confirmar senha',
                      },
                      passwords: const ['password', 'confirmation'],
                      submit: mode == 'login'
                          ? 'Entrar'
                          : mode == 'signup'
                          ? 'Criar conta'
                          : 'Redefinir senha',
                      enabled: !widget.controller.busy,
                      footer: CheckboxListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Lembrar de mim'),
                        value: remember,
                        onChanged: (v) => setState(() => remember = v!),
                      ),
                      onSave: (v) async {
                        final c = widget.controller;
                        if (mode == 'login') {
                          await c.login(v['email']!, v['password']!, remember);
                        } else if (mode == 'forgot') {
                          await c.resetPassword(
                            v['email']!,
                            v['code']!,
                            v['password']!,
                            v['confirmation']!,
                          );
                          if (context.mounted) {
                            setState(() => mode = 'login');
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Senha atualizada. Entre com a nova senha.',
                                ),
                              ),
                            );
                          }
                        } else {
                          final code = await c.register(
                            v['name']!,
                            v['email']!,
                            v['password']!,
                            v['confirmation']!,
                          );
                          if (!context.mounted) return;
                          await showDialog<void>(
                            context: context,
                            barrierDismissible: false,
                            builder: (dialogContext) => AlertDialog(
                              title: const Text('Conta criada'),
                              content: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text(
                                    'Guarde o código abaixo para recuperar sua senha. Não há envio de e-mail.',
                                  ),
                                  const SizedBox(height: 16),
                                  SelectableText(code),
                                ],
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () => perform(
                                    dialogContext,
                                    () => exportJson(
                                      'recuperacao-leva-comigo.json',
                                      {
                                        'email': v['email']!
                                            .trim()
                                            .toLowerCase(),
                                        'codigo': code,
                                      },
                                    ),
                                  ),
                                  child: const Text('Baixar código'),
                                ),
                                FilledButton(
                                  onPressed: () => Navigator.pop(dialogContext),
                                  child: const Text('Continuar'),
                                ),
                              ],
                            ),
                          );
                          await c.login(v['email']!, v['password']!, remember);
                        }
                      },
                    ),
                  ),
                  Wrap(
                    alignment: WrapAlignment.center,
                    children: [
                      for (final entry in {
                        'login': 'Entrar',
                        'signup': 'Criar conta',
                        'forgot': 'Esqueci minha senha',
                      }.entries)
                        if (entry.key != mode)
                          TextButton(
                            onPressed: () => setState(() => mode = entry.key),
                            child: Text(entry.value),
                          ),
                    ],
                  ),
                  OutlinedButton.icon(
                    icon: const Icon(Icons.explore_outlined),
                    onPressed: widget.controller.busy
                        ? null
                        : () => perform(
                            context,
                            () => widget.controller.login(
                              '',
                              '',
                              remember,
                              explore: true,
                            ),
                          ),
                    label: const Text('Explorar demonstração'),
                  ),
                  TextButton.icon(
                    onPressed: widget.controller.busy
                        ? null
                        : () => perform(
                            context,
                            () => importJson(widget.controller),
                          ),
                    icon: const Icon(Icons.file_upload_outlined),
                    label: const Text('Importar dados do projeto original'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
  );
}
