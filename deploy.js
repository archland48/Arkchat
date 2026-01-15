const https = require('https');

const API_BASE_URL = 'https://space.ai-builders.com/backend';
const AI_BUILDER_TOKEN = process.env.AI_BUILDER_TOKEN || 'sk_f42afda7_53b5ad04de005b84e48a8837494c681d0587';

const deployConfig = {
  repo_url: process.env.REPO_URL || '',
  service_name: 'arkchat',
  branch: 'main',
  port: 3000,
  env_vars: {}
};

if (!deployConfig.repo_url) {
  console.error('❌ Error: REPO_URL environment variable is required');
  console.log('\n📝 To deploy, you need to:');
  console.log('1. Create a public GitHub repository');
  console.log('2. Push your code to GitHub');
  console.log('3. Set REPO_URL environment variable');
  console.log('\nExample:');
  console.log('  export REPO_URL=https://github.com/yourusername/chatgpt-clone');
  console.log('  node deploy.js');
  process.exit(1);
}

const postData = JSON.stringify(deployConfig);

const options = {
  hostname: 'space.ai-builders.com',
  port: 443,
  path: '/backend/v1/deployments',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length,
    'Authorization': `Bearer ${AI_BUILDER_TOKEN}`
  }
};

console.log('🚀 Starting deployment...');
console.log(`📦 Service: ${deployConfig.service_name}`);
console.log(`🔗 Repository: ${deployConfig.repo_url}`);
console.log(`🌿 Branch: ${deployConfig.branch}`);
console.log(`🔌 Port: ${deployConfig.port}\n`);

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 202) {
      const response = JSON.parse(data);
      console.log('✅ Deployment queued successfully!');
      console.log(`\n📊 Status: ${response.status}`);
      console.log(`🌐 Public URL: ${response.public_url || 'Will be available after deployment'}`);
      console.log(`\n⏳ Deployment typically takes 5-10 minutes.`);
  console.log(`📝 Check status: GET ${API_BASE_URL}/v1/deployments/${deployConfig.service_name}`);
  console.log(`\n💡 Monitor logs: GET ${API_BASE_URL}/v1/deployments/${deployConfig.service_name}/logs`);
  console.log(`\n🌐 Your app will be available at: https://${deployConfig.service_name}.ai-builders.space`);
    } else {
      console.error(`❌ Deployment failed with status ${res.statusCode}`);
      console.error('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(postData);
req.end();
