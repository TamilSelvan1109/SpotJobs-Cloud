const AWS = require('aws-sdk');
const { TextractClient, DetectDocumentTextCommand } = require('@aws-sdk/client-textract');
const axios = require('axios');

const s3 = new AWS.S3();
const textract = new TextractClient({
    region: process.env.AWS_REGION || 'ap-south-1'
});

exports.handler = async (event) => {
    console.log('🚀 Lambda function started');
    console.log('📥 Event received:', JSON.stringify(event, null, 2));
    
    try {
        const { jobDescription, requiredSkills, userSkills, userBio, resumeUrl, applicationId, backendUrl } = JSON.parse(event.body);
        
        console.log('📊 Processing application:', {
            applicationId,
            requiredSkills,
            userSkills,
            hasResume: !!resumeUrl,
            backendUrl
        });
        
        let resumeText = userBio || '';
        
        // Extract text from resume using Textract if resume URL is provided
        if (resumeUrl && resumeUrl.includes('.pdf')) {
            try {
                const bucketName = resumeUrl.split('/')[3];
                const key = resumeUrl.split('/').slice(4).join('/');
                
                const textractParams = {
                    Document: {
                        S3Object: {
                            Bucket: bucketName,
                            Name: key
                        }
                    }
                };
                
                const command = new DetectDocumentTextCommand(textractParams);
                const textractResponse = await textract.send(command);
                
                // Extract text from Textract response
                const extractedText = textractResponse.Blocks
                    .filter(block => block.BlockType === 'LINE')
                    .map(block => block.Text)
                    .join(' ');
                
                if (extractedText.trim()) {
                    resumeText = extractedText;
                }
            } catch (textractError) {
                console.log('Textract extraction failed:', textractError.message);
                // Fallback to user skills and bio
            }
        }
        
        // Calculate resume score using extracted text and user data
        const score = calculateResumeScore(jobDescription, requiredSkills, userSkills, resumeText);
        
        console.log('🎯 Score calculated:', score);
        
        // Update JobApplication with score
        console.log('📞 Calling backend:', `${backendUrl}/api/users/update-application-score`);
        
        const response = await axios.patch(`${backendUrl}/api/users/update-application-score`, {
            applicationId,
            score
        });
        
        console.log('✅ Backend response:', response.data);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                score,
                message: 'Resume scored successfully'
            })
        };
    } catch (error) {
        console.error('❌ Lambda error:', error.message);
        console.error('📋 Error stack:', error.stack);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: error.message
            })
        };
    }
};

function calculateResumeScore(jobDescription, requiredSkills, userSkills, resumeText) {
    let score = 0;
    
    // Skills matching from resume text (50% weight)
    if (requiredSkills && requiredSkills.length > 0 && resumeText) {
        const resumeLower = resumeText.toLowerCase();
        const matchedSkillsFromResume = requiredSkills.filter(skill => 
            resumeLower.includes(skill.toLowerCase())
        );
        const resumeSkillsScore = (matchedSkillsFromResume.length / requiredSkills.length) * 50;
        score += resumeSkillsScore;
    }
    
    // Skills matching from user profile (30% weight)
    if (requiredSkills && requiredSkills.length > 0 && userSkills && userSkills.length > 0) {
        const matchedProfileSkills = requiredSkills.filter(skill => 
            userSkills.some(userSkill => 
                userSkill.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(userSkill.toLowerCase())
            )
        );
        const profileSkillsScore = (matchedProfileSkills.length / requiredSkills.length) * 30;
        score += profileSkillsScore;
    }
    
    // Content relevance (20% weight)
    if (jobDescription && resumeText) {
        const jobKeywords = extractKeywords(jobDescription.toLowerCase());
        const resumeKeywords = extractKeywords(resumeText.toLowerCase());
        
        const matchedKeywords = jobKeywords.filter(keyword => 
            resumeKeywords.includes(keyword)
        );
        
        if (jobKeywords.length > 0) {
            const contentScore = (matchedKeywords.length / jobKeywords.length) * 20;
            score += contentScore;
        }
    }
    
    return Math.min(Math.round(score), 100);
}

function extractKeywords(text) {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'a', 'an'];
    
    return text
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !commonWords.includes(word))
        .slice(0, 20); // Top 20 keywords
}