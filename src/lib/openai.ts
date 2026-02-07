import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access
// without requiring your own OpenAI API key. Charges are billed to your Replit credits.
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
export const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export const AI_MODEL = "gpt-4o"; // Using gpt-4o for cost efficiency

export interface EventGenerationRequest {
  templateId?: number;
  topic: string;
  targetAudience: string;
  eventType: string;
  mode: string;
  duration?: number;
  additionalContext?: string;
}

export interface GeneratedEventData {
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  tags: string[];
  level: string;
  agenda: Array<{
    time: string;
    title: string;
    description: string;
  }>;
  speakers?: Array<{
    name: string;
    title: string;
    bio: string;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  suggestedPrice?: number;
  suggestedCapacity?: number;
}

export async function generateEventContent(
  request: EventGenerationRequest
): Promise<GeneratedEventData> {
  const systemPrompt = `You are an expert event planner for Next Leap Pro, a platform focused on learning, career development, and professional growth in India. Generate comprehensive event content based on the user's requirements.

Your response must be valid JSON matching this structure:
{
  "title": "string - catchy, engaging title",
  "shortDescription": "string - 1-2 sentences for previews",
  "description": "string - detailed markdown description with sections",
  "category": "string - one of: Workshop, Webinar, Bootcamp, Conference, Meetup, Hackathon, Seminar, Networking",
  "tags": ["array", "of", "relevant", "tags"],
  "level": "string - one of: beginner, intermediate, advanced, all",
  "agenda": [{"time": "string", "title": "string", "description": "string"}],
  "speakers": [{"name": "string", "title": "string", "bio": "string"}] (optional, generate 1-2 placeholder speakers if applicable),
  "faqs": [{"question": "string", "answer": "string"}] (3-5 FAQs),
  "suggestedPrice": number (in INR, 0 for free events),
  "suggestedCapacity": number (50-500 based on type)
}

Focus on topics relevant to Indian students and professionals: technology, career skills, entrepreneurship, freelancing, upskilling, etc.`;

  const userPrompt = `Generate event content for:
Topic: ${request.topic}
Target Audience: ${request.targetAudience}
Event Type: ${request.eventType}
Mode: ${request.mode}
${request.duration ? `Duration: ${request.duration} minutes` : ""}
${request.additionalContext ? `Additional Context: ${request.additionalContext}` : ""}

Create engaging, professional content that would attract the target audience. Make the description detailed with markdown formatting including bullet points, key takeaways, and what attendees will learn.`;

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content generated");
  }

  return JSON.parse(content) as GeneratedEventData;
}

export interface CareerInsightRequest {
  skills: string[];
  interests: string[];
  currentRole?: string;
  experienceLevel?: string;
  learningGoals: string[];
  careerAspirations: string[];
  incomeGoals?: string;
}

export interface CareerInsightResponse {
  careerPath: {
    title: string;
    summary: string;
    milestones: Array<{
      timeframe: string;
      goal: string;
      actions: string[];
    }>;
  };
  skillGaps: Array<{
    skill: string;
    importance: "high" | "medium" | "low";
    resources: string[];
  }>;
  monetizationTips: Array<{
    method: string;
    description: string;
    potentialEarning: string;
    difficulty: "easy" | "medium" | "hard";
    steps: string[];
  }>;
  recommendedEvents: string[];
  recommendedCommunities: string[];
}

export async function generateCareerInsights(
  request: CareerInsightRequest
): Promise<CareerInsightResponse> {
  const systemPrompt = `You are an expert career counselor for Next Leap Pro, helping Indian students and professionals navigate their career journey. Provide personalized, actionable career guidance.

Your response must be valid JSON matching this structure:
{
  "careerPath": {
    "title": "string - recommended career path name",
    "summary": "string - 2-3 sentence overview",
    "milestones": [{"timeframe": "string", "goal": "string", "actions": ["string"]}]
  },
  "skillGaps": [{"skill": "string", "importance": "high|medium|low", "resources": ["string"]}],
  "monetizationTips": [{
    "method": "string",
    "description": "string",
    "potentialEarning": "string in INR",
    "difficulty": "easy|medium|hard",
    "steps": ["string"]
  }],
  "recommendedEvents": ["string - types of events to attend"],
  "recommendedCommunities": ["string - types of communities to join"]
}

Focus on practical, India-specific advice considering:
- Local job market trends
- Popular freelancing opportunities
- Startup ecosystem
- Remote work opportunities
- Gig economy`;

  const userPrompt = `Generate personalized career insights for:
Skills: ${request.skills.join(", ")}
Interests: ${request.interests.join(", ")}
Current Role: ${request.currentRole || "Not specified"}
Experience Level: ${request.experienceLevel || "Not specified"}
Learning Goals: ${request.learningGoals.join(", ")}
Career Aspirations: ${request.careerAspirations.join(", ")}
Income Goals: ${request.incomeGoals || "Not specified"}

Provide actionable, specific advice with concrete steps. Include 3-5 monetization tips ranging from easy to hard difficulty.`;

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content generated");
  }

  return JSON.parse(content) as CareerInsightResponse;
}
