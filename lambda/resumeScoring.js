const AWS = require('aws-sdk');
const { TextractClient, DetectDocumentTextCommand } = require('@aws-sdk/client-textract');
const axios = require('axios');

const s3 = new AWS.S3();
const textract = new TextractClient({
    region: process.env.AWS_REGION || 'ap-south-1'
});

exports.handler = async (event) => {
    
    try {
        const { 
            jobTitle, jobDescription, jobLocation, jobCategory, jobLevel, jobSalary, requiredSkills,
            userSkills, userBio, userRole, resumeUrl, applicationId, backendUrl 
        } = JSON.parse(event.body);
        

        
        let resumeText = userBio || '';
        
        // Extract text from resume using Textract if resume URL is provided
        if (resumeUrl && resumeUrl.includes('.pdf')) {
            try {
                const url = new URL(resumeUrl);
                const bucketName = url.hostname.split('.')[0];
                const key = url.pathname.substring(1);
                
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
                
                const extractedText = textractResponse.Blocks
                    .filter(block => block.BlockType === 'LINE')
                    .map(block => block.Text)
                    .join(' ');
                
                if (extractedText.trim()) {
                    resumeText = extractedText;
                }
            } catch (textractError) {
                // Capture Textract error for backend logging
                textractError.textractErrorDetails = {
                    bucketName: url.hostname.split('.')[0],
                    keyName: url.pathname.substring(1),
                    errorCode: textractError.code,
                    errorMessage: textractError.message
                };
            }
        }
        

        
        // Calculate precise score based on exact job requirements
        const score = calculatePreciseScore({
            jobTitle, jobDescription, jobLocation, jobCategory, jobLevel, jobSalary,
            requiredSkills, userSkills, userBio, userRole, resumeText
        });
        

        

        
        // Get detailed scoring breakdown for controller logging
        const scoringDetails = getDetailedScoring({
            jobTitle, jobDescription, jobLocation, jobCategory, jobLevel, jobSalary,
            requiredSkills, userSkills, userBio, userRole, resumeText
        });
        
        // Prepare comprehensive info for backend logging
        const processingInfo = {
            textract: {
                hasResume: !!resumeUrl,
                resumeUrl: resumeUrl || null,
                textExtracted: resumeText !== (userBio || ''),
                textLength: resumeText.length,
                source: resumeUrl ? 'Textract + Bio' : 'Bio only',
                extractedText: resumeText // Send full extracted text to backend
            },
            scoring: {
                totalRequiredSkills: requiredSkills?.length || 0,
                totalUserSkills: userSkills?.length || 0,
                jobLevel: jobLevel,
                jobTitle: jobTitle,
                hasJobDescription: !!jobDescription,
                processingTimestamp: new Date().toISOString()
            }
        };
        
        // Send response to backend
        await axios.post(`${backendUrl}/api/users/update-application-score`, {
            applicationId,
            score,
            details: scoringDetails,
            processingInfo
        });
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                score,
                message: 'Resume scored successfully',
                details: scoringDetails,
                processingInfo,
                applicationId
            })
        };
    } catch (error) {
        // Capture detailed error information for backend logging
        const errorDetails = {
            errorType: error.name || 'UnknownError',
            errorMessage: error.message,
            errorStack: error.stack,
            timestamp: new Date().toISOString(),
            applicationId: applicationId || 'unknown'
        };
        
        // Send error to same backend route
        try {
            const { backendUrl } = JSON.parse(event.body);
            if (backendUrl) {
                await axios.post(`${backendUrl}/api/users/update-application-score`, {
                    applicationId: applicationId || 'unknown',
                    error: true,
                    errorDetails
                });
            }
        } catch (notificationError) {
            console.log('Failed to notify backend of error:', notificationError.message);
        }
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: error.message,
                errorDetails,
                applicationId: applicationId || 'unknown'
            })
        };
    }
};

function calculatePreciseScore(jobData) {
    
    const {
        jobTitle, jobDescription, jobLocation, jobCategory, jobLevel, jobSalary,
        requiredSkills, userSkills, userBio, userRole, resumeText
    } = jobData;
    
    // Analyze each component precisely
    const skillsAnalysis = analyzeExactSkillsMatch(requiredSkills, userSkills, resumeText);
    const descriptionAnalysis = analyzeJobDescriptionMatch(jobDescription, resumeText, userBio);
    const experienceAnalysis = analyzeExperienceLevel(jobLevel, resumeText, userRole);
    const roleAnalysis = analyzeRoleCompatibility(jobTitle, userRole, resumeText);
    const qualificationAnalysis = analyzeQualifications(jobDescription, resumeText);
    
    // Weighted scoring (recruiter priorities)
    const weights = {
        skills: 0.40,      // 40% - Skills match is most critical
        description: 0.25, // 25% - Job description relevance
        experience: 0.20,  // 20% - Experience level
        role: 0.10,        // 10% - Role compatibility
        qualification: 0.05 // 5% - Additional qualifications
    };
    
    const finalScore = Math.round(
        (skillsAnalysis.score * weights.skills * 100) +
        (descriptionAnalysis.score * weights.description * 100) +
        (experienceAnalysis.score * weights.experience * 100) +
        (roleAnalysis.score * weights.role * 100) +
        (qualificationAnalysis.score * weights.qualification * 100)
    );
    

    
    return Math.max(Math.min(finalScore, 100), 0);
}

