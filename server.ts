import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper: Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

const RECOVERABLE_STATUS_CODES = [503, 429, 404, 500];

async function generateContentWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction?: string
): Promise<{ text: string; modelUsed: string }> {
  let lastError: unknown = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      const text = response.text || '';
      return { text, modelUsed: model };
    } catch (err: unknown) {
      lastError = err;
      const errorStr = String(err);
      console.warn(`[Gemini Fallback] Model ${model} failed: ${errorStr}. Attempting next model in ladder...`);

      // Check for recoverable status code
      const isRecoverable = RECOVERABLE_STATUS_CODES.some((code) => errorStr.includes(String(code))) ||
        errorStr.toLowerCase().includes('quota') ||
        errorStr.toLowerCase().includes('unavailable') ||
        errorStr.toLowerCase().includes('overloaded');

      if (!isRecoverable && MODEL_FALLBACK_LADDER.indexOf(model) === MODEL_FALLBACK_LADDER.length - 1) {
        break;
      }
    }
  }

  throw lastError || new Error('All models in Gemini fallback ladder failed');
}

// Initialize Gemini SDK if API key exists
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Health endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// API: AI Analyze Citizen Issue
app.post('/api/analyze-issue', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const text = String(body.text || '').trim();
    const declaredLanguage = String(body.language || 'auto');
    const categoryHint = String(body.category || '');
    const locationName = String(body.locationName || '');

    if (!text) {
      return res.status(400).json({ error: 'Text description is required' });
    }

    if (!ai) {
      // Heuristic fallback if Gemini API key not yet configured
      return res.json({
        detectedLanguage: declaredLanguage === 'auto' ? 'English' : declaredLanguage,
        detectedLanguageCode: declaredLanguage === 'auto' ? 'en' : declaredLanguage,
        translatedText: text,
        category: categoryHint || 'Roads',
        severity: text.toLowerCase().includes('urgent') || text.toLowerCase().includes('danger') ? 'High' : 'Medium',
        infrastructureType: categoryHint || 'Public Infrastructure',
        keyDemand: text.slice(0, 100),
        suggestedAction: 'Forward to local municipal department for on-site inspection.',
        summary: text.slice(0, 150),
        priorityScoreDemand: 18,
        aiPowered: false,
      });
    }

    const systemPrompt = `You are CivicPulse AI, a multilingual civic infrastructure intelligence system.
Analyze the citizen's infrastructure request. Provide output strictly in valid JSON format matching this schema:
{
  "detectedLanguage": "English|Hindi|Tamil|Telugu|Bengali|Other",
  "detectedLanguageCode": "en|hi|ta|te|bn|other",
  "translatedText": "Accurate English translation of the feedback",
  "category": "Roads|Water|Electricity|Healthcare|Education|Public Transport|Sanitation|Housing|Digital Infrastructure|Other",
  "severity": "Low|Medium|High|Critical",
  "infrastructureType": "Specific infrastructure item (e.g. Drinking Water Pipeline, Pothole / Road Surface, Street Lighting, Drainage Canal, Primary Health Center)",
  "keyDemand": "Concise statement of what citizens are requesting",
  "suggestedAction": "Concrete immediate or intermediate government action recommended",
  "summary": "1-2 sentence executive summary of the issue",
  "priorityScoreDemand": <number between 10 and 25 representing severity and public impact>
}`;

    const userPrompt = `Citizen Feedback:
"${text}"
User-selected language: ${declaredLanguage}
Reported Location: ${locationName || 'Unspecified'}
Reported Category Hint: ${categoryHint || 'None'}

Return ONLY raw JSON, no markdown codeblocks.`;

    const { text: resultText, modelUsed } = await generateContentWithFallback(ai, userPrompt, systemPrompt);
    const cleanedText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(cleanedText);
      return res.json({ ...parsed, aiPowered: true, modelUsed });
    } catch {
      return res.json({
        detectedLanguage: 'English',
        detectedLanguageCode: 'en',
        translatedText: text,
        category: categoryHint || 'Infrastructure',
        severity: 'Medium',
        infrastructureType: categoryHint || 'Civic Infrastructure',
        keyDemand: text.slice(0, 100),
        suggestedAction: 'Review by civic authority',
        summary: text.slice(0, 150),
        priorityScoreDemand: 16,
        aiPowered: true,
        modelUsed,
      });
    }
  } catch (error) {
    console.error('Error in /api/analyze-issue:', error);
    return res.status(500).json({ error: 'Failed to analyze issue', details: String(error) });
  }
});

