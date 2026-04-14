export type ProjectLevel = "Beginner" | "Intermediate" | "Industry Ready";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type ScanOptions = {
  aiDetection: boolean;
  vivaQuestions: boolean;
  interviewQuestions: boolean;
  securityAudit: boolean;
  codeQuality: boolean;
};

export type QuestionItem = {
  question: string;
  keywords: string[];
  expectedAnswer: string;
  difficulty: Difficulty;
  sourceFile: string;
};

export type SecurityIssue = {
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  detail: string;
  file?: string;
};

export type AnalysisResult = {
  meta: {
    aiProbability: number;
    templateSimilarity: number;
    codeQuality: number;
    projectLevel: ProjectLevel;
    techStack: string[];
    totalFiles: number;
    locEstimate: number;
    complexityScore: number;
  };
  originality: {
    aiLikelihood: number;
    suspiciousFiles: { path: string; reason: string; score: number }[];
    similarityHeatmap: { file: string; score: number }[];
  };
  quality: {
    folderStructure: number;
    namingConsistency: number;
    reusability: number;
    performance: number;
  };
  viva: QuestionItem[];
  interview: QuestionItem[];
  security: SecurityIssue[];
  architecture: {
    patterns: string[];
    componentHierarchy: string;
    stateManagement: string;
    summary: string;
  };
  resume: string;
  weaknesses: string[];
  suggestions: string[];
};

export const defaultScanOptions: ScanOptions = {
  aiDetection: true,
  vivaQuestions: true,
  interviewQuestions: true,
  securityAudit: true,
  codeQuality: true,
};
