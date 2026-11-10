/** Read-only archive for moving the original browser data to Flutter. */
export function migrationArchive(storage: Storage) {
  const parse = (key: string) => {
    const value = storage.getItem(key)
    return value ? JSON.parse(value) : null
  }
  const profiles: Record<string, unknown> = {}
  const collections: Record<string, Map<string, unknown>> = {
    trips: new Map(), shipments: new Map(), reviews: new Map(), messages: new Map(),
  }
  const merge = (store: Record<string, unknown> | null) => {
    if (!store) return
    for (const key of Object.keys(collections)) {
      const rows = store[key]
      if (!Array.isArray(rows)) continue
      for (const row of rows) {
        const id = key === 'reviews' ? row.shipmentId : row.id
        if (typeof id === 'string') collections[key].set(id, row)
      }
    }
  }
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index)!
    if (!key.startsWith('leva:workspace:v2:')) continue
    const workspace = parse(key)
    if (workspace?.profile?.email) profiles[workspace.profile.email] = workspace.profile
    merge(workspace)
  }
  // The shared marketplace is authoritative over older account snapshots.
  merge(parse('leva:marketplace:v3'))
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts: parse('leva:accounts') || [],
    profiles,
    market: Object.fromEntries(Object.entries(collections).map(([key, rows]) => [key, [...rows.values()]])),
    legacyDelivery: parse('leva-comigo:delivery-progress'),
  }
}
