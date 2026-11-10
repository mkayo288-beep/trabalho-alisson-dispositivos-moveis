import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react"
import { migrationArchive } from "./migration"
import {
  Avatar,
  Button,
  Empty,
  ErrorText,
  Field,
  Icon,
  type IconName,
} from "./ui"
import {
  changeStatus,
  receivedReviews,
  reconcileTrips,
  reviewAverage,
  tripState,
  tripRating,
  cities,
  city,
  dateLabel,
  findTrips,
  initialStore,
  itemTypes,
  labels,
  money,
  remaining,
  routeError,
  terminal,
  timeLabel,
  today,
  uid,
  type Profile,
  type Review,
  type Search,
  type Shipment,
  type Status,
  type Store,
  type Trip,
} from "./domain"

type Page = "home" | "search" | "results" | "traveler" | "request" | "offer" | "requests" | "tracking" | "delivery" | "rating" | "profile" | "messages"
type Account = {
  name: string
  email: string
  hash: string
  salt: string
  recoveryHash: string
}
interface Session {
  name: string
  email: string
  demo: boolean
}
interface StageAction {
  status: Status
  text: string
}
interface NavigationItem {
  page: Page
  label: string
  icon: IconName
}
const read = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback
  } catch {
    return fallback
  }
}
const save = (key: string, value: unknown) =>
  localStorage.setItem(key, JSON.stringify(value))
