const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

// Test endpoint to receive Lambda responses
app.post('/api/users/update-application-score', (req, res) => {
  console.log('🎯 LAMBDA RESPONSE RECEIVED!');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('📦 Full Request Body:', JSON.stringify(req.body, null, 2));
  
  const { applicationId, score, error, errorDetails, details, processingInfo } = req.body;
  
  if (error) {
    console.log('❌ ERROR RESPONSE:');
    console.log('   Application ID:', applicationId);
    console.log('   Error Type:', errorDetails?.errorType);
    console.log('   Error Message:', errorDetails?.errorMessage);
  } else {
    console.log('✅ SUCCESS RESPONSE:');
    console.log('   Application ID:', applicationId);
    console.log('   Score:', score + '%');
    
    if (details) {
      console.log('📊 Scoring Breakdown:');
      console.log('   Skills:', details.skillsMatch?.score + '%');
      console.log('   Description:', details.descriptionMatch?.score + '%');
      console.log('   Experience:', details.experienceMatch?.score + '%');
      console.log('   Role:', details.roleMatch?.score + '%');
      console.log('   Qualifications:', details.qualificationMatch?.score + '%');
    }
    
    if (processingInfo?.textract) {
      console.log('📄 Textract Info:');
      console.log('   Has Resume:', processingInfo.textract.hasResume);
      console.log('   Text Extracted:', processingInfo.textract.textExtracted);
      console.log('   Text Length:', processingInfo.textract.textLength);
      console.log('   Source:', processingInfo.textract.source);
    }
  }
  
  console.log('=' .repeat(50));
  
  res.json({ success: true, message: 'Test receiver got the response!' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Test Lambda receiver is running!', port });
});

app.listen(port, () => {
  console.log(`🧪 Test Lambda Receiver running on port ${port}`);
  console.log(`📡 Listening for Lambda responses at: http://localhost:${port}/api/users/update-application-score`);
  console.log(`🔍 Health check: http://localhost:${port}/health`);
});