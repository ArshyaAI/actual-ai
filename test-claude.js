const https = require('https');

// Your API key
const ANTHROPIC_API_KEY = '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';

// Test Claude API
const testClaude = () => {
  const data = JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: 'Say "Swiss Bookkeeping Agent is ready!" in German'
      }
    ]
  });

  const options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      if (res.statusCode === 200) {
        const response = JSON.parse(responseData);
        console.log('✅ Claude API working!');
        console.log('Response:', response.content[0].text);
      } else {
        console.log('❌ API Error:', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error);
  });

  req.write(data);
  req.end();
};

console.log('🔍 Testing Claude API connection...');
testClaude();