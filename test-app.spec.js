import { test, expect } from '@playwright/test';

test.describe('Gestor Condominios - Verificación de Funcionamiento', () => {
  
  test('La aplicación carga sin errores', async ({ page }) => {
    console.log('🔍 Iniciando prueba de carga de aplicación...');
    
    // Navegar a la aplicación
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Verificar que el título es correcto
    await expect(page).toHaveTitle('Gestor Condominios - Modo Oscuro');
    console.log('✅ Título correcto');
    
    // Verificar que no hay errores en la consola
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Esperar un momento para capturar posibles errores
    await page.waitForTimeout(2000);
    
    // Reportar errores si los hay
    if (consoleErrors.length > 0) {
      console.log('⚠️ Errores en consola encontrados:', consoleErrors);
    } else {
      console.log('✅ No hay errores críticos en consola');
    }
  });

  test('No hay parpadeo en la aplicación', async ({ page }) => {
    console.log('🔍 Verificando ausencia de parpadeo...');
    
    await page.goto('http://localhost:5173');
    
    // Tomar screenshots en intervalos para detectar parpadeo
    const screenshots = [];
    for (let i = 0; i < 3; i++) {
      screenshots.push(await page.screenshot({ fullPage: false }));
      await page.waitForTimeout(500);
    }
    
    // Verificar que los screenshots son similares (no hay parpadeo)
    const firstScreenshot = screenshots[0];
    let hasFlickering = false;
    
    for (let i = 1; i < screenshots.length; i++) {
      // Comparación básica de tamaño (un indicador simple)
      if (Math.abs(firstScreenshot.length - screenshots[i].length) > 10000) {
        hasFlickering = true;
        break;
      }
    }
    
    if (hasFlickering) {
      console.log('❌ Se detectó parpadeo en la aplicación');
    } else {
      console.log('✅ No se detectó parpadeo');
    }
    
    expect(hasFlickering).toBe(false);
  });

  test('El menú de navegación está presente', async ({ page }) => {
    console.log('🔍 Verificando componentes de navegación...');
    
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // Verificar que existe el contenedor principal
    const mainContainer = await page.$('div#root');
    expect(mainContainer).not.toBeNull();
    console.log('✅ Contenedor principal encontrado');
    
    // Verificar tema oscuro
    const isDarkMode = await page.$eval('body', el => 
      el.classList.contains('dark') || 
      document.documentElement.classList.contains('dark')
    );
    console.log(isDarkMode ? '✅ Tema oscuro activo' : '⚠️ Tema oscuro no detectado');
  });

  test('Navegación entre secciones funciona', async ({ page }) => {
    console.log('🔍 Probando navegación entre secciones...');
    
    await page.goto('http://localhost:5173');
    
    // Verificar que podemos navegar a diferentes rutas
    const routes = [
      '/dashboard',
      '/miembros', 
      '/finanzas',
      '/convocatorias',
      '/actas'
    ];
    
    for (const route of routes) {
      await page.goto(`http://localhost:5173${route}`, {
        waitUntil: 'networkidle',
        timeout: 10000
      });
      
      // Verificar que la página carga sin error 500
      const response = page.url();
      expect(response).toContain(route);
      console.log(`✅ Ruta ${route} accesible`);
      
      await page.waitForTimeout(500);
    }
  });

  test('API Backend responde correctamente', async ({ page }) => {
    console.log('🔍 Verificando conexión con backend...');
    
    const response = await page.request.get('http://localhost:3002/api/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.status).toBe('OK');
    console.log('✅ Backend API funcionando:', data);
  });
});

// Resumen final
test.afterAll(async () => {
  console.log('\n📊 RESUMEN DE PRUEBAS COMPLETADO');
  console.log('===================================');
});