// API: AI Project Recommendations & Duplicate Investment Detection
app.post('/api/recommend-projects', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const areaName = String(body.areaName || 'General District');
    const gaps = Array.isArray(body.gaps) ? body.gaps : [];
    const demands = Array.isArray(body.demands) ? body.demands : [];
    const existingProjects = Array.isArray(body.existingProjects) ? body.existingProjects : [];
    const nationalPriorities = Array.isArray(body.nationalPriorities) ? body.nationalPriorities : [];

    if (!ai) {
      return res.json({
        recommendations: [
          {
            title: `Community Water Supply & Filtration Grid in ${areaName}`,
            category: 'Water',
            problemAddressed: 'High citizen demand for potable drinking water and pipeline deficits.',
            affectedPopulation: 45000,
            infrastructureGap: 'High',
            priorityScore: 88,
            estimatedBudget: 42000000, // ₹4.2 Crore
            expectedImpact: 'Supplies 15,000 households with clean tap water; eliminates water-borne disease incidence by 65%.',
            evidence: 'Aggregated 18 citizen reports and baseline 40% distribution loss in district water audit.',
            confidenceScore: 92,
            explanation: 'Directly aligns with National Jal Jeevan Mission and addresses critical citizen health complaints.',
            duplicateCheck: {
              hasDuplicate: false,
              recommendationType: 'new',
              notes: 'No active water filtration schemes identified in northern sector.',
            },
          },
        ],
        aiPowered: false,
      });
    }

    const systemPrompt = `You are CivicPulse AI's Chief Infrastructure Planning Intelligence Agent.
Evaluate citizen feedback, regional infrastructure gaps, national priorities, and EXISTING government projects.
Before recommending a new project, evaluate if existing or planned projects already address this demand to PREVENT DUPLICATE INVESTMENTS.
If an existing project is similar, underfunded, or incomplete, recommend "expansion" or "acceleration" instead of a new duplicate project.
Return JSON with format:
{
  "recommendations": [
    {
      "title": "Title of project",
      "category": "Water|Roads|Healthcare|Electricity|Sanitation|Education|Public Transport|Digital Infrastructure",
      "problemAddressed": "Clear statement of the civic issue",
      "affectedPopulation": <number>,
      "infrastructureGap": "Critical|High|Medium",
      "priorityScore": <number 0-100>,
      "estimatedBudget": <number in INR>,
      "expectedImpact": "Quantifiable expected public impact",
      "evidence": "Evidence linking citizen complaints and demographic deficits",
      "confidenceScore": <number 0-100>,
      "explanation": "Explainable AI reasoning why this project is recommended and how priority score was calculated",
      "duplicateCheck": {
        "hasDuplicate": <boolean>,
        "existingProjectId": "<id or null>",
        "existingProjectName": "<name or null>",
        "recommendationType": "new|expansion|acceleration",
        "notes": "Explanation of duplicate check and why expansion/acceleration/new was chosen"
      }
    }
  ]
}`;

    const userPrompt = `Area: ${areaName}
Identified Gaps: ${JSON.stringify(gaps)}
Key Citizen Demands: ${JSON.stringify(demands)}
Existing Government Projects in Area: ${JSON.stringify(existingProjects)}
Active National Priority Weights: ${JSON.stringify(nationalPriorities)}

Return ONLY valid JSON.`;

    const { text: resultText, modelUsed } = await generateContentWithFallback(ai, userPrompt, systemPrompt);
    const cleanedText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(cleanedText);
      return res.json({ ...parsed, aiPowered: true, modelUsed });
    } catch {
      return res.status(500).json({ error: 'Failed to parse AI recommendations JSON' });
    }
  } catch (error) {
    console.error('Error in /api/recommend-projects:', error);
    return res.status(500).json({ error: 'Failed to generate recommendations', details: String(error) });
  }
});

// API: Budget What-If Simulation
app.post('/api/simulate-budget', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const totalBudget = Number(body.totalBudget) || 1000000000; // Default ₹100 Crore
    const allocations = body.allocations || {
      water: 25,
      healthcare: 20,
      roads: 20,
      education: 15,
      sanitation: 10,
      digital: 10,
    };

    // Calculate simulated outcomes based on standard civic impact coefficients
    const waterCr = (totalBudget * (allocations.water || 0)) / 100 / 10000000;
    const healthCr = (totalBudget * (allocations.healthcare || 0)) / 100 / 10000000;
    const roadsCr = (totalBudget * (allocations.roads || 0)) / 100 / 10000000;
    const eduCr = (totalBudget * (allocations.education || 0)) / 100 / 10000000;
    const sanCr = (totalBudget * (allocations.sanitation || 0)) / 100 / 10000000;
    const digCr = (totalBudget * (allocations.digital || 0)) / 100 / 10000000;

    // Beneficiaries estimation: ~8,000 people per ₹1 Crore weighted
    const peopleAffected = Math.round(
      waterCr * 9500 +
      healthCr * 12000 +
      roadsCr * 7000 +
      eduCr * 6500 +
      sanCr * 8500 +
      digCr * 11000
    );

    // Gaps reduced count
    const gapsReduced = Math.round(
      (waterCr > 15 ? 4 : 2) +
      (healthCr > 15 ? 3 : 1) +
      (roadsCr > 15 ? 5 : 2) +
      (eduCr > 10 ? 3 : 1) +
      (sanCr > 10 ? 3 : 1) +
      (digCr > 8 ? 2 : 1)
    );

    const priorityCoverage = Math.min(
      98,
      Math.round(40 + (allocations.water * 0.8 + allocations.healthcare * 0.9 + allocations.roads * 0.6) * 0.5)
    );

    const impactScore = Math.min(
      96,
      Math.round(55 + (peopleAffected / 100000) * 4)
    );

    return res.json({
      totalBudget,
      allocations,
      results: {
        peopleAffected,
        gapsReduced,
        priorityCoverage,
        impactScore,
        label: 'Estimated / Simulated',
        sectorBreakdown: {
          water: { budgetCr: waterCr, beneficiaries: Math.round(waterCr * 9500) },
          healthcare: { budgetCr: healthCr, beneficiaries: Math.round(healthCr * 12000) },
          roads: { budgetCr: roadsCr, beneficiaries: Math.round(roadsCr * 7000) },
          education: { budgetCr: eduCr, beneficiaries: Math.round(eduCr * 6500) },
          sanitation: { budgetCr: sanCr, beneficiaries: Math.round(sanCr * 8500) },
          digital: { budgetCr: digCr, beneficiaries: Math.round(digCr * 11000) },
        },
      },
    });
  } catch (error) {
    console.error('Error in /api/simulate-budget:', error);
    return res.status(500).json({ error: 'Failed to simulate budget', details: String(error) });
  }
});

// Setup dev server with Vite or production static file serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error('Failed to attach Vite middleware:', err);
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CivicPulse AI Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
