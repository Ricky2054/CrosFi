#!/usr/bin/env node

// Simple test script to verify API client fallback behavior
const { apiClient } = require('./lib/api-client.ts');

async function testAPIClient() {
  console.log('🧪 Testing API Client Fallback Behavior...');
  console.log('==========================================\n');

  try {
    // Test getVaultTokens
    console.log('1. Testing getVaultTokens...');
    const tokens = await apiClient.getVaultTokens();
    console.log('   ✅ Success:', tokens.length, 'tokens returned');
    console.log('   📊 Tokens:', tokens.map(t => `${t.token} (${t.apy}% APY)`).join(', '));

    // Test getVaultStats
    console.log('\n2. Testing getVaultStats...');
    const stats = await apiClient.getVaultStats();
    console.log('   ✅ Success:', 'Stats returned');
    console.log('   📊 Total TVL:', stats.totalTVL);
    console.log('   📊 Average APY:', stats.averageAPY + '%');

    // Test getTVL
    console.log('\n3. Testing getTVL...');
    const tvl = await apiClient.getTVL();
    console.log('   ✅ Success:', 'TVL data returned');
    console.log('   📊 Total TVL:', tvl.totalTVL);
    console.log('   📊 Breakdown:', tvl.breakdown.length, 'tokens');

    // Test isBackendAvailable
    console.log('\n4. Testing isBackendAvailable...');
    const isAvailable = await apiClient.isBackendAvailable();
    console.log('   📡 Backend Available:', isAvailable ? 'Yes' : 'No (using fallback)');

    console.log('\n🎉 All tests passed! API client is working correctly.');
    console.log('💡 The application will work with or without the backend server.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAPIClient();
