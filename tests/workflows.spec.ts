import { test, expect, type Page } from "@playwright/test"
import { today, type Shipment } from "../src/domain"

async function logout(page: Page) {
  await nav(page, "Perfil")
  await page.getByRole("button", { name: "Preferências e acesso" }).click()
  await page
    .getByRole("button", { name: "SAIR DA CONTA", exact: true })
    .last()
    .click()
}
async function register(page: Page, name: string, email: string) {
  await page.getByRole("button", { name: "Criar conta", exact: true }).click()
  await page.getByLabel("Nome completo").fill(name)
  await page.getByLabel("E-mail", { exact: true }).fill(email)
  await page.getByLabel("Senha", { exact: true }).fill("senha123")
  await page.getByLabel("Confirmar senha").fill("senha123")
  await page.getByRole("button", { name: "CRIAR CONTA", exact: true }).click()
  await page.getByRole("button", { name: "ACESSAR MINHA CONTA" }).click()
}
async function login(page: Page, email: string) {
  await page.getByLabel("E-mail", { exact: true }).fill(email)
  await page.getByLabel("Senha", { exact: true }).fill("senha123")
  await page.getByRole("button", { name: "ENTRAR", exact: true }).click()
}

test("Lucas e Maria: envio, transporte, avaliação recebida, histórico e isolamento entre contas", async ({
  page,
}) => {
  test.setTimeout(100000)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.goto("/")
  await register(page, "Maria Silva", "maria@exemplo.com")
  await page
    .getByRole("button", { name: "PUBLICAR VIAGEM", exact: true })
    .click()
  await page.getByLabel("Origem", { exact: true }).fill("Curitiba, Brasil")
  await page.getByLabel("Destino", { exact: true }).fill("Fortaleza, Brasil")
  await page.getByRole("checkbox").check()
  await page
    .getByRole("button", { name: "PUBLICAR VIAGEM", exact: true })
    .click()
  await page.getByRole("button", { name: "EDITAR CONDIÇÕES DA VIAGEM" }).click()
  await page.getByLabel("Novo preço por kg (R$)").fill("25.50")
  await page.getByRole("button", { name: "SALVAR CONDIÇÕES" }).click()
  await logout(page)
  await register(page, "Lucas", "lucas@exemplo.com")
  await expect(page.getByText("Você ainda não tem encomendas")).toBeVisible()
  await nav(page, "Buscar")
  await page.getByLabel("De onde?").fill("Curitiba, Brasil")
  await page.getByLabel("Para onde?").fill("Fortaleza, Brasil")
  await page.getByLabel("Data da viagem").fill(today())
  await page.getByLabel("Peso aproximado (kg)").fill("1.2")
  await page
    .getByRole("button", { name: "BUSCAR VIAGENS", exact: true })
    .click()
  await page.getByRole("button", { name: "VER VIAGEM", exact: true }).click()
  await page.getByRole("button", { name: "SOLICITAR TRANSPORTE" }).click()
  await page.getByLabel("Descrição da mercadoria").fill("Um livro embalado")
  await page.getByLabel("Valor declarado (R$)").fill("120")
  await page.getByRole("checkbox").check()
  await page.getByRole("button", { name: "ENVIAR SOLICITAÇÃO" }).click()
  await expect(
    page.getByRole("button", { name: /ACEITAR SOLICITAÇÃO/ }),
  ).toHaveCount(0)
  await page.getByRole("button", { name: "CONVERSAR / PEDIR AJUDA" }).click()
  await page
    .getByLabel("Mensagem", { exact: true })
    .fill("Podemos nos encontrar no aeroporto?")
  await page.getByRole("button", { name: "Salvar mensagem" }).click()
  await logout(page)
  await login(page, "maria@exemplo.com")
  await page.locator(".delivery-row").click()
  await page.getByRole("button", { name: "CONVERSAR / PEDIR AJUDA" }).click()
  await expect(page.locator(".message.received")).toContainText(
    "Podemos nos encontrar no aeroporto?",
  )
  await page.getByRole("button", { name: "VER ENCOMENDA" }).click()
  await expect(page.locator(".package-details")).toContainText("30,60")
  for (const name of [
    "ACEITAR SOLICITAÇÃO",
    "CONFIRMAR COLETA DA MERCADORIA",
    "INICIAR VIAGEM",
    "MARCAR CHEGADA AO DESTINO",
  ])
    await page.getByRole("button", { name, exact: true }).click()
  await expect(
    page.getByRole("button", { name: "CONFIRMAR RECEBIMENTO", exact: true }),
  ).toHaveCount(0)
  await logout(page)
  await login(page, "lucas@exemplo.com")
  await page.locator(".delivery-row").click()
  await page
    .getByRole("button", { name: "CONFIRMAR RECEBIMENTO", exact: true })
    .click()
  await page.getByRole("checkbox").check()
  await page
    .getByRole("button", { name: "CONFIRMAR RECEBIMENTO", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Viagem concluída" }),
  ).toBeVisible()
  await page.getByRole("button", { name: "AVALIAR TRANSPORTE" }).click()
  await page.getByRole("button", { name: "4 estrelas", exact: true }).click()
  await page
    .getByLabel("Comentário (opcional)")
    .fill("Maria cuidou muito bem da encomenda do Lucas.")
  await page.getByRole("button", { name: "ENVIAR AVALIAÇÃO" }).click()
  await nav(page, "Início")
  await expect(
    page.getByText("Nenhuma encomenda em andamento", { exact: true }),
  ).toBeVisible()
  await expect(page.locator(".delivery-row")).toHaveCount(0)
  await nav(page, "Perfil")
  await page.getByRole("button", { name: "Histórico", exact: true }).click()
  await expect(page.getByText("Você enviou", { exact: true })).toBeVisible()
  await expect(page.getByText("Você transportou", { exact: true })).toHaveCount(
    0,
  )
  await expect(page.locator(".history-activity")).toContainText("Concluída")
  await page.getByRole("button", { name: "Avaliações", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Recebidas (0)", exact: true }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Enviadas (1)", exact: true }).click()
  await expect(page.locator(".reputation-review")).toContainText(
    "Para Maria Silva",
  )
  await logout(page)
  await login(page, "maria@exemplo.com")
  await expect(page.locator(".delivery-row")).toHaveCount(0)
  await nav(page, "Perfil")
  await page.getByRole("button", { name: "Avaliações", exact: true }).click()
  await expect(page.locator(".reputation-average strong")).toHaveText("4,0")
  await expect(page.locator(".reputation-review")).toContainText(
    "Avaliação de Lucas",
  )
  await expect(
    page.getByRole("button", { name: "ENVIAR AVALIAÇÃO", exact: true }),
  ).toHaveCount(0)
  await page.getByRole("button", { name: "Histórico", exact: true }).click()
  await expect(
    page.getByText("Você transportou", { exact: true }),
  ).toBeVisible()
  await expect(page.getByText("Você enviou", { exact: true })).toHaveCount(0)
  await expect(
    page
      .locator(".account-stats article")
      .filter({ hasText: "Viagens concluídas" })
      .locator("strong"),
  ).toHaveText("1")
  await page.reload()
  await nav(page, "Perfil")
  await page.getByRole("button", { name: "Avaliações", exact: true }).click()
  await expect(page.locator(".reputation-average strong")).toHaveText("4,0")
  await logout(page)
  await register(page, "Clara Independente", "clara@exemplo.com")
  await expect(page.locator(".delivery-row")).toHaveCount(0)
  await nav(page, "Perfil")
  await page.getByRole("button", { name: "Avaliações", exact: true }).click()
  await expect(page.locator(".reputation-review")).toHaveCount(0)
  await page.getByRole("button", { name: "Histórico", exact: true }).click()
  await expect(page.locator(".history-activity")).toHaveCount(0)
  expect(
    await page.evaluate(() => {
      const data = JSON.parse(
        localStorage.getItem("leva:marketplace:v3") || "{}",
      )
      return data.shipments.every(
        (s: Pick<Shipment, "tripId" | "senderId">) =>
          data.trips.find((t: { id: string }) => t.id === s.tripId).ownerId !==
          s.senderId,
      )
    }),
  ).toBe(true)
  expect(errors).toEqual([])
})

async function demo(page: Page) {
  await page.goto("/")
  await page.getByRole("button", { name: "EXPLORAR DEMONSTRAÇÃO" }).click()
  await expect(
    page.getByRole("heading", { name: "O que você deseja fazer hoje?" }),
  ).toBeVisible()
}
test("verificação simulada, edição de perfil e troca de senha persistem sem alterar outra conta", async ({
  page,
}) => {
  test.setTimeout(75000)
  await page.goto("/")
  await register(page, "Lucas", "lucas@exemplo.com")
  await nav(page, "Perfil")
  await page
    .getByRole("button", { name: "Verificação de identidade", exact: true })
    .click()
  await expect(page.locator(".verification-pending")).toHaveText("Pendente")
  await page.getByLabel("Tipo de documento (simulação)").selectOption("CNH")
  await page.getByRole("checkbox").check()
  await page.getByRole("button", { name: "INICIAR VERIFICAÇÃO" }).click()
  await expect(page.locator(".verification-review")).toHaveText("Em análise")
  await page.getByRole("button", { name: "SIMULAR REPROVAÇÃO" }).click()
  await expect(page.locator(".verification-rejected")).toHaveText("Reprovado")
  await page.getByRole("button", { name: "REENVIAR PARA ANÁLISE" }).click()
  await page.getByRole("button", { name: "SIMULAR APROVAÇÃO" }).click()
  await expect(page.locator(".verification-approved")).toHaveText("Aprovado")
  await page.getByRole("button", { name: "Meus dados", exact: true }).click()
  await page.getByLabel("Nome completo").fill("Lucas Almeida")
  await page.getByLabel("Telefone (opcional)").fill("81999999999")
  await page.getByRole("button", { name: "SALVAR ALTERAÇÕES" }).click()
  await page.reload()
  await nav(page, "Perfil")
  await expect(page.getByLabel("Nome completo")).toHaveValue("Lucas Almeida")
  await page
    .getByRole("button", { name: "Verificação de identidade", exact: true })
    .click()
  await expect(page.locator(".verification-approved")).toHaveText("Aprovado")
  await page.getByRole("button", { name: "Preferências e acesso" }).click()
  await page.getByLabel("Senha atual").fill("senha123")
  await page.getByLabel("Nova senha", { exact: true }).fill("novaSenha123")
  await page.getByRole("button", { name: "ALTERAR SENHA", exact: true }).click()
  await expect(page.getByRole("status")).toContainText("Senha atualizada")
  await logout(page)
  await login(page, "lucas@exemplo.com")
  await expect(page.getByRole("alert")).toContainText(
    "E-mail ou senha incorretos",
  )
  await page.getByLabel("Senha", { exact: true }).fill("novaSenha123")
  await page.getByRole("button", { name: "ENTRAR", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "O que você deseja fazer hoje?" }),
  ).toBeVisible()
  await logout(page)
  await register(page, "Maria Silva", "maria@exemplo.com")
  await nav(page, "Perfil")
  await expect(page.getByLabel("Nome completo")).toHaveValue("Maria Silva")
  await expect(page.getByLabel("Telefone (opcional)")).toHaveValue("")
  await page
    .getByRole("button", { name: "Verificação de identidade", exact: true })
    .click()
  await expect(page.locator(".verification-pending")).toHaveText("Pendente")
})
async function nav(page: Page, name: string) {
  await page
    .locator("nav:visible")
    .getByRole("button", { name: new RegExp(`^${name}( \\d+)?$`) })
    .click()
}
test("busca respeita rota, data e capacidade; envio percorre todas as etapas", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await demo(page)
  await nav(page, "Buscar")
  await expect(page.getByLabel("Data da viagem")).toHaveAttribute(
    "type",
    "date",
  )
  await page.getByLabel("Tipo de mercadoria").selectOption("Documentos")
  await page.getByLabel("Para onde?").fill("São Paulo, Brasil")
  await page
    .getByRole("button", { name: "BUSCAR VIAGENS", exact: true })
    .click()
  await expect(page.getByText("Nenhuma viagem compatível")).toBeVisible()
  await page.getByRole("button", { name: "ALTERAR FILTROS" }).click()
  await page.getByLabel("Para onde?").fill("Lisboa, Portugal")
  await page.getByLabel("Peso aproximado (kg)").fill("1.5")
  await page
    .getByRole("button", { name: "BUSCAR VIAGENS", exact: true })
    .click()
  await expect(page.getByText("1 VIAGEM(NS) ENCONTRADA(S)")).toBeVisible()
  await page.getByRole("button", { name: "VER VIAGEM", exact: true }).click()
  await page.getByRole("button", { name: "SOLICITAR TRANSPORTE" }).click()
  await page
    .getByLabel("Descrição da mercadoria")
    .fill("Documentos em envelope lacrado")
  await page.getByLabel("Valor declarado (R$)").fill("250.50")
  await expect(page.locator(".total-row")).toContainText("60,00")
  await page.getByRole("checkbox").check()
  await page.getByRole("button", { name: "ENVIAR SOLICITAÇÃO" }).click()
  await expect(page.locator(".tracking-head")).toContainText(
    "Aguardando aceite",
  )
  const code = await page.locator(".tracking-head h2").innerText()
  for (const name of [
    "SIMULAR: ACEITAR SOLICITAÇÃO",
    "SIMULAR: CONFIRMAR COLETA DA MERCADORIA",
    "SIMULAR: INICIAR VIAGEM",
    "SIMULAR: MARCAR CHEGADA AO DESTINO",
  ])
    await page.getByRole("button", { name, exact: true }).click()
  await page
    .getByRole("button", { name: "CONFIRMAR RECEBIMENTO", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "CONFIRMAR RECEBIMENTO", exact: true }),
  ).toBeDisabled()
  await page
    .getByRole("checkbox", { name: "Recebi e conferi minha encomenda." })
    .check()
  await page
    .getByRole("button", { name: "CONFIRMAR RECEBIMENTO", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Viagem concluída" }),
  ).toBeVisible()
  await page.getByRole("button", { name: "AVALIAR TRANSPORTE" }).click()
  await page.getByRole("button", { name: "5 estrelas", exact: true }).click()
  await page
    .getByRole("button", { name: "Comunicação: 4 estrelas", exact: true })
    .click()
  await page
    .getByLabel("Comentário (opcional)")
    .fill("Muito cuidado e boa comunicação.")
  await page.getByRole("button", { name: "ENVIAR AVALIAÇÃO" }).click()
  await page.getByRole("button", { name: "CONVERSAR / PEDIR AJUDA" }).click()
  await page
    .getByLabel("Mensagem", { exact: true })
    .fill("Obrigado pela entrega!")
  await page.getByRole("button", { name: "Salvar mensagem" }).click()
  await expect(
    page.locator(".message.sent").filter({ hasText: "Obrigado pela entrega!" }),
  ).toBeVisible()
  await page.reload()
  await nav(page, "Viagens")
  await page.getByRole("tab", { name: /Concluídas/ }).click()
  await page.locator(".delivery-row").filter({ hasText: code }).click()
  await expect(
    page.getByRole("heading", { name: "Viagem concluída" }),
  ).toBeVisible()
  await page.getByRole("button", { name: "VER AVALIAÇÃO" }).click()
  await expect(
    page.getByText("Muito cuidado e boa comunicação.", { exact: true }),
  ).toBeVisible()
  expect(errors).toEqual([])
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test("publicação, solicitações recebidas, recusa e encerramento", async ({
  page,
}) => {
  await demo(page)
  await page
    .getByRole("button", { name: "PUBLICAR VIAGEM", exact: true })
    .click()
  await page.getByLabel("Origem", { exact: true }).fill("Curitiba, Brasil")
  await page.getByLabel("Destino", { exact: true }).fill("Porto, Portugal")
  await page.getByLabel("Observações").fill("Somente documentos")
  await page.getByRole("checkbox").check()
  await page
    .getByRole("button", { name: "PUBLICAR VIAGEM", exact: true })
    .click()
  await expect(
    page.getByText("5 de 5 kg disponíveis", { exact: false }),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "TESTAR COM SOLICITAÇÃO DE EXEMPLO" })
    .click()
  await page
    .getByRole("button", { name: "RECUSAR SOLICITAÇÃO", exact: true })
    .click()
  await expect(page.locator(".tracking-head")).toContainText("Recusada")
  await nav(page, "Viagens")
  await expect(
    page.getByText("5 de 5 kg disponíveis", { exact: false }),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "TESTAR COM SOLICITAÇÃO DE EXEMPLO" })
    .click()
  for (const name of [
    "ACEITAR SOLICITAÇÃO",
    "CONFIRMAR COLETA DA MERCADORIA",
    "INICIAR VIAGEM",
    "MARCAR CHEGADA AO DESTINO",
    "SIMULAR CONFIRMAÇÃO DO REMETENTE",
  ])
    await page.getByRole("button", { name, exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Viagem concluída" }),
  ).toBeVisible()
  await nav(page, "Viagens")
  await expect(page.locator(".record-list .panel .status")).toContainText(
    "Concluída",
  )
  await page
    .getByRole("button", { name: "PUBLICAR VIAGEM", exact: true })
    .click()
  await page.getByRole("checkbox").check()
  await page
    .getByRole("button", { name: "PUBLICAR VIAGEM", exact: true })
    .click()
  await page
    .getByRole("button", { name: "ENCERRAR PUBLICAÇÃO", exact: true })
    .click()
  await page
    .getByRole("button", { name: "CONFIRMAR ENCERRAMENTO", exact: true })
    .click()
  await expect(page.getByText("Encerrada", { exact: true })).toBeVisible()
})