function getDetailedScoring(jobData) {
    const {
        jobTitle, jobDescription, jobLocation, jobCategory, jobLevel, jobSalary,
        requiredSkills, userSkills, userBio, userRole, resumeText
    } = jobData;
    
    const skillsAnalysis = analyzeExactSkillsMatch(requiredSkills, userSkills, resumeText);
    const descriptionAnalysis = analyzeJobDescriptionMatch(jobDescription, resumeText, userBio);
    const experienceAnalysis = analyzeExperienceLevel(jobLevel, resumeText, userRole);
    const roleAnalysis = analyzeRoleCompatibility(jobTitle, userRole, resumeText);
    const qualificationAnalysis = analyzeQualifications(jobDescription, resumeText);
    
    return {
        skillsMatch: {
            score: Math.round(skillsAnalysis.score * 100),
            matched: skillsAnalysis.matched,
            total: skillsAnalysis.total,
            matchedSkills: skillsAnalysis.matchedSkills,
            weight: '40%'
        },
        descriptionMatch: {
            score: Math.round(descriptionAnalysis.score * 100),
            keywordMatches: descriptionAnalysis.keywordMatches,
            totalKeywords: descriptionAnalysis.totalKeywords,
            weight: '25%'
        },
        experienceMatch: {
            score: Math.round(experienceAnalysis.score * 100),
            candidateLevel: experienceAnalysis.level,
            requiredLevel: jobLevel,
            years: experienceAnalysis.years,
            weight: '20%'
        },
        roleMatch: {
            score: Math.round(roleAnalysis.score * 100),
            similarity: roleAnalysis.similarity,
            weight: '10%'
        },
        qualificationMatch: {
            score: Math.round(qualificationAnalysis.score * 100),
            found: qualificationAnalysis.found,
            weight: '5%'
        },
        recommendation: getHiringRecommendation(
            Math.round(
                (skillsAnalysis.score * 0.40 * 100) +
                (descriptionAnalysis.score * 0.25 * 100) +
                (experienceAnalysis.score * 0.20 * 100) +
                (roleAnalysis.score * 0.10 * 100) +
                (qualificationAnalysis.score * 0.05 * 100)
            ),
            {
                skillsMatch: skillsAnalysis,
                descriptionMatch: descriptionAnalysis,
                experienceMatch: experienceAnalysis,
                roleMatch: roleAnalysis
            }
        )
    };
}

// Precise analysis functions for exact job requirement matching
function analyzeExactSkillsMatch(requiredSkills, userSkills, resumeText) {
    if (!requiredSkills || requiredSkills.length === 0) {
        return { score: 0.5, matched: 0, total: 0, details: [] };
    }
    
    const text = resumeText ? resumeText.toLowerCase() : '';
    const userSkillsLower = userSkills ? userSkills.map(s => s.toLowerCase()) : [];
    
    let matchedSkills = [];
    let skillDetails = [];
    
    requiredSkills.forEach(skill => {
        const skillLower = skill.toLowerCase();
        let matchType = 'none';
        let proficiencyLevel = 0;
        
        // Exact match in user skills
        if (userSkillsLower.some(us => 
            us === skillLower || 
            us.includes(skillLower) || 
            skillLower.includes(us) ||
            areSkillsSynonyms(skill, us)
        )) {
            matchType = 'profile';
            proficiencyLevel = 0.8;
        }
        
        // Match in resume with context analysis
        if (text.includes(skillLower)) {
            matchType = matchType === 'profile' ? 'both' : 'resume';
            proficiencyLevel = Math.max(proficiencyLevel, extractSkillProficiency(skill, text));
        }
        
        if (matchType !== 'none') {
            matchedSkills.push(skill);
        }
        
        skillDetails.push({
            skill,
            matched: matchType !== 'none',
            matchType,
            proficiencyLevel
        });
    });
    
    const baseScore = matchedSkills.length / requiredSkills.length;
    const avgProficiency = skillDetails
        .filter(s => s.matched)
        .reduce((sum, s) => sum + s.proficiencyLevel, 0) / Math.max(matchedSkills.length, 1);
    
    const finalScore = baseScore * (0.7 + (avgProficiency * 0.3));
    
    return {
        score: Math.min(finalScore, 1),
        matched: matchedSkills.length,
        total: requiredSkills.length,
        details: skillDetails,
        matchedSkills
    };
}

