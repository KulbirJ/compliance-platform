require('dotenv').config();
const { connectDB, pool } = require('./database');

// Import seed files
const seedNistCsfData = require('./seeds/001_nist_csf_data');
const seedInitialUser = require('./seeds/003_initial_user');

/**
 * Main seed runner
 * Executes all seed files in order
 */
const runSeeds = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');
    console.log('=========================================');
    
    // Connect to database
    await connectDB();
    
    // Run seed files in order
    console.log('\n1️⃣  Seeding NIST CSF reference data...');
    await seedNistCsfData();
    
    console.log('\n2️⃣  Seeding initial user and organization...');
    await seedInitialUser();
    
    // Add more seed files here as needed
    // await seedOtherData();
    
    console.log('\n=========================================');
    console.log('✅ All seeds completed successfully!\n');
    
    // Close database connection
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    
    // Close database connection
    await pool.end();
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runSeeds();
}

module.exports = runSeeds;
