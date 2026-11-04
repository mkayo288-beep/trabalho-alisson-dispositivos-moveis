import { useState, type ReactNode } from "react";

type Screen =
  | "splash"
  | "login"
  | "home"
  | "search"
  | "results"
  | "traveler"
  | "request"
  | "offer"
  | "requests"
  | "tracking"
  | "delivery"
  | "rating"
  | "profile"
  | "messages";

type IconName =
  | "home"
  | "search"
  | "box"
  | "message"
  | "user"
  | "plane"
  | "arrow"
  | "shield"
  | "star"
  | "calendar"
  | "weight"
  | "pin"
  | "chevron"
  | "bell"
  | "check"
  | "route"
  | "clock";

const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  box: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></>,
  message: <><path d="M21 14a4 4 0 0 1-4 4H8l-5 3 1.5-5A7 7 0 0 1 3 12V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6Z" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  plane: <><path d="m2 16 20-8-2-3-8 3-4-5-2 1 3 6-5 2-2-2-1 1 1 5Z" /><path d="m13 15-1 5 2-1 3-6" /></>,
  arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
  shield: <><path d="M12 22s8-3.5 8-11V5l-8-3-8 3v6c0 7.5 8 11 8 11Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
  star: <path d="m12 2 3 6.3 7 .9-5 4.8 1.3 7-6.3-3.4L5.7 21 7 14 2 9.2l7-.9L12 2Z" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6M17 2v6M3 10h18" /></>,
  weight: <><path d="M6 8h12l3 13H3L6 8Z" /><circle cx="12" cy="7" r="4" /><path d="m12 7 2-1" /></>,
  pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  route: <><circle cx="6" cy="18" r="3" /><circle cx="18" cy="6" r="3" /><path d="M8 16 16 8" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></>,
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

type Traveler = {
  initials: string;
  name: string;
  rating: string;
  trips: number;
  route: string;
  date: string;
  space: string;
  price: string;
  verified: boolean;
};

type SearchData = {
  origin: string;
  destination: string;
  date: string;
  weight: string;
  itemType: string;
};

type ShipmentData = {
  itemType: string;
  weight: string;
  description: string;
  declaredValue: string;
};

type OfferData = {
  origin: string;
  destination: string;
  date: string;
  space: string;
  price: string;
  notes: string;
};

const travelerCards: Traveler[] = [
  { initials: "MS", name: "Maria Silva", rating: "4,9", trips: 23, route: "Recife → Lisboa", date: "15 nov. 2026", space: "5 kg", price: "R$ 40/kg", verified: true },
  { initials: "RC", name: "Rafael Costa", rating: "4,7", trips: 16, route: "São Paulo → Porto", date: "18 nov. 2026", space: "3 kg", price: "R$ 35/kg", verified: true },
];

const screenTitles: Partial<Record<Screen, string>> = {
  home: "Início",
  search: "Buscar viagens",
  results: "Resultados",
  traveler: "Perfil do viajante",
  request: "Solicitar transporte",
  offer: "Oferecer transporte",
  requests: "Solicitações",
  tracking: "Acompanhamento",
  delivery: "Entrega",
  rating: "Avaliação",
  profile: "Meu perfil",
  messages: "Mensagens",
};

function Avatar({ initials = "MS", large = false }: { initials?: string; large?: boolean }) {
  return <div className={`avatar ${large ? "avatar-large" : ""}`}>{initials}</div>;
}

function Rating({ value = "4,9" }: { value?: string }) {
  return <span className="rating"><Icon name="star" size={15} /> <strong>{value}</strong></span>;
}

function Field({ label, placeholder, icon, textarea = false, type = "text", value, onChange }: { label: string; placeholder: string; icon?: IconName; textarea?: boolean; type?: string; value?: string; onChange?: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className={`input-shell ${textarea ? "textarea-shell" : ""}`}>
        {icon && <Icon name={icon} size={18} />}
        {textarea
          ? <textarea placeholder={placeholder} value={value} onChange={(event) => onChange?.(event.target.value)} />
          : <input type={type} placeholder={placeholder} value={value} onChange={(event) => onChange?.(event.target.value)} />}
      </div>
    </label>
  );
}

