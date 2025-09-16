import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Analizando cambios en la página...\n');
  
  // Escuchar todos los console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Error en consola:', msg.text());
    }
  });

  // Monitorear navegación
  page.on('framenavigated', () => {
    console.log('📍 Navegación detectada:', page.url());
  });

  // Detectar cambios en el DOM
  await page.goto('http://localhost:5173');
  
  // Evaluar el estado inicial
  const initialState = await page.evaluate(() => {
    return {
      title: document.title,
      bodyClass: document.body.className,
      rootClass: document.documentElement.className,
      hasRoot: !!document.getElementById('root'),
      rootChildren: document.getElementById('root')?.children.length || 0
    };
  });
  
  console.log('Estado inicial:', initialState);
  
  // Monitorear cambios durante 3 segundos
  let changeCount = 0;
  const interval = setInterval(async () => {
    const currentState = await page.evaluate(() => {
      return {
        title: document.title,
        bodyClass: document.body.className,
        rootClass: document.documentElement.className,
        hasRoot: !!document.getElementById('root'),
        rootChildren: document.getElementById('root')?.children.length || 0
      };
    });
    
    // Comparar con estado inicial
    if (JSON.stringify(currentState) !== JSON.stringify(initialState)) {
      changeCount++;
      console.log(`\n⚠️ Cambio #${changeCount} detectado:`);
      console.log('Estado actual:', currentState);
    }
  }, 100);
  
  // Esperar 3 segundos
  await page.waitForTimeout(3000);
  clearInterval(interval);
  
  console.log(`\n📊 Total de cambios detectados: ${changeCount}`);
  
  if (changeCount > 0) {
    console.log('❌ La aplicación está parpadeando');
  } else {
    console.log('✅ La aplicación es estable');
  }
  
  await browser.close();
})();