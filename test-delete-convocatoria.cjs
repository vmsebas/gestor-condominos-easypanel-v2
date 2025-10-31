const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Iniciando teste de eliminação de convocatoria...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down so we can see what's happening
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Track network requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('convocatorias')) {
      requests.push({
        method: request.method(),
        url: request.url(),
        timestamp: new Date().toISOString()
      });
      console.log(`📤 ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', async response => {
    if (response.url().includes('convocatorias')) {
      const status = response.status();
      console.log(`📥 ${response.status()} ${response.url()}`);

      if (status === 200 && response.request().method() === 'GET') {
        try {
          const data = await response.json();
          if (data.data) {
            console.log(`   ✅ Recebidas ${data.data.length} convocatorias`);
            data.data.forEach(c => {
              console.log(`      - ${c.assembly_number}: ${c.deleted_at ? '❌ DELETED' : '✅ ACTIVE'}`);
            });
          }
        } catch (e) {
          // Not JSON
        }
      }
    }
  });

  try {
    // Step 1: Go to login
    console.log('\n1️⃣ Indo para página de login...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');

    // Step 2: Login
    console.log('2️⃣ Fazendo login...');
    await page.fill('input[type="email"]', 'admin@migestpro.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Login bem-sucedido!\n');

    // Step 3: Navigate to Convocatorias
    console.log('3️⃣ Navegando para Convocatorias...');
    await page.click('text=Convocatorias');
    await page.waitForURL('**/convocatorias', { timeout: 5000 });
    await page.waitForLoadState('networkidle');
    console.log('✅ Página de Convocatorias carregada\n');

    // Wait a bit for data to load
    await page.waitForTimeout(2000);

    // Step 4: Find and click delete on convocatoria 31
    console.log('4️⃣ Procurando convocatoria 31...');

    // Look for row with assembly number 31
    const row = page.locator('tr:has-text("31")').first();
    const exists = await row.count() > 0;

    if (!exists) {
      console.log('❌ Convocatoria 31 não encontrada na tabela!');
      await page.screenshot({ path: 'screenshot-not-found.png', fullPage: true });
      console.log('📸 Screenshot salvo: screenshot-not-found.png');
    } else {
      console.log('✅ Convocatoria 31 encontrada!');

      // Click the menu button (three dots)
      await row.locator('button[role="button"]').last().click();
      await page.waitForTimeout(500);

      console.log('5️⃣ Clicando em Eliminar...\n');

      // Click delete option
      await page.click('text=Eliminar');
      await page.waitForTimeout(500);

      // Confirm deletion in modal
      console.log('6️⃣ Confirmando eliminação...\n');
      await page.click('button:has-text("Confirmar")');

      // Wait for requests to complete
      await page.waitForTimeout(3000);

      // Check if convocatoria 31 still appears
      console.log('\n7️⃣ Verificando se convocatoria foi removida da lista...');
      const stillExists = await page.locator('tr:has-text("31")').count() > 0;

      if (stillExists) {
        console.log('❌ PROBLEMA: Convocatoria 31 ainda aparece na tabela!');
        await page.screenshot({ path: 'screenshot-still-visible.png', fullPage: true });
        console.log('📸 Screenshot salvo: screenshot-still-visible.png');
      } else {
        console.log('✅ Convocatoria 31 removida com sucesso da tabela!');
        await page.screenshot({ path: 'screenshot-success.png', fullPage: true });
        console.log('📸 Screenshot salvo: screenshot-success.png');
      }
    }

    console.log('\n📊 Resumo dos requests:');
    requests.forEach(req => {
      console.log(`   ${req.method} ${req.url.split('?')[0]}`);
    });

    // Keep browser open for 5 seconds so you can see the result
    console.log('\n⏳ Aguardando 5 segundos antes de fechar...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    await page.screenshot({ path: 'screenshot-error.png', fullPage: true });
    console.log('📸 Screenshot salvo: screenshot-error.png');
  } finally {
    await browser.close();
    console.log('\n✅ Teste concluído!');
  }
})();
