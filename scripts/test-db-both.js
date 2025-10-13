import { Client } from 'pg';

// Test both direct and pooler connections
async function testConnections() {
  const baseUrl = 'postgresql://postgres.mofboditnsbvidtrepah:FastSchoolITalia@';
  
  const connections = [
    {
      name: 'Direct Connection',
      url: `${baseUrl}db.mofboditnsbvidtrepah.supabase.co:5432/postgres?sslmode=require`
    },
    {
      name: 'Session Pooler (RECOMMENDED)',
      url: `${baseUrl}aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true&pgbouncer_mode=session&sslmode=require`
    }
  ];

  for (const conn of connections) {
    console.log(`\n🔍 Testing ${conn.name}...`);
    console.log(`URL: ${conn.url.replace(/:[^:@]+@/, ':***@')}`);
    
    const client = new Client({ 
      connectionString: conn.url,
      ssl: { rejectUnauthorized: false } // Allow self-signed certificates for testing
    });
    
    try {
      await client.connect();
      const result = await client.query('SELECT NOW() as current_time, current_database(), current_user');
      console.log(`✅ SUCCESS: ${conn.name}`);
      console.log(`   Time: ${result.rows[0].current_time}`);
      console.log(`   Database: ${result.rows[0].current_database}`);
      console.log(`   User: ${result.rows[0].current_user}`);
    } catch (error) {
      console.log(`❌ FAILED: ${conn.name}`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Code: ${error.code || 'N/A'}`);
    } finally {
      await client.end();
    }
  }
}

testConnections().catch(console.error);