const city = (location: string) => location.split(",")[0].trim() || location;
const countryCode = (location: string) => {
  const normalized = location.toLocaleLowerCase();
  if (normalized.includes("brasil")) return "BR";
  if (normalized.includes("portugal")) return "PT";
  return location.split(",").at(-1)?.trim().slice(0, 2).toUpperCase() || "--";
};
const numericValue = (value: string) => Number(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
const currency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

function Button({ children, onClick, variant = "primary", wide = false }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger" | "text"; wide?: boolean }) {
  return <button className={`button ${variant} ${wide ? "wide" : ""}`} onClick={onClick}>{children}</button>;
}

function AppShell({ screen, go, children }: { screen: Screen; go: (screen: Screen) => void; children: ReactNode }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const nav = [
    { key: "home" as Screen, label: "Início", icon: "home" as IconName },
    { key: "search" as Screen, label: "Buscar", icon: "search" as IconName },
    { key: "requests" as Screen, label: "Viagens", icon: "box" as IconName },
    { key: "messages" as Screen, label: "Mensagens", icon: "message" as IconName },
    { key: "profile" as Screen, label: "Perfil", icon: "user" as IconName },
  ];
  const isActive = (key: Screen) => key === screen || (key === "search" && ["results", "traveler", "request"].includes(screen));
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => go("home")}><span className="brand-mark"><Icon name="route" /></span><span>LEVA<strong>Comigo</strong></span></button>
        <nav>
          {nav.map((item) => (
            <button key={item.key} className={isActive(item.key) ? "active" : ""} onClick={() => go(item.key)}>
              <Icon name={item.icon} /><span>{item.label}</span>
              {item.key === "requests" && <small>2</small>}
            </button>
          ))}
        </nav>
        <div className="trust-box"><Icon name="shield" /><div><strong>Ambiente seguro</strong><span>Usuários verificados e entregas rastreáveis.</span></div></div>
        <button className="sidebar-profile" onClick={() => go("profile")}><Avatar initials="JS" /><span><strong>João Silva</strong><small>Ver meu perfil</small></span><Icon name="chevron" size={17} /></button>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div><span className="eyebrow">LEVA COMIGO</span><h1>{screenTitles[screen]}</h1></div>
          <div className="top-actions">
            <button className="icon-button notification-button" aria-label="Abrir notificações" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}><Icon name="bell" /><i /></button>
            {notificationsOpen && (
              <div className="notification-panel">
                <span className="kicker">NOTIFICAÇÕES</span>
                <button onClick={() => { setNotificationsOpen(false); go("tracking"); }}><Icon name="box" size={18} /><span><strong>Encomenda em viagem</strong><small>#BG28491 chega hoje às 18:20</small></span></button>
                <button onClick={() => { setNotificationsOpen(false); go("requests"); }}><Icon name="message" size={18} /><span><strong>Nova solicitação recebida</strong><small>João quer enviar um eletrônico</small></span></button>
              </div>
            )}
            <button className="mini-user" onClick={() => go("profile")}><Avatar initials="JS" /><span>João</span></button>
          </div>
        </header>
        <main className="content">{children}</main>
        <nav className="mobile-nav">
          {nav.map((item) => <button key={item.key} className={isActive(item.key) ? "active" : ""} onClick={() => go(item.key)}><Icon name={item.icon} size={19} /><span>{item.label}</span></button>)}
        </nav>
      </div>
    </div>
  );
}

function Splash({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="route-art">
          <span className="art-pin start"><Icon name="box" size={26} /></span>
          <span className="dotted-route" />
          <span className="art-plane"><Icon name="plane" size={36} /></span>
          <span className="art-pin end"><Icon name="pin" size={26} /></span>
        </div>
        <div><span className="kicker light">TRANSPORTE COLABORATIVO</span><h1>Sua encomenda encontra<br />quem já vai viajar.</h1><p>Conectamos pessoas, destinos e confiança para aproximar o mundo.</p></div>
        <div className="auth-features"><span><Icon name="shield" /> Identidade verificada</span><span><Icon name="route" /> Entrega rastreável</span></div>
      </div>
      <div className="auth-panel">
        <div className="splash-content">
          <span className="brand-mark large"><Icon name="route" size={28} /></span>
          <h2>LEVA<strong>Comigo</strong></h2>
          <p>Pequenas encomendas.<br />Grandes conexões.</p>
          <Button wide onClick={() => go("login")}>ENTRAR <Icon name="arrow" /></Button>
          <small>Simples, seguro e transparente.</small>
        </div>
      </div>
    </div>
  );
}

function Login({ go }: { go: (s: Screen) => void }) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [recoverySent, setRecoverySent] = useState(false);

  const title = mode === "login" ? "Entre na sua conta" : mode === "signup" ? "Crie sua conta" : "Recupere sua senha";
  const description = mode === "login"
    ? "Acesse suas viagens e acompanhe suas encomendas."
    : mode === "signup"
      ? "Comece a enviar e transportar encomendas com segurança."
      : "Enviaremos as instruções de recuperação para o seu e-mail.";

  return (
    <div className="login-page">
      <button className="brand login-brand" onClick={() => go("splash")}><span className="brand-mark"><Icon name="route" /></span><span>LEVA<strong>Comigo</strong></span></button>
      <div className="login-card">
        <span className="kicker">{mode === "login" ? "BEM-VINDO DE VOLTA" : mode === "signup" ? "PRIMEIRO ACESSO" : "ACESSO À CONTA"}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {recoverySent ? (
          <div className="auth-success"><Icon name="check" /><strong>E-mail enviado</strong><p>Verifique sua caixa de entrada e siga as instruções.</p></div>
        ) : (
          <div className="form-stack">
            {mode === "signup" && <Field label="Nome completo" placeholder="João Silva" />}
            <Field label="E-mail" placeholder="voce@email.com" type="email" />
            {mode !== "forgot" && <Field label="Senha" placeholder="••••••••" type="password" />}
            {mode === "signup" && <Field label="Confirmar senha" placeholder="••••••••" type="password" />}
          </div>
        )}
        {mode === "login" && <div className="forgot"><label><input type="checkbox" /> Lembrar de mim</label><button onClick={() => setMode("forgot")}>Esqueci minha senha</button></div>}
        {!recoverySent && <Button wide onClick={() => mode === "forgot" ? setRecoverySent(true) : go("home")}>{mode === "login" ? "ENTRAR" : mode === "signup" ? "CRIAR CONTA" : "ENVIAR INSTRUÇÕES"} <Icon name="arrow" /></Button>}
        {mode === "login" && <><div className="divider"><span>ou</span></div><Button wide variant="secondary" onClick={() => setMode("signup")}>CRIAR CONTA</Button></>}
        <p className="signup">{mode === "login" ? <>Não possui uma conta? <button onClick={() => setMode("signup")}>Criar conta</button></> : <button onClick={() => { setMode("login"); setRecoverySent(false); }}>VOLTAR PARA ENTRAR</button>}</p>
      </div>
      <span className="legal">Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade.</span>
    </div>
  );
}

