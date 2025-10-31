const { TextractClient, DetectDocumentTextCommand } = require('@aws-sdk/client-textract');
const axios = require('axios');

const textract = new TextractClient({ region: process.env.AWS_REGION || 'ap-south-1' });

exports.handler = async (event) => {
    console.log('🚀 High-precision resume scoring started');
    console.log('📥 Event received:', JSON.stringify(event, null, 2));
    
    try {
        const eventBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { jobTitle, jobDescription, jobLevel, requiredSkills, userSkills, userBio, userRole, resumeUrl, applicationId, backendUrl } = eventBody;
        
        console.log('📋 Parsed payload:', {
            jobTitle,
            hasJobDescription: !!jobDescription,
            jobLevel,
            requiredSkillsCount: requiredSkills?.length || 0,
            userSkillsCount: userSkills?.length || 0,
            hasBio: !!userBio,
            userRole,
            resumeUrl,
            applicationId,
            backendUrl
        });
        
        // Use environment variable as fallback for backend URL
        const finalBackendUrl = backendUrl || process.env.BACKEND_URL || 'http://localhost:5000';
        console.log('🔗 Using backend URL:', finalBackendUrl);
        console.log('🔍 AWS Configuration:', {
            region: process.env.AWS_REGION,
            hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
            bucketName: process.env.S3_BUCKET_NAME
        });
        
        let resumeText = userBio || '';
        let textractUsed = false;
        
        // Extract text from resume using Textract if PDF URL provided
        const isS3Url = resumeUrl && resumeUrl.includes('amazonaws.com');
        const hasPdfExtension = resumeUrl && (resumeUrl.includes('.pdf') || resumeUrl.includes('.PDF'));
        const shouldProcessWithTextract = resumeUrl && (isS3Url || hasPdfExtension);
        
        console.log('🔍 Checking resume URL for processing:', { 
            resumeUrl, 
            isS3Url, 
            hasPdfExtension, 
            shouldProcessWithTextract 
        });
        
        if (shouldProcessWithTextract) {
            try {
                let bucketName, key;
                
                // Handle different S3 URL formats
                if (resumeUrl.includes('amazonaws.com')) {
                    const url = new URL(resumeUrl);
                    
                    // Format 1: https://bucket-name.s3.region.amazonaws.com/path/to/file.pdf
                    if (url.hostname.startsWith('s3.') || url.hostname.includes('.s3.')) {
                        // Path-style: https://s3.region.amazonaws.com/bucket-name/key
                        const pathParts = url.pathname.substring(1).split('/');
                        bucketName = pathParts[0];
                        key = pathParts.slice(1).join('/');
                    } else if (url.hostname.endsWith('.amazonaws.com')) {
                        // Virtual-hosted style: https://bucket-name.s3.region.amazonaws.com/key
                        bucketName = url.hostname.split('.')[0];
                        key = url.pathname.substring(1);
                    } else {
                        throw new Error(`Unsupported S3 URL format: ${resumeUrl}`);
                    }
                } else {
                    // Use environment bucket with filename from URL
                    bucketName = process.env.S3_BUCKET_NAME || 'spotjobs-bucket-2025';
                    const urlParts = resumeUrl.split('/');
                    key = urlParts[urlParts.length - 1];
                }
                
                // Validate extracted values
                console.log('🔍 S3 URL parsing result:', { 
                    originalUrl: resumeUrl,
                    extractedBucket: bucketName, 
                    extractedKey: key,
                    keyLength: key?.length || 0
                });
                
                console.log('📄 Extracting text from resume:', { bucketName, key, originalUrl: resumeUrl });
                
                const command = new DetectDocumentTextCommand({
                    Document: { S3Object: { Bucket: bucketName, Name: key } }
                });
                
                const response = await textract.send(command);
                const extractedText = response.Blocks
                    ?.filter(block => block.BlockType === 'LINE')
                    ?.map(block => block.Text)
                    ?.join(' ') || '';
                
                // Log detailed Textract response
                console.log('📄 Textract Response Details:', {
                    totalBlocks: response.Blocks?.length || 0,
                    lineBlocks: response.Blocks?.filter(block => block.BlockType === 'LINE')?.length || 0,
                    wordBlocks: response.Blocks?.filter(block => block.BlockType === 'WORD')?.length || 0,
                    pageBlocks: response.Blocks?.filter(block => block.BlockType === 'PAGE')?.length || 0
                });
                
                if (extractedText.trim()) {
                    resumeText = extractedText;
                    textractUsed = true;
                    
                    // Log comprehensive extracted text details
                    console.log('✅ Textract extraction successful:', {
                        characterCount: extractedText.length,
                        wordCount: extractedText.split(/\s+/).length,
                        lineCount: response.Blocks?.filter(block => block.BlockType === 'LINE')?.length || 0
                    });
                    
                    // Log the full extracted text (truncated for readability)
                    console.log('📝 EXTRACTED TEXT FROM PDF:');
                    console.log('=' .repeat(80));
                    console.log(extractedText);
                    console.log('=' .repeat(80));
                    
                    // Log individual lines for better structure visibility
                    const lines = response.Blocks
                        ?.filter(block => block.BlockType === 'LINE')
                        ?.map((block, index) => `Line ${index + 1}: ${block.Text}`) || [];
                    
                    if (lines.length > 0) {
                        console.log('📋 EXTRACTED LINES BREAKDOWN:');
                        console.log('-'.repeat(50));
                        lines.forEach(line => console.log(line));
                        console.log('-'.repeat(50));
                    }
                    
                } else {
                    console.log('⚠️ Textract returned empty text');
                    console.log('🔍 Raw Textract response:', JSON.stringify(response, null, 2));
                }
            } catch (error) {
                console.log('⚠️ Textract failed:', {
                    error: error.message,
                    code: error.code,
                    stack: error.stack,
                    resumeUrl,
                    bucketName,
                    key
                });
                console.log('🔍 Full error object:', JSON.stringify(error, null, 2));
            }
        } else {
            console.log('📄 Skipping Textract - URL not suitable for processing:', {
                resumeUrl,
                reason: !resumeUrl ? 'No URL provided' : 
                       !isS3Url && !hasPdfExtension ? 'Not S3 URL and no PDF extension' :
                       'Unknown reason'
            });
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
        const backendResponse = await axios.patch(`${finalBackendUrl}/api/users/update-application-score`, {
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
            const errorResponse = await axios.patch(`${finalBackendUrl}/api/users/update-application-score`, {
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
    console.log('🔍 Starting comprehensive resume analysis...');
    
    // Normalize and combine all candidate text with better fallbacks
    const safeResumeText = resumeText || '';
    const safeUserRole = userRole || '';
    const safeUserSkills = userSkills || [];
    const safeJobDescription = jobDescription || '';
    const safeRequiredSkills = requiredSkills || [];
    
    const fullText = (safeResumeText + ' ' + safeUserRole + ' ' + safeUserSkills.join(' ')).toLowerCase();
    const jobDesc = safeJobDescription.toLowerCase();
    
    console.log('📝 Text analysis:', {
        resumeLength: safeResumeText.length,
        userSkillsCount: safeUserSkills.length,
        jobDescLength: safeJobDescription.length,
        requiredSkillsCount: safeRequiredSkills.length,
        textractUsed,
        hasUserRole: !!safeUserRole,
        fullTextLength: fullText.length
    });
    
    let breakdown = {
        skillsMatch: { score: 0, matched: 0, total: 0, details: [] },
        descriptionMatch: { score: 0, matchedKeywords: [], totalKeywords: 0 },
        roleMatch: { score: 0, matchedTerms: [] },
        experienceMatch: { score: 0, detectedLevel: '', requiredLevel: '' },
        resumeQuality: { score: 0, factors: [] }
    };
    
    let matchedSkills = [];
    
    // 1. ADVANCED SKILLS MATCHING (35% weight) - More flexible scoring
    if (safeRequiredSkills.length > 0) {
        console.log('🎯 Analyzing skills matching...');
        const skillMatches = safeRequiredSkills.map(skill => {
            const skillLower = skill.toLowerCase();
            const skillVariations = generateSkillVariations(skillLower);
            
            // Check in user skills with fuzzy matching
            const inUserSkills = safeUserSkills.some(us => {
                const userSkillLower = us.toLowerCase();
                return skillVariations.some(variation => 
                    userSkillLower.includes(variation) || 
                    variation.includes(userSkillLower) ||
                    levenshteinSimilarity(userSkillLower, variation) > 0.7 // More lenient
                );
            });
            
            // Check in resume text with context awareness
            const inResume = skillVariations.some(variation => fullText.includes(variation));
            
            // Advanced scoring based on context
            let skillScore = 0;
            if (inUserSkills && inResume) {
                skillScore = 1.0; // Perfect match
                breakdown.skillsMatch.details.push(`${skill}: Found in both profile and resume`);
            } else if (inUserSkills) {
                skillScore = 0.85; // In profile only
                breakdown.skillsMatch.details.push(`${skill}: Found in profile`);
            } else if (inResume) {
                skillScore = 0.7; // In resume only
                breakdown.skillsMatch.details.push(`${skill}: Found in resume`);
            }
            
            if (skillScore > 0) {
                matchedSkills.push(skill);
            }
            
            return skillScore;
        });
        
        breakdown.skillsMatch.matched = matchedSkills.length;
        breakdown.skillsMatch.total = safeRequiredSkills.length;
        breakdown.skillsMatch.score = Math.round((skillMatches.reduce((a, b) => a + b, 0) / safeRequiredSkills.length) * 100);
        
        console.log(`✅ Skills: ${breakdown.skillsMatch.matched}/${breakdown.skillsMatch.total} matched (${breakdown.skillsMatch.score}%)`);
    } else {
        // If no required skills, give partial credit based on user having any skills
        breakdown.skillsMatch.score = safeUserSkills.length > 0 ? 50 : 25;
        console.log(`⚠️ No required skills specified, giving base score: ${breakdown.skillsMatch.score}%`);
    }
    
    // 2. ENHANCED JOB DESCRIPTION RELEVANCE (30% weight) - More flexible
    if (jobDesc || fullText) {
        console.log('📋 Analyzing job description relevance...');
        
        if (jobDesc && fullText) {
            const jobKeywords = extractAdvancedKeywords(jobDesc);
            const resumeKeywords = extractAdvancedKeywords(fullText);
            
            // Weighted keyword matching with fuzzy matching
            const keywordMatches = jobKeywords.map(keyword => {
                const found = resumeKeywords.some(resumeKeyword => 
                    resumeKeyword.includes(keyword) || 
                    keyword.includes(resumeKeyword) ||
                    levenshteinSimilarity(keyword, resumeKeyword) > 0.7
                );
                if (found) breakdown.descriptionMatch.matchedKeywords.push(keyword);
                return found ? 1 : 0;
            });
            
            breakdown.descriptionMatch.totalKeywords = jobKeywords.length;
            breakdown.descriptionMatch.score = jobKeywords.length > 0 ? 
                Math.round((keywordMatches.reduce((a, b) => a + b, 0) / jobKeywords.length) * 100) : 0;
        } else if (jobDesc && !fullText) {
            // Job description exists but no candidate text - give minimal score
            breakdown.descriptionMatch.score = 15;
            console.log('⚠️ Job description available but no candidate text for comparison');
        } else if (!jobDesc && fullText) {
            // No job description but candidate has text - give moderate score
            breakdown.descriptionMatch.score = 40;
            console.log('⚠️ No job description available but candidate has profile text');
        } else {
            // Neither available
            breakdown.descriptionMatch.score = 25;
            console.log('⚠️ No job description or candidate text available');
        }
        
        console.log(`📊 Description match: ${breakdown.descriptionMatch.matchedKeywords.length}/${breakdown.descriptionMatch.totalKeywords} keywords (${breakdown.descriptionMatch.score}%)`);
    }
    
    // 3. INTELLIGENT ROLE/TITLE MATCHING (20% weight) - More flexible
    if (jobTitle || safeUserRole) {
        console.log('👤 Analyzing role compatibility...');
        
        if (jobTitle && safeUserRole) {
            const titleTerms = extractRoleTerms(jobTitle.toLowerCase());
            const roleTerms = extractRoleTerms(safeUserRole.toLowerCase());
            
            const matches = titleTerms.filter(term => {
                const found = roleTerms.some(roleTerm => 
                    roleTerm.includes(term) || 
                    term.includes(roleTerm) || 
                    levenshteinSimilarity(term, roleTerm) > 0.6 // More lenient
                );
                if (found) breakdown.roleMatch.matchedTerms.push(term);
                return found;
            });
            
            breakdown.roleMatch.score = titleTerms.length > 0 ? 
                Math.round((matches.length / titleTerms.length) * 100) : 0;
                
            console.log(`🎭 Role match: ${matches.length}/${titleTerms.length} terms (${breakdown.roleMatch.score}%)`);
        } else if (jobTitle && !safeUserRole) {
            // Job title exists but no user role - give base score
            breakdown.roleMatch.score = 30;
            console.log('⚠️ Job title available but no user role specified');
        } else if (!jobTitle && safeUserRole) {
            // No job title but user has role - give moderate score
            breakdown.roleMatch.score = 45;
            console.log('⚠️ No job title available but user has role specified');
        } else {
            // Neither available
            breakdown.roleMatch.score = 35;
            console.log('⚠️ No job title or user role available');
        }
    }
    
    // 4. COMPREHENSIVE EXPERIENCE ANALYSIS (10% weight)
    const levelMap = { entry: 1, junior: 2, mid: 3, senior: 4, lead: 5, principal: 6, director: 7 };
    const requiredLevel = levelMap[jobLevel?.toLowerCase()] || 3;
    const candidateLevel = detectAdvancedExperienceLevel(fullText, levelMap);
    
    breakdown.experienceMatch.requiredLevel = Object.keys(levelMap).find(key => levelMap[key] === requiredLevel) || 'mid';
    breakdown.experienceMatch.detectedLevel = Object.keys(levelMap).find(key => levelMap[key] === candidateLevel) || 'mid';
    
    const levelDiff = Math.abs(requiredLevel - candidateLevel);
    breakdown.experienceMatch.score = levelDiff === 0 ? 100 : 
                                    levelDiff === 1 ? 85 : 
                                    levelDiff === 2 ? 65 : 
                                    levelDiff === 3 ? 45 : 25;
    
    console.log(`📈 Experience: Required ${breakdown.experienceMatch.requiredLevel}, Detected ${breakdown.experienceMatch.detectedLevel} (${breakdown.experienceMatch.score}%)`);
    
    // 5. ADVANCED RESUME QUALITY ASSESSMENT (5% weight) - More flexible
    const qualityFactors = assessResumeQuality(safeResumeText, textractUsed, fullText, safeUserSkills, safeUserRole);
    breakdown.resumeQuality.factors = qualityFactors.factors;
    breakdown.resumeQuality.score = qualityFactors.score;
    
    console.log(`📄 Resume quality: ${breakdown.resumeQuality.score}% (${qualityFactors.factors.join(', ')})`);
    
    // Calculate weighted final score with improved weights
    const finalScore = Math.round(
        (breakdown.skillsMatch.score * 0.35) +
        (breakdown.descriptionMatch.score * 0.30) +
        (breakdown.roleMatch.score * 0.20) +
        (breakdown.experienceMatch.score * 0.10) +
        (breakdown.resumeQuality.score * 0.05)
    );
    
    console.log('🏆 Final scoring calculation:', {
        skills: `${breakdown.skillsMatch.score}% × 35% = ${Math.round(breakdown.skillsMatch.score * 0.35)}`,
        description: `${breakdown.descriptionMatch.score}% × 30% = ${Math.round(breakdown.descriptionMatch.score * 0.30)}`,
        role: `${breakdown.roleMatch.score}% × 20% = ${Math.round(breakdown.roleMatch.score * 0.20)}`,
        experience: `${breakdown.experienceMatch.score}% × 10% = ${Math.round(breakdown.experienceMatch.score * 0.10)}`,
        quality: `${breakdown.resumeQuality.score}% × 5% = ${Math.round(breakdown.resumeQuality.score * 0.05)}`,
        total: finalScore
    });
    
    return {
        score: Math.min(finalScore, 100),
        breakdown,
        matchedSkills
    };
}

// ADVANCED KEYWORD EXTRACTION
function extractAdvancedKeywords(text) {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'this', 'that', 'these', 'those', 'a', 'an', 'as', 'if', 'then', 'than', 'such', 'very', 'just', 'so', 'even', 'more', 'most', 'other', 'some', 'any', 'only', 'own', 'same', 'few', 'much', 'many', 'well', 'also'];
    
    // Extract multi-word technical terms and single keywords
    const phrases = text.match(/\b[a-zA-Z][a-zA-Z0-9+#\.\-]{2,}(?:\s+[a-zA-Z][a-zA-Z0-9+#\.\-]{2,}){0,2}\b/g) || [];
    const words = text.split(/\s+/)
        .map(word => word.replace(/[^a-zA-Z0-9+#\.\-]/g, '').toLowerCase())
        .filter(word => word.length > 2 && !stopWords.includes(word));
    
    const allKeywords = [...phrases.map(p => p.toLowerCase()), ...words]
        .filter((word, index, arr) => arr.indexOf(word) === index)
        .slice(0, 100);
    
    return allKeywords;
}

// SKILL VARIATIONS GENERATOR
function generateSkillVariations(skill) {
    const variations = [skill];
    
    // Common abbreviations and variations
    const skillMap = {
        'javascript': ['js', 'javascript', 'ecmascript'],
        'typescript': ['ts', 'typescript'],
        'python': ['python', 'py'],
        'react': ['react', 'reactjs', 'react.js'],
        'angular': ['angular', 'angularjs', 'angular.js'],
        'vue': ['vue', 'vuejs', 'vue.js'],
        'node': ['node', 'nodejs', 'node.js'],
        'express': ['express', 'expressjs', 'express.js'],
        'mongodb': ['mongodb', 'mongo'],
        'postgresql': ['postgresql', 'postgres', 'psql'],
        'mysql': ['mysql', 'my sql'],
        'aws': ['aws', 'amazon web services'],
        'docker': ['docker', 'containerization'],
        'kubernetes': ['kubernetes', 'k8s'],
        'git': ['git', 'version control'],
        'html': ['html', 'html5'],
        'css': ['css', 'css3', 'cascading style sheets'],
        'sql': ['sql', 'structured query language']
    };
    
    const normalizedSkill = skill.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    
    Object.keys(skillMap).forEach(key => {
        if (skillMap[key].some(variant => normalizedSkill.includes(variant.replace(/[^a-zA-Z0-9]/g, '')))) {
            variations.push(...skillMap[key]);
        }
    });
    
    return [...new Set(variations)];
}

// ROLE TERMS EXTRACTION
function extractRoleTerms(roleText) {
    const roleKeywords = ['developer', 'engineer', 'programmer', 'architect', 'manager', 'lead', 'senior', 'junior', 'full', 'stack', 'front', 'end', 'back', 'end', 'software', 'web', 'mobile', 'data', 'devops', 'qa', 'tester', 'analyst', 'consultant', 'specialist', 'expert'];
    
    return roleText.split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => roleKeywords.includes(word) || /^[a-zA-Z]{3,}$/.test(word))
        .slice(0, 10);
}

// ADVANCED EXPERIENCE DETECTION
function detectAdvancedExperienceLevel(text, levelMap) {
    let detectedLevel = 2; // Default to junior
    
    // Check for explicit level mentions
    Object.keys(levelMap).forEach(level => {
        const regex = new RegExp(`\\b${level}\\b`, 'gi');
        if (regex.test(text)) {
            detectedLevel = Math.max(detectedLevel, levelMap[level]);
        }
    });
    
    // Enhanced year detection with context
    const yearPatterns = [
        /(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp|work)/gi,
        /(?:experience|exp)\s*(?:of\s*)?(\d+)\s*(?:years?|yrs?)/gi,
        /(\d+)\+\s*(?:years?|yrs?)/gi
    ];
    
    let maxYears = 0;
    yearPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => {
                const years = parseInt(match.match(/\d+/)[0]);
                maxYears = Math.max(maxYears, years);
            });
        }
    });
    
    // Map years to levels more accurately
    if (maxYears >= 10) detectedLevel = Math.max(detectedLevel, 6); // Principal
    else if (maxYears >= 7) detectedLevel = Math.max(detectedLevel, 5); // Lead
    else if (maxYears >= 4) detectedLevel = Math.max(detectedLevel, 4); // Senior
    else if (maxYears >= 2) detectedLevel = Math.max(detectedLevel, 3); // Mid
    else if (maxYears >= 1) detectedLevel = Math.max(detectedLevel, 2); // Junior
    
    // Check for leadership indicators
    const leadershipTerms = ['lead', 'manager', 'director', 'head', 'chief', 'principal', 'architect', 'team lead', 'tech lead'];
    if (leadershipTerms.some(term => text.includes(term))) {
        detectedLevel = Math.max(detectedLevel, 5);
    }
    
    return detectedLevel;
}

// RESUME QUALITY ASSESSMENT - More flexible scoring
function assessResumeQuality(resumeText, textractUsed, fullText, userSkills, userRole) {
    const factors = [];
    let score = 0;
    
    // Length and completeness - more flexible
    if (resumeText.length > 1000) {
        factors.push('Comprehensive resume content');
        score += 30;
    } else if (resumeText.length > 500) {
        factors.push('Adequate resume content');
        score += 20;
    } else if (resumeText.length > 100) {
        factors.push('Basic resume content');
        score += 15;
    } else {
        // No resume text, but check if user has profile info
        if (userSkills?.length > 0 || userRole) {
            factors.push('Profile information available');
            score += 25;
        } else {
            factors.push('Limited profile information');
            score += 10;
        }
    }
    
    // Textract usage bonus
    if (textractUsed) {
        factors.push('PDF resume processed');
        score += 25;
    } else if (resumeText.length === 0) {
        // No resume but user might have filled profile
        factors.push('No resume document');
        score += 5;
    }
    
    // Structure indicators - check in full profile text
    const structureKeywords = ['experience', 'education', 'skills', 'projects', 'work', 'employment', 'qualification', 'developer', 'engineer'];
    const foundStructure = structureKeywords.filter(keyword => fullText.includes(keyword));
    if (foundStructure.length >= 4) {
        factors.push('Well-structured profile');
        score += 25;
    } else if (foundStructure.length >= 2) {
        factors.push('Basic profile structure');
        score += 15;
    } else if (foundStructure.length >= 1) {
        factors.push('Minimal profile structure');
        score += 10;
    }
    
    // Technical depth - more inclusive
    const techTerms = fullText.match(/\b(?:api|database|framework|library|algorithm|architecture|deployment|testing|debugging|programming|coding|development|software|web|mobile|frontend|backend|fullstack)\b/gi) || [];
    if (techTerms.length >= 5) {
        factors.push('Strong technical depth');
        score += 20;
    } else if (techTerms.length >= 2) {
        factors.push('Some technical content');
        score += 10;
    }
    
    // Skills bonus
    if (userSkills?.length >= 5) {
        factors.push('Multiple skills listed');
        score += 15;
    } else if (userSkills?.length >= 1) {
        factors.push('Some skills listed');
        score += 10;
    }
    
    return {
        score: Math.min(score, 100),
        factors
    };
}

// Keep original function for backward compatibility
function extractKeywords(text) {
    return extractAdvancedKeywords(text);
}

// Keep for backward compatibility
function detectExperienceLevel(text, levelMap) {
    return detectAdvancedExperienceLevel(text, levelMap);
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