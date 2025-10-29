# AWS S3 Setup Guide for SpotJobs

## Prerequisites
1. AWS Account
2. AWS CLI installed (optional but recommended)

## Step 1: Create S3 Bucket
1. Go to AWS S3 Console
2. Click "Create bucket"
3. Choose a unique bucket name (e.g., `spotjobs-uploads-your-name`)
4. Select your preferred region
5. **Important**: Uncheck "Block all public access" for public file access
6. Create the bucket

## Step 2: Configure Bucket Policy (for public read access)
1. Go to your bucket → Permissions → Bucket Policy
2. Add this policy (replace `YOUR_BUCKET_NAME` with your actual bucket name):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

## Step 3: Create IAM User
1. Go to AWS IAM Console
2. Create a new user with programmatic access
3. Attach the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
        }
    ]
}
```

## Step 4: Update Environment Variables
Add these to your `.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=your_bucket_region
S3_BUCKET_NAME=your_bucket_name
```

## Step 5: Test the Setup
Start your backend server and try uploading a profile image or resume to verify S3 integration is working.

## Migration Complete! 🎉
Your SpotJobs application now uses AWS S3 instead of Cloudinary for file uploads.