function Home({ go, traveler, shipment }: { go: (s: Screen) => void; traveler: Traveler; shipment: ShipmentData }) {
  const [origin, destination] = traveler.route.split(" → ");
  return (
    <>
      <section className="welcome">
        <div><span className="kicker">OLÁ, JOÃO</span><h2>O que você deseja fazer hoje?</h2><p>Envie sua encomenda ou aproveite sua próxima viagem.</p></div>
        <div className="verified-pill"><Icon name="shield" size={18} /> Perfil verificado</div>
      </section>
      <div className="action-grid">
        <article className="action-card dark">
          <span className="card-icon"><Icon name="box" size={30} /></span>
          <span className="step-label">QUERO ENVIAR</span>
          <h3>Enviar uma<br />encomenda</h3>
          <p>Encontre alguém que já vai viajar para o destino da sua encomenda.</p>
          <Button onClick={() => go("search")}>COMEÇAR <Icon name="arrow" /></Button>
          <span className="card-number">01</span>
        </article>
        <article className="action-card light-card">
          <span className="card-icon outlined"><Icon name="plane" size={30} /></span>
          <span className="step-label">QUERO TRANSPORTAR</span>
          <h3>Oferecer espaço<br />na bagagem</h3>
          <p>Você vai viajar? Ganhe uma renda extra levando pequenas encomendas.</p>
          <Button variant="secondary" onClick={() => go("offer")}>OFERECER <Icon name="arrow" /></Button>
          <span className="card-number">02</span>
        </article>
      </div>
      <section className="active-delivery">
        <div className="section-heading"><div><span className="kicker">EM ANDAMENTO</span><h3>Sua encomenda</h3></div><button onClick={() => go("tracking")}>Ver detalhes <Icon name="arrow" size={16} /></button></div>
        <button className="delivery-row" onClick={() => go("tracking")}>
          <span className="package-icon"><Icon name="box" /></span>
          <span><small>CÓDIGO #BG28491 · {shipment.itemType}</small><strong>{city(origin)} <Icon name="arrow" size={15} /> {city(destination)}</strong></span>
          <span className="status"><i /> EM VIAGEM</span>
          <span className="delivery-person"><Avatar initials={traveler.initials} /><span><small>TRANSPORTADORA</small><strong>{traveler.name}</strong></span></span>
          <Icon name="chevron" />
        </button>
      </section>
    </>
  );
}

function SearchTrip({ go, data, onChange, onSubmit }: { go: (s: Screen) => void; data: SearchData; onChange: (data: SearchData) => void; onSubmit: () => void }) {
  const [showRules, setShowRules] = useState(false);
  const update = (key: keyof SearchData, value: string) => onChange({ ...data, [key]: value });
  return (
    <div className="page-grid">
      <section className="panel main-panel">
        <div className="panel-title"><span className="number">01</span><div><h2>Para onde sua encomenda vai?</h2><p>Preencha os dados para encontrar viajantes disponíveis.</p></div></div>
        <div className="route-fields">
          <Field label="De onde?" placeholder="Recife, Brasil" icon="pin" value={data.origin} onChange={(value) => update("origin", value)} />
          <span className="route-arrow"><Icon name="arrow" /></span>
          <Field label="Para onde?" placeholder="Lisboa, Portugal" icon="pin" value={data.destination} onChange={(value) => update("destination", value)} />
        </div>
        <div className="form-grid three">
          <Field label="Data da viagem" placeholder="15/11/2026" icon="calendar" value={data.date} onChange={(value) => update("date", value)} />
          <Field label="Peso aproximado" placeholder="2 kg" icon="weight" value={data.weight} onChange={(value) => update("weight", value)} />
          <Field label="Tipo de mercadoria" placeholder="Eletrônico" icon="box" value={data.itemType} onChange={(value) => update("itemType", value)} />
        </div>
        <div className={`rule-note ${showRules ? "expanded" : ""}`}><Icon name="shield" /><div><strong>Mercadorias seguras, viagens tranquilas.</strong><span>Itens proibidos ou ilegais não são permitidos. Consulte as regras de transporte.</span>{showRules && <small>Não são aceitos armas, substâncias ilegais, produtos inflamáveis, perecíveis sem acondicionamento ou itens sem declaração de conteúdo.</small>}</div><button onClick={() => setShowRules(!showRules)}>{showRules ? "Fechar" : "Ver regras"}</button></div>
        <Button wide onClick={() => { onSubmit(); go("results"); }}>BUSCAR VIAGENS <Icon name="search" /></Button>
      </section>
      <aside className="side-help"><span className="kicker">COMO FUNCIONA</span><h3>Envie em<br />3 passos</h3>{["Encontre uma viagem", "Escolha um viajante", "Acompanhe a entrega"].map((text, i) => <div className="help-step" key={text}><span>0{i + 1}</span><p>{text}</p></div>)}</aside>
    </div>
  );
}

