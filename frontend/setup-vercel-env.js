#!/usr/bin/env node

/**
 * Script to configure Vercel environment variables
 * Run this after logging in to Vercel CLI
 */

console.log('🔧 CareConnect - Vercel Environment Setup\n');

const { execSync } = require('child_process');

// Configuration
const ENV_VARS = {
    VITE_API_URL: 'https://care-connect-api-bl1z.onrender.com'
};

const ENVIRONMENTS = ['production', 'preview', 'development'];

console.log('Setting up environment variables...\n');

try {
    // Check if logged in
    try {
        execSync('vercel whoami', { stdio: 'pipe' });
    } catch (err) {
        console.error('❌ Not logged in to Vercel.');
        console.log('\n📝 Please run: vercel login');
        process.exit(1);
    }

    // Add each environment variable
    for (const [key, value] of Object.entries(ENV_VARS)) {
        console.log(`📌 Adding ${key}...`);

        for (const env of ENVIRONMENTS) {
            try {
                // Remove if exists 
                try {
                    execSync(`vercel env rm ${key} ${env} -y`, { stdio: 'pipe' });
                } catch { }

                // Add the variable
                execSync(`echo ${value} | vercel env add ${key} ${env}`, {
                    stdio: 'inherit'
                });
                console.log(`   ✅ Set for ${env}`);
            } catch (err) {
                console.log(`   ⚠️  Warning: Could not set for ${env}`);
            }
        }
    }

    console.log('\n✅ Environment variables configured!');
    console.log('\n📦 Triggering production deployment...');

    execSync('vercel --prod', { stdio: 'inherit' });

    console.log('\n🎉 Done! Your frontend should now connect to the backend.');
    console.log('🌐 Visit your site and try logging in.');

} catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n📝 Manual steps:');
    console.log('1. Go to https://vercel.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Settings → Environment Variables');
    console.log('4. Add VITE_API_URL = https://care-connect-api-bl1z.onrender.com');
    console.log('5. Redeploy your site');
    process.exit(1);
}
