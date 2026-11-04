export type Status = "pending" | "accepted" | "received" | "in_transit" | "arrived" | "completed" | "refused" | "cancelled"
export type Profile = {
  name: string
  email: string
  phone: string
  city: string
  notifications: boolean
  verification?: {
    status: "pending" | "review" | "approved" | "rejected"
    documentType?: string
    submittedAt?: string
    updatedAt?: string
    reason?: string
  }
}
export type Trip = {
  id: string
  ownerId: string
  name: string
  origin: string
  destination: string
  date: string
  space: number
  price: number
  notes: string
  rating: number
  active: boolean
  acceptedTypes?: string[]
  completedAt?: string
}
export type Shipment = {
  id: string
  tripId: string
  senderId: string
  sender: string
  itemType: string
  weight: number
  description: string
  declaredValue: number
  status: Status
  createdAt: string
  events: Partial<Record<Status, string>>
  price: number
}
export type Review = {
  shipmentId: string
  score: number
  criteria: Record<string, number>
  comment: string
  at: string
}
export type Message = {
  id: string
  shipmentId: string
  text: string
  at: string
  author: "user" | "system"
  authorId?: string
}
export type Store = {
  profile: Profile
  trips: Trip[]
  shipments: Shipment[]
  reviews: Review[]
  messages: Message[]
}
export type Search = {
  origin: string
  destination: string
  date: string
  weight: string
  itemType: string
}
export const cities = [
  "Recife, Brasil",
  "Lisboa, Portugal",
  "São Paulo, Brasil",
  "Porto, Portugal",
  "Rio de Janeiro, Brasil",
  "Brasília, Brasil",
  "Salvador, Brasil",
  "Fortaleza, Brasil",
  "Belo Horizonte, Brasil",
  "Curitiba, Brasil",
  "Madrid, Espanha",
  "Paris, França",
  "Londres, Reino Unido",
]
export const itemTypes = [
  "Eletrônico",
  "Documentos",
  "Roupas e acessórios",
  "Livros",
  "Presentes",
  "Outros",
]
export const labels: Record<Status, string> = {
  pending: "Aguardando aceite",
  accepted: "Solicitação aceita",
  received: "Mercadoria recebida",
  in_transit: "Em viagem",
  arrived: "Aguardando recebimento",
  completed: "Concluída",
  refused: "Recusada",
  cancelled: "Cancelada",
}
export const terminal = (status: Status) =>
  ["completed", "refused", "cancelled"].includes(status)
export const city = (value: string) => value.split(",")[0]
export const normalize = (value: string) =>
  city(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  )
export const dateLabel = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR")
export const timeLabel = (value?: string) =>
  value ? new Date(value).toLocaleString("pt-BR") : "Aguardando"
export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
export const uid = (prefix: string) =>
  `${prefix}${crypto.randomUUID().slice(0, 8).toUpperCase()}`
