const { query } = require('../database');

/**
 * NIST CSF v1.1 Seeding Script
 * Populates NIST Cybersecurity Framework reference data
 */

const seedNistCsfData = async () => {
  try {
    console.log('Starting NIST CSF data seeding...');

    // Note: Functions are already seeded in the migration, but we'll verify/update them
    console.log('Seeding NIST CSF Categories...');

    // =====================================================
    // IDENTIFY (ID) - Categories
    // =====================================================
    const identifyFunction = await query(
      'SELECT id FROM nist_csf_functions WHERE function_code = $1',
      ['ID']
    );
    const idFunctionId = identifyFunction.rows[0].id;

    const idCategories = [
      { code: 'ID.AM', name: 'Asset Management', desc: 'The data, personnel, devices, systems, and facilities that enable the organization to achieve business purposes are identified and managed consistent with their relative importance to organizational objectives and the organization\'s risk strategy.', order: 1 },
      { code: 'ID.BE', name: 'Business Environment', desc: 'The organization\'s mission, objectives, stakeholders, and activities are understood and prioritized; this information is used to inform cybersecurity roles, responsibilities, and risk management decisions.', order: 2 },
      { code: 'ID.GV', name: 'Governance', desc: 'The policies, procedures, and processes to manage and monitor the organization\'s regulatory, legal, risk, environmental, and operational requirements are understood and inform the management of cybersecurity risk.', order: 3 },
      { code: 'ID.RA', name: 'Risk Assessment', desc: 'The organization understands the cybersecurity risk to organizational operations (including mission, functions, image, or reputation), organizational assets, and individuals.', order: 4 },
      { code: 'ID.RM', name: 'Risk Management Strategy', desc: 'The organization\'s priorities, constraints, risk tolerances, and assumptions are established and used to support operational risk decisions.', order: 5 }
    ];

    for (const cat of idCategories) {
      await query(
        `INSERT INTO nist_csf_categories (function_id, category_code, category_name, description, display_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (category_code) DO UPDATE SET
         category_name = EXCLUDED.category_name,
         description = EXCLUDED.description`,
        [idFunctionId, cat.code, cat.name, cat.desc, cat.order]
      );
    }

    // =====================================================
    // PROTECT (PR) - Categories
    // =====================================================
    const protectFunction = await query(
      'SELECT id FROM nist_csf_functions WHERE function_code = $1',
      ['PR']
    );
    const prFunctionId = protectFunction.rows[0].id;

    const prCategories = [
      { code: 'PR.AC', name: 'Identity Management, Authentication and Access Control', desc: 'Access to physical and logical assets and associated facilities is limited to authorized users, processes, and devices, and is managed consistent with the assessed risk of unauthorized access.', order: 1 },
      { code: 'PR.AT', name: 'Awareness and Training', desc: 'The organization\'s personnel and partners are provided cybersecurity awareness education and are trained to perform their cybersecurity-related duties and responsibilities consistent with related policies, procedures, and agreements.', order: 2 },
      { code: 'PR.DS', name: 'Data Security', desc: 'Information and records (data) are managed consistent with the organization\'s risk strategy to protect the confidentiality, integrity, and availability of information.', order: 3 },
      { code: 'PR.IP', name: 'Information Protection Processes and Procedures', desc: 'Security policies, processes, and procedures are maintained and used to manage protection of information systems and assets.', order: 4 },
      { code: 'PR.PT', name: 'Protective Technology', desc: 'Technical security solutions are managed to ensure the security and resilience of systems and assets, consistent with related policies, procedures, and agreements.', order: 5 }
    ];

    for (const cat of prCategories) {
      await query(
        `INSERT INTO nist_csf_categories (function_id, category_code, category_name, description, display_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (category_code) DO UPDATE SET
         category_name = EXCLUDED.category_name,
         description = EXCLUDED.description`,
        [prFunctionId, cat.code, cat.name, cat.desc, cat.order]
      );
    }

    // =====================================================
    // DETECT (DE) - Categories
    // =====================================================
    const detectFunction = await query(
      'SELECT id FROM nist_csf_functions WHERE function_code = $1',
      ['DE']
    );
    const deFunctionId = detectFunction.rows[0].id;

    const deCategories = [
      { code: 'DE.AE', name: 'Anomalies and Events', desc: 'Anomalous activity is detected in a timely manner and the potential impact of events is understood.', order: 1 },
      { code: 'DE.CM', name: 'Security Continuous Monitoring', desc: 'The information system and assets are monitored at discrete intervals to identify cybersecurity events and verify the effectiveness of protective measures.', order: 2 },
      { code: 'DE.DP', name: 'Detection Processes', desc: 'Detection processes and procedures are maintained and tested to ensure timely and adequate awareness of anomalous events.', order: 3 }
    ];

    for (const cat of deCategories) {
      await query(
        `INSERT INTO nist_csf_categories (function_id, category_code, category_name, description, display_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (category_code) DO UPDATE SET
         category_name = EXCLUDED.category_name,
         description = EXCLUDED.description`,
        [deFunctionId, cat.code, cat.name, cat.desc, cat.order]
      );
    }

    // =====================================================
    // RESPOND (RS) - Categories
    // =====================================================
    const respondFunction = await query(
      'SELECT id FROM nist_csf_functions WHERE function_code = $1',
      ['RS']
    );
    const rsFunctionId = respondFunction.rows[0].id;

    const rsCategories = [
      { code: 'RS.RP', name: 'Response Planning', desc: 'Response processes and procedures are executed and maintained to ensure timely response to detected cybersecurity events.', order: 1 },
      { code: 'RS.CO', name: 'Communications', desc: 'Response activities are coordinated with internal and external stakeholders as appropriate to include external support from law enforcement agencies.', order: 2 },
      { code: 'RS.AN', name: 'Analysis', desc: 'Analysis is conducted to ensure adequate response and support recovery activities.', order: 3 },
      { code: 'RS.MI', name: 'Mitigation', desc: 'Activities are performed to prevent expansion of an event, mitigate its effects, and eradicate the incident.', order: 4 },
      { code: 'RS.IM', name: 'Improvements', desc: 'Organizational response activities are improved by incorporating lessons learned from current and previous detection/response activities.', order: 5 }
    ];

    for (const cat of rsCategories) {
      await query(
        `INSERT INTO nist_csf_categories (function_id, category_code, category_name, description, display_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (category_code) DO UPDATE SET
         category_name = EXCLUDED.category_name,
         description = EXCLUDED.description`,
        [rsFunctionId, cat.code, cat.name, cat.desc, cat.order]
      );
    }

    // =====================================================
    // RECOVER (RC) - Categories
    // =====================================================
    const recoverFunction = await query(
      'SELECT id FROM nist_csf_functions WHERE function_code = $1',
      ['RC']
    );
    const rcFunctionId = recoverFunction.rows[0].id;

    const rcCategories = [
      { code: 'RC.RP', name: 'Recovery Planning', desc: 'Recovery processes and procedures are executed and maintained to ensure timely restoration of systems or assets affected by cybersecurity events.', order: 1 },
      { code: 'RC.IM', name: 'Improvements', desc: 'Recovery planning and processes are improved by incorporating lessons learned into future activities.', order: 2 },
      { code: 'RC.CO', name: 'Communications', desc: 'Restoration activities are coordinated with internal and external parties, such as coordinating centers, Internet Service Providers, owners of attacking systems, victims, other CSIRTs, and vendors.', order: 3 }
    ];

    for (const cat of rcCategories) {
      await query(
        `INSERT INTO nist_csf_categories (function_id, category_code, category_name, description, display_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (category_code) DO UPDATE SET
         category_name = EXCLUDED.category_name,
         description = EXCLUDED.description`,
        [rcFunctionId, cat.code, cat.name, cat.desc, cat.order]
      );
    }

    console.log('NIST CSF Categories seeded successfully.');
    console.log('Seeding NIST CSF Controls...');

    // =====================================================
    // CONTROLS - Sample controls for each category
    // =====================================================

    // ID.AM - Asset Management Controls
    const idAmCategory = await query('SELECT id FROM nist_csf_categories WHERE category_code = $1', ['ID.AM']);
    const idAmControls = [
      { code: 'ID.AM-1', name: 'Physical devices and systems within the organization are inventoried', guidance: 'Maintain an accurate inventory of all hardware assets to understand what needs protection.', importance: 'high', order: 1 },
      { code: 'ID.AM-2', name: 'Software platforms and applications within the organization are inventoried', guidance: 'Track all software assets including operating systems, applications, and services.', importance: 'high', order: 2 },
      { code: 'ID.AM-3', name: 'Organizational communication and data flows are mapped', guidance: 'Document how data moves through your organization and with external parties.', importance: 'medium', order: 3 }
    ];
    
    for (const ctrl of idAmControls) {
      await query(
        `INSERT INTO nist_csf_controls (category_id, control_code, control_name, guidance, importance, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (control_code) DO UPDATE SET
         control_name = EXCLUDED.control_name`,
        [idAmCategory.rows[0].id, ctrl.code, ctrl.name, ctrl.guidance, ctrl.importance, ctrl.order]
      );
    }

    // ID.BE - Business Environment Controls
    const idBeCategory = await query('SELECT id FROM nist_csf_categories WHERE category_code = $1', ['ID.BE']);
    const idBeControls = [
      { code: 'ID.BE-1', name: 'The organization\'s role in the supply chain is identified and communicated', guidance: 'Understand your position in the supply chain and associated dependencies.', importance: 'medium', order: 1 },
      { code: 'ID.BE-2', name: 'The organization\'s place in critical infrastructure and its industry sector is identified and communicated', guidance: 'Identify if your organization is part of critical infrastructure.', importance: 'medium', order: 2 },
      { code: 'ID.BE-3', name: 'Priorities for organizational mission, objectives, and activities are established and communicated', guidance: 'Define what\'s most important to protect based on business priorities.', importance: 'high', order: 3 }
    ];
    
    for (const ctrl of idBeControls) {
      await query(
        `INSERT INTO nist_csf_controls (category_id, control_code, control_name, guidance, importance, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (control_code) DO UPDATE SET
         control_name = EXCLUDED.control_name`,
        [idBeCategory.rows[0].id, ctrl.code, ctrl.name, ctrl.guidance, ctrl.importance, ctrl.order]
      );
    }

    // ID.GV - Governance Controls
    const idGvCategory = await query('SELECT id FROM nist_csf_categories WHERE category_code = $1', ['ID.GV']);
    const idGvControls = [
      { code: 'ID.GV-1', name: 'Organizational cybersecurity policy is established and communicated', guidance: 'Create and disseminate comprehensive cybersecurity policies.', importance: 'critical', order: 1 },
      { code: 'ID.GV-2', name: 'Cybersecurity roles and responsibilities are coordinated and aligned with internal roles and external partners', guidance: 'Define who is responsible for what in cybersecurity.', importance: 'high', order: 2 },
      { code: 'ID.GV-3', name: 'Legal and regulatory requirements regarding cybersecurity are understood and managed', guidance: 'Ensure compliance with applicable laws and regulations.', importance: 'critical', order: 3 }
    ];
    
    for (const ctrl of idGvControls) {
      await query(
        `INSERT INTO nist_csf_controls (category_id, control_code, control_name, guidance, importance, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (control_code) DO UPDATE SET
         control_name = EXCLUDED.control_name`,
        [idGvCategory.rows[0].id, ctrl.code, ctrl.name, ctrl.guidance, ctrl.importance, ctrl.order]
      );
    }

    // ID.RA - Risk Assessment Controls
    const idRaCategory = await query('SELECT id FROM nist_csf_categories WHERE category_code = $1', ['ID.RA']);
    const idRaControls = [
      { code: 'ID.RA-1', name: 'Asset vulnerabilities are identified and documented', guidance: 'Regularly scan and document vulnerabilities in your assets.', importance: 'high', order: 1 },
      { code: 'ID.RA-2', name: 'Cyber threat intelligence is received from information sharing forums and sources', guidance: 'Stay informed about current threats and attack vectors.', importance: 'medium', order: 2 },
      { code: 'ID.RA-3', name: 'Threats, both internal and external, are identified and documented', guidance: 'Maintain a comprehensive threat register.', importance: 'high', order: 3 }
    ];
    
    for (const ctrl of idRaControls) {
      await query(
        `INSERT INTO nist_csf_controls (category_id, control_code, control_name, guidance, importance, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (control_code) DO UPDATE SET
         control_name = EXCLUDED.control_name`,
        [idRaCategory.rows[0].id, ctrl.code, ctrl.name, ctrl.guidance, ctrl.importance, ctrl.order]
      );
    }

    // PR.AC - Access Control Controls
    const prAcCategory = await query('SELECT id FROM nist_csf_categories WHERE category_code = $1', ['PR.AC']);
    const prAcControls = [
      { code: 'PR.AC-1', name: 'Identities and credentials are issued, managed, verified, revoked, and audited for authorized devices, users and processes', guidance: 'Implement comprehensive identity and access management.', importance: 'critical', order: 1 },
      { code: 'PR.AC-3', name: 'Remote access is managed', guidance: 'Control and monitor all remote access to organizational resources.', importance: 'critical', order: 2 },
      { code: 'PR.AC-4', name: 'Access permissions and authorizations are managed, incorporating the principles of least privilege and separation of duties', guidance: 'Grant users only the minimum access they need.', importance: 'critical', order: 3 }
    ];
    
    for (const ctrl of prAcControls) {
      await query(
        `INSERT INTO nist_csf_controls (category_id, control_code, control_name, guidance, importance, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (control_code) DO UPDATE SET
         control_name = EXCLUDED.control_name`,
        [prAcCategory.rows[0].id, ctrl.code, ctrl.name, ctrl.guidance, ctrl.importance, ctrl.order]
      );
    }

    // PR.DS - Data Security Controls
    const prDsCategory = await query('SELECT id FROM nist_csf_categories WHERE category_code = $1', ['PR.DS']);
    const prDsControls = [
      { code: 'PR.DS-1', name: 'Data-at-rest is protected', guidance: 'Encrypt sensitive data when stored.', importance: 'critical', order: 1 },
      { code: 'PR.DS-2', name: 'Data-in-transit is protected', guidance: 'Use encryption for data moving across networks.', importance: 'critical', order: 2 },
      { code: 'PR.DS-5', name: 'Protections against data leaks are implemented', guidance: 'Implement DLP and other data leakage prevention measures.', importance: 'high', order: 3 }
    ];
    
    for (const ctrl of prDsControls) {
      await query(
        `INSERT INTO nist_csf_controls (category_id, control_code, control_name, guidance, importance, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (control_code) DO UPDATE SET
         control_name = EXCLUDED.control_name`,
        [prDsCategory.rows[0].id, ctrl.code, ctrl.name, ctrl.guidance, ctrl.importance, ctrl.order]
      );
    }

    // DE.AE - Anomalies and Events Controls
    const deAeCategory = await query('SELECT id FROM nist_csf_categories WHERE category_code = $1', ['DE.AE']);
    const deAeControls = [
      { code: 'DE.AE-1', name: 'A baseline of network operations and expected data flows for users and systems is established and managed', guidance: 'Know what normal looks like to detect anomalies.', importance: 'high', order: 1 },
      { code: 'DE.AE-2', name: 'Detected events are analyzed to understand attack targets and methods', guidance: 'Investigate security events to understand attacker techniques.', importance: 'high', order: 2 },
      { code: 'DE.AE-3', name: 'Event data are collected and correlated from multiple sources and sensors', guidance: 'Aggregate logs from various sources for comprehensive visibility.', importance: 'medium', order: 3 }
    ];
    
    for (const ctrl of deAeControls) {
      await query(
        `INSERT INTO nist_csf_controls (category_id, control_code, control_name, guidance, importance, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (control_code) DO UPDATE SET
         control_name = EXCLUDED.control_name`,
        [deAeCategory.rows[0].id, ctrl.code, ctrl.name, ctrl.guidance, ctrl.importance, ctrl.order]
      );
    }

    // DE.CM - Continuous Monitoring Controls
    const deCmCategory = await query('SELECT id FROM nist_csf_categories WHERE category_code = $1', ['DE.CM']);
    const deCmControls = [
      { code: 'DE.CM-1', name: 'The network is monitored to detect potential cybersecurity events', guidance: 'Implement continuous network monitoring solutions.', importance: 'critical', order: 1 },
      { code: 'DE.CM-4', name: 'Malicious code is detected', guidance: 'Deploy and maintain anti-malware solutions.', importance: 'critical', order: 2 },
      { code: 'DE.CM-7', name: 'Monitoring for unauthorized personnel, connections, devices, and software is performed', guidance: 'Detect unauthorized access and rogue devices.', importance: 'high', order: 3 }
    ];
    
    for (const ctrl of deCmControls) {
      await query(
        `INSERT INTO nist_csf_controls (category_id, control_code, control_name, guidance, importance, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (control_code) DO UPDATE SET
         control_name = EXCLUDED.control_name`,
        [deCmCategory.rows[0].id, ctrl.code, ctrl.name, ctrl.guidance, ctrl.importance, ctrl.order]
      );
    }

    // RS.RP - Response Planning Controls
    const rsRpCategory = await query('SELECT id FROM nist_csf_categories WHERE category_code = $1', ['RS.RP']);
    const rsRpControls = [
      { code: 'RS.RP-1', name: 'Response plan is executed during or after an incident', guidance: 'Have documented incident response procedures and follow them.', importance: 'critical', order: 1 }
    ];
    
    for (const ctrl of rsRpControls) {
      await query(
        `INSERT INTO nist_csf_controls (category_id, control_code, control_name, guidance, importance, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (control_code) DO UPDATE SET
         control_name = EXCLUDED.control_name`,
        [rsRpCategory.rows[0].id, ctrl.code, ctrl.name, ctrl.guidance, ctrl.importance, ctrl.order]
      );
    }

    // RS.CO - Communications Controls
    const rsCoCategory = await query('SELECT id FROM nist_csf_categories WHERE category_code = $1', ['RS.CO']);
    const rsCoControls = [
      { code: 'RS.CO-1', name: 'Personnel know their roles and order of operations when a response is needed', guidance: 'Clearly define incident response roles and responsibilities.', importance: 'high', order: 1 },
      { code: 'RS.CO-2', name: 'Incidents are reported consistent with established criteria', guidance: 'Define what constitutes an incident and how to report it.', importance: 'high', order: 2 },
      { code: 'RS.CO-3', name: 'Information is shared consistent with response plans', guidance: 'Share incident information appropriately with stakeholders.', importance: 'medium', order: 3 }
    ];
    
    for (const ctrl of rsCoControls) {
      await query(
        `INSERT INTO nist_csf_controls (category_id, control_code, control_name, guidance, importance, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (control_code) DO UPDATE SET
         control_name = EXCLUDED.control_name`,
        [rsCoCategory.rows[0].id, ctrl.code, ctrl.name, ctrl.guidance, ctrl.importance, ctrl.order]
      );
    }

    // RS.AN - Analysis Controls
    const rsAnCategory = await query('SELECT id FROM nist_csf_categories WHERE category_code = $1', ['RS.AN']);
    const rsAnControls = [
      { code: 'RS.AN-1', name: 'Notifications from detection systems are investigated', guidance: 'Follow up on all security alerts and events.', importance: 'critical', order: 1 },
      { code: 'RS.AN-2', name: 'The impact of the incident is understood', guidance: 'Assess the scope and severity of security incidents.', importance: 'high', order: 2 }
    ];
    
    for (const ctrl of rsAnControls) {
      await query(
        `INSERT INTO nist_csf_controls (category_id, control_code, control_name, guidance, importance, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (control_code) DO UPDATE SET
         control_name = EXCLUDED.control_name`,
        [rsAnCategory.rows[0].id, ctrl.code, ctrl.name, ctrl.guidance, ctrl.importance, ctrl.order]
      );
    }

    // RS.MI - Mitigation Controls
    const rsMiCategory = await query('SELECT id FROM nist_csf_categories WHERE category_code = $1', ['RS.MI']);
    const rsMiControls = [
      { code: 'RS.MI-1', name: 'Incidents are contained', guidance: 'Isolate affected systems to prevent incident spread.', importance: 'critical', order: 1 },
      { code: 'RS.MI-2', name: 'Incidents are mitigated', guidance: 'Take action to reduce the impact of incidents.', importance: 'critical', order: 2 },
      { code: 'RS.MI-3', name: 'Newly identified vulnerabilities are mitigated or documented as accepted risks', guidance: 'Address vulnerabilities discovered during incident response.', importance: 'high', order: 3 }
    ];
    
    for (const ctrl of rsMiControls) {
      await query(
        `INSERT INTO nist_csf_controls (category_id, control_code, control_name, guidance, importance, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (control_code) DO UPDATE SET
         control_name = EXCLUDED.control_name`,
        [rsMiCategory.rows[0].id, ctrl.code, ctrl.name, ctrl.guidance, ctrl.importance, ctrl.order]
      );
    }

    // RC.RP - Recovery Planning Controls
    const rcRpCategory = await query('SELECT id FROM nist_csf_categories WHERE category_code = $1', ['RC.RP']);
    const rcRpControls = [
      { code: 'RC.RP-1', name: 'Recovery plan is executed during or after a cybersecurity incident', guidance: 'Follow documented recovery procedures after incidents.', importance: 'critical', order: 1 }
    ];
    
    for (const ctrl of rcRpControls) {
      await query(
        `INSERT INTO nist_csf_controls (category_id, control_code, control_name, guidance, importance, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (control_code) DO UPDATE SET
         control_name = EXCLUDED.control_name`,
        [rcRpCategory.rows[0].id, ctrl.code, ctrl.name, ctrl.guidance, ctrl.importance, ctrl.order]
      );
    }

    // RC.IM - Improvements Controls
    const rcImCategory = await query('SELECT id FROM nist_csf_categories WHERE category_code = $1', ['RC.IM']);
    const rcImControls = [
      { code: 'RC.IM-1', name: 'Recovery plans incorporate lessons learned', guidance: 'Update recovery procedures based on incident experiences.', importance: 'medium', order: 1 },
      { code: 'RC.IM-2', name: 'Recovery strategies are updated', guidance: 'Continuously improve recovery capabilities.', importance: 'medium', order: 2 }
    ];
    
    for (const ctrl of rcImControls) {
      await query(
        `INSERT INTO nist_csf_controls (category_id, control_code, control_name, guidance, importance, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (control_code) DO UPDATE SET
         control_name = EXCLUDED.control_name`,
        [rcImCategory.rows[0].id, ctrl.code, ctrl.name, ctrl.guidance, ctrl.importance, ctrl.order]
      );
    }

    // RC.CO - Communications Controls
    const rcCoCategory = await query('SELECT id FROM nist_csf_categories WHERE category_code = $1', ['RC.CO']);
    const rcCoControls = [
      { code: 'RC.CO-1', name: 'Public relations are managed', guidance: 'Coordinate communications with public and media during recovery.', importance: 'medium', order: 1 },
      { code: 'RC.CO-2', name: 'Reputation is repaired after an incident', guidance: 'Work to restore organizational reputation post-incident.', importance: 'medium', order: 2 },
      { code: 'RC.CO-3', name: 'Recovery activities are communicated to internal and external stakeholders', guidance: 'Keep stakeholders informed about recovery progress.', importance: 'high', order: 3 }
    ];
    
    for (const ctrl of rcCoControls) {
      await query(
        `INSERT INTO nist_csf_controls (category_id, control_code, control_name, guidance, importance, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (control_code) DO UPDATE SET
         control_name = EXCLUDED.control_name`,
        [rcCoCategory.rows[0].id, ctrl.code, ctrl.name, ctrl.guidance, ctrl.importance, ctrl.order]
      );
    }

    console.log('NIST CSF Controls seeded successfully.');
    console.log('✅ NIST CSF data seeding completed!');
    
    // Summary statistics
    const functionCount = await query('SELECT COUNT(*) FROM nist_csf_functions');
    const categoryCount = await query('SELECT COUNT(*) FROM nist_csf_categories');
    const controlCount = await query('SELECT COUNT(*) FROM nist_csf_controls');
    
    console.log('\n📊 Summary:');
    console.log(`   - Functions: ${functionCount.rows[0].count}`);
    console.log(`   - Categories: ${categoryCount.rows[0].count}`);
    console.log(`   - Controls: ${controlCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error seeding NIST CSF data:', error);
    throw error;
  }
};

module.exports = seedNistCsfData;