function Results({ go, onSelect, search }: { go: (s: Screen) => void; onSelect: (traveler: Traveler) => void; search: SearchData }) {
  const [sort, setSort] = useState<"rating" | "price" | "trips">("rating");
  const sortedTravelers = [...travelerCards].sort((a, b) => {
    if (sort === "price") return Number(a.price.replace(/\D/g, "")) - Number(b.price.replace(/\D/g, ""));
    if (sort === "trips") return b.trips - a.trips;
    return Number(b.rating.replace(",", ".")) - Number(a.rating.replace(",", "."));
  });

  return (
    <>
      <section className="results-head">
        <div><span className="kicker">2 VIAJANTES ENCONTRADOS</span><h2>{city(search.origin)} <span>{countryCode(search.origin)}</span> <Icon name="arrow" /> {city(search.destination)} <span>{countryCode(search.destination)}</span></h2><p>{search.date} · {search.weight} · {search.itemType}</p></div>
        <Button variant="secondary" onClick={() => go("search")}>ALTERAR BUSCA</Button>
      </section>
      <div className="filter-row"><span>Ordenar por:</span><button className={sort === "rating" ? "selected" : ""} onClick={() => setSort("rating")}>Melhor avaliação</button><button className={sort === "price" ? "selected" : ""} onClick={() => setSort("price")}>Menor preço</button><button className={sort === "trips" ? "selected" : ""} onClick={() => setSort("trips")}>Mais viagens</button></div>
      <section className="travelers-list">
        {sortedTravelers.map((person) => {
          const matchingTraveler = { ...person, route: `${search.origin} → ${search.destination}`, date: search.date };
          return (
          <article className="traveler-card" key={person.name}>
            <div className="traveler-main"><Avatar initials={person.initials} large /><div><div className="name-line"><h3>{person.name}</h3>{person.verified && <span title="Identidade verificada"><Icon name="shield" size={17} /></span>}</div><p><Rating value={person.rating} /> <i /> {person.trips} viagens realizadas</p><span className="positive">98% de avaliações positivas</span></div></div>
            <div className="trip-route"><span className="route-dots"><i /><b /><i /></span><div><strong>{city(search.origin)}</strong><small>{countryCode(search.origin)}</small><strong>{city(search.destination)}</strong><small>{countryCode(search.destination)}</small></div></div>
            <div className="trip-facts"><span><Icon name="calendar" /><small>DATA</small><strong>{search.date}</strong></span><span><Icon name="weight" /><small>ESPAÇO</small><strong>{person.space}</strong></span><span><small>A PARTIR DE</small><strong className="price">{person.price}</strong></span></div>
            <Button onClick={() => { onSelect(matchingTraveler); go("traveler"); }}>VER PERFIL <Icon name="arrow" /></Button>
          </article>
        )})}
      </section>
    </>
  );
}

function TravelerProfile({ go, traveler }: { go: (s: Screen) => void; traveler: Traveler }) {
  const [origin, destination] = traveler.route.split(" → ");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const reviews = [
    ["AC", "Ana Costa", "Excelente comunicação e muito cuidado com a encomenda.", "2 semanas atrás"],
    ["PL", "Pedro Lima", "Super pontual. Minha encomenda chegou em perfeito estado.", "1 mês atrás"],
    ["LM", "Lucas Martins", "Todo o processo foi transparente e a entrega aconteceu no horário combinado.", "2 meses atrás"],
    ["BS", "Beatriz Souza", "Viajante muito atenciosa e cuidadosa. Recomendo.", "3 meses atrás"],
  ];

  return (
    <div className="profile-layout">
      <section>
        <div className="profile-hero">
          <Avatar initials={traveler.initials} large /><div className="profile-name"><span className="verified-label"><Icon name="shield" size={15} /> IDENTIDADE VERIFICADA</span><h2>{traveler.name}</h2><p><Rating value={traveler.rating} /> <b>{traveler.rating} / 5</b> <i /> {traveler.trips} viagens realizadas</p></div>
          <div className="profile-score"><strong>{traveler.rating === "4,9" ? "98%" : "94%"}</strong><span>avaliações<br />positivas</span></div>
        </div>
        <div className="section-heading reviews-title"><div><span className="kicker">REPUTAÇÃO</span><h3>Últimas avaliações</h3></div><button onClick={() => setShowAllReviews(!showAllReviews)}>{showAllReviews ? "Mostrar menos" : "Ver mais avaliações"}</button></div>
        {reviews.slice(0, showAllReviews ? reviews.length : 2).map((review) => <article className="review" key={review[1]}><Avatar initials={review[0]} /><div><div><strong>{review[1]}</strong><span><Rating value="5,0" /></span></div><p>“{review[2]}”</p><small>{review[3]}</small></div></article>)}
        <div className="reputation-grid">{["Comunicação", "Pontualidade", "Cuidado", "Confiabilidade"].map((x, i) => <span key={x}><small>{x}</small><strong>{i === 2 ? "5,0" : "4,9"}</strong><Rating value="" /></span>)}</div>
      </section>
      <aside className="booking-card">
        <span className="kicker">PRÓXIMA VIAGEM</span>
        <div className="booking-route"><div><strong>{city(origin)}</strong><small>{countryCode(origin)}</small></div><span><Icon name="plane" /></span><div><strong>{city(destination)}</strong><small>{countryCode(destination)}</small></div></div>
        <div className="booking-data"><span><Icon name="calendar" /><small>DATA</small><strong>{traveler.date}</strong></span><span><Icon name="weight" /><small>ESPAÇO DISPONÍVEL</small><strong>{traveler.space}</strong></span></div>
        <div className="booking-price"><span>Preço por kg</span><strong>{traveler.price.replace("/kg", "")}<small>/kg</small></strong></div>
        <Button wide onClick={() => go("request")}>SOLICITAR TRANSPORTE <Icon name="arrow" /></Button>
        <p className="safe-line"><Icon name="shield" size={16} /> Solicitação segura e sem compromisso</p>
      </aside>
    </div>
  );
}

