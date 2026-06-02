/**
 * Adzuna search configurations.
 *
 * Adzuna is query-based (not company-board based), so we define a list of
 * focused searches to pull relevant engineering/product opportunities.
 */
export interface AdzunaSearchConfig {
  label: string;
  what: string;
  where?: string;
  category?: string;
  resultsPerPage?: number;
  maxPages?: number;
}

export const adzunaSearches: AdzunaSearchConfig[] = [
  // Core Software Engineering
  { label: "Software Engineer India", what: "software engineer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 3 },
  { label: "Software Developer India", what: "software developer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 3 },
  { label: "SDE India", what: "SDE", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },

  // Frontend
  { label: "Frontend Engineer India", what: "frontend engineer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "React Developer India", what: "React developer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "Angular Developer India", what: "Angular developer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "Vue Developer India", what: "Vue developer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "UI Developer India", what: "UI developer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },

  // Backend
  { label: "Backend Engineer India", what: "backend engineer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "Node.js Developer India", what: "Node.js developer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "Java Developer India", what: "Java developer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "Python Developer India", what: "Python developer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },

  // Full Stack
  { label: "Full Stack Developer India", what: "full stack developer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 3 },
  { label: "Full Stack Engineer India", what: "full stack engineer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },

  // Mobile
  { label: "Android Developer India", what: "android developer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "iOS Developer India", what: "ios developer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "React Native Developer India", what: "react native developer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "Flutter Developer India", what: "flutter developer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },

  // Data & AI
  { label: "Data Engineer India", what: "data engineer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "Data Scientist India", what: "data scientist", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "Machine Learning Engineer India", what: "machine learning engineer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "AI Engineer India", what: "AI engineer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "Data Analyst India", what: "data analyst", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },

  // DevOps / Cloud / SRE
  { label: "DevOps Engineer India", what: "devops engineer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "Cloud Engineer India", what: "cloud engineer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "SRE India", what: "site reliability engineer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "Platform Engineer India", what: "platform engineer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },

  // QA / Testing
  { label: "QA Engineer India", what: "QA engineer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "Automation Engineer India", what: "automation engineer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "SDET India", what: "SDET", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },

  // Product & Design
  { label: "Product Manager India", what: "product manager", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "UX Designer India", what: "UX designer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "Product Designer India", what: "product designer", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },

  // Architecture & Leadership
  { label: "Engineering Manager India", what: "engineering manager", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "Tech Lead India", what: "tech lead", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },

  // Internships
  { label: "Software Engineer Intern India", what: "software engineer intern", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
  { label: "Developer Intern India", what: "developer intern", where: "india", category: "it-jobs", resultsPerPage: 50, maxPages: 2 },
];
