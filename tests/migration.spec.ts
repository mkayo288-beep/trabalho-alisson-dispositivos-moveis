import { test, expect } from '@playwright/test'
import { migrationArchive } from '../src/migration'

test('exportação preserva contas e perfis e prioriza mercado compartilhado', () => {
  const entries = new Map<string, string>([
    ['leva:accounts', JSON.stringify([{ email: 'a@b.com', hash: 'hash' }])],
    ['leva:workspace:v2:a@b.com', JSON.stringify({ profile: { email: 'a@b.com', name: 'Pessoa' }, trips: [{ id: 'T1', active: true }], shipments: [], reviews: [], messages: [] })],
    ['leva:marketplace:v3', JSON.stringify({ trips: [{ id: 'T1', active: false }], shipments: [], reviews: [], messages: [] })],
  ])
  const storage = { get length() { return entries.size }, key: (i: number) => [...entries.keys()][i] ?? null, getItem: (key: string) => entries.get(key) ?? null } as Storage
  const before = JSON.stringify([...entries])
  const archive = migrationArchive(storage)
  expect(archive.accounts[0].hash).toBe('hash')
  expect(archive.profiles['a@b.com']).toEqual({ email: 'a@b.com', name: 'Pessoa' })
  expect(archive.market.trips).toEqual([{ id: 'T1', active: false }])
  expect(JSON.stringify([...entries])).toBe(before)
})