function RequestTransport({ go, traveler, shipment, onChange, onSubmit }: { go: (s: Screen) => void; traveler: Traveler; shipment: ShipmentData; onChange: (shipment: ShipmentData) => void; onSubmit: () => void }) {
  const update = (key: keyof ShipmentData, value: string) => onChange({ ...shipment, [key]: value });
  const pricePerKg = numericValue(traveler.price);
  const total = numericValue(shipment.weight) * pricePerKg;

  return (
    <div className="page-grid request-layout">
      <section className="panel main-panel">
        <div className="summary-user"><Avatar initials={traveler.initials} /><div><small>VIAJANTE</small><strong>{traveler.name} <span><Icon name="shield" size={15} /></span></strong><p><Rating value={traveler.rating} /> · {traveler.route} · {traveler.date}</p></div></div>
        <div className="form-grid two"><Field label="Tipo de mercadoria" placeholder="Eletrônico" icon="box" value={shipment.itemType} onChange={(value) => update("itemType", value)} /><Field label="Peso" placeholder="2 kg" icon="weight" value={shipment.weight} onChange={(value) => update("weight", value)} /></div>
        <Field label="Descrição da mercadoria" placeholder="Ex.: Fone de ouvido sem fio, na embalagem original." textarea value={shipment.description} onChange={(value) => update("description", value)} />
        <Field label="Valor declarado" placeholder="R$ 800,00" value={shipment.declaredValue} onChange={(value) => update("declaredValue", value)} />
        <label className="checkbox-line"><input type="checkbox" defaultChecked /><span><strong>Li e concordo com as regras de transporte.</strong><small>Confirmo que a mercadoria é permitida e que as informações são verdadeiras.</small></span></label>
      </section>
      <aside className="order-summary">
        <span className="kicker">RESUMO</span><h3>Sua solicitação</h3>
        <div className="summary-row"><span>Transporte</span><strong>{shipment.weight || "0 kg"} × {currency(pricePerKg)}</strong></div>
        <div className="summary-row"><span>Taxa de proteção</span><strong>Inclusa</strong></div>
        <div className="total-row"><span>Total</span><strong>{currency(total)}</strong></div>
        <Button wide onClick={() => { onSubmit(); go("tracking"); }}>ENVIAR SOLICITAÇÃO <Icon name="arrow" /></Button>
        <p><Icon name="shield" size={16} /> O pagamento só é liberado após a confirmação da entrega.</p>
      </aside>
    </div>
  );
}

function OfferTrip({ go, offer, onChange, onSubmit }: { go: (s: Screen) => void; offer: OfferData; onChange: (offer: OfferData) => void; onSubmit: () => void }) {
  const update = (key: keyof OfferData, value: string) => onChange({ ...offer, [key]: value });
  return (
    <div className="page-grid">
      <section className="panel main-panel">
        <div className="panel-title"><span className="number"><Icon name="plane" /></span><div><h2>Compartilhe sua próxima viagem</h2><p>Informe os detalhes e receba solicitações compatíveis.</p></div></div>
        <div className="route-fields"><Field label="Origem" placeholder="Recife, Brasil" icon="pin" value={offer.origin} onChange={(value) => update("origin", value)} /><span className="route-arrow"><Icon name="arrow" /></span><Field label="Destino" placeholder="Lisboa, Portugal" icon="pin" value={offer.destination} onChange={(value) => update("destination", value)} /></div>
        <div className="form-grid three"><Field label="Data da viagem" placeholder="15/11/2026" icon="calendar" value={offer.date} onChange={(value) => update("date", value)} /><Field label="Espaço disponível" placeholder="5 kg" icon="weight" value={offer.space} onChange={(value) => update("space", value)} /><Field label="Preço por kg" placeholder="R$ 40" value={offer.price} onChange={(value) => update("price", value)} /></div>
        <Field label="Observações" placeholder="Ex.: Posso transportar eletrônicos pequenos e documentos." textarea value={offer.notes} onChange={(value) => update("notes", value)} />
        <label className="checkbox-line"><input type="checkbox" defaultChecked /><span><strong>Aceito transportar apenas mercadorias permitidas.</strong><small>Vou conferir o conteúdo antes de receber a encomenda.</small></span></label>
        <Button wide onClick={() => { onSubmit(); go("requests"); }}>PUBLICAR VIAGEM <Icon name="arrow" /></Button>
      </section>
      <aside className="side-help"><span className="kicker">VIAJE E GANHE</span><h3>Você decide<br />o que levar</h3><p>Analise cada solicitação, converse com o remetente e só aceite quando se sentir seguro.</p><div className="trust-list">{["Você define o preço", "Escolha as encomendas", "Pagamento protegido"].map(x => <span key={x}><Icon name="check" /> {x}</span>)}</div></aside>
    </div>
  );
}

function Requests({ go, offer, shipment, requestStatus, onStatusChange }: { go: (s: Screen) => void; offer: OfferData; shipment: ShipmentData; requestStatus: "pending" | "accepted" | "refused"; onStatusChange: (status: "pending" | "accepted" | "refused") => void }) {
  const [tab, setTab] = useState<"pending" | "accepted" | "refused">(requestStatus);
  const visible = tab === requestStatus;

  const decide = (status: "accepted" | "refused") => {
    onStatusChange(status);
    setTab(status);
    if (status === "accepted") {
      go("tracking");
    }
  };

  return (
    <>
      <section className="trip-banner"><div><span className="kicker light">SUA PRÓXIMA VIAGEM</span><h2>{city(offer.origin)} <small>{countryCode(offer.origin)}</small> <Icon name="plane" /> {city(offer.destination)} <small>{countryCode(offer.destination)}</small></h2><p><Icon name="calendar" size={16} /> {offer.date} <i /> <Icon name="weight" size={16} /> {offer.space} disponíveis · {offer.price}/kg</p></div><span className="status inverse">VIAGEM PUBLICADA</span></section>
      <div className="section-heading request-heading"><div><span className="kicker">{requestStatus === "pending" ? "1 NOVA" : "ATUALIZADO"}</span><h3>Solicitações recebidas</h3></div><div className="tabs"><button className={tab === "pending" ? "active" : ""} onClick={() => setTab("pending")}>Pendentes</button><button className={tab === "accepted" ? "active" : ""} onClick={() => setTab("accepted")}>Aceitas</button><button className={tab === "refused" ? "active" : ""} onClick={() => setTab("refused")}>Recusadas</button></div></div>
      {visible ? <article className="request-card">
        <div className="request-user"><Avatar initials="JS" /><div><h3>João Silva</h3><p><Rating value="4,8" /> · 8 encomendas enviadas</p><span><Icon name="shield" size={15} /> Identidade verificada</span></div></div>
        <div className="request-details"><span><small>MERCADORIA</small><strong>{shipment.itemType}</strong></span><span><small>PESO</small><strong>{shipment.weight}</strong></span><span><small>VALOR DECLARADO</small><strong>{shipment.declaredValue}</strong></span><span><small>SEU GANHO</small><strong className="price">{currency(numericValue(shipment.weight) * numericValue(offer.price))}</strong></span></div>
        <div className="request-actions">{requestStatus === "pending" ? <><Button variant="danger" onClick={() => decide("refused")}>RECUSAR</Button><Button variant="primary" onClick={() => decide("accepted")}>ACEITAR <Icon name="check" /></Button></> : <span className={`decision-label ${requestStatus}`}><Icon name={requestStatus === "accepted" ? "check" : "clock"} size={16} /> {requestStatus === "accepted" ? "ACEITA" : "RECUSADA"}</span>}</div>
      </article> : <div className="list-empty"><Icon name={tab === "pending" ? "clock" : "box"} /><strong>Nenhuma solicitação {tab === "pending" ? "pendente" : tab === "accepted" ? "aceita" : "recusada"}</strong><span>As solicitações aparecerão aqui quando estiverem disponíveis.</span></div>}
    </>
  );
}