test("cadastro, perfil, recuperação e login validam e persistem dados", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Criar conta", exact: true }).click()
  await page.getByLabel("Nome completo").fill("Carla Souza")
  await page.getByLabel("E-mail", { exact: true }).fill("carla@exemplo.com")
  await page.getByLabel("Senha", { exact: true }).fill("senha123")
  await page.getByLabel("Confirmar senha").fill("senha123")
  await page.getByRole("button", { name: "CRIAR CONTA", exact: true }).click()
  const recovery = await page.locator(".recovery-code").innerText()
  await page.getByRole("button", { name: "ACESSAR MINHA CONTA" }).click()
  await nav(page, "Perfil")
  await page.getByLabel("Nome completo").fill("Carla Souza Lima")
  await page.getByLabel("Telefone (opcional)").fill("81999999999")
  await page.getByRole("button", { name: "SALVAR ALTERAÇÕES" }).click()
  await expect(
    page.getByRole("heading", { name: "Carla Souza Lima" }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Preferências e acesso" }).click()
  await page
    .getByRole("checkbox", { name: "Exibir notificações de encomendas" })
    .uncheck()
  await expect(
    page.getByRole("button", { name: "Notificações", exact: true }),
  ).toHaveCount(0)
  await page
    .getByRole("button", { name: "SAIR DA CONTA", exact: true })
    .last()
    .click()
  await page.getByRole("button", { name: "Esqueci minha senha" }).click()
  await page.getByLabel("E-mail", { exact: true }).fill("carla@exemplo.com")
  await page.getByLabel("Código de recuperação").fill(recovery)
  await page.getByLabel("Nova senha", { exact: true }).fill("nova1234")
  await page.getByLabel("Confirmar senha").fill("nova1234")
  await page.getByRole("button", { name: "REDEFINIR SENHA" }).click()
  await page.getByLabel("Senha", { exact: true }).fill("errada123")
  await page.getByRole("button", { name: "ENTRAR", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText(
    "E-mail ou senha incorretos",
  )
  await page.getByLabel("Senha", { exact: true }).fill("nova1234")
  await page.getByRole("button", { name: "ENTRAR", exact: true }).click()
  await nav(page, "Perfil")
  await expect(page.getByLabel("Nome completo")).toHaveValue("Carla Souza Lima")
  await page.reload()
  await nav(page, "Perfil")
  await expect(page.getByLabel("Telefone (opcional)")).toHaveValue(
    "81999999999",
  )
})