function analyzeJobDescriptionMatch(jobDescription, resumeText, userBio) {
    if (!jobDescription) {
        return { score: 0.5, keywordMatches: 0, totalKeywords: 0 };
    }
    
    const jobText = jobDescription.toLowerCase();
    const candidateText = ((resumeText || '') + ' ' + (userBio || '')).toLowerCase();
    
    const jobKeywords = extractMeaningfulKeywords(jobText);
    const technicalTerms = extractTechnicalTerms(jobText);
    const responsibilities = extractResponsibilityKeywords(jobText);
    
    let keywordMatches = 0;
    let technicalMatches = 0;
    let responsibilityMatches = 0;
    
    jobKeywords.forEach(keyword => {
        if (candidateText.includes(keyword)) keywordMatches++;
    });
    
    technicalTerms.forEach(term => {
        if (candidateText.includes(term)) technicalMatches++;
    });
    
    responsibilities.forEach(resp => {
        if (candidateText.includes(resp)) responsibilityMatches++;
    });
    
    const totalTerms = jobKeywords.length + technicalTerms.length + responsibilities.length;
    const totalMatches = keywordMatches + (technicalMatches * 1.5) + responsibilityMatches;
    
    const score = totalTerms > 0 ? Math.min(totalMatches / (totalTerms * 1.2), 1) : 0.5;
    
    return {
        score,
        keywordMatches: keywordMatches + technicalMatches + responsibilityMatches,
        totalKeywords: totalTerms
    };
}

function analyzeExperienceLevel(jobLevel, resumeText, userRole) {
    const levelMap = {
        'entry': 0, 'junior': 1, 'associate': 2, 'mid': 3, 'intermediate': 3,
        'senior': 4, 'lead': 5, 'principal': 6, 'staff': 6, 'architect': 6
    };
    
    const requiredLevel = levelMap[jobLevel?.toLowerCase()] ?? 3;
    let candidateLevel = 1;
    let experienceYears = 0;
    
    if (userRole) {
        Object.keys(levelMap).forEach(level => {
            if (userRole.toLowerCase().includes(level)) {
                candidateLevel = Math.max(candidateLevel, levelMap[level]);
            }
        });
    }
    
    if (resumeText) {
        const text = resumeText.toLowerCase();
        
        const yearPatterns = [
            /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi,
            /(?:experience|exp).*?(\d+)\+?\s*(?:years?|yrs?)/gi
        ];
        
        yearPatterns.forEach(pattern => {
            const matches = [...text.matchAll(pattern)];
            matches.forEach(match => {
                experienceYears = Math.max(experienceYears, parseInt(match[1]));
            });
        });
        
        if (experienceYears >= 8) candidateLevel = Math.max(candidateLevel, 5);
        else if (experienceYears >= 5) candidateLevel = Math.max(candidateLevel, 4);
        else if (experienceYears >= 3) candidateLevel = Math.max(candidateLevel, 3);
        else if (experienceYears >= 1) candidateLevel = Math.max(candidateLevel, 2);
        
        Object.entries(levelMap).forEach(([level, value]) => {
            if (text.includes(level)) {
                candidateLevel = Math.max(candidateLevel, value);
            }
        });
    }
    
    const levelDiff = Math.abs(requiredLevel - candidateLevel);
    let score;
    
    if (levelDiff === 0) score = 1.0;
    else if (levelDiff === 1) score = 0.85;
    else if (levelDiff === 2) score = 0.65;
    else score = 0.4;
    
    return {
        score,
        level: Object.keys(levelMap).find(k => levelMap[k] === candidateLevel) || 'junior',
        years: experienceYears
    };
}

function analyzeRoleCompatibility(jobTitle, userRole, resumeText) {
    if (!jobTitle) {
        return { score: 0.5, similarity: 'unknown' };
    }
    
    const jobTitleLower = jobTitle.toLowerCase();
    const text = (resumeText || '').toLowerCase();
    const role = (userRole || '').toLowerCase();
    
    const jobRoleTerms = extractRoleKeywords(jobTitleLower);
    let score = 0;
    let similarity = 'none';
    
    if (role) {
        const roleTerms = extractRoleKeywords(role);
        const commonTerms = jobRoleTerms.filter(term => 
            roleTerms.some(rt => rt.includes(term) || term.includes(rt))
        );
        
        if (commonTerms.length > 0) {
            score = commonTerms.length / jobRoleTerms.length;
            similarity = score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';
        }
    }
    
    if (text) {
        const resumeRoleMatches = jobRoleTerms.filter(term => text.includes(term));
        const resumeScore = resumeRoleMatches.length / jobRoleTerms.length;
        score = Math.max(score, resumeScore);
        
        if (resumeScore > score * 0.8) {
            similarity = resumeScore > 0.7 ? 'high' : resumeScore > 0.4 ? 'medium' : 'low';
        }
    }
    
    return {
        score: Math.min(score, 1),
        similarity
    };
}