function Tracking({ go, traveler, shipment, route }: { go: (s: Screen) => void; traveler: Traveler; shipment: ShipmentData; route: { origin: string; destination: string; date: string } }) {
  const steps = [
    ["Solicitação aceita", "12 nov. · 14:32", "done"],
    ["Mercadoria recebida", "14 nov. · 18:10", "done"],
    ["Em viagem", `${route.date} · 09:45`, "current"],
    ["Chegou ao destino", `Previsão: ${route.date} · 18:20`, ""],
    ["Entregue", "Aguardando confirmação", ""],
  ];
  return (
    <div className="tracking-layout">
      <section>
        <div className="tracking-head"><div><span className="kicker">CÓDIGO DA ENCOMENDA</span><h2>#BG28491</h2></div><span className="status"><i /> EM VIAGEM</span></div>
        <div className="route-overview"><div><small>ORIGEM</small><strong>{city(route.origin)} <span>{countryCode(route.origin)}</span></strong></div><span className="flight-line"><i /><Icon name="plane" /><i /></span><div><small>DESTINO</small><strong>{city(route.destination)} <span>{countryCode(route.destination)}</span></strong></div></div>
        <div className="timeline">{steps.map(([name, time, state], i) => <div className={`timeline-step ${state}`} key={name}><span className="timeline-dot">{state === "done" ? <Icon name="check" size={15} /> : i + 1}</span><div><strong>{name}</strong><small>{time}</small></div>{state === "current" && <span className="moving">AGORA</span>}</div>)}</div>
      </section>
      <aside>
        <div className="carrier-card"><span className="kicker">TRANSPORTADORA</span><div><Avatar initials={traveler.initials} /><span><strong>{traveler.name}</strong><Rating value={traveler.rating} /></span><button aria-label={`Conversar com ${traveler.name}`} onClick={() => go("messages")}><Icon name="message" /></button></div><Button variant="secondary" wide onClick={() => go("traveler")}>VER DETALHES</Button></div>
        <div className="package-details"><span className="kicker">DETALHES</span><div><span>Mercadoria</span><strong>{shipment.itemType}</strong></div><div><span>Peso</span><strong>{shipment.weight}</strong></div><div><span>Valor declarado</span><strong>{shipment.declaredValue}</strong></div>{shipment.description && <div><span>Descrição</span><strong>{shipment.description}</strong></div>}</div>
        <Button wide onClick={() => go("delivery")}>SIMULAR CHEGADA <Icon name="arrow" /></Button>
      </aside>
    </div>
  );
}

function Delivery({ go, traveler, destination }: { go: (s: Screen) => void; traveler: Traveler; destination: string }) {
  return (
    <div className="success-page">
      <span className="success-icon"><Icon name="box" size={42} /><i><Icon name="check" size={16} /></i></span>
      <span className="kicker">ENTREGA REALIZADA</span><h2>Sua encomenda<br />chegou a {city(destination)}.</h2><p>A transportadora marcou a encomenda <strong>#BG28491</strong> como entregue.</p>
      <div className="delivered-card"><Avatar initials={traveler.initials} /><div><small>TRANSPORTADORA</small><strong>{traveler.name}</strong><Rating value={traveler.rating} /></div><span><small>ENTREGUE EM</small><strong>Hoje · 18:42</strong></span></div>
      <div className="confirm-box"><h3>Você recebeu sua encomenda?</h3><p>Confirme apenas se ela estiver em suas mãos e em bom estado.</p><Button wide onClick={() => go("rating")}>CONFIRMAR RECEBIMENTO <Icon name="check" /></Button><button onClick={() => go("messages")}>Preciso de ajuda</button></div>
    </div>
  );
}

