# LevaComigo

Wireframe navegável de uma plataforma de transporte colaborativo de pequenas encomendas internacionais. O LevaComigo conecta pessoas que precisam enviar uma encomenda a viajantes que já possuem uma viagem planejada e espaço disponível na bagagem.

O projeto foi desenvolvido para fins acadêmicos de UX/UI como uma aplicação React responsiva, com fluxos completos para remetentes e viajantes.

## Problema e público-alvo

Serviços tradicionais de transporte internacional podem ter custos elevados, prazos longos e processos burocráticos. Ao mesmo tempo, muitos viajantes realizam trajetos internacionais com espaço livre na bagagem.

O LevaComigo aproxima essas duas necessidades:

- remetentes encontram pessoas que já viajarão para o destino desejado;
- viajantes podem obter uma renda adicional utilizando o espaço disponível;
- as duas partes acompanham o processo por meio de reputação, verificação, mensagens e rastreabilidade.

### Remetentes

Pessoas que:

- precisam enviar documentos, eletrônicos ou pequenas encomendas para outro país;
- buscam uma alternativa mais acessível aos serviços convencionais;
- desejam acompanhar o transporte;
- valorizam informações sobre identidade e reputação do transportador.

### Viajantes

Pessoas que:

- realizam viagens internacionais;
- possuem espaço disponível na bagagem;
- desejam obter renda adicional;
- querem escolher quais mercadorias estão dispostas a transportar;
- valorizam segurança, transparência e controle sobre as solicitações.

## Navegação e estrutura de telas

A aplicação possui navegação lateral no desktop e uma barra fixa inferior em dispositivos móveis. Os destinos globais são:

- Início;
- Buscar;
- Viagens;
- Mensagens;
- Perfil.

A barra superior apresenta o título da página, notificações e um atalho para a conta do usuário.

### Acesso

1. **Splash:** apresentação da plataforma, benefícios e entrada no aplicativo.
2. **Login:** entrada, criação de conta e recuperação de senha.

A autenticação é simulada, pois o projeto atual é um protótipo frontend e não utiliza servidor ou banco de dados.

### Fluxo do remetente

O principal caminho do remetente é:

```text
Início → Buscar viagem → Resultados → Perfil do viajante
→ Solicitar transporte → Acompanhamento → Entrega → Avaliação
```

#### Buscar viagem

O usuário informa:

- origem;
- destino;
- data;
- peso aproximado;
- tipo de mercadoria.

Também é possível expandir as regras de transporte e consultar exemplos de itens não permitidos.

#### Resultados

Os critérios informados aparecem no cabeçalho e nos cartões dos viajantes. Os resultados podem ser ordenados por:

- melhor avaliação;
- menor preço;
- maior número de viagens.

Cada cartão apresenta identidade, reputação, rota, data, espaço disponível e preço por quilo.

#### Perfil do viajante

Apresenta:

- identidade verificada;
- nota e número de viagens;
- percentual de avaliações positivas;
- avaliações anteriores;
- rota, data, espaço e preço;
- ação para solicitar o transporte.

#### Solicitação de transporte

O remetente informa ou confirma:

- tipo da mercadoria;
- peso;
- descrição;
- valor declarado;
- aceite das regras.

O valor total é calculado automaticamente a partir do peso e do preço por quilo do viajante.

#### Acompanhamento

Apresenta:

- código da encomenda;
- origem e destino;
- transportador selecionado;
- detalhes da mercadoria;
- status atual;
- linha do tempo;
- previsão de chegada;
- acesso às mensagens.

#### Entrega e avaliação

O usuário confirma o recebimento e avalia o viajante por nota geral, comunicação, cuidado, pontualidade e confiabilidade. Também pode adicionar um comentário.

### Fluxo do viajante

O caminho principal do viajante é:

```text
Início → Oferecer transporte → Solicitações recebidas
→ Aceitar ou recusar → Acompanhamento
```

#### Oferecer transporte

O viajante informa:

- origem;
- destino;
- data;
- espaço disponível;
- preço por quilo;
- observações.

Depois da publicação, esses dados são reutilizados na tela de solicitações.

#### Solicitações recebidas

As solicitações são organizadas nas abas:

- Pendentes;
- Aceitas;
- Recusadas.

Cada solicitação apresenta o remetente, sua reputação, mercadoria, peso, valor declarado e ganho estimado. O estado de aceite ou recusa permanece consistente durante a navegação.

### Mensagens

A área de mensagens permite:

- visualizar o contato selecionado;
- consultar o histórico;
- escrever e enviar mensagens;
- enviar pelo botão ou pela tecla Enter;
- visualizar imediatamente uma nova mensagem na conversa.

### Perfil do usuário

O perfil foi representado como um mapa de fluxo interativo. O nó central está conectado a:

- editar dados;
- verificar identidade;
- reputação;
- histórico;
- segurança e ajustes.

Ao selecionar um nó, um painel lateral explica sua finalidade, informações relacionadas e ação correspondente.

## Principais funcionalidades

### Estado compartilhado

Os dados dos formulários são mantidos no componente principal da aplicação e reaproveitados nas telas seguintes. O estado inclui:

- critérios da busca;
- viajante selecionado;
- dados da mercadoria;
- dados da viagem oferecida;
- fluxo ativo;
- situação da solicitação.

Assim, origem, destino, data, peso, mercadoria, preço e viajante permanecem coerentes ao longo da jornada.

### Cálculo de transporte

O valor do transporte é calculado a partir do peso e do preço por quilo. Valores textuais como `2 kg` e `R$ 40` são convertidos para números e o resultado é formatado novamente em reais.

### Ordenação

Os resultados podem ser reorganizados por nota, preço ou número de viagens sem alterar a fonte original de dados.

### Persistência da sessão

As informações permanecem disponíveis durante a navegação da sessão. Como não existe backend, elas não são mantidas após o recarregamento completo da página.

### Responsividade

A interface possui adaptações para desktop, tablet e smartphone:

- sidebar compactada em telas intermediárias;
- navegação inferior no mobile;
- formulários e cards reorganizados em coluna;
- mapa de perfil convertido em grade;
- conversa exibida sem a lista lateral no mobile.

## Comparação entre protótipo e aplicação

### Protótipo inicial

O protótipo foi concebido como um wireframe visual para representar:

- hierarquia das informações;
- organização das telas;
- identidade visual;
- arquitetura de navegação;
- fluxos principais.

Grande parte das informações era fixa. Os campos utilizavam placeholders e diversos controles tinham finalidade apenas visual.

### Aplicação implementada

O wireframe foi transformado em uma aplicação frontend navegável. As principais alterações foram:

1. **Campos controlados:** os valores digitados passaram a ser armazenados e reutilizados.
2. **Sincronização entre telas:** rota, data, peso, mercadoria, preço e viajante acompanham o usuário.
3. **Seleção correta do viajante:** cada resultado abre o perfil correspondente.
4. **Cálculo automático:** o resumo utiliza o peso e o preço realmente informados.
5. **Controles interativos:** filtros, abas, estrelas, notificações, regras, mensagens e avaliações passaram a responder às ações.
6. **Persistência de decisões:** solicitações aceitas ou recusadas não retornam indevidamente ao estado pendente.
7. **Mensagens completas:** o estado vazio foi substituído por uma conversa funcional.
8. **Perfil em mapa de fluxo:** a arquitetura da conta passou a ser apresentada de maneira visual e interativa.

As alterações preservam a identidade do protótipo, mas tornam a experiência demonstrável e coerente para avaliações de UX/UI.

## Organização do código

### Arquivos principais

- `src/main.tsx`: inicialização do React, importação dos estilos e montagem do aplicativo.
- `src/App.tsx`: tipos, ícones, dados de exemplo, componentes, telas, estados e regras dos fluxos.
- `src/index.css`: fontes, cores, layout, componentes visuais e responsividade.
- `vite.config.ts`: configuração do Vite, React, Tailwind CSS e alias `@`.
- `package.json`: dependências e scripts do projeto.

