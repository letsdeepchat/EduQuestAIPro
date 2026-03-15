
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { Question, Topic, UserPreferences, SyllabusData, AIConfig } from "../types";

export const extractJSON = (text: string) => {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch (e) {
    // Try to find JSON block
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        console.error("Failed to parse extracted JSON:", e2);
        throw new Error("Invalid JSON structure in AI response");
      }
    }
    throw new Error("No JSON found in AI response");
  }
};

export async function fetchDynamicSyllabus(prefs: UserPreferences): Promise<SyllabusData> {
  const config = prefs.aiConfig;
  if (!config) throw new Error("AI Configuration missing");

  const subjectStr = prefs.subject ? `Subject: ${prefs.subject}` : "";
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const prevYear = currentYear - 1;

  const prompt = `SEARCH GROUNDING REQUIRED: You are a world-class academic researcher. 
  Perform an exhaustive web search for the CURRENT year (${prevYear}-${currentYear} and ${currentYear}-${nextYear}) examination pattern, chapters, and marking scheme for:
  - Exam: ${prefs.examType}
  - Class: ${prefs.className}
  - ${subjectStr}
  - Language: ${prefs.language}

  Based on search results, provide:
  1. A specific title reflecting the exam, class, and year.
  2. A summary of the latest marking scheme or exam changes found.
  3. Total Questions (e.g., "100 Questions").
  4. Total Marks for the exam (e.g., "300 Marks").
  5. Negative Marking details (e.g., "-1/4 for wrong answers").
  6. Cutoff Trends: Provide the latest expected or previous year's cutoff marks.
  7. Exam Pattern: Briefly describe the structure (e.g., "Objective MCQ, 3 Sections").
  8. Rank Analysis: Provide a concise summary of AIR (All India Rank), State Rank, or Global Percentile trends from the last 3 years (e.g., "To reach Top 100 AIR, a score of 280+ was needed in 2023").
  9. A breakdown of 5-7 core units/modules as they appear in the latest official syllabus.
  10. 3-4 specific topics per unit.
  11. A concise, high-impact "Mastery Study Plan" (3-4 sentences) for this specific exam.
  12. Interview Eligibility: Determine if this exam has a personality test, interview, or document verification stage.

  IMPORTANT:
  - Translate everything accurately into ${prefs.language}.
  - Ensure the syllabus is tailored to the specific combination of ${prefs.examType}, ${prefs.className}, and ${prefs.language}.
  - Use ONLY valid JSON.`;

  if (config.provider === 'google') {
    const ai = new GoogleGenAI({ apiKey: config.apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: config.model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            examInfo: { type: Type.STRING },
            studyPlan: { type: Type.STRING },
            totalQuestions: { type: Type.STRING },
            totalMarks: { type: Type.STRING },
            negativeMarking: { type: Type.STRING },
            cutoff: { type: Type.STRING },
            examPattern: { type: Type.STRING },
            rankAnalysis: { type: Type.STRING },
            hasInterview: { type: Type.BOOLEAN },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  icon: { type: Type.STRING },
                  description: { type: Type.STRING },
                  topics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        section: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            }
          },
          required: ['title', 'examInfo', 'sections', 'totalMarks', 'negativeMarking', 'rankAnalysis', 'totalQuestions', 'cutoff', 'examPattern']
        }
      }
    });

    const data = extractJSON(response.text || '{}');
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(chunk => ({ title: chunk.web?.title || 'Source', uri: chunk.web?.uri || '' }))
      .filter(s => s.uri);
    
    return { ...data, sources };
  } else {
    let client;
    if (config.provider === 'openai') {
      client = new OpenAI({ 
        apiKey: config.apiKey, 
        baseURL: config.baseURL,
        dangerouslyAllowBrowser: true 
      });
    } else if (config.provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey: config.apiKey, dangerouslyAllowBrowser: true });
      const response = await anthropic.messages.create({
        model: config.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt + "\nReturn ONLY JSON." }]
      });
      const text = (response.content[0] as any).text;
      return extractJSON(text || '{}');
    } else if (config.provider === 'deepseek') {
      client = new OpenAI({ 
        apiKey: config.apiKey, 
        baseURL: 'https://api.deepseek.com',
        dangerouslyAllowBrowser: true 
      });
    } else if (config.provider === 'mistral') {
      client = new OpenAI({ 
        apiKey: config.apiKey, 
        baseURL: 'https://api.mistral.ai/v1',
        dangerouslyAllowBrowser: true 
      });
    } else if (config.provider === 'meta') {
      client = new OpenAI({ 
        apiKey: config.apiKey, 
        baseURL: config.baseURL,
        dangerouslyAllowBrowser: true 
      });
    }

    if (client) {
      const response = await client.chat.completions.create({
        model: config.model,
        messages: [{ role: 'user', content: prompt + "\nReturn ONLY JSON." }],
        response_format: { type: 'json_object' }
      });
      return extractJSON(response.choices[0].message.content || '{}');
    }
  }

  throw new Error("Unsupported provider or configuration issue");
}