function RatingScreen({ go, traveler }: { go: (s: Screen) => void; traveler: Traveler }) {
  const [score, setScore] = useState(0);
  const [criteria, setCriteria] = useState<Record<string, number>>({});
  const items = ["Comunicação", "Cuidado com a encomenda", "Pontualidade", "Confiabilidade"];

  return (
    <div className="rating-page">
      <Avatar initials={traveler.initials} large /><span className="kicker">{traveler.name.toUpperCase()}</span><h2>Avalie sua experiência</h2><p>Como foi transportar sua encomenda com {traveler.name.split(" ")[0]}?</p>
      <div className="stars" aria-label="Avaliação de cinco estrelas">{[1,2,3,4,5].map(n => <button className={n <= score ? "selected" : ""} aria-label={`${n} estrela${n > 1 ? "s" : ""}`} key={n} onClick={() => setScore(n)}><Icon name="star" size={32} /></button>)}</div>
      <div className="criteria">{items.map(item => <div key={item}><span>{item}</span><span>{[1,2,3,4,5].map(n => <button className={n <= (criteria[item] || 0) ? "selected" : ""} aria-label={`${item}: ${n} estrela${n > 1 ? "s" : ""}`} key={n} onClick={() => setCriteria({ ...criteria, [item]: n })}><Icon name="star" size={18} /></button>)}</span></div>)}</div>
      <div className="rating-comment"><Field label="Comentário" placeholder="Conte como foi sua experiência (opcional)." textarea /></div>
      <Button wide onClick={() => score > 0 && go("home")}>ENVIAR AVALIAÇÃO <Icon name="arrow" /></Button>
      {score === 0 && <span className="rating-hint">Selecione uma nota geral para enviar.</span>}
      <p className="mutual"><Icon name="shield" size={16} /> {traveler.name.split(" ")[0]} também poderá avaliar você como remetente.</p>
    </div>
  );
}

function UserProfile({ go }: { go: (s: Screen) => void }) {
  const [selected, setSelected] = useState("profile");
  const [actionDone, setActionDone] = useState("");
  const flowDetails: Record<string, { step: string; title: string; description: string; action: string; icon: IconName; items: string[] }> = {
    edit: { step: "02", title: "Editar dados", description: "Atualização das informações pessoais e preferências de contato.", action: "Salvar alterações", icon: "user", items: ["Nome e fotografia", "Telefone e e-mail", "Idioma e localização"] },
    verification: { step: "03", title: "Verificar identidade", description: "Etapa de segurança necessária para enviar e transportar encomendas.", action: "Revisar documentos", icon: "shield", items: ["Documento oficial", "Validação facial", "Telefone confirmado"] },
    profile: { step: "01", title: "Perfil principal", description: "Visão consolidada da conta, reputação e atividade do usuário.", action: "Tela atual", icon: "user", items: ["Dados públicos", "Resumo de reputação", "Atalhos da conta"] },
    reputation: { step: "04", title: "Reputação", description: "Avaliações recebidas após cada envio ou transporte concluído.", action: "Ver avaliações", icon: "star", items: ["Nota geral 4,8", "96% positivas", "Critérios detalhados"] },
    history: { step: "05", title: "Histórico", description: "Registro rastreável de todas as atividades realizadas na plataforma.", action: "Abrir histórico", icon: "clock", items: ["8 encomendas enviadas", "4 transportes realizados", "12 viagens concluídas"] },
    settings: { step: "06", title: "Segurança e ajustes", description: "Controle de privacidade, notificações, acesso e preferências da conta.", action: "Abrir ajustes", icon: "shield", items: ["Senha e acesso", "Notificações", "Privacidade"] },
  };
  const detail = flowDetails[selected];
  const nodes = [
    { id: "edit", className: "node-edit" },
    { id: "verification", className: "node-verification" },
    { id: "profile", className: "node-profile" },
    { id: "reputation", className: "node-reputation" },
    { id: "history", className: "node-history" },
    { id: "settings", className: "node-settings" },
  ];

  return (
    <section className="flow-page">
      <div className="flow-intro">
        <div><span className="kicker">MAPA DE FLUXO · PERFIL DO USUÁRIO</span><h2>Jornada da conta e reputação</h2><p>Selecione uma etapa para visualizar sua função dentro da experiência.</p></div>
        <div className="flow-legend"><span><i className="main-dot" /> Tela principal</span><span><i /> Sub-tela</span><span><b>→</b> Navegação</span></div>
      </div>

      <div className="flow-workspace">
        <div className="flow-canvas">
          <span className="flow-label label-account">GESTÃO DA CONTA</span>
          <span className="flow-label label-trust">CONFIANÇA E ATIVIDADE</span>
          <svg className="flow-connectors" viewBox="0 0 900 530" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0 0 L8 4 L0 8 Z" fill="#8c9088" />
              </marker>
            </defs>
            <path d="M190 145 C270 145 280 245 365 245" />
            <path d="M190 385 C270 385 280 285 365 285" />
            <path d="M535 245 C620 245 630 145 710 145" />
            <path d="M535 265 L710 265" />
            <path d="M535 285 C620 285 630 385 710 385" />
          </svg>
          {nodes.map(({ id, className }) => {
            const node = flowDetails[id];
            const isMain = id === "profile";
            return (
              <button key={id} className={`flow-node ${className} ${isMain ? "main-node" : ""} ${selected === id ? "selected" : ""}`} onClick={() => { setSelected(id); setActionDone(""); }}>
                <span className="node-top"><small>{node.step}</small><i><Icon name={node.icon} size={isMain ? 21 : 17} /></i></span>
                {isMain && <Avatar initials="JS" />}
                <strong>{node.title}</strong>
                <p>{isMain ? "João Silva · 4,8 / 5" : node.description}</p>
                <span className="node-link">{isMain ? "NÓ CENTRAL" : "ABRIR ETAPA"} <Icon name="arrow" size={13} /></span>
              </button>
            );
          })}
        </div>

        <aside className="flow-inspector">
          <div className="inspector-head"><span>{detail.step}</span><i><Icon name={detail.icon} /></i></div>
          <span className="kicker">DETALHE DA ETAPA</span>
          <h3>{detail.title}</h3>
          <p>{detail.description}</p>
          <div className="inspector-items">
            {detail.items.map(item => <span key={item}><Icon name="check" size={14} /> {item}</span>)}
          </div>
          {selected === "history" ? (
            <Button wide onClick={() => go("tracking")}>{detail.action.toUpperCase()} <Icon name="arrow" /></Button>
          ) : selected === "reputation" ? (
            <Button wide onClick={() => go("rating")}>{detail.action.toUpperCase()} <Icon name="arrow" /></Button>
          ) : (
            <Button wide onClick={() => setActionDone(`${detail.title}: ação concluída no protótipo.`)}>{detail.action.toUpperCase()} <Icon name="arrow" /></Button>
          )}
          {actionDone && <span className="action-feedback"><Icon name="check" size={14} /> {actionDone}</span>}
          <small className="inspector-note"><Icon name="route" size={14} /> Retorna ao perfil após concluir a etapa.</small>
        </aside>
      </div>

      <div className="flow-summary">
        <span><b>01</b><small>ENTRADA</small><strong>Perfil principal</strong></span>
        <Icon name="arrow" />
        <span><b>02–03</b><small>CONFIGURAÇÃO</small><strong>Dados e identidade</strong></span>
        <Icon name="arrow" />
        <span><b>04–05</b><small>ACOMPANHAMENTO</small><strong>Reputação e histórico</strong></span>
        <Icon name="arrow" />
        <span><b>06</b><small>CONTROLE</small><strong>Segurança e ajustes</strong></span>
      </div>
    </section>
  );
}