async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 120000,
      hash: "SHA-256",
    },
    key,
    256,
  )
  return Array.from(new Uint8Array(bits), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("")
}
function download(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  )
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function RequestTransport({ search }: { search: Search }) {
  const {
    store,
    session,
    selectedTrip: trip,
    update,
    openShipment,
    notify,
  } = useWorkspace()
  const [item, setItem] = useState(search.itemType),
    [weight, setWeight] = useState(search.weight),
    [description, setDescription] = useState(""),
    [value, setValue] = useState("")
  const [agreed, setAgreed] = useState(false),
    [error, setError] = useState("")
  const submitting = useRef(false)
  if (!trip) return <Empty title="Selecione uma viagem primeiro" />
  const total = Number(weight) * trip.price
  function submit(e: FormEvent) {
    e.preventDefault()
    if (submitting.current || !trip) return
    if (trip.acceptedTypes && !trip.acceptedTypes.includes(item)) {
      setError("Este viajante não aceita a categoria selecionada.")
      return
    }
    if (!agreed) {
      setError("Você precisa concordar com as regras de transporte.")
      return
    }
    if (
      trip.ownerId === session.email ||
      !trip.active ||
      trip.date < today() ||
      Number(weight) <= 0 ||
      Number(weight) > remaining(trip, store.shipments)
    ) {
      setError(
        "A viagem não está disponível para esse peso. Confira o espaço restante.",
      )
      return
    }
    if (
      !description.trim() ||
      !Number.isFinite(Number(value)) ||
      Number(value) < 0
    ) {
      setError("Descreva a mercadoria e informe um valor declarado válido.")
      return
    }
    submitting.current = true
    const id = uid("BG"),
      at = new Date().toISOString()
    const shipment: Shipment = {
      id,
      tripId: trip.id,
      senderId: session.email,
      sender: store.profile.name,
      itemType: item,
      weight: Number(weight),
      description: description.trim(),
      declaredValue: Number(value),
      status: "pending",
      createdAt: at,
      events: { pending: at },
      price: total,
    }
    update((current) => ({
      ...current,
      shipments: [...current.shipments, shipment],
    }))
    notify("Solicitação enviada. Aguarde o aceite do viajante.")
    openShipment(id)
  }
  return (
    <form className="page-grid request-layout" onSubmit={submit}>
      <section className="panel main-panel">
        <div className="summary-user">
          <Avatar name={trip.name} />
          <div>
            <small>VIAJANTE</small>
            <strong>{trip.name}</strong>
            <p>
              {trip.origin} → {trip.destination} · {dateLabel(trip.date)}
            </p>
          </div>
        </div>
        <div className="form-grid two">
          <Field
            label="Tipo de mercadoria"
            value={item}
            options={trip.acceptedTypes || itemTypes}
            onValue={setItem}
          />
          <Field
            label="Peso (kg)"
            type="number"
            min="0.1"
            step="0.1"
            max={remaining(trip, store.shipments)}
            value={weight}
            onValue={setWeight}
            required
          />
        </div>
        <Field
          label="Descrição da mercadoria"
          multiline
          placeholder="Descreva o conteúdo e a embalagem."
          value={description}
          onValue={setDescription}
          required
        />
        <Field
          label="Valor declarado (R$)"
          type="number"
          min="0"
          step="0.01"
          value={value}
          onValue={setValue}
          required
        />
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
          />
          <span>Li as regras e confirmo que o conteúdo é permitido.</span>
        </label>
        <ErrorText error={error} />
      </section>
      <aside className="order-summary">
        <span className="kicker">RESUMO</span>
        <h3>Sua solicitação</h3>
        <div className="summary-row">
          <span>Transporte</span>
          <strong>
            {weight || 0} kg × {money(trip.price)}
          </strong>
        </div>
        <div className="total-row">
          <span>Total combinado</span>
          <strong>{money(total || 0)}</strong>
        </div>
        <Button type="submit" wide>
          ENVIAR SOLICITAÇÃO
          <Icon name="arrow" />
        </Button>
        <p>
          Esta versão registra o valor combinado. Não realiza cobrança ou
          transferência de dinheiro.
        </p>
      </aside>
    </form>
  )
}
function OfferTrip() {
  const { store, session, update, go, notify } = useWorkspace()
  const [data, setData] = useState({
    origin: cities[0],
    destination: cities[1],
    date: today(),
    space: "5",
    price: "40",
    notes: "",
  })
  const [agreed, setAgreed] = useState(false),
    [error, setError] = useState("")
  const [acceptedTypes, setAcceptedTypes] = useState<string[]>(itemTypes)
  const submitted = useRef(false)
  const field = (key: keyof typeof data, value: string) =>
    setData({ ...data, [key]: value })
  return (
    <form
      className="page-grid"
      onSubmit={(e) => {
        e.preventDefault()
        if (submitted.current) return
        const problem = routeError(
          data.origin,
          data.destination,
          data.date,
          Number(data.space),
        )
        if (
          problem ||
          Number(data.price) <= 0 ||
          !agreed ||
          !acceptedTypes.length
        ) {
          setError(
            problem ||
              "Informe um preço positivo, selecione as mercadorias aceitas e aceite as regras.",
          )
          return
        }
        submitted.current = true
        const trip: Trip = {
          ...data,
          id: uid("T"),
          ownerId: session.email,
          name: store.profile.name,
          space: Number(data.space),
          price: Number(data.price),
          rating: 0,
          active: true,
          acceptedTypes,
        }
        update((current) => ({ ...current, trips: [...current.trips, trip] }))
        notify("Viagem publicada e disponível para busca.")
        go("requests")
      }}
    >
      <section className="panel main-panel">
        <div className="panel-title">
          <span className="number">
            <Icon name="plane" />
          </span>
          <div>
            <h2>Compartilhe sua próxima viagem</h2>
            <p>Defina sua rota, capacidade e preço.</p>
          </div>
        </div>
        <div className="route-fields">
          <Field
            label="Origem"
            value={data.origin}
            suggestions={cities}
            required
            onValue={(v) => field("origin", v)}
          />
          <span className="route-arrow">
            <Icon name="arrow" />
          </span>
          <Field
            label="Destino"
            value={data.destination}
            suggestions={cities}
            required
            onValue={(v) => field("destination", v)}
          />
        </div>
        <div className="form-grid three">
          <Field
            label="Data da viagem"
            type="date"
            min={today()}
            value={data.date}
            required
            onValue={(v) => field("date", v)}
          />
          <Field
            label="Espaço disponível (kg)"
            type="number"
            min="0.1"
            max="30"
            step="0.1"
            value={data.space}
            required
            onValue={(v) => field("space", v)}
          />
          <Field
            label="Preço por kg (R$)"
            type="number"
            min="0.01"
            step="0.01"
            value={data.price}
            required
            onValue={(v) => field("price", v)}
          />
        </div>
        <Field
          label="Observações"
          multiline
          value={data.notes}
          onValue={(v) => field("notes", v)}
          placeholder="Ponto de encontro e cuidados."
        />
        <fieldset className="item-selector">
          <legend>Mercadorias que você aceita transportar</legend>
          <p>Toque para selecionar ou remover uma categoria.</p>
          <div className="filter-row">
            {itemTypes.map((item) => (
              <button
                type="button"
                key={item}
                className={acceptedTypes.includes(item) ? "selected" : ""}
                aria-pressed={acceptedTypes.includes(item)}
                onClick={() =>
                  setAcceptedTypes((current) =>
                    current.includes(item)
                      ? current.filter((t) => t !== item)
                      : [...current, item],
                  )
                }
              >
                {item}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
          />
          Aceito transportar apenas mercadorias permitidas.
        </label>
        <ErrorText error={error} />
        <Button type="submit" wide>
          PUBLICAR VIAGEM
          <Icon name="arrow" />
        </Button>
      </section>
      <aside className="side-help">
        <span className="kicker light">VIAJE E GANHE</span>
        <h3>Você decide o que levar</h3>
        <p>
          Analise cada solicitação antes de aceitar. O espaço é reservado por
          encomenda e liberado quando uma solicitação é recusada ou cancelada.
        </p>
      </aside>
    </form>
  )
}
function TripEditor({ trip }: { trip: Trip }) {
  const { store, update, notify } = useWorkspace()
  const [editing, setEditing] = useState(false),
    [price, setPrice] = useState(String(trip.price)),
    [space, setSpace] = useState(String(trip.space)),
    [notes, setNotes] = useState(trip.notes),
    [error, setError] = useState("")
  const reserved = trip.space - remaining(trip, store.shipments)
  if (!editing)
    return (
      <Button variant="secondary" onClick={() => setEditing(true)}>
        EDITAR CONDIÇÕES DA VIAGEM
      </Button>
    )
  return (
    <form
      className="trip-editor form-stack"
      onSubmit={(e) => {
        e.preventDefault()
        if (
          Number(space) < reserved ||
          Number(space) <= 0 ||
          Number(price) <= 0
        ) {
          setError(
            `A capacidade deve comportar os ${reserved} kg já reservados, e o preço precisa ser positivo.`,
          )
          return
        }
        update((current) => ({
          ...current,
          trips: current.trips.map((t) =>
            t.id === trip.id
              ? {
                  ...t,
                  price: Number(price),
                  space: Number(space),
                  notes: notes.trim(),
                }
              : t,
          ),
        }))
        setEditing(false)
        notify(
          "Viagem atualizada. Valores de solicitações anteriores foram preservados.",
        )
      }}
    >
      <h3>Condições para novas solicitações</h3>
      <p className="muted">
        A rota e a data são mantidas. A capacidade não pode ser menor que o
        espaço reservado; o preço combinado das encomendas existentes não muda.
      </p>
      <div className="form-grid two">
        <Field
          label="Capacidade total (kg)"
          type="number"
          value={space}
          min={Math.max(0.1, reserved)}
          max="30"
          step="0.1"
          required
          onValue={setSpace}
        />
        <Field
          label="Novo preço por kg (R$)"
          type="number"
          value={price}
          min="0.01"
          step="0.01"
          required
          onValue={setPrice}
        />
      </div>
      <Field
        label="Observações da viagem"
        multiline
        value={notes}
        onValue={setNotes}
      />
      <ErrorText error={error} />
      <div className="inline-actions">
        <Button type="submit">SALVAR CONDIÇÕES</Button>
        <Button variant="text" onClick={() => setEditing(false)}>
          CANCELAR EDIÇÃO
        </Button>
      </div>
    </form>
  )
}
function Trips() {
  const { store, myShipments, session, update, notify, openShipment, go } =
    useWorkspace()
  const [tab, setTab] = useState("active"),
    [confirmTrip, setConfirmTrip] = useState("")
  const filter = (s: Shipment, id: string) =>
    id === "active"
      ? !terminal(s.status)
      : id === "completed"
        ? s.status === "completed"
        : ["cancelled", "refused"].includes(s.status)
  function sample(trip: Trip) {
    if (remaining(trip, store.shipments) < 1) {
      notify("Esta viagem não tem espaço disponível.")
      return
    }
    const id = uid("BG"),
      at = new Date().toISOString()
    update((current) => ({
      ...current,
      shipments: [
        ...current.shipments,
        {
          id,
          tripId: trip.id,
          senderId: "sample-sender",
          sender: "Ana Costa (exemplo)",
          itemType: trip.acceptedTypes?.[0] || "Documentos",
          weight: 1,
          description:
            "Envelope de documentos para testar o recebimento de solicitações.",
          declaredValue: 50,
          price: trip.price,
          status: "pending",
          createdAt: at,
          events: { pending: at },
        },
      ],
    }))
    openShipment(id)
    notify("Solicitação de exemplo adicionada à sua viagem.")
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="kicker">PAINEL DE VIAGENS</span>
          <h2>Envios e transportes</h2>
        </div>
        <Button onClick={() => go("offer")}>PUBLICAR VIAGEM</Button>
      </div>
      <div
        className="filter-row"
        role="tablist"
        aria-label="Filtrar encomendas"
      >
        {[
          ["active", "Em andamento"],
          ["completed", "Concluídas"],
          ["cancelled", "Canceladas / recusadas"],
        ].map(([id, label]) => (
          <button
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "selected" : ""}
            key={id}
            onClick={() => setTab(id)}
          >
            {label} ({myShipments.filter((s) => filter(s, id)).length})
          </button>
        ))}
      </div>
      <div className="record-list">
        {myShipments
          .filter((s) => filter(s, tab))
          .map((s) => (
            <ShipmentRow key={s.id} shipment={s} />
          ))}
        {!myShipments.some((s) => filter(s, tab)) && (
          <Empty title="Nenhuma encomenda nesta categoria" />
        )}
      </div>
      <div className="section-heading reviews-title">
        <h3>Viagens que você publicou</h3>
      </div>
      <div className="record-list">
        {store.trips
          .filter((t) => t.ownerId === session.email)
          .map((trip) => (
            <article className="panel main-panel" key={trip.id}>
              <div className="section-heading">
                <h3>
                  {trip.origin} → {trip.destination}
                </h3>
                <span className="status">
                  {tripState(trip, store.shipments)}
                </span>
              </div>
              <p>
                {dateLabel(trip.date)} · {remaining(trip, store.shipments)} de{" "}
                {trip.space} kg disponíveis · {money(trip.price)}/kg
              </p>
              <p>{trip.notes}</p>
              {trip.active && <TripEditor trip={trip} />}
              {trip.active && (
                <div className="inline-actions">
                  <Button variant="secondary" onClick={() => sample(trip)}>
                    TESTAR COM SOLICITAÇÃO DE EXEMPLO
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setConfirmTrip(trip.id)}
                  >
                    ENCERRAR PUBLICAÇÃO
                  </Button>
                </div>
              )}
              {confirmTrip === trip.id && (
                <div className="confirm-box">
                  <p>
                    Encerrar impede novas solicitações. As encomendas em
                    andamento continuam disponíveis.
                  </p>
                  <Button
                    variant="danger"
                    onClick={() => {
                      update((current) => ({
                        ...current,
                        trips: current.trips.map((t) =>
                          t.id === trip.id ? { ...t, active: false } : t,
                        ),
                      }))
                      setConfirmTrip("")
                      notify("Publicação encerrada.")
                    }}
                  >
                    CONFIRMAR ENCERRAMENTO
                  </Button>
                  <Button variant="text" onClick={() => setConfirmTrip("")}>
                    VOLTAR
                  </Button>
                </div>
              )}
            </article>
          ))}
        {!store.trips.some((t) => t.ownerId === session.email) && (
          <Empty title="Nenhuma viagem publicada por você" />
        )}
      </div>
    </>
  )
}
function Tracking() {
  const {
    store,
    session,
    selectedShipment: s,
    status,
    go,
    openShipment,
  } = useWorkspace()
  const [cancel, setCancel] = useState(false)
  if (!s) return <Empty title="Selecione uma encomenda em Viagens" />
  const trip = store.trips.find((t) => t.id === s.tripId)!
  const isSender = s.senderId === session.email,
    isTraveler = trip.ownerId === session.email,
    simulation = trip.ownerId.startsWith("sample")
  const stages: [Status, string][] = [
    ["pending", "Solicitação enviada"],
    ["accepted", "Solicitação aceita"],
    ["received", "Mercadoria recebida"],
    ["in_transit", "Em viagem"],
    ["arrived", "Chegou ao destino"],
    ["completed", "Recebimento confirmado"],
  ]
  const next: Partial<Record<Status, StageAction>> = {
    pending: { status: "accepted", text: "ACEITAR SOLICITAÇÃO" },
    accepted: { status: "received", text: "CONFIRMAR COLETA DA MERCADORIA" },
    received: { status: "in_transit", text: "INICIAR VIAGEM" },
    in_transit: { status: "arrived", text: "MARCAR CHEGADA AO DESTINO" },
  }
  const action = next[s.status],
    review = store.reviews.find((r) => r.shipmentId === s.id)
  return (
    <div className="tracking-layout">
      <section>
        <div className="tracking-head">
          <div>
            <span className="kicker">CÓDIGO DA ENCOMENDA</span>
            <h2>#{s.id}</h2>
          </div>
          <StatusBadge status={s.status} />
        </div>
        <Route trip={trip} />
        <div className="timeline">
          {stages.map(([key, label]) => (
            <div
              className={`timeline-step ${s.events[key] ? "done" : ""} ${
                s.status === key ? "current" : ""
              }`}
              key={key}
            >
              <span className="timeline-dot">
                {s.events[key] ? (
                  <Icon name="check" size={15} />
                ) : (
                  <Icon name="clock" size={15} />
                )}
              </span>
              <div>
                <strong>{label}</strong>
                <small>{timeLabel(s.events[key])}</small>
              </div>
              {s.status === key && (
                <span className="moving">
                  {terminal(s.status) ? "FINALIZADA" : "AGORA"}
                </span>
              )}
            </div>
          ))}
        </div>
        {["cancelled", "refused"].includes(s.status) && (
          <div className="confirm-box">
            <h3>{labels[s.status]}</h3>
            <p>
              {timeLabel(s.events[s.status])}. O espaço reservado foi liberado.
            </p>
          </div>
        )}
      </section>
      <aside>
        <div className="carrier-card">
          <span className="kicker">
            {isTraveler ? "REMETENTE" : "VIAJANTE"}
          </span>
          <div>
            <Avatar name={isTraveler ? s.sender : trip.name} />
            <span>
              <strong>{isTraveler ? s.sender : trip.name}</strong>
              <small>
                {simulation ? "Viagem de exemplo" : "Contato pela conversa"}
              </small>
            </span>
            <button aria-label="Abrir conversa" onClick={() => go("messages")}>
              <Icon name="message" />
            </button>
          </div>
        </div>
        <div className="package-details">
          <span className="kicker">DETALHES</span>
          {[
            ["Mercadoria", s.itemType],
            ["Descrição", s.description],
            ["Peso", `${s.weight} kg`],
            ["Valor declarado", money(s.declaredValue)],
            ["Total combinado", money(s.price)],
            ["Data da viagem", dateLabel(trip.date)],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="action-stack">
          {action && (isTraveler || simulation) && (
            <>
              <Button wide onClick={() => status(s.id, action.status)}>
                {simulation ? `SIMULAR: ${action.text}` : action.text}
                <Icon name="arrow" />
              </Button>
              {simulation && (
                <p className="muted">
                  Esta ação simula a etapa do viajante na viagem de exemplo.
                </p>
              )}
            </>
          )}
          {s.status === "pending" && (isTraveler || simulation) && (
            <Button
              variant="danger"
              wide
              onClick={() => status(s.id, "refused")}
            >
              {simulation ? "SIMULAR RECUSA" : "RECUSAR SOLICITAÇÃO"}
            </Button>
          )}
          {s.status === "arrived" && isSender && (
            <Button wide onClick={() => go("delivery")}>
              CONFIRMAR RECEBIMENTO
              <Icon name="check" />
            </Button>
          )}
          {s.status === "arrived" && !isSender && (
            <p>Aguardando a confirmação do remetente.</p>
          )}
          {s.status === "arrived" && s.senderId === "sample-sender" && (
            <Button wide onClick={() => status(s.id, "completed")}>
              SIMULAR CONFIRMAÇÃO DO REMETENTE
            </Button>
          )}
          {s.status === "completed" && (
            <div className="confirm-box" role="status">
              <h3>Viagem concluída</h3>
              <p>Recebimento confirmado em {timeLabel(s.events.completed)}.</p>
              {isSender && (
                <Button wide variant="secondary" onClick={() => go("rating")}>
                  {review ? "VER AVALIAÇÃO" : "AVALIAR TRANSPORTE"}
                </Button>
              )}
            </div>
          )}
          {["pending", "accepted"].includes(s.status) &&
            (isSender || isTraveler) && (
              <Button variant="danger" onClick={() => setCancel(true)}>
                CANCELAR SOLICITAÇÃO
              </Button>
            )}
          {cancel && (
            <div className="confirm-box">
              <p>Deseja cancelar esta solicitação? O espaço será liberado.</p>
              <Button
                variant="danger"
                onClick={() => {
                  status(s.id, "cancelled")
                  setCancel(false)
                }}
              >
                CONFIRMAR CANCELAMENTO
              </Button>
              <Button variant="text" onClick={() => setCancel(false)}>
                VOLTAR
              </Button>
            </div>
          )}
          <Button
            variant="secondary"
            wide
            onClick={() => openShipment(s.id, "messages")}
          >
            CONVERSAR / PEDIR AJUDA
          </Button>
        </div>
      </aside>
    </div>
  )
}
function Delivery() {
  const { selectedShipment: s, store, session, status, go } = useWorkspace()
  const [confirmed, setConfirmed] = useState(false)
  if (!s || s.status !== "arrived" || s.senderId !== session.email)
    return (
      <Empty title="Nenhuma entrega aguardando sua confirmação">
        <Button onClick={() => go("tracking")}>VER ACOMPANHAMENTO</Button>
      </Empty>
    )
  const trip = store.trips.find((t) => t.id === s.tripId)!
  return (
    <div className="success-page">
      <span className="success-icon">
        <Icon name="box" size={42} />
      </span>
      <span className="kicker">CHEGADA REGISTRADA</span>
      <h2>Sua encomenda chegou a {city(trip.destination)}.</h2>
      <p>
        {trip.name} registrou a chegada de <strong>#{s.id}</strong> em{" "}
        {timeLabel(s.events.arrived)}.
      </p>
      <div className="confirm-box">
        <h3>Você recebeu sua encomenda?</h3>
        <p>Confirme apenas depois de receber e conferir a mercadoria.</p>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          Recebi e conferi minha encomenda.
        </label>
        <Button
          wide
          disabled={!confirmed}
          onClick={() => {
            status(s.id, "completed")
            go("tracking")
          }}
        >
          CONFIRMAR RECEBIMENTO
          <Icon name="check" />
        </Button>
        <Button variant="text" onClick={() => go("messages")}>
          PRECISO DE AJUDA
        </Button>
        <Button variant="text" onClick={() => go("tracking")}>
          VOLTAR
        </Button>
      </div>
    </div>
  )
}
function RatingScreen() {
  const {
    store,
    session,
    selectedShipment: s,
    update,
    notify,
    go,
  } = useWorkspace()
  const previous = store.reviews.find((r) => r.shipmentId === s?.id)
  const [score, setScore] = useState(previous?.score || 0),
    [criteria, setCriteria] = useState<Record<string, number>>(
      previous?.criteria || {},
    ),
    [comment, setComment] = useState(previous?.comment || "")
  if (!s || s.status !== "completed" || s.senderId !== session.email)
    return <Empty title="Conclua uma entrega para avaliar" />
  const trip = store.trips.find((t) => t.id === s.tripId)!
  return (
    <div className="rating-page">
      <Avatar name={trip.name} large />
      <span className="kicker">{trip.name}</span>
      <h2>{previous ? "Sua avaliação" : "Como foi sua experiência?"}</h2>
      <p>
        Encomenda #{s.id} · {city(trip.origin)} → {city(trip.destination)}
      </p>
      <div className="stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            disabled={!!previous}
            className={n <= score ? "selected" : ""}
            aria-label={`${n} estrelas`}
            aria-pressed={n === score}
            onClick={() => setScore(n)}
          >
            <Icon name="star" size={32} />
          </button>
        ))}
      </div>
      <div className="criteria">
        {[
          "Comunicação",
          "Cuidado com a encomenda",
          "Pontualidade",
          "Confiabilidade",
        ].map((label) => (
          <div key={label}>
            <span>{label}</span>
            <span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  disabled={!!previous}
                  aria-label={`${label}: ${n} estrelas`}
                  className={n <= (criteria[label] || 0) ? "selected" : ""}
                  onClick={() => setCriteria({ ...criteria, [label]: n })}
                >
                  <Icon name="star" size={18} />
                </button>
              ))}
            </span>
          </div>
        ))}
      </div>
      {previous ? (
        <p>{comment || "Sem comentário."}</p>
      ) : (
        <>
          <Field
            label="Comentário (opcional)"
            multiline
            value={comment}
            onValue={setComment}
          />
          <Button
            wide
            disabled={!score}
            onClick={() => {
              const review: Review = {
                shipmentId: s.id,
                score,
                criteria,
                comment: comment.trim(),
                at: new Date().toISOString(),
              }
              update((current) =>
                current.reviews.some((r) => r.shipmentId === s.id)
                  ? current
                  : { ...current, reviews: [...current.reviews, review] },
              )
              notify("Avaliação registrada. Obrigado!")
              go("tracking")
            }}
          >
            ENVIAR AVALIAÇÃO
          </Button>
        </>
      )}
      <Button variant="text" onClick={() => go("tracking")}>
        VOLTAR AO ACOMPANHAMENTO
      </Button>
    </div>
  )
}
function Messages() {
  const {
    store,
    myShipments,
    selectedShipment,
    openShipment,
    update,
    session,
  } = useWorkspace()
  const [draft, setDraft] = useState("")
  const end = useRef<HTMLDivElement>(null)
  const s = selectedShipment || myShipments[0]
  const messages = store.messages.filter((m) => m.shipmentId === s?.id)
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" })
  }, [messages.length, s?.id])
  useEffect(() => setDraft(""), [s?.id])
  if (!s) return <Empty title="Suas conversas aparecem após uma solicitação" />
  const trip = store.trips.find((t) => t.id === s.tripId)!
  const contact = trip.ownerId === session.email ? s.sender : trip.name
  return (
    <div className="messages-layout">
      <aside className="conversation-list">
        <span className="kicker">ENCOMENDAS</span>
        {myShipments.map((shipment) => (
          <button
            className={shipment.id === s.id ? "active" : ""}
            key={shipment.id}
            onClick={() => openShipment(shipment.id, "messages")}
          >
            <Avatar
              name={store.trips.find((t) => t.id === shipment.tripId)!.name}
            />
            <span>
              <strong>#{shipment.id}</strong>
              <small>{labels[shipment.status]}</small>
            </span>
          </button>
        ))}
      </aside>
      <section className="conversation">
        <div className="conversation-head">
          <Avatar name={contact} />
          <span>
            <strong>
              {contact} · #{s.id}
            </strong>
            <small>Conversa entre contas deste navegador</small>
          </span>
        </div>
        <label className="mobile-conversation field">
          Encomenda
          <select
            value={s.id}
            onChange={(e) => openShipment(e.target.value, "messages")}
          >
            {myShipments.map((shipment) => (
              <option key={shipment.id} value={shipment.id}>
                #{shipment.id}
              </option>
            ))}
          </select>
        </label>
        <div className="message-stream">
          <p className="chat-notice">
            Combine retirada e entrega por aqui. Nesta versão, as mensagens são
            compartilhadas entre as contas deste navegador. Não são enviadas
            para outros dispositivos.
          </p>
          {messages.map((m) =>
            m.author === "system" ? (
              <p className="chat-notice" key={m.id}>
                {m.text}
                <small>{timeLabel(m.at)}</small>
              </p>
            ) : (
              <span
                className={`message ${
                  m.authorId && m.authorId !== session.email
                    ? "received"
                    : "sent"
                }`}
                key={m.id}
              >
                {m.text}
                <small>{timeLabel(m.at)}</small>
              </span>
            ),
          )}
          <div ref={end} />
        </div>
        <form
          className="message-compose"
          onSubmit={(e) => {
            e.preventDefault()
            const text = draft.trim()
            if (!text) return
            update((current) => ({
              ...current,
              messages: [
                ...current.messages,
                {
                  id: uid("M"),
                  shipmentId: s.id,
                  text,
                  at: new Date().toISOString(),
                  author: "user",
                  authorId: session.email,
                },
              ],
            }))
            setDraft("")
          }}
        >
          <input
            aria-label="Mensagem"
            placeholder="Escreva uma mensagem…"
            maxLength={2000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            disabled={!draft.trim()}
            aria-label="Salvar mensagem"
            type="submit"
          >
            <Icon name="arrow" />
          </button>
        </form>
        <Button variant="text" onClick={() => openShipment(s.id)}>
          VER ENCOMENDA
        </Button>
      </section>
    </div>
  )
}
function ProfileHistory() {
  const { store, myShipments, session, go } = useWorkspace()
  const [filter, setFilter] = useState("all")
  const sent = myShipments.filter((s) => s.senderId === session.email)
  const transported = myShipments.filter((s) =>
    store.trips.some((t) => t.id === s.tripId && t.ownerId === session.email),
  )
  const trips = store.trips.filter((t) => t.ownerId === session.email)
  const completed = trips.filter(
    (t) => tripState(t, store.shipments) === "Concluída",
  )
  const visible =
    filter === "sent"
      ? sent
      : filter === "transported"
        ? transported
        : filter === "completed"
          ? myShipments.filter((s) => s.status === "completed")
          : myShipments
  return (
    <section className="profile-section" aria-label="Histórico de atividades">
      <div className="section-heading">
        <div>
          <span className="kicker">SUAS ATIVIDADES</span>
          <h3>Histórico de atividades</h3>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            download("historico-leva-comigo.json", {
              enviadas: sent,
              transportadas: transported,
              viagens: trips,
              concluidas: completed,
            })
          }
        >
          EXPORTAR HISTÓRICO
        </Button>
      </div>
      <div className="account-stats">
        <article>
          <strong>{sent.length}</strong>
          <span>Encomendas enviadas</span>
        </article>
        <article>
          <strong>{transported.length}</strong>
          <span>Encomendas transportadas</span>
        </article>
        <article>
          <strong>{completed.length}</strong>
          <span>Viagens concluídas</span>
        </article>
        <article>
          <strong>{sent.filter((s) => s.status === "completed").length}</strong>
          <span>Encomendas recebidas</span>
        </article>
      </div>
      <div className="filter-row" aria-label="Filtrar histórico">
        {[
          ["all", "Todas"],
          ["sent", "Enviadas"],
          ["transported", "Transportadas"],
          ["completed", "Finalizadas"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={filter === key}
            className={filter === key ? "selected" : ""}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="record-list">
        {visible
          .slice()
          .reverse()
          .map((s) => (
            <article key={s.id} className="history-activity">
              <div className="activity-meta">
                <strong>
                  {s.senderId === session.email
                    ? "Você enviou"
                    : "Você transportou"}
                </strong>
                <span>
                  Solicitada em {timeLabel(s.createdAt)} · Última atualização:{" "}
                  {timeLabel(s.events[s.status])}
                </span>
              </div>
              <ShipmentRow shipment={s} />
            </article>
          ))}
        {!visible.length && <Empty title="Nenhuma atividade nesta categoria" />}
      </div>
      <div className="section-heading reviews-title">
        <h3>Suas viagens</h3>
        <Button variant="text" onClick={() => go("requests")}>
          GERENCIAR VIAGENS
        </Button>
      </div>
      <div className="record-list">
        {trips.map((t) => (
          <article key={t.id} className="panel main-panel">
            <div className="section-heading">
              <strong>
                {t.origin} → {t.destination}
              </strong>
              <span className="status">{tripState(t, store.shipments)}</span>
            </div>
            <p>
              {dateLabel(t.date)}
              {t.completedAt
                ? ` · Concluída em ${timeLabel(t.completedAt)}`
                : ""}
            </p>
          </article>
        ))}
        {!trips.length && <Empty title="Você ainda não publicou viagens" />}
      </div>
    </section>
  )
}
function ProfileReputation() {
  const { store, session, openShipment } = useWorkspace()
  const [view, setView] = useState("received")
  const received = receivedReviews(store, session.email)
  const sent = store.reviews.filter((r) =>
    store.shipments.some(
      (s) => s.id === r.shipmentId && s.senderId === session.email,
    ),
  )
  const reviews = view === "received" ? received : sent
  return (
    <section className="profile-section" aria-label="Reputação">
      <div className="panel main-panel reputation-summary">
        <div>
          <span className="kicker">SUA REPUTAÇÃO COMO VIAJANTE</span>
          <h3>Nota das avaliações recebidas</h3>
          <p>Calculada a partir dos transportes que você realizou.</p>
        </div>
        <div className="reputation-average">
          <strong>
            {received.length
              ? reviewAverage(received).toLocaleString("pt-BR", {
                  minimumFractionDigits: 1,
                })
              : "—"}
          </strong>
          <span>{received.length} avaliação(ões) recebida(s)</span>
        </div>
      </div>
      <div className="filter-row">
        <button
          className={view === "received" ? "selected" : ""}
          aria-pressed={view === "received"}
          onClick={() => setView("received")}
        >
          Recebidas ({received.length})
        </button>
        <button
          className={view === "sent" ? "selected" : ""}
          aria-pressed={view === "sent"}
          onClick={() => setView("sent")}
        >
          Enviadas ({sent.length})
        </button>
      </div>
      <h3>
        {view === "received"
          ? "O que outros remetentes disseram sobre você"
          : "Avaliações que você enviou"}
      </h3>
      <div className="record-list">
        {reviews.map((r) => {
          const shipment = store.shipments.find((s) => s.id === r.shipmentId)!
          const trip = store.trips.find((t) => t.id === shipment.tripId)!
          return (
            <article
              className="panel main-panel reputation-review"
              key={r.shipmentId}
            >
              <div className="section-heading">
                <strong>
                  {r.score}/5 ·{" "}
                  {view === "received"
                    ? `Avaliação de ${shipment.sender}`
                    : `Para ${trip.name}`}
                </strong>
                <span>#{r.shipmentId}</span>
              </div>
              <p>{r.comment || "Sem comentário."}</p>
              <small>{timeLabel(r.at)}</small>
              <div className="review-criteria">
                {Object.entries(r.criteria).map(([label, score]) => (
                  <span key={label}>
                    {label}: {score}/5
                  </span>
                ))}
              </div>
              <Button
                variant="secondary"
                onClick={() => openShipment(r.shipmentId)}
              >
                VER ENCOMENDA AVALIADA
              </Button>
            </article>
          )
        })}
        {!reviews.length && (
          <Empty
            title={
              view === "received"
                ? "Você ainda não recebeu avaliações"
                : "Você ainda não enviou avaliações"
            }
          />
        )}
      </div>
    </section>
  )
}
function IdentityVerification() {
  const { store, update, notify } = useWorkspace()
  const verification = store.profile.verification || {
    status: "pending" as const,
  }
  const [documentType, setDocumentType] = useState(
      verification.documentType || "RG",
    ),
    [agreed, setAgreed] = useState(false)
  const names = {
    pending: "Pendente",
    review: "Em análise",
    approved: "Aprovado",
    rejected: "Reprovado",
  }
  const setStatus = (status: "review" | "approved" | "rejected") => {
    const at = new Date().toISOString()
    update((current) => ({
      ...current,
      profile: {
        ...current.profile,
        verification: {
          ...current.profile.verification,
          status,
          documentType,
          submittedAt:
            status === "review"
              ? at
              : current.profile.verification?.submittedAt,
          updatedAt: at,
          reason:
            status === "rejected"
              ? "Reprovação simulada. Confira o tipo de documento e envie novamente."
              : undefined,
        },
      },
    }))
    notify(`Verificação simulada: ${names[status]}.`)
  }
  return (
    <section
      className="panel main-panel profile-section profile-form"
      aria-label="Verificação de identidade"
    >
      <div className="section-heading">
        <h3>Verificação de identidade</h3>
        <span className={`status verification-${verification.status}`}>
          {names[verification.status]}
        </span>
      </div>
      <p className="muted">
        Processo de demonstração. Nenhum documento real é solicitado ou enviado,
        e uma aprovação simulada não representa uma identidade validada.
      </p>
      {verification.submittedAt && (
        <p>Solicitada em {timeLabel(verification.submittedAt)}</p>
      )}
      {verification.updatedAt && (
        <p>Atualizada em {timeLabel(verification.updatedAt)}</p>
      )}
      {verification.reason && <p role="status">{verification.reason}</p>}
      {["pending", "rejected"].includes(verification.status) && (
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault()
            if (agreed) setStatus("review")
          }}
        >
          <Field
            label="Tipo de documento (simulação)"
            options={["RG", "CNH", "Passaporte"]}
            value={documentType}
            onValue={setDocumentType}
          />
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
            />
            Entendo que esta verificação é uma simulação.
          </label>
          <Button type="submit" disabled={!agreed}>
            {verification.status === "rejected"
              ? "REENVIAR PARA ANÁLISE"
              : "INICIAR VERIFICAÇÃO"}
          </Button>
        </form>
      )}
      {verification.status === "review" && (
        <div className="inline-actions">
          <Button onClick={() => setStatus("approved")}>
            SIMULAR APROVAÇÃO
          </Button>
          <Button variant="danger" onClick={() => setStatus("rejected")}>
            SIMULAR REPROVAÇÃO
          </Button>
        </div>
      )}
      {verification.status === "approved" && (
        <p role="status">
          Processo de demonstração concluído. Aprovação simulada registrada no
          seu perfil.
        </p>
      )}
    </section>
  )
}
function UserProfile({ logout }: { logout: () => void }) {
  const { store, myShipments, update, notify, openShipment, session } =
    useWorkspace()
  const [tab, setTab] = useState("profile"),
    [profile, setProfile] = useState<Profile>(store.profile),
    [password, setPassword] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false)
  async function changePassword(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      const accounts = read<Account[]>("leva:accounts", [])
      const account = accounts.find((a) => a.email === session.email)
      if (
        !account ||
        (await hashPassword(password, account.salt)) !== account.hash
      )
        throw new Error("Senha atual incorreta.")
      if (newPassword.length < 6)
        throw new Error("A nova senha precisa ter pelo menos 6 caracteres.")
      const hash = await hashPassword(newPassword, account.salt)
      save(
        "leva:accounts",
        accounts.map((a) => (a.email === account.email ? { ...a, hash } : a)),
      )
      setPassword("")
      setNewPassword("")
      notify("Senha atualizada.")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar a senha.",
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <div className="profile-hero">
        <Avatar name={store.profile.name} large />
        <div className="profile-name">
          <span className="kicker">MINHA CONTA</span>
          <h2>{store.profile.name}</h2>
          <p>{store.profile.email}</p>
        </div>
      </div>
      <div className="filter-row profile-tabs">
        {[
          ["profile", "Meus dados"],
          ["history", "Histórico"],
          ["reputation", "Avaliações"],
          ["identity", "Verificação de identidade"],
          ["settings", "Preferências e acesso"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "selected" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "profile" && (
        <form
          className="panel main-panel profile-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (profile.name.trim().length < 3) {
              setError("Informe um nome com pelo menos 3 caracteres.")
              return
            }
            update((current) => ({
              ...current,
              profile: {
                ...current.profile,
                name: profile.name.trim(),
                phone: profile.phone,
                city: profile.city,
              },
              trips: current.trips.map((t) =>
                t.ownerId === session.email
                  ? { ...t, name: profile.name.trim() }
                  : t,
              ),
              shipments: current.shipments.map((s) =>
                s.senderId === session.email
                  ? { ...s, sender: profile.name.trim() }
                  : s,
              ),
            }))
            setError("")
            notify("Dados atualizados.")
          }}
        >
          <h3>Dados pessoais</h3>
          <div className="form-grid two">
            <Field
              label="Nome completo"
              value={profile.name}
              required
              onValue={(v) => setProfile({ ...profile, name: v })}
            />
            <Field
              label="E-mail da conta"
              type="email"
              value={profile.email}
              readOnly
              onValue={() => {}}
            />
            <Field
              label="Telefone (opcional)"
              type="tel"
              value={profile.phone}
              onValue={(v) => setProfile({ ...profile, phone: v })}
            />
            <Field
              label="Cidade"
              value={profile.city}
              suggestions={cities}
              onValue={(v) => setProfile({ ...profile, city: v })}
            />
          </div>
          <ErrorText error={error} />
          <Button type="submit">SALVAR ALTERAÇÕES</Button>
        </form>
      )}
      {tab === "history" && <ProfileHistory />}
      {tab === "reputation" && <ProfileReputation />}
      {tab === "identity" && <IdentityVerification />}
      {tab === "settings" && (
        <div className="panel main-panel profile-form">
          <h3>Preferências</h3>
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={store.profile.notifications}
              onChange={(e) => {
                const checked = e.target.checked
                update((current) => ({
                  ...current,
                  profile: { ...current.profile, notifications: checked },
                }))
                setProfile((p) => ({ ...p, notifications: checked }))
              }}
            />
            Exibir notificações de encomendas
          </label>
          <p className="muted">
            Seus dados ficam neste navegador. A verificação de identidade é
            simulada. Não há envio automático de e-mail nesta versão.
          </p>
          {!session.demo ? (
            <form className="form-stack" onSubmit={changePassword}>
              <h3>Alterar senha</h3>
              <Field
                label="Senha atual"
                type="password"
                required
                value={password}
                onValue={setPassword}
              />
              <Field
                label="Nova senha"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onValue={setNewPassword}
              />
              <ErrorText error={error} />
              <Button type="submit" disabled={busy}>
                ALTERAR SENHA
              </Button>
            </form>
          ) : (
            <p>
              A senha da conta de demonstração é fixa. Crie sua própria conta
              para gerenciar o acesso.
            </p>
          )}
          <div className="inline-actions">
            <Button
              variant="secondary"
              onClick={() =>
                download("meus-dados-leva-comigo.json", {
                  ...store,
                  trips: store.trips.filter(
                    (t) =>
                      t.ownerId === session.email ||
                      myShipments.some((s) => s.tripId === t.id),
                  ),
                  shipments: myShipments,
                  messages: store.messages.filter((m) =>
                    myShipments.some((s) => s.id === m.shipmentId),
                  ),
                  reviews: store.reviews.filter((r) =>
                    myShipments.some((s) => s.id === r.shipmentId),
                  ),
                })
              }
            >
              EXPORTAR MEUS DADOS
            </Button>
            <Button variant="secondary" onClick={() => {
              if (window.confirm("Este arquivo inclui todas as contas locais e hashes de acesso. Guarde-o em local privado. Exportar para Flutter?")) {
                try { download("migracao-leva-comigo.json", migrationArchive(localStorage)) }
                catch { notify("Não foi possível exportar: há dados locais inválidos. Nenhum dado foi alterado.") }
              }
            }}>
              EXPORTAR MIGRAÇÃO FLUTTER
            </Button>
            <Button variant="danger" onClick={logout}>
              SAIR DA CONTA
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
const titles: Record<Page, string> = {
  home: "Início",
  search: "Buscar viagens",
  results: "Resultados",
  traveler: "Detalhes da viagem",
  request: "Solicitar transporte",
  offer: "Publicar viagem",
  requests: "Minhas viagens",
  tracking: "Acompanhamento",
  delivery: "Confirmar recebimento",
  rating: "Avaliação",
  profile: "Meu perfil",
  messages: "Mensagens",
}
function Shell({
  page,
  children,
  logout,
}: {
  page: Page
  children: ReactNode
  logout: () => void
}) {
  const { store, myShipments, go, openShipment } = useWorkspace()
  const [notifications, setNotifications] = useState(false),
    [readAt, setReadAt] = useState(() =>
      read<string>(`leva:read:${store.profile.email}`, ""),
    )
  const active = myShipments.filter((s) => !terminal(s.status)).length
  const notices = myShipments
    .slice()
    .sort(
      (a, b) =>
        Math.max(...Object.values(b.events).map((v) => Date.parse(v))) -
        Math.max(...Object.values(a.events).map((v) => Date.parse(v))),
    )
  const unread = notices.some((s) =>
    Object.values(s.events).some((at) => at > readAt),
  )
  const nav: NavigationItem[] = [
    { page: "home", label: "Início", icon: "home" },
    { page: "search", label: "Buscar", icon: "search" },
    { page: "requests", label: "Viagens", icon: "box" },
    { page: "messages", label: "Mensagens", icon: "message" },
    { page: "profile", label: "Perfil", icon: "user" },
  ]
  const current = (p: Page) =>
    page === p ||
    (p === "search" && ["results", "traveler", "request"].includes(page)) ||
    (p === "requests" &&
      ["tracking", "delivery", "rating", "offer"].includes(page))
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotifications(false)
    }
    window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [])
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => go("home")}>
          <span className="brand-mark">
            <Icon name="route" />
          </span>
          <span>
            LEVA<strong>Comigo</strong>
          </span>
        </button>
        <nav>
          {nav.map((n) => (
            <button
              key={n.page}
              className={current(n.page) ? "active" : ""}
              onClick={() => go(n.page)}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
              {n.page === "requests" && active > 0 && <small>{active}</small>}
            </button>
          ))}
        </nav>
        <div className="trust-box">
          <Icon name="shield" />
          <div>
            <strong>Seu espaço de transporte</strong>
            <span>Versão local · dados salvos neste navegador.</span>
          </div>
        </div>
        <button className="sidebar-profile" onClick={() => go("profile")}>
          <Avatar name={store.profile.name} />
          <span>
            <strong>{store.profile.name}</strong>
            <small>Gerenciar minha conta</small>
          </span>
          <Icon name="chevron" />
        </button>
        <button className="logout-link" onClick={logout}>
          Sair da conta
        </button>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div>
            <span className="eyebrow">LEVA COMIGO</span>
            <h1>{titles[page]}</h1>
          </div>
          <div className="top-actions">
            {store.profile.notifications && (
              <>
                <button
                  className="icon-button notification-button"
                  aria-label="Notificações"
                  aria-expanded={notifications}
                  onClick={() => {
                    setNotifications(!notifications)
                    const at = new Date().toISOString()
                    setReadAt(at)
                    try {
                      save(`leva:read:${store.profile.email}`, at)
                    } catch {
                      /* Keep notifications available in memory. */
                    }
                  }}
                >
                  <Icon name="bell" />
                  {unread && <i />}
                </button>
                {notifications && (
                  <>
                    <button
                      className="notification-scrim"
                      aria-label="Fechar notificações"
                      onClick={() => setNotifications(false)}
                    />
                    <div className="notification-panel">
                      <span className="kicker">NOTIFICAÇÕES</span>
                      {notices.slice(0, 6).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setNotifications(false)
                            openShipment(s.id)
                          }}
                        >
                          <Icon name="box" />
                          <span>
                            <strong>
                              #{s.id} · {labels[s.status]}
                            </strong>
                            <small>{timeLabel(s.events[s.status])}</small>
                          </span>
                        </button>
                      ))}
                      {!notices.length && (
                        <p>Nenhuma notificação por enquanto.</p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
            <button className="mini-user" onClick={() => go("profile")}>
              <Avatar name={store.profile.name} />
              <span>{store.profile.name.split(" ")[0]}</span>
            </button>
          </div>
        </header>
        <main className="content" id="main-content">
          {children}
        </main>
        <nav className="mobile-nav">
          {nav.map((n) => (
            <button
              key={n.page}
              className={current(n.page) ? "active" : ""}
              onClick={() => go(n.page)}
            >
              <Icon name={n.icon} size={19} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
function Application({
  session,
  logout,
}: {
  session: Session
  logout: () => void
}) {
  const storageKey = `leva:workspace:v2:${session.email}`
  const [store, setStore] = useState<Store>(() => {
    const stored = read<Store | null>(storageKey, null)
    const validStored =
      stored &&
      Array.isArray(stored.trips) &&
      Array.isArray(stored.shipments) &&
      Array.isArray(stored.messages) &&
      Array.isArray(stored.reviews) &&
      stored.profile
    const initial = initialStore(session.name, session.email, session.demo)
    if (session.demo) {
      const legacy = read<{
        status: string
        arrivedAt?: string
        completedAt?: string
      } | null>("leva-comigo:delivery-progress", null)
      if (legacy && ["arrived", "completed"].includes(legacy.status)) {
        initial.shipments[0].status = (legacy.status as Status)
        initial.shipments[0].events.arrived =
          legacy.arrivedAt || new Date().toISOString()
        if (legacy.status === "completed")
          initial.shipments[0].events.completed =
            legacy.completedAt || new Date().toISOString()
      }
    }
    const local = reconcileTrips(validStored ? stored : initial)
    const market = read<Store | null>("leva:marketplace:v3", null)
    if (
      !market ||
      !Array.isArray(market.trips) ||
      !Array.isArray(market.shipments)
    )
      return local
    return reconcileTrips({
      ...local,
      trips: [
        ...market.trips,
        ...local.trips.filter((t) => !market.trips.some((m) => m.id === t.id)),
      ],
      shipments: [
        ...market.shipments,
        ...local.shipments.filter(
          (s) => !market.shipments.some((m) => m.id === s.id),
        ),
      ],
      reviews: market.reviews || [],
      messages: market.messages || [],
    })
  })
  const [page, setPage] = useState<Page>("home"),
    [tripId, setTripId] = useState(""),
    [shipmentId, setShipmentId] = useState(store.shipments[0]?.id || ""),
    [toast, setToast] = useState(""),
    [storageError, setStorageError] = useState("")
  const [search, setSearch] = useState<Search>({
    origin: cities[0],
    destination: cities[1],
    date: store.trips[0]?.date || today(),
    weight: "2",
    itemType: itemTypes[0],
  })
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== "leva:marketplace:v3" || !event.newValue) return
      try {
        const incoming = JSON.parse(event.newValue) as Store
        if (
          Array.isArray(incoming.trips) &&
          Array.isArray(incoming.shipments) &&
          Array.isArray(incoming.messages) &&
          Array.isArray(incoming.reviews)
        )
          setStore((current) =>
            reconcileTrips({
              ...current,
              trips: incoming.trips,
              shipments: incoming.shipments,
              messages: incoming.messages,
              reviews: incoming.reviews,
            }),
          )
      } catch {
        /* Ignore unrelated or invalid browser storage events. */
      }
    }
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [])
  useEffect(() => {
    try {
      save(storageKey, store)
      save("leva:marketplace:v3", {
        trips: store.trips,
        shipments: store.shipments,
        reviews: store.reviews,
        messages: store.messages,
      })
      setStorageError("")
    } catch {
      setStorageError(
        "Não foi possível salvar no navegador. Exporte seus dados no Perfil antes de fechar esta página.",
      )
    }
  }, [storageKey, store])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(""), 4500)
    return () => clearTimeout(timer)
  }, [toast])
  const go = (next: Page) => {
    setPage(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const openShipment = (id: string, next: Page = "tracking") => {
    setShipmentId(id)
    go(next)
  }
  const status = (id: string, next: Status) => {
    const shipment = store.shipments.find((s) => s.id === id)
    const trip = store.trips.find((t) => t.id === shipment?.tripId)
    if (!shipment || !trip) return
    const sender = shipment.senderId === session.email
    const traveler = trip.ownerId === session.email
    const simulatedTraveler = trip.ownerId.startsWith("sample") && sender
    const simulatedSender = shipment.senderId === "sample-sender" && traveler
    const allowed =
      next === "completed"
        ? sender || simulatedSender
        : next === "cancelled"
          ? sender || traveler
          : traveler || simulatedTraveler
    if (!allowed || changeStatus(store, id, next) === store) return
    setStore((current) => changeStatus(current, id, next))
    setToast(`Encomenda: ${labels[next]}.`)
  }
  const myShipments = store.shipments.filter(
    (s) =>
      s.senderId === session.email ||
      store.trips.some((t) => t.id === s.tripId && t.ownerId === session.email),
  )
  const value: Workspace = {
    store,
    myShipments,
    session,
    update: setStore,
    go,
    openShipment,
    selectTrip: setTripId,
    selectedTrip: store.trips.find((t) => t.id === tripId),
    selectedShipment: myShipments.find((s) => s.id === shipmentId),
    notify: setToast,
    status,
  }
  const views: Record<Page, ReactNode> = {
    home: <Home />,
    search: <SearchTrip search={search} setSearch={setSearch} />,
    results: <Results search={search} />,
    traveler: <TravelerProfile />,
    request: <RequestTransport key={tripId} search={search} />,
    offer: <OfferTrip />,
    requests: <Trips />,
    tracking: <Tracking key={shipmentId} />,
    delivery: <Delivery key={shipmentId} />,
    rating: <RatingScreen key={shipmentId} />,
    profile: <UserProfile logout={logout} />,
    messages: <Messages />,
  }
  return (
    <WorkspaceContext.Provider value={value}>
      <Shell page={page} logout={logout}>
        {storageError && <ErrorText error={storageError} />}
        {views[page]}
      </Shell>
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button aria-label="Fechar aviso" onClick={() => setToast("")}>
            ×
          </button>
        </div>
      )}
    </WorkspaceContext.Provider>
  )
}
export default function App() {
  const [session, setSession] = useState<Session | null>(() => {
      try {
        const s = JSON.parse(
          sessionStorage.getItem("leva:session") ||
            localStorage.getItem("leva:session") ||
            "null",
        )
        return s?.email && s?.name ? s : null
      } catch {
        return null
      }
    }),
    [error, setError] = useState("")
  const login = (next: Session, remember: boolean) => {
    try {
      localStorage.removeItem("leva:session")
      sessionStorage.removeItem("leva:session")
      ;(remember ? localStorage : sessionStorage).setItem(
        "leva:session",
        JSON.stringify(next),
      )
    } catch {
      setError(
        "O navegador não permite salvar a sessão. O acesso ficará ativo até fechar a página.",
      )
    }
    setSession(next)
  }
  const logout = () => {
    try {
      localStorage.removeItem("leva:session")
      sessionStorage.removeItem("leva:session")
    } catch {
      /* Always clear the in-memory session. */
    }
    setSession(null)
  }
  return (
    <>
      {error && <ErrorText error={error} />}
      {session ? (
        <Application key={session.email} session={session} logout={logout} />
      ) : (
        <Login onLogin={login} />
      )}
    </>
  )
}
function Login({
  onLogin,
}: {
  onLogin: (session: Session, remember: boolean) => void
}) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [recovery, setRecovery] = useState("")
  const [newAccount, setNewAccount] = useState<Account | null>(null)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  async function submit(event: FormEvent) {
    event.preventDefault()
    setError("")
    setBusy(true)
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const accounts = read<Account[]>("leva:accounts", [])
      const account = accounts.find((a) => a.email === normalizedEmail)
      if (mode === "login") {
        if (normalizedEmail === "teste@exemplo.com" && password === "123456") {
          onLogin(
            { name: "João Silva", email: normalizedEmail, demo: true },
            remember,
          )
          return
        }
        if (
          !account ||
          (await hashPassword(password, account.salt)) !== account.hash
        )
          throw new Error(
            "E-mail ou senha incorretos. Crie sua conta neste navegador ou use a demonstração.",
          )
        onLogin(
          { name: account.name, email: account.email, demo: false },
          remember,
        )
      } else if (mode === "signup") {
        if (name.trim().length < 3)
          throw new Error("Informe seu nome completo.")
        if (account || normalizedEmail === "teste@exemplo.com")
          throw new Error("Este e-mail já possui uma conta.")
        if (password.length < 6 || password !== confirmation)
          throw new Error(
            "Use pelo menos 6 caracteres e confirme a mesma senha.",
          )
        const salt = crypto.randomUUID(),
          code = crypto.randomUUID()
        const created = {
          name: name.trim(),
          email: normalizedEmail,
          salt,
          hash: await hashPassword(password, salt),
          recoveryHash: await hashPassword(code, salt),
        }
        save("leva:accounts", [...accounts, created])
        setRecovery(code)
        setNewAccount(created)
      } else {
        if (
          !account ||
          (await hashPassword(recovery.trim(), account.salt)) !==
            account.recoveryHash
        )
          throw new Error("E-mail ou código de recuperação inválido.")
        if (password.length < 6 || password !== confirmation)
          throw new Error(
            "Use pelo menos 6 caracteres e confirme a mesma senha.",
          )
        const hash = await hashPassword(password, account.salt)
        save(
          "leva:accounts",
          accounts.map((a) => (a.email === account.email ? { ...a, hash } : a)),
        )
        setMode("login")
        setPassword("")
        setConfirmation("")
        setError("Senha atualizada. Entre com a nova senha.")
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível acessar o armazenamento do navegador.",
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="login-page">
      <div className="brand login-brand">
        <span className="brand-mark">
          <Icon name="route" />
        </span>
        LEVA<strong>Comigo</strong>
      </div>
      <div className="login-card">
        <span className="kicker">TRANSPORTE COLABORATIVO</span>
        <h1>
          {newAccount
            ? "Conta criada"
            : mode === "signup"
              ? "Crie sua conta"
              : mode === "forgot"
                ? "Recupere seu acesso"
                : "Entre na sua conta"}
        </h1>
        <p>
          Versão local: contas e atividades ficam neste navegador. Viagens de
          exemplo permitem testar o fluxo.
        </p>
        {newAccount ? (
          <div className="form-stack">
            <p>
              Guarde seu código de recuperação. Ele permite redefinir a senha
              sem envio de e-mail.
            </p>
            <code className="recovery-code">{recovery}</code>
            <Button
              variant="secondary"
              onClick={() =>
                download("recuperacao-leva-comigo.json", {
                  email: newAccount.email,
                  codigo: recovery,
                })
              }
            >
              BAIXAR CÓDIGO
            </Button>
            <Button
              onClick={() =>
                onLogin(
                  {
                    name: newAccount.name,
                    email: newAccount.email,
                    demo: false,
                  },
                  remember,
                )
              }
            >
              ACESSAR MINHA CONTA
            </Button>
          </div>
        ) : (
          <form className="form-stack" onSubmit={submit}>
            {mode === "signup" && (
              <Field
                label="Nome completo"
                value={name}
                onValue={setName}
                required
                autoComplete="name"
              />
            )}
            <Field
              label="E-mail"
              type="email"
              value={email}
              onValue={setEmail}
              required
              autoComplete="email"
            />
            {mode === "forgot" && (
              <Field
                label="Código de recuperação"
                value={recovery}
                onValue={setRecovery}
                required
              />
            )}
            <Field
              label={mode === "forgot" ? "Nova senha" : "Senha"}
              type="password"
              value={password}
              onValue={setPassword}
              required
              minLength={6}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
            {mode !== "login" && (
              <Field
                label="Confirmar senha"
                type="password"
                value={confirmation}
                onValue={setConfirmation}
                required
                minLength={6}
              />
            )}
            {mode === "login" && (
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Lembrar de mim
              </label>
            )}
            <ErrorText error={error} />
            <Button type="submit" wide disabled={busy}>
              {busy
                ? "AGUARDE…"
                : mode === "login"
                  ? "ENTRAR"
                  : mode === "signup"
                    ? "CRIAR CONTA"
                    : "REDEFINIR SENHA"}
            </Button>
            <div className="inline-actions">
              {(["login", "signup", "forgot"] as const)
                .filter((m) => m !== mode)
                .map((m) => (
                  <Button
                    key={m}
                    variant="text"
                    onClick={() => {
                      setMode(m)
                      setError("")
                    }}
                  >
                    {m === "login"
                      ? "Entrar"
                      : m === "signup"
                        ? "Criar conta"
                        : "Esqueci minha senha"}
                  </Button>
                ))}
            </div>
            <Button
              variant="secondary"
              wide
              onClick={() =>
                onLogin(
                  {
                    name: "João Silva",
                    email: "teste@exemplo.com",
                    demo: true,
                  },
                  remember,
                )
              }
            >
              EXPLORAR DEMONSTRAÇÃO
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

type Workspace = {
  store: Store
  myShipments: Shipment[]
  session: Session
  update: (fn: (current: Store) => Store) => void
  go: (page: Page) => void
  openShipment: (id: string, page?: Page) => void
  selectTrip: (id: string) => void
  selectedTrip?: Trip
  selectedShipment?: Shipment
  notify: (text: string) => void
  status: (id: string, next: Status) => void
}
const WorkspaceContext = createContext<Workspace | null>(null)
const useWorkspace = () => useContext(WorkspaceContext)!
function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status status-${status}`}>
      <i />
      {labels[status]}
    </span>
  )
}
function Route({ trip }: { trip: Trip }) {
  return (
    <div className="route-overview">
      <div>
        <small>ORIGEM</small>
        <strong>{city(trip.origin)}</strong>
      </div>
      <span className="flight-line">
        <i />
        <Icon name="plane" />
        <i />
      </span>
      <div>
        <small>DESTINO</small>
        <strong>{city(trip.destination)}</strong>
      </div>
    </div>
  )
}
function ShipmentRow({ shipment }: { shipment: Shipment }) {
  const { store, openShipment } = useWorkspace()
  const trip = store.trips.find((t) => t.id === shipment.tripId)!
  return (
    <button className="delivery-row" onClick={() => openShipment(shipment.id)}>
      <span className="package-icon">
        <Icon name="box" />
      </span>
      <span>
        <small>
          #{shipment.id} · {shipment.itemType}
        </small>
        <strong>
          {city(trip.origin)} <Icon name="arrow" size={14} />
          {city(trip.destination)}
        </strong>
      </span>
      <StatusBadge status={shipment.status} />
      <span className="delivery-person">
        <Avatar name={trip.name} />
        <span>
          <small>VIAJANTE</small>
          <strong>{trip.name}</strong>
        </span>
      </span>
      <Icon name="chevron" />
    </button>
  )
}
function Home() {
  const { store, myShipments, go } = useWorkspace()
  const active = myShipments.filter((s) => !terminal(s.status))
  return (
    <>
      <section className="welcome">
        <div>
          <span className="kicker">
            OLÁ, {store.profile.name.split(" ")[0].toUpperCase()}
          </span>
          <h2>O que você deseja fazer hoje?</h2>
          <p>Envie sua encomenda ou aproveite sua próxima viagem.</p>
        </div>
        <span className="verified-pill">
          <Icon name="box" />
          {active.length} envio(s) em andamento
        </span>
      </section>
      <div className="action-grid">
        {[
          {
            title: "Enviar uma encomenda",
            text: "Encontre uma viagem compatível e acompanhe cada etapa da entrega.",
            page: "search",
            icon: "box",
            label: "BUSCAR VIAGENS",
          },
          {
            title: "Oferecer espaço na bagagem",
            text: "Publique sua viagem, defina o preço e gerencie solicitações.",
            page: "offer",
            icon: "plane",
            label: "PUBLICAR VIAGEM",
          },
        ].map((a, i) => (
          <article
            key={a.page}
            className={`action-card ${i === 0 ? "dark" : "light-card"}`}
          >
            <span className="card-icon">
              <Icon name={a.icon as IconName} size={30} />
            </span>
            <h3>{a.title}</h3>
            <p>{a.text}</p>
            <Button
              variant={i ? "secondary" : "primary"}
              onClick={() => go(a.page as Page)}
            >
              {a.label}
              <Icon name="arrow" />
            </Button>
          </article>
        ))}
      </div>
      <section className="active-delivery">
        <div className="section-heading">
          <div>
            <span className="kicker">ACOMPANHAMENTO</span>
            <h3>Suas encomendas em andamento</h3>
          </div>
          <button onClick={() => go("requests")}>
            Ver todas <Icon name="arrow" size={16} />
          </button>
        </div>
        <div className="record-list">
          {active
            .slice()
            .reverse()
            .slice(0, 4)
            .map((s) => (
              <ShipmentRow key={s.id} shipment={s} />
            ))}
          {myShipments.length > 0 && !active.length && (
            <Empty title="Nenhuma encomenda em andamento">
              <Button variant="secondary" onClick={() => go("requests")}>
                VER MINHAS VIAGENS
              </Button>
            </Empty>
          )}
          {!myShipments.length && (
            <Empty title="Você ainda não tem encomendas">
              <Button onClick={() => go("search")}>ENCONTRAR UMA VIAGEM</Button>
            </Empty>
          )}
        </div>
      </section>
    </>
  )
}
function SearchTrip({
  search,
  setSearch,
}: {
  search: Search
  setSearch: (search: Search) => void
}) {
  const { go } = useWorkspace()
  const [error, setError] = useState("")
  const [rules, setRules] = useState(false)
  const change = (key: keyof Search, value: string) =>
    setSearch({ ...search, [key]: value })
  return (
    <div className="page-grid">
      <form
        className="panel main-panel"
        onSubmit={(e) => {
          e.preventDefault()
          const problem = routeError(
            search.origin,
            search.destination,
            search.date,
            Number(search.weight),
          )
          setError(problem)
          if (!problem) go("results")
        }}
      >
        <div className="panel-title">
          <span className="number">01</span>
          <div>
            <h2>Para onde sua encomenda vai?</h2>
            <p>Escolha os destinos, a data e o tipo de mercadoria.</p>
          </div>
        </div>
        <div className="route-fields">
          <Field
            label="De onde?"
            icon="pin"
            value={search.origin}
            suggestions={cities}
            required
            onValue={(v) => change("origin", v)}
          />
          <button
            type="button"
            className="swap-route"
            aria-label="Inverter origem e destino"
            onClick={() =>
              setSearch({
                ...search,
                origin: search.destination,
                destination: search.origin,
              })
            }
          >
            ⇄
          </button>
          <Field
            label="Para onde?"
            icon="pin"
            value={search.destination}
            suggestions={cities}
            required
            onValue={(v) => change("destination", v)}
          />
        </div>
        <div className="form-grid three">
          <Field
            label="Data da viagem"
            icon="calendar"
            type="date"
            min={today()}
            value={search.date}
            required
            onValue={(v) => change("date", v)}
          />
          <Field
            label="Peso aproximado (kg)"
            icon="weight"
            type="number"
            min="0.1"
            max="30"
            step="0.1"
            value={search.weight}
            required
            onValue={(v) => change("weight", v)}
          />
          <Field
            label="Tipo de mercadoria"
            icon="box"
            value={search.itemType}
            options={itemTypes}
            onValue={(v) => change("itemType", v)}
          />
        </div>
        <div className="rule-note">
          <Icon name="shield" />
          <div>
            <strong>Mercadorias seguras, viagens tranquilas.</strong>
            <span>
              Confira o conteúdo e combine a entrega antes de transportar.
            </span>
            {rules && (
              <p>
                Itens proibidos no destino não são aceitos. Confira documentos e
                exigências aplicáveis ao transporte antes de combinar a viagem.
              </p>
            )}
          </div>
          <button
            type="button"
            aria-expanded={rules}
            onClick={() => setRules(!rules)}
          >
            {rules ? "Fechar" : "Ver regras"}
          </button>
        </div>
        <ErrorText error={error} />
        <Button type="submit" wide>
          BUSCAR VIAGENS
          <Icon name="search" />
        </Button>
      </form>
      <aside className="side-help">
        <span className="kicker light">COMO FUNCIONA</span>
        <h3>
          Envie em
          <br />3 passos
        </h3>
        {[
          "Encontre uma viagem",
          "Solicite o transporte",
          "Confirme o recebimento",
        ].map((text, i) => (
          <div className="help-step" key={text}>
            <span>0{i + 1}</span>
            <p>{text}</p>
          </div>
        ))}
        <p>
          Viagens de exemplo estão identificadas nos resultados. Novas
          publicações aparecem na busca deste navegador.
        </p>
      </aside>
    </div>
  )
}
function Results({ search }: { search: Search }) {
  const { store, go, selectTrip } = useWorkspace()
  const [sort, setSort] = useState("rating")
  const results = findTrips(store.trips, store.shipments, search).sort(
    (a, b) =>
      sort === "price"
        ? a.price - b.price
        : sort === "space"
          ? remaining(b, store.shipments) - remaining(a, store.shipments)
          : tripRating(store, b) - tripRating(store, a),
  )
  return (
    <>
      <section className="results-head">
        <div>
          <span className="kicker">
            {results.length} VIAGEM(NS) ENCONTRADA(S)
          </span>
          <h2>
            {city(search.origin)}
            <Icon name="arrow" />
            {city(search.destination)}
          </h2>
          <p>
            {dateLabel(search.date)} · {search.weight} kg · {search.itemType}
          </p>
        </div>
        <Button variant="secondary" onClick={() => go("search")}>
          ALTERAR BUSCA
        </Button>
      </section>
      <div className="filter-row">
        <span>Ordenar por:</span>
        {[
          ["rating", "Melhor avaliação"],
          ["price", "Menor preço"],
          ["space", "Mais espaço"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={sort === key ? "selected" : ""}
            onClick={() => setSort(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <section className="travelers-list">
        {results.map((trip) => (
          <article className="traveler-card" key={trip.id}>
            <div className="traveler-main">
              <Avatar name={trip.name} large />
              <div>
                <h3>{trip.name}</h3>
                <p>
                  <Icon name="star" size={14} />
                  {tripRating(store, trip) || "Novo viajante"}
                </p>
                <span className="positive">
                  {trip.ownerId.startsWith("sample")
                    ? "Viagem de exemplo"
                    : "Viagem publicada neste navegador"}
                </span>
              </div>
            </div>
            <div className="trip-route">
              <div>
                <strong>{city(trip.origin)}</strong>
                <strong>{city(trip.destination)}</strong>
              </div>
            </div>
            <div className="trip-facts">
              <span>
                <small>DATA</small>
                <strong>{dateLabel(trip.date)}</strong>
              </span>
              <span>
                <small>DISPONÍVEL</small>
                <strong>{remaining(trip, store.shipments)} kg</strong>
              </span>
              <span>
                <small>POR KG</small>
                <strong>{money(trip.price)}</strong>
              </span>
            </div>
            <Button
              onClick={() => {
                selectTrip(trip.id)
                go("traveler")
              }}
            >
              VER VIAGEM
              <Icon name="arrow" />
            </Button>
          </article>
        ))}
        {!results.length && (
          <Empty title="Nenhuma viagem compatível">
            <p>Tente outra data, destino ou peso.</p>
            <Button onClick={() => go("search")}>ALTERAR FILTROS</Button>
          </Empty>
        )}
      </section>
    </>
  )
}
function TravelerProfile() {
  const { selectedTrip: trip, store, session, go } = useWorkspace()
  if (!trip) return <Empty title="Selecione uma viagem na busca" />
  const reviews = store.reviews.filter((r) =>
    store.shipments.some((s) => s.id === r.shipmentId && s.tripId === trip.id),
  )
  return (
    <div className="profile-layout">
      <section>
        <div className="profile-hero">
          <Avatar name={trip.name} large />
          <div className="profile-name">
            <span className="kicker">
              {trip.ownerId.startsWith("sample")
                ? "VIAJANTE DE EXEMPLO"
                : "VIAJANTE"}
            </span>
            <h2>{trip.name}</h2>
            <p>
              <Icon name="star" size={16} />
              {tripRating(store, trip) || "Sem avaliações"}
            </p>
          </div>
        </div>
        <Route trip={trip} />
        <div className="panel main-panel">
          <h3>Sobre o transporte</h3>
          <p>
            <strong>Mercadorias aceitas:</strong>{" "}
            {(trip.acceptedTypes || itemTypes).join(", ")}
          </p>
          <p>
            {trip.notes || "Converse com o viajante para combinar os detalhes."}
          </p>
          <p>
            Combine retirada, conteúdo, documentos e ponto de encontro pela
            conversa da solicitação.
          </p>
        </div>
        <div className="section-heading reviews-title">
          <h3>Avaliações registradas</h3>
        </div>
        {reviews.map((r) => (
          <article className="review" key={r.shipmentId}>
            <Avatar
              name={
                store.shipments.find((s) => s.id === r.shipmentId)?.sender ||
                "Remetente"
              }
            />
            <div>
              <strong>
                {r.score}/5 ·{" "}
                {store.shipments.find((s) => s.id === r.shipmentId)?.sender ||
                  "Remetente"}
              </strong>
              <p>{r.comment || "Avaliação sem comentário."}</p>
              <small>{timeLabel(r.at)}</small>
            </div>
          </article>
        ))}
        {!reviews.length && (
          <Empty title="Nenhuma avaliação local desta viagem" />
        )}
      </section>
      <aside className="booking-card">
        <span className="kicker">DETALHES DA VIAGEM</span>
        <h3>
          {city(trip.origin)} → {city(trip.destination)}
        </h3>
        <div className="booking-data">
          <span>
            <small>DATA</small>
            <strong>{dateLabel(trip.date)}</strong>
          </span>
          <span>
            <small>ESPAÇO DISPONÍVEL</small>
            <strong>{remaining(trip, store.shipments)} kg</strong>
          </span>
        </div>
        <div className="booking-price">
          <span>Preço por kg</span>
          <strong>{money(trip.price)}</strong>
        </div>
        <Button
          wide
          disabled={
            trip.ownerId === session.email ||
            !trip.active ||
            remaining(trip, store.shipments) <= 0
          }
          onClick={() => go("request")}
        >
          {trip.ownerId === session.email
            ? "SUA VIAGEM"
            : "SOLICITAR TRANSPORTE"}
        </Button>
      </aside>
    </div>
  )
}