function analyzeQualifications(jobDescription, resumeText) {
    if (!jobDescription || !resumeText) {
        return { score: 0.5, found: 0 };
    }
    
    const jobText = jobDescription.toLowerCase();
    const text = resumeText.toLowerCase();
    
    const qualifications = {
        education: ['degree', 'bachelor', 'master', 'phd', 'certification'],
        experience: ['experience', 'background', 'track record'],
        certifications: ['certified', 'certification', 'license'],
        achievements: ['award', 'recognition', 'achievement']
    };
    
    let totalFound = 0;
    let totalRequired = 0;
    
    Object.entries(qualifications).forEach(([category, terms]) => {
        const requiredInJob = terms.some(term => jobText.includes(term));
        if (requiredInJob) {
            totalRequired++;
            const foundInResume = terms.some(term => text.includes(term));
            if (foundInResume) totalFound++;
        }
    });
    
    const score = totalRequired > 0 ? totalFound / totalRequired : 0.8;
    
    return { score, found: totalFound };
}

// Helper functions
function areSkillsSynonyms(skill1, skill2) {
    const synonyms = {
        'javascript': ['js', 'es6', 'es2015'],
        'typescript': ['ts'],
        'python': ['py'],
        'react': ['reactjs', 'react.js'],
        'node': ['nodejs', 'node.js'],
        'angular': ['angularjs'],
        'vue': ['vuejs', 'vue.js']
    };
    
    const s1 = skill1.toLowerCase();
    const s2 = skill2.toLowerCase();
    
    for (const [main, alts] of Object.entries(synonyms)) {
        if ((s1.includes(main) || alts.some(alt => s1.includes(alt))) &&
            (s2.includes(main) || alts.some(alt => s2.includes(alt)))) {
            return true;
        }
    }
    
    return false;
}

function extractSkillProficiency(skill, resumeText) {
    const skillLower = skill.toLowerCase();
    const text = resumeText.toLowerCase();
    
    const proficiencyPatterns = [
        { pattern: `expert.*${skillLower}|${skillLower}.*expert`, level: 1.0 },
        { pattern: `proficient.*${skillLower}|${skillLower}.*proficient`, level: 0.9 },
        { pattern: `experienced.*${skillLower}|${skillLower}.*experienced`, level: 0.8 },
        { pattern: `(\\d+)\\s*(?:years?|yrs?).*${skillLower}`, level: 0.7 }
    ];
    
    for (const { pattern, level } of proficiencyPatterns) {
        if (new RegExp(pattern, 'i').test(text)) {
            return level;
        }
    }
    
    return 0.5;
}

function extractMeaningfulKeywords(text) {
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return text.split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word))
        .slice(0, 20);
}

function extractTechnicalTerms(text) {
    const techTerms = [
        'api', 'database', 'framework', 'library', 'algorithm', 'architecture',
        'microservices', 'cloud', 'devops', 'agile', 'scrum', 'testing'
    ];
    return techTerms.filter(term => text.includes(term));
}

function extractResponsibilityKeywords(text) {
    const responsibilities = [
        'develop', 'manage', 'lead', 'create', 'implement', 'design',
        'build', 'coordinate', 'analyze', 'research', 'optimize', 'maintain'
    ];
    return responsibilities.filter(resp => text.includes(resp));
}

function extractRoleKeywords(roleTitle) {
    const words = roleTitle.split(/\s+/);
    return words.filter(word => word.length > 2 && 
        !['and', 'or', 'the', 'of', 'in', 'at', 'to', 'for'].includes(word)
    );
}

function getHiringRecommendation(score, analysis) {
    let recommendation = '';
    
    if (score >= 85) {
        recommendation = 'EXCELLENT MATCH - Immediate interview recommended';
    } else if (score >= 70) {
        recommendation = 'STRONG CANDIDATE - Schedule interview';
    } else if (score >= 55) {
        recommendation = 'GOOD POTENTIAL - Consider for phone screening';
    } else if (score >= 40) {
        recommendation = 'MODERATE FIT - Review manually';
    } else {
        recommendation = 'POOR MATCH - Not recommended';
    }
    
    const insights = [];
    if (analysis.skillsMatch.score < 0.5) insights.push('Skills gap identified');
    if (analysis.experienceMatch.score < 0.6) insights.push('Experience level mismatch');
    if (analysis.roleMatch.score < 0.4) insights.push('Role alignment issues');
    
    if (insights.length > 0) {
        recommendation += ` | ${insights.join(', ')}`;
    }
    
    return recommendation;
}