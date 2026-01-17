const bcrypt = require('bcryptjs');
const { query } = require('../database');

/**
 * Initial User and Organization Seeding Script
 * Creates default organization and admin user
 */

const seedInitialUser = async () => {
  try {
    console.log('Starting initial user and organization seeding...');

    // =====================================================
    // CREATE DEFAULT ORGANIZATION
    // =====================================================
    console.log('Creating default organization...');
    
    const orgResult = await query(
      `INSERT INTO organizations (name, description, industry, size)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING id, name`,
      ['My Organization', 'Default organization for the compliance platform', 'Technology', 'Small']
    );

    let organizationId;
    
    if (orgResult.rows.length > 0) {
      organizationId = orgResult.rows[0].id;
      console.log(`✓ Created organization: ${orgResult.rows[0].name} (ID: ${organizationId})`);
    } else {
      // Organization already exists, fetch it
      const existingOrg = await query(
        `SELECT id, name FROM organizations WHERE name = $1`,
        ['My Organization']
      );
      organizationId = existingOrg.rows[0].id;
      console.log(`✓ Organization already exists: ${existingOrg.rows[0].name} (ID: ${organizationId})`);
    }

    // =====================================================
    // CREATE ADMIN USER
    // =====================================================
    console.log('Creating admin user...');
    
    // TODO: CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION!
    // Default password: admin123
    const defaultPassword = 'admin123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

    const userResult = await query(
      `INSERT INTO users (username, email, password_hash, full_name, is_admin, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (username) DO NOTHING
       RETURNING id, username, email`,
      ['admin', 'admin@example.com', passwordHash, 'System Administrator', true, true]
    );

    let userId;
    
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
      console.log(`✓ Created admin user: ${userResult.rows[0].username} (${userResult.rows[0].email})`);
      console.log(`  ⚠️  Default password: ${defaultPassword} - CHANGE THIS IMMEDIATELY!`);
    } else {
      // User already exists, fetch it
      const existingUser = await query(
        `SELECT id, username, email FROM users WHERE username = $1`,
        ['admin']
      );
      userId = existingUser.rows[0].id;
      console.log(`✓ Admin user already exists: ${existingUser.rows[0].username} (${existingUser.rows[0].email})`);
    }

    // =====================================================
    // LINK USER TO ORGANIZATION
    // =====================================================
    console.log('Linking admin user to organization...');
    
    const linkResult = await query(
      `INSERT INTO user_organizations (user_id, organization_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, organization_id) DO UPDATE
       SET role = EXCLUDED.role
       RETURNING id, role`,
      [userId, organizationId, 'admin']
    );

    if (linkResult.rows.length > 0) {
      console.log(`✓ Linked user to organization with role: ${linkResult.rows[0].role}`);
    }

    console.log('✅ Initial user and organization seeding completed!');
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   - Organization: My Organization (ID: ${organizationId})`);
    console.log(`   - Admin User: admin (ID: ${userId})`);
    console.log(`   - Email: admin@example.com`);
    console.log(`   - Password: ${defaultPassword}`);
    console.log(`   - Role: admin`);
    console.log('\n⚠️  SECURITY WARNING: Change the default admin password immediately!');
    
  } catch (error) {
    console.error('❌ Error seeding initial user:', error);
    throw error;
  }
};

module.exports = seedInitialUser;