export const remaining = (trip: Trip, shipments: Shipment[]) => {
  const used = shipments
    .filter(
      (s) =>
        s.tripId === trip.id && !["cancelled", "refused"].includes(s.status),
    )
    .reduce((total, s) => total + s.weight, 0)
  return Math.max(0, Math.round((trip.space - used) * 1000) / 1000)
}
export function tripRating(store: Store, trip: Trip) {
  const reviews = receivedReviews(store, trip.ownerId)
  return reviews.length ? reviewAverage(reviews) : trip.rating
}
export function receivedReviews(store: Store, userId: string) {
  return store.reviews.filter((r) =>
    store.shipments.some(
      (s) =>
        s.id === r.shipmentId &&
        s.status === "completed" &&
        store.trips.some(
          (t) =>
            t.id === s.tripId && t.ownerId === userId && s.senderId !== userId,
        ),
    ),
  )
}
export function reviewAverage(reviews: Review[]) {
  return reviews.length
    ? Math.round(
        (reviews.reduce((total, r) => total + r.score, 0) / reviews.length) *
          10,
      ) / 10
    : 0
}
export function tripState(trip: Trip, shipments: Shipment[]) {
  const related = shipments.filter((s) => s.tripId === trip.id)
  if (
    related.some((s) => s.status === "completed") &&
    related.every((s) => terminal(s.status))
  )
    return "Concluída"
  if (
    related.some((s) =>
      ["received", "in_transit", "arrived"].includes(s.status),
    )
  )
    return "Em andamento"
  return trip.active ? "Publicada" : "Encerrada"
}
export function reconcileTrips(store: Store): Store {
  return {
    ...store,
    trips: store.trips.map((trip) => {
      if (tripState(trip, store.shipments) !== "Concluída") return trip
      const dates = store.shipments
        .filter((s) => s.tripId === trip.id && s.status === "completed")
        .map((s) => s.events.completed || s.createdAt)
        .sort()
      return {
        ...trip,
        active: false,
        completedAt: trip.completedAt || dates[dates.length - 1],
      }
    }),
  }
}
export function findTrips(
  trips: Trip[],
  shipments: Shipment[],
  search: Search,
) {
  return trips.filter(
    (t) =>
      t.active &&
      normalize(t.origin) === normalize(search.origin) &&
      normalize(t.destination) === normalize(search.destination) &&
      t.date === search.date &&
      (!t.acceptedTypes || t.acceptedTypes.includes(search.itemType)) &&
      remaining(t, shipments) >= Number(search.weight),
  )
}
export function routeError(
  origin: string,
  destination: string,
  date: string,
  weight: number,
) {
  if (!origin.trim() || !destination.trim())
    return "Informe a origem e o destino."
  if (normalize(origin) === normalize(destination))
    return "Escolha um destino diferente da origem."
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today())
    return "Escolha uma data de hoje em diante."
  if (!Number.isFinite(weight) || weight <= 0 || weight > 30)
    return "Informe um peso entre 0,1 e 30 kg."
  return ""
}
const transitions: Partial<Record<Status, Status[]>> = {
  pending: ["accepted", "refused", "cancelled"],
  accepted: ["received", "cancelled"],
  received: ["in_transit"],
  in_transit: ["arrived"],
  arrived: ["completed"],
}
export function changeStatus(store: Store, id: string, next: Status): Store {
  const shipment = store.shipments.find((s) => s.id === id)
  if (!shipment || !transitions[shipment.status]?.includes(next)) return store
  const at = new Date().toISOString()
  const shipments = store.shipments.map((s) =>
    s.id === id
      ? { ...s, status: next, events: { ...s.events, [next]: at } }
      : s,
  )
  return {
    ...store,
    shipments,
    trips: store.trips.map((trip) => {
      if (
        trip.id !== shipment.tripId ||
        tripState(trip, shipments) !== "Concluída"
      )
        return trip
      return { ...trip, active: false, completedAt: trip.completedAt || at }
    }),
    messages: [
      ...store.messages,
      {
        id: uid("M"),
        shipmentId: id,
        text: `Status atualizado: ${labels[next]}.`,
        at,
        author: "system",
      },
    ],
  }
}
export function initialStore(name: string, email: string, demo = false): Store {
  const date = today() > "2026-11-15" ? today() : "2026-11-15"
  const at = new Date().toISOString()
  return {
    profile: {
      name,
      email,
      phone: "",
      city: cities[0],
      notifications: true,
    },
    trips: [
      {
        id: "T-MARIA",
        ownerId: "sample-maria",
        name: "Maria Silva",
        origin: cities[0],
        destination: cities[1],
        date,
        space: 7,
        price: 40,
        notes:
          "Pequenos eletrônicos e documentos. Retirada e entrega a combinar.",
        rating: 4.9,
        active: true,
      },
      {
        id: "T-RAFAEL",
        ownerId: "sample-rafael",
        name: "Rafael Costa",
        origin: cities[2],
        destination: cities[3],
        date,
        space: 3,
        price: 35,
        notes: "Itens na embalagem original.",
        rating: 4.7,
        active: true,
      },
    ],
    shipments: demo
      ? [
          {
            id: "BG28491",
            tripId: "T-MARIA",
            senderId: email,
            sender: name,
            itemType: "Eletrônico",
            weight: 2,
            description: "Fone de ouvido na embalagem original",
            declaredValue: 800,
            status: "in_transit",
            createdAt: at,
            events: { pending: at, accepted: at, received: at, in_transit: at },
            price: 80,
          },
        ]
      : [],
    reviews: [],
    messages: [],
  }
}