### Componentes reutilizáveis

- `Icon`
- `Avatar`
- `Rating`
- `Field`
- `Button`
- `AppShell`

### Componentes de tela

- `Splash`
- `Login`
- `Home`
- `SearchTrip`
- `Results`
- `TravelerProfile`
- `RequestTransport`
- `OfferTrip`
- `Requests`
- `Tracking`
- `Delivery`
- `RatingScreen`
- `Messages`
- `UserProfile`

### Tipos de dados

O TypeScript é utilizado para representar:

- telas;
- ícones;
- viajantes;
- critérios de busca;
- dados da encomenda;
- dados da viagem oferecida.

## Principais desafios e soluções

### Manter dados entre telas

**Desafio:** os campos exibiam apenas placeholders e as telas seguintes utilizavam dados fixos.

**Solução:** os dados foram elevados para o componente principal, criando uma única fonte de verdade para cada fluxo.

### Preservar o viajante selecionado

**Desafio:** diferentes resultados podiam abrir o mesmo perfil.

**Solução:** o viajante selecionado passou a ser armazenado antes da navegação.

### Diferenciar os fluxos

**Desafio:** remetentes e viajantes acessam telas semelhantes, mas com contextos distintos.

**Solução:** um estado identifica o fluxo ativo e determina quais dados devem ser apresentados.

### Calcular valores formatados

**Desafio:** valores como `2 kg` e `R$ 40` não podem ser multiplicados diretamente.

**Solução:** funções auxiliares removem caracteres não numéricos, realizam o cálculo e formatam o resultado em moeda brasileira.

### Preservar aceite e recusa

**Desafio:** o estado local era perdido ao sair da tela de solicitações.

**Solução:** a situação da solicitação foi transferida para o estado principal.

### Adaptar telas complexas

**Desafio:** cards horizontais, timeline, mensagens e mapa de perfil ocupam muito espaço.

**Solução:** breakpoints reorganizam grids, ocultam informações secundárias e substituem a sidebar pela navegação inferior.

### Evitar dependências de ícones

**Desafio:** manter consistência visual sem instalar uma biblioteca externa.

**Solução:** foi criado um componente próprio com caminhos SVG reutilizáveis.

## Tecnologias

- React 19
- TypeScript 5.7
- Vite 8
- Tailwind CSS v4
- CSS responsivo
- Google Fonts: DM Sans e Manrope
- SVGs próprios

## Identidade visual

A interface utiliza uma paleta neutra para transmitir confiança e clareza, com verde-limão para destaques e estados ativos.

| Token | Cor | Uso |
| --- | --- | --- |
| `--ink` | `#171916` | Textos, botões e fundos escuros |
| `--muted` | `#73766F` | Textos secundários |
| `--line` | `#DEDFD9` | Bordas e divisores |
| `--paper` | `#FBFBF9` | Cartões e superfícies |
| `--soft` | `#EFEFEB` | Fundos secundários |
| `--accent` | `#C8FF46` | Destaques e indicadores |

As fontes utilizadas são:

- **DM Sans:** textos, labels, campos e navegação;
- **Manrope:** títulos, marca, valores e números de destaque.

## Executando localmente

Requisitos:

- Node.js
- pnpm

Instale as dependências:

```bash
pnpm install
```

Inicie o ambiente de desenvolvimento:

```bash
pnpm dev
```

Gere a versão de produção:

```bash
pnpm build
```

## Limitações atuais

O projeto é um protótipo frontend navegável. Ainda não possui:

- autenticação real;
- banco de dados;
- persistência após recarregar a página;
- pagamentos;
- upload e validação de documentos;
- geolocalização;
- rastreamento real;
- mensagens entre dispositivos;
- notificações externas;
- integrações com companhias aéreas ou transportadoras.

Essas funcionalidades exigiriam backend, controle de acesso, armazenamento seguro e integrações externas.
