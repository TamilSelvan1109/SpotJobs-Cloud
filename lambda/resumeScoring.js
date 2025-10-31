const { TextractClient, DetectDocumentTextCommand } = require('@aws-sdk/client-textract');
const axios = require('axios');

const textract = new TextractClient({ region: process.env.AWS_REGION || 'ap-south-1' });

exports.handler = async (event) => {
    console.log('🚀 High-precision resume scoring started');
    
    try {
        const { jobTitle, jobDescription, jobLevel, requiredSkills, userSkills, userBio, userRole, resumeUrl, applicationId, backendUrl } = JSON.parse(event.body);
        
        // Use environment variable as fallback for backend URL
        const finalBackendUrl = backendUrl || process.env.BACKEND_URL || 'http://localhost:5000';
        console.log('🔗 Using backend URL:', finalBackendUrl);
        
        let resumeText = userBio || '';
        let textractUsed = false;
        
        // Extract text from resume using Textract if PDF URL provided
        if (resumeUrl && resumeUrl.includes('.pdf')) {
            try {
                const url = new URL(resumeUrl);
                const bucketName = url.hostname.split('.')[0];
                const key = url.pathname.substring(1);
                
                console.log('📄 Extracting text from resume:', { bucketName, key });
                
                const command = new DetectDocumentTextCommand({
                    Document: { S3Object: { Bucket: bucketName, Name: key } }
                });
                
                const response = await textract.send(command);
                const extractedText = response.Blocks
                    .filter(block => block.BlockType === 'LINE')
                    .map(block => block.Text)
                    .join(' ');
                
                if (extractedText.trim()) {
                    resumeText = extractedText;
                    textractUsed = true;
                    console.log('✅ Textract extraction successful:', extractedText.length + ' characters');
                }
            } catch (error) {
                console.log('⚠️ Textract failed, using bio only:', error.message);
            }
        }
        
        // High-precision scoring calculation
        const scoringResult = calculateHighPrecisionScore({
            jobTitle,
            jobDescription,
            jobLevel,
            requiredSkills,
            userSkills,
            userRole,
            resumeText,
            textractUsed
        });
        
        console.log('📊 Scoring completed:', {
            applicationId,
            finalScore: scoringResult.score,
            breakdown: scoringResult.breakdown
        });
        
        // Log detailed scoring information
        console.log('📊 Detailed Scoring Breakdown:', {
            applicationId,
            finalScore: scoringResult.score + '%',
            breakdown: {
                skillsMatch: `${scoringResult.breakdown.skillsMatch.score}% (${scoringResult.breakdown.skillsMatch.matched}/${scoringResult.breakdown.skillsMatch.total} skills)`,
                descriptionMatch: `${scoringResult.breakdown.descriptionMatch.score}%`,
                roleMatch: `${scoringResult.breakdown.roleMatch.score}%`,
                experienceMatch: `${scoringResult.breakdown.experienceMatch.score}%`,
                resumeQuality: `${scoringResult.breakdown.resumeQuality.score}%`
            },
            matchedSkills: scoringResult.matchedSkills,
            textractUsed,
            resumeTextLength: resumeText.length,
            recommendation: getRecommendation(scoringResult.score)
        });
        
        // Send detailed scoring results to backend
        console.log('📤 Sending score to backend:', finalBackendUrl);
        const backendResponse = await axios.post(`${finalBackendUrl}/api/users/update-application-score`, {
            applicationId,
            score: scoringResult.score,
            scoringDetails: {
                breakdown: scoringResult.breakdown,
                matchedSkills: scoringResult.matchedSkills,
                textractUsed,
                resumeTextLength: resumeText.length,
                recommendation: getRecommendation(scoringResult.score)
            }
        });
        
        console.log('✅ Backend response:', {
            status: backendResponse.status,
            data: backendResponse.data
        });
        console.log('✅ Score sent to backend successfully');
        
        return { statusCode: 200, body: JSON.stringify({ success: true, score: scoringResult.score }) };
    } catch (error) {
        console.error('❌ Scoring error:', error);
        
        try {
            const { applicationId, backendUrl } = JSON.parse(event.body);
            const finalBackendUrl = backendUrl || process.env.BACKEND_URL || 'http://localhost:5000';
            console.error('❌ Scoring failed for application:', applicationId, 'Error:', error.message);
            console.log('📤 Sending error to backend:', finalBackendUrl);
            const errorResponse = await axios.post(`${finalBackendUrl}/api/users/update-application-score`, {
                applicationId,
                error: true,
                errorMessage: error.message
            });
            console.log('📥 Error response from backend:', errorResponse.data);
        } catch (e) {
            console.error('Failed to send error to backend:', e.message);
        }
        
        return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
    }
};

