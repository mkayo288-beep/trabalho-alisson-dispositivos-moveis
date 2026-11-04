import { test, expect } from "@playwright/test"
import {
  changeStatus,
  findTrips,
  initialStore,
  remaining,
  routeError,
  today,
  tripState,
  reviewAverage,
  receivedReviews,
  type Shipment,
  type Status,
} from "../src/domain"

test("capacidade usa decimais, cancela reservas e impede transições inválidas", () => {
  let store = initialStore("João", "teste@exemplo.com", true)
  const trip = store.trips[0]
  expect(remaining(trip, store.shipments)).toBe(5)
  expect(changeStatus(store, "BG28491", "completed")).toBe(store)
  for (const next of ["arrived", "completed"] as Status[])
    store = changeStatus(store, "BG28491", next)
  expect(store.shipments[0].events.completed).toBeTruthy()
  expect(store.trips[0].active).toBe(false)
  expect(tripState(store.trips[0], store.shipments)).toBe("Concluída")
  expect(changeStatus(store, "BG28491", "arrived")).toBe(store)
  const s: Shipment = {
    ...store.shipments[0],
    id: "BG-NEW",
    status: "pending",
    weight: 1.5,
    events: { pending: new Date().toISOString() },
  }
  store = { ...store, shipments: [...store.shipments, s] }
  expect(remaining(trip, store.shipments)).toBe(3.5)
  store = changeStatus(store, s.id, "cancelled")
  expect(remaining(trip, store.shipments)).toBe(5)
  const search = {
    origin: "recife",
    destination: "LISBOA",
    date: trip.date,
    weight: "5",
    itemType: "Documentos",
  }
  expect(findTrips(store.trips, store.shipments, search)).toHaveLength(0)
  expect(findTrips([trip], store.shipments, search)).toHaveLength(1)
  expect(
    findTrips([trip], store.shipments, { ...search, weight: "5.1" }),
  ).toHaveLength(0)
  expect(
    findTrips([trip], store.shipments, {
      ...search,
      destination: "Porto",
    }),
  ).toHaveLength(0)
  expect(
    findTrips(
      [{ ...trip, acceptedTypes: ["Eletrônico"] }],
      store.shipments,
      search,
    ),
  ).toHaveLength(0)
  expect(routeError("Recife", "recife", today(), 1)).toBeTruthy()
  expect(routeError("Recife", "Lisboa", "2020-01-01", 1)).toBeTruthy()
  const reviewed = {
    ...store,
    reviews: [
      {
        shipmentId: "BG28491",
        score: 4,
        comment: "Bom",
        criteria: {},
        at: new Date().toISOString(),
      },
      {
        shipmentId: "BG-NEW",
        score: 2,
        comment: "Regular",
        criteria: {},
        at: new Date().toISOString(),
      },
    ],
  }
  expect(reviewAverage(receivedReviews(reviewed, "sample-maria"))).toBe(4)
  const bothCompleted = {
    ...reviewed,
    shipments: reviewed.shipments.map((s) => ({
      ...s,
      status: "completed" as const,
    })),
  }
  expect(reviewAverage(receivedReviews(bothCompleted, "sample-maria"))).toBe(3)
  expect(receivedReviews(reviewed, "teste@exemplo.com")).toHaveLength(0)
})
