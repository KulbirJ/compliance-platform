require('dotenv').config();
const { connectDB } = require('./src/config/database');
const RiskRegister = require('./src/models/riskRegisterModel');

async function testRiskCreation() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected!');

    console.log('\nTesting createFromControlAssessment...');
    const assessmentId = 4;
    const controlId = 20; // PR.AC-1
    const userId = 1;
    const questionnaireResponse = 'Test risk description from script';
    const comments = 'Test comments from script';

    console.log('Parameters:', { assessmentId, controlId, userId, questionnaireResponse, comments });

    const risk = await RiskRegister.createFromControlAssessment(
      assessmentId,
      controlId,
      userId,
      questionnaireResponse,
      comments
    );

    console.log('\n✓ Risk created successfully!');
    console.log('Risk ID:', risk.risk_id);
    console.log('Risk Description:', risk.risk_description);
    console.log('Comments:', risk.comments);

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testRiskCreation();
