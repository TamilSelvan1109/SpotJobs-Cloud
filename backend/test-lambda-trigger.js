const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
require('dotenv').config();

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testLambda() {
  console.log('🧪 Testing Lambda Function...');
  
  const testPayload = {
    jobTitle: 'Software Engineer',
    jobDescription: 'We are looking for a skilled software engineer with React and Node.js experience. Must have 3+ years experience.',
    jobLocation: 'Remote',
    jobCategory: 'Technology',
    jobLevel: 'mid',
    jobSalary: '80000',
    requiredSkills: ['React', 'Node.js', 'JavaScript', 'MongoDB'],
    userSkills: ['React', 'JavaScript', 'Python', 'Node.js'],
    userBio: 'Experienced developer with 3 years in web development. Expert in React and JavaScript.',
    userRole: 'Frontend Developer',
    resumeUrl: '',
    applicationId: 'test-' + Date.now(),
    backendUrl: 'http://localhost:3001' // Point to test receiver
  };
  
  console.log('📤 Sending payload to Lambda:', {
    applicationId: testPayload.applicationId,
    backendUrl: testPayload.backendUrl,
    functionName: process.env.LAMBDA_FUNCTION_NAME
  });
  
  try {
    const command = new InvokeCommand({
      FunctionName: process.env.LAMBDA_FUNCTION_NAME || 'resumeScoring',
      Payload: JSON.stringify({ body: JSON.stringify(testPayload) }),
      InvocationType: 'Event' // Async invocation
    });
    
    const result = await lambdaClient.send(command);
    
    console.log('✅ Lambda invoked successfully!');
    console.log('📊 Result:', {
      statusCode: result.StatusCode,
      executedVersion: result.ExecutedVersion
    });
    
    console.log('⏰ Waiting for Lambda to send response to test receiver...');
    console.log('👀 Check the test receiver console for Lambda response!');
    
  } catch (error) {
    console.error('❌ Lambda invocation failed:', error);
  }
}

testLambda();