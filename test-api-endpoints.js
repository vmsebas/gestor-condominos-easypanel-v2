// Test API endpoints
const BASE_URL = 'http://localhost:3002';

async function testEndpoints() {
  console.log('🔍 Testing API endpoints...\n');
  
  // Test endpoints without auth
  const publicEndpoints = [
    '/api/health',
    '/api/test'
  ];
  
  for (const endpoint of publicEndpoints) {
    try {
      const response = await fetch(BASE_URL + endpoint);
      const data = await response.json();
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
      console.log(`   Response:`, JSON.stringify(data).substring(0, 100));
    } catch (error) {
      console.log(`❌ ${endpoint} - Error:`, error.message);
    }
  }
  
  console.log('\n🔐 Testing authenticated endpoints...');
  
  // First login to get token
  try {
    const loginResponse = await fetch(BASE_URL + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'Admin123!'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log(`\n📝 Login - Status: ${loginResponse.status}`);
    
    if (loginData.success && loginData.data?.accessToken) {
      const token = loginData.data.accessToken;
      console.log(`✅ Got access token`);
      
      // Test authenticated endpoints
      const authEndpoints = [
        '/api/buildings',
        '/api/members',
        '/api/convocatorias',
        '/api/minutes',
        '/api/actas',
        '/api/tasks',
        '/api/documents',
        '/api/financial-summary/fb0d83d3-fe04-47cb-ba48-f95538a2a7fc'
      ];
      
      for (const endpoint of authEndpoints) {
        try {
          const response = await fetch(BASE_URL + endpoint, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          console.log(`\n✅ ${endpoint} - Status: ${response.status}`);
          if (data.data && Array.isArray(data.data)) {
            console.log(`   Records: ${data.data.length}`);
          } else {
            console.log(`   Response:`, JSON.stringify(data).substring(0, 100));
          }
        } catch (error) {
          console.log(`\n❌ ${endpoint} - Error:`, error.message);
        }
      }
    } else {
      console.log('❌ Login failed:', loginData);
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
  }
}

testEndpoints();