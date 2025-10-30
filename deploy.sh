#!/bin/bash

# Simple EC2 Deployment Script for Amazon Linux

echo "🚀 Deploying SpotJobs Backend..."

# Update system
sudo yum update -y

# Install Node.js 18
sudo yum install -y nodejs npm git

# Clone repository
git clone https://github.com/your-username/SpotJobs-Cloud.git
cd SpotJobs-Cloud/backend

# Install dependencies
npm install

# Get EC2 public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Create .env file
cat > .env << EOL
JWT_SECRET="your-jwt-secret-here"
PORT=5000
MONGODB_URI="your-mongodb-uri-here"
CLOUDINARY_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_SECRET_KEY="your-cloudinary-secret"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="ap-south-1"
SES_VERIFIED_EMAIL="your-email@gmail.com"
S3_BUCKET_NAME="spotjobs-bucket-2025"
LAMBDA_FUNCTION_NAME="resumeScoring"
BACKEND_URL="http://$PUBLIC_IP:5000"
EOL

echo "✅ Setup complete!"
echo "📝 Edit .env with your values: nano .env"
echo "🚀 Start app: nohup npm start > app.log 2>&1 &"
echo "🌐 Your backend will be at: http://$PUBLIC_IP:5000"