function calculateHighPrecisionScore({ jobTitle, jobDescription, jobLevel, requiredSkills, userSkills, userRole, resumeText, textractUsed }) {
    const fullText = (resumeText + ' ' + userRole + ' ' + (userSkills?.join(' ') || '')).toLowerCase();
    const jobDesc = (jobDescription || '').toLowerCase();
    
    let breakdown = {
        skillsMatch: { score: 0, matched: 0, total: 0 },
        descriptionMatch: { score: 0 },
        roleMatch: { score: 0 },
        experienceMatch: { score: 0 },
        resumeQuality: { score: 0 }
    };
    
    let matchedSkills = [];
    
    // 1. Skills Matching (40% weight)
    if (requiredSkills?.length) {
        const skillMatches = requiredSkills.map(skill => {
            const skillLower = skill.toLowerCase();
            const inUserSkills = userSkills?.some(us => 
                us.toLowerCase().includes(skillLower) || skillLower.includes(us.toLowerCase())
            );
            const inResume = fullText.includes(skillLower);
            
            if (inUserSkills || inResume) {
                matchedSkills.push(skill);
                return inUserSkills && inResume ? 1.0 : inUserSkills ? 0.8 : 0.6;
            }
            return 0;
        });
        
        breakdown.skillsMatch.matched = matchedSkills.length;
        breakdown.skillsMatch.total = requiredSkills.length;
        breakdown.skillsMatch.score = Math.round((skillMatches.reduce((a, b) => a + b, 0) / requiredSkills.length) * 100);
    }
    
    // 2. Job Description Relevance (25% weight)
    if (jobDesc && resumeText) {
        const jobKeywords = extractKeywords(jobDesc);
        const resumeKeywords = extractKeywords(fullText);
        const commonKeywords = jobKeywords.filter(kw => resumeKeywords.includes(kw));
        breakdown.descriptionMatch.score = Math.round((commonKeywords.length / Math.max(jobKeywords.length, 1)) * 100);
    }
    
    // 3. Role/Title Matching (20% weight)
    if (jobTitle && userRole) {
        const titleWords = jobTitle.toLowerCase().split(/\s+/);
        const roleWords = userRole.toLowerCase().split(/\s+/);
        const matches = titleWords.filter(tw => 
            roleWords.some(rw => rw.includes(tw) || tw.includes(rw) || levenshteinSimilarity(tw, rw) > 0.7)
        );
        breakdown.roleMatch.score = Math.round((matches.length / titleWords.length) * 100);
    }
    
    // 4. Experience Level Matching (10% weight)
    const levelMap = { entry: 1, junior: 2, mid: 3, senior: 4, lead: 5, principal: 6 };
    const requiredLevel = levelMap[jobLevel?.toLowerCase()] || 3;
    let candidateLevel = detectExperienceLevel(fullText, levelMap);
    
    const levelDiff = Math.abs(requiredLevel - candidateLevel);
    breakdown.experienceMatch.score = levelDiff === 0 ? 100 : levelDiff === 1 ? 80 : levelDiff === 2 ? 60 : 40;
    
    // 5. Resume Quality Bonus (5% weight)
    if (textractUsed && resumeText.length > 500) {
        breakdown.resumeQuality.score = 100;
    } else if (resumeText.length > 200) {
        breakdown.resumeQuality.score = 70;
    } else {
        breakdown.resumeQuality.score = 30;
    }
    
    // Calculate weighted final score
    const finalScore = Math.round(
        (breakdown.skillsMatch.score * 0.40) +
        (breakdown.descriptionMatch.score * 0.25) +
        (breakdown.roleMatch.score * 0.20) +
        (breakdown.experienceMatch.score * 0.10) +
        (breakdown.resumeQuality.score * 0.05)
    );
    
    return {
        score: Math.min(finalScore, 100),
        breakdown,
        matchedSkills
    };
}

function extractKeywords(text) {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'];
    return text.split(/\s+/)
        .map(word => word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
        .filter(word => word.length > 2 && !stopWords.includes(word))
        .filter((word, index, arr) => arr.indexOf(word) === index)
        .slice(0, 50);
}

function detectExperienceLevel(text, levelMap) {
    let detectedLevel = 2;
    
    Object.keys(levelMap).forEach(level => {
        if (text.includes(level)) {
            detectedLevel = Math.max(detectedLevel, levelMap[level]);
        }
    });
    
    const yearMatches = text.match(/(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi);
    if (yearMatches) {
        const years = Math.max(...yearMatches.map(match => parseInt(match.match(/\d+/)[0])));
        if (years >= 8) detectedLevel = Math.max(detectedLevel, 5);
        else if (years >= 5) detectedLevel = Math.max(detectedLevel, 4);
        else if (years >= 3) detectedLevel = Math.max(detectedLevel, 3);
        else if (years >= 1) detectedLevel = Math.max(detectedLevel, 2);
    }
    
    return detectedLevel;
}

function levenshteinSimilarity(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    const maxLen = Math.max(str1.length, str2.length);
    return maxLen === 0 ? 1 : (maxLen - matrix[str2.length][str1.length]) / maxLen;
}

function getRecommendation(score) {
    if (score >= 85) return 'Excellent match - Highly recommended';
    if (score >= 70) return 'Good match - Recommended';
    if (score >= 55) return 'Fair match - Consider for interview';
    if (score >= 40) return 'Weak match - May need additional screening';
    return 'Poor match - Not recommended';
}