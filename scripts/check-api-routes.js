const fs = require('fs');
const path = require('path');

// Find all route.ts files
function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Check a route file
function checkRouteFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = filePath.replace(process.cwd() + path.sep, '');
  
  const issues = [];
  const checks = {
    hasExport: false,
    exports: [],
    hasErrorHandling: false,
    hasTryCatch: false,
    usesRateLimit: false,
    usesCSRF: false,
    hasDynamic: false,
    hasRevalidate: false,
  };
  
  // Check for exports
  const exportMatches = content.match(/export\s+(?:const|function|async\s+function)\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)/g);
  if (exportMatches) {
    checks.hasExport = true;
    checks.exports = exportMatches.map(m => {
      const match = m.match(/(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)/);
      return match ? match[1] : null;
    }).filter(Boolean);
  }
  
  // Check for error handling
  checks.hasTryCatch = content.includes('try {') || content.includes('try{');
  checks.hasErrorHandling = checks.hasTryCatch && content.includes('catch');
  
  // Check for rate limiting
  checks.usesRateLimit = content.includes('createRateLimitedRoute');
  
  // Check for CSRF protection
  checks.usesCSRF = content.includes('withCSRFProtection');
  
  // Check for route segment config
  checks.hasDynamic = content.includes('export const dynamic');
  checks.hasRevalidate = content.includes('export const revalidate');
  
  // Determine issues
  if (!checks.hasExport) {
    issues.push('❌ No HTTP method exports found (GET, POST, etc.)');
  }
  
  if (!checks.hasErrorHandling && checks.hasExport) {
    issues.push('⚠️  No try-catch error handling found');
  }
  
  // Check if async functions return NextResponse
  if (checks.hasExport && !content.includes('NextResponse')) {
    issues.push('⚠️  May not be returning NextResponse');
  }
  
  return {
    path: relativePath,
    checks,
    issues,
    status: issues.length === 0 ? '✅' : issues.length > 2 ? '❌' : '⚠️'
  };
}

// Main
const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

console.log('🔍 Checking API Routes...\n');
console.log(`Found ${routeFiles.length} route files\n`);

const results = routeFiles.map(checkRouteFile);

// Group by status
const passed = results.filter(r => r.status === '✅');
const warnings = results.filter(r => r.status === '⚠️');
const errors = results.filter(r => r.status === '❌');

console.log('📊 Summary:');
console.log(`  ✅ Passed: ${passed.length}`);
console.log(`  ⚠️  Warnings: ${warnings.length}`);
console.log(`  ❌ Errors: ${errors.length}\n`);

// Show errors first
if (errors.length > 0) {
  console.log('❌ Routes with Errors:\n');
  errors.forEach(result => {
    console.log(`  ${result.path}`);
    result.issues.forEach(issue => console.log(`    ${issue}`));
    console.log(`    Exports: ${result.checks.exports.join(', ') || 'None'}`);
    console.log('');
  });
}

// Show warnings
if (warnings.length > 0) {
  console.log('⚠️  Routes with Warnings:\n');
  warnings.forEach(result => {
    console.log(`  ${result.path}`);
    result.issues.forEach(issue => console.log(`    ${issue}`));
    console.log(`    Exports: ${result.checks.exports.join(', ') || 'None'}`);
    console.log('');
  });
}

// Show all routes summary
console.log('\n📋 All Routes Summary:\n');
results.forEach(result => {
  const exports = result.checks.exports.length > 0 
    ? result.checks.exports.join(', ') 
    : 'None';
  const errorHandling = result.checks.hasErrorHandling ? '✅' : '❌';
  const rateLimit = result.checks.usesRateLimit ? '✅' : '';
  const csrf = result.checks.usesCSRF ? '✅' : '';
  
  console.log(`  ${result.status} ${result.path}`);
  console.log(`     Methods: ${exports} | Error Handling: ${errorHandling} ${rateLimit} ${csrf}`);
});

// Exit with error code if there are issues
if (errors.length > 0 || warnings.length > 0) {
  process.exit(1);
}