function Messages({ go, traveler }: { go: (s: Screen) => void; traveler: Traveler }) {
  const [draft, setDraft] = useState("");
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setSentMessages([...sentMessages, text]);
    setDraft("");
  };

  return (
    <div className="messages-layout">
      <aside className="conversation-list">
        <span className="kicker">CONVERSAS</span>
        <button className="active"><Avatar initials={traveler.initials} /><span><strong>{traveler.name}</strong><small>A encomenda está a caminho.</small></span><i>1</i></button>
      </aside>
      <section className="conversation">
        <div className="conversation-head"><Avatar initials={traveler.initials} /><span><strong>{traveler.name}</strong><small><i /> Online agora</small></span></div>
        <div className="message-stream">
          <span className="message received">Olá, João! Sua encomenda está segura e já estou a caminho do destino.<small>09:45</small></span>
          <span className="message sent">Ótimo, obrigado por avisar. Boa viagem!<small>09:48</small></span>
          <span className="message received">Chego a Lisboa às 18:20. Aviso assim que puder fazer a entrega.<small>10:02</small></span>
          {sentMessages.map((message, index) => <span className="message sent" key={`${message}-${index}`}>{message}<small>agora</small></span>)}
        </div>
        <div className="message-compose">
          <input aria-label="Mensagem" placeholder="Escreva uma mensagem..." value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && send()} />
          <button aria-label="Enviar mensagem" onClick={send}><Icon name="arrow" /></button>
        </div>
        <button className="back-to-search" onClick={() => go("search")}>Explorar outras viagens</button>
      </section>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [selectedTraveler, setSelectedTraveler] = useState<Traveler>(travelerCards[0]);
  const [search, setSearch] = useState<SearchData>({
    origin: "Recife, Brasil",
    destination: "Lisboa, Portugal",
    date: "15/11/2026",
    weight: "2 kg",
    itemType: "Eletrônico",
  });
  const [shipment, setShipment] = useState<ShipmentData>({
    itemType: "Eletrônico",
    weight: "2 kg",
    description: "",
    declaredValue: "R$ 800,00",
  });
  const [offer, setOffer] = useState<OfferData>({
    origin: "Recife, Brasil",
    destination: "Lisboa, Portugal",
    date: "15/11/2026",
    space: "5 kg",
    price: "R$ 40",
    notes: "",
  });
  const [activeFlow, setActiveFlow] = useState<"sender" | "traveler">("sender");
  const [requestStatus, setRequestStatus] = useState<"pending" | "accepted" | "refused">("pending");
  const go = (next: Screen) => {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (screen === "splash") return <Splash go={go} />;
  if (screen === "login") return <Login go={go} />;

  const [selectedOrigin, selectedDestination] = selectedTraveler.route.split(" → ");
  const trackingRoute = activeFlow === "traveler"
    ? { origin: offer.origin, destination: offer.destination, date: offer.date }
    : { origin: selectedOrigin, destination: selectedDestination, date: selectedTraveler.date };

  const views: Record<string, ReactNode> = {
    home: <Home go={go} traveler={selectedTraveler} shipment={shipment} />,
    search: <SearchTrip go={go} data={search} onChange={setSearch} onSubmit={() => { setActiveFlow("sender"); setShipment((current) => ({ ...current, weight: search.weight, itemType: search.itemType })); }} />,
    results: <Results go={go} onSelect={setSelectedTraveler} search={search} />,
    traveler: <TravelerProfile go={go} traveler={selectedTraveler} />,
    request: <RequestTransport go={go} traveler={selectedTraveler} shipment={shipment} onChange={setShipment} onSubmit={() => setActiveFlow("sender")} />,
    offer: <OfferTrip go={go} offer={offer} onChange={setOffer} onSubmit={() => { setActiveFlow("traveler"); setRequestStatus("pending"); }} />,
    requests: <Requests go={go} offer={offer} shipment={shipment} requestStatus={requestStatus} onStatusChange={(status) => { setRequestStatus(status); if (status === "accepted") setActiveFlow("traveler"); }} />,
    tracking: <Tracking go={go} traveler={selectedTraveler} shipment={shipment} route={trackingRoute} />,
    delivery: <Delivery go={go} traveler={selectedTraveler} destination={trackingRoute.destination} />,
    rating: <RatingScreen go={go} traveler={selectedTraveler} />,
    profile: <UserProfile go={go} />,
    messages: <Messages go={go} traveler={selectedTraveler} />,
  };

  return <AppShell screen={screen} go={go}>{views[screen]}</AppShell>;
}
