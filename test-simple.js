import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Verificando estabilidad de la aplicación...\n');
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  // Tomar 5 screenshots con 200ms de diferencia
  const screenshots = [];
  for (let i = 0; i < 5; i++) {
    const screenshot = await page.screenshot();
    screenshots.push(screenshot);
    console.log(`📸 Screenshot ${i + 1} tomado (${screenshot.length} bytes)`);
    await page.waitForTimeout(200);
  }
  
  // Comparar tamaños
  const sizes = screenshots.map(s => s.length);
  const uniqueSizes = [...new Set(sizes)];
  
  console.log('\n📊 Análisis de screenshots:');
  console.log('Tamaños:', sizes);
  console.log('Tamaños únicos:', uniqueSizes.length);
  
  if (uniqueSizes.length === 1) {
    console.log('✅ La aplicación es estable - no hay cambios visuales');
  } else {
    const maxDiff = Math.max(...sizes) - Math.min(...sizes);
    console.log(`❌ Se detectaron cambios visuales - diferencia máxima: ${maxDiff} bytes`);
    
    if (maxDiff < 1000) {
      console.log('   (Cambios menores, posiblemente animaciones)');
    } else {
      console.log('   (Cambios significativos, probable parpadeo)');
    }
  }
  
  await browser.close();
})();