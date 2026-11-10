import { chromium, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

// Run with the original app on :8443 and Flutter build/web on :8450.
// Every page uses an isolated browser context; user browser data is untouched.
const browser = await chromium.launch({ channel: 'msedge' })
const errors = []
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const original = await context.newPage()
  await original.goto('http://127.0.0.1:8443')
  await original.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await original.getByLabel('Nome completo').fill('Pessoa Migrada')
  await original.getByLabel('E-mail', { exact: true }).fill('migracao@exemplo.com')
  await original.getByLabel('Senha', { exact: true }).fill('senha123')
  await original.getByLabel('Confirmar senha').fill('senha123')
  await original.getByRole('button', { name: 'CRIAR CONTA', exact: true }).click()
  await original.getByRole('button', { name: 'ACESSAR MINHA CONTA' }).click()
  await original.locator('nav:visible').getByRole('button', { name: /^Perfil/ }).click()
  await original.getByRole('button', { name: 'Preferências e acesso' }).click()
  original.once('dialog', dialog => dialog.accept())
  const downloaded = original.waitForEvent('download')
  await original.getByRole('button', { name: 'EXPORTAR MIGRAÇÃO FLUTTER' }).click()
  const archive = await downloaded

  const flutter = await context.newPage()
  flutter.on('pageerror', error => errors.push(error.message))
  await flutter.goto('http://127.0.0.1:8450')
  await flutter.locator('flt-semantics-placeholder').evaluate(element => element.click())
  const choosing = flutter.waitForEvent('filechooser')
  await flutter.getByRole('button', { name: 'Importar dados do projeto original' }).click()
  await (await choosing).setFiles(await archive.path())
  await flutter.waitForFunction(() => Object.values(localStorage).some(value => value.includes('migracao@exemplo.com')))
  await flutter.getByRole('textbox', { name: 'E-mail', exact: true }).click()
  await flutter.waitForTimeout(200)
  await flutter.keyboard.type('migracao@exemplo.com', { delay: 30 })
  await flutter.getByRole('textbox', { name: 'Senha', exact: true }).click()
  await flutter.waitForTimeout(200)
  await flutter.keyboard.type('senha123', { delay: 30 })
  await flutter.getByRole('checkbox', { name: 'Lembrar de mim' }).click()
  await flutter.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(flutter.getByText('O que vamos conectar hoje?', { exact: true })).toBeVisible()
  const separateTab = await context.newPage()
  await separateTab.goto('http://127.0.0.1:8450')
  await separateTab.locator('flt-semantics-placeholder').evaluate(element => element.click())
  await expect(separateTab.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  await mkdir('test-results', { recursive: true })
  await flutter.screenshot({ path: 'test-results/flutter-home.png' })
  await flutter.reload()
  await flutter.locator('flt-semantics-placeholder').evaluate(element => element.click())
  await expect(flutter.getByText('O que vamos conectar hoje?', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
  console.log('PASS: React → arquivo de migração → Flutter → login com senha original → sessão temporária após recarregar e isolada de outra aba; nenhum erro JavaScript.')
} finally {
  await browser.close()
}