export async function generateQuestions(
  topic: Topic, 
  prefs: UserPreferences, 
  count: number = 5
): Promise<Question[]> {
  const config = prefs.aiConfig;
  if (!config) throw new Error("AI Configuration missing");

  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;
  const subjectContext = prefs.subject ? `for ${prefs.subject}` : "";
  const prompt = `SEARCH GROUNDING REQUIRED: You are an elite question designer for ${prefs.examType}.
  Research the ACTUAL level and type of questions asked in recent (${prevYear}-${currentYear}) papers for:
  - Exam: ${prefs.examType}
  - Class: ${prefs.className}
  - Chapter/Topic: "${topic.name}" ${subjectContext}
  - Language: ${prefs.language}

  Generate ${count} original, high-difficulty questions matching the target exam's standard.

  STRICT CONTENT RULES:
  1. CONCEPTUAL FOCUS: Prioritize logic, calculations, and multi-step reasoning.
  2. LANGUAGE: All text and explanations MUST be in ${prefs.language}.
  3. IMAGE NEED: For each question, indicate if an illustration would be helpful (needsImage: true/false).

  Format as JSON array of questions.`;

  let questions: (Question & { needsImage: boolean })[] = [];

  if (config.provider === 'google') {
    const ai = new GoogleGenAI({ apiKey: config.apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: config.model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              needsImage: { type: Type.BOOLEAN }
            },
            required: ['id', 'text', 'options', 'correctAnswer', 'explanation', 'difficulty', 'needsImage']
          }
        }
      }
    });
    questions = extractJSON(response.text || '[]');
  } else {
    let client;
    if (config.provider === 'openai') {
      client = new OpenAI({ 
        apiKey: config.apiKey, 
        baseURL: config.baseURL,
        dangerouslyAllowBrowser: true 
      });
    } else if (config.provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey: config.apiKey, dangerouslyAllowBrowser: true });
      const response = await anthropic.messages.create({
        model: config.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt + "\nReturn ONLY JSON array." }]
      });
      const text = (response.content[0] as any).text;
      const result = extractJSON(text || '{}');
      questions = Array.isArray(result) ? result : (result.questions || []);
    } else if (config.provider === 'deepseek') {
      client = new OpenAI({ 
        apiKey: config.apiKey, 
        baseURL: 'https://api.deepseek.com',
        dangerouslyAllowBrowser: true 
      });
    } else if (config.provider === 'mistral') {
      client = new OpenAI({ 
        apiKey: config.apiKey, 
        baseURL: 'https://api.mistral.ai/v1',
        dangerouslyAllowBrowser: true 
      });
    } else if (config.provider === 'meta') {
      client = new OpenAI({ 
        apiKey: config.apiKey, 
        baseURL: config.baseURL,
        dangerouslyAllowBrowser: true 
      });
    }

    if (client) {
      const response = await client.chat.completions.create({
        model: config.model,
        messages: [{ role: 'user', content: prompt + "\nReturn ONLY JSON array." }],
        response_format: { type: 'json_object' }
      });
      const result = extractJSON(response.choices[0].message.content || '{}');
      questions = Array.isArray(result) ? result : (result.questions || []);
    }
  }

  // Generate images for questions that need them (using Gemini for images as it's free/ready)
  const questionsWithImages = await Promise.all(questions.map(async (q) => {
    if (q.needsImage) {
      const imageUrl = await generateImageForQuestion(q.text, prefs);
      return { ...q, imageUrl };
    }
    return q;
  }));

  return questionsWithImages;
}

async function generateImageForQuestion(text: string, prefs: UserPreferences): Promise<string | undefined> {
  const config = prefs.aiConfig;
  const ai = new GoogleGenAI({ apiKey: config?.apiKey || process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          {
            text: `Generate a clear, educational illustration for the following question in ${prefs.language}: "${text}". 
            The illustration should be simple, clean, and helpful for a student in ${prefs.className}. 
            Avoid text in the image. Focus on diagrams, shapes, or objects mentioned in the question.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "512px"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image generation failed:", error);
  }
  return undefined;
}
