const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'admin@example.com',
      password: 'Admin123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login exitoso:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error en login:');
    console.error(error.response?.data || error.message);
  }
}

testLogin();