const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying deployment configuration...\n');

// Check package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('📦 Package.json verification:');
console.log(`   Next.js version: ${packageJson.dependencies.next}`);
console.log(`   Clerk version: ${packageJson.dependencies['@clerk/nextjs']}`);
console.log(`   Node.js engines: ${packageJson.engines?.node || 'Not specified'}`);

// Check if required files exist
const requiredFiles = [
  'package.json',
  '.npmrc',
  'railway.toml',
  'Dockerfile',
  'server-combined.js',
  'prisma/schema.prisma'
];

console.log('\n📁 Required files check:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${file}: ${exists ? '✅' : '❌'}`);
});

// Check .npmrc configuration
console.log('\n⚙️  .npmrc configuration:');
const npmrc = fs.readFileSync('.npmrc', 'utf8');
console.log(`   Legacy peer deps: ${npmrc.includes('legacy-peer-deps=true') ? '✅' : '❌'}`);
console.log(`   Auto install peers: ${npmrc.includes('auto-install-peers=true') ? '✅' : '❌'}`);

// Check Railway configuration
console.log('\n🚂 Railway configuration:');
const railwayToml = fs.readFileSync('railway.toml', 'utf8');
console.log(`   Has install phase: ${railwayToml.includes('[phases.install]') ? '✅' : '❌'}`);
console.log(`   Has build phase: ${railwayToml.includes('[phases.build]') ? '✅' : '❌'}`);

console.log('\n🎉 Deployment verification complete!');
console.log('\n📋 Next steps:');
console.log('1. Railway should automatically redeploy with the new configuration');
console.log('2. Check Railway logs for any remaining issues');
console.log('3. Verify the health endpoint: https://your-app.railway.app/api/health'); 