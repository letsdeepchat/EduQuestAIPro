
export enum ExamCategory {
  OLYMPIAD = "Olympiad",
  ENTRANCE = "Entrance Exam",
  COMPETITIVE = "Competitive Exam"
}

export interface ExamType {
  id: string;
  name: string;
  category: ExamCategory;
  subjects?: string[];
}

export type AIProvider = 'google' | 'openai' | 'anthropic' | 'meta' | 'mistral' | 'deepseek';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;
  baseURL?: string;
}

export interface UserPreferences {
  language: string;
  className: string;
  examType: string;
  subject?: string;
  aiConfig?: AIConfig;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  section: string;
}

export interface SyllabusData {
  title: string;
  examInfo: string;
  studyPlan?: string;
  totalMarks?: string;
  totalQuestions?: string;
  negativeMarking?: string;
  cutoff?: string;
  examPattern?: string;
  rankAnalysis?: string;
  hasInterview?: boolean;
  sections: {
    name: string;
    icon: string;
    description: string;
    topics: Topic[];
  }[];
  sources?: { title: string; uri: string }[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: string;
  imageUrl?: string;
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  score: number;
  userAnswers: (number | null)[];
  isComplete: boolean;
  startTime: number;
}

export interface ReviewData {
  questions: Question[];
  userAnswers: (number | null)[];
  score: number;
  total: number;
}
