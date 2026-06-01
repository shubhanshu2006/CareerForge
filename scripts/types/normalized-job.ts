export interface NormalizedJob {
  source: string;

  sourceJobId?: string;
  sourceUrl?: string;

  company: string;
  companyLogo?: string;

  title: string;
  location?: string;

  department?: string;

  employmentType?: string;

  description?: string;

  applyUrl: string;

  postedAt?: Date;

  isRemote: boolean;

  experienceLevel?: string;

  minSalary?: number;
  maxSalary?: number;

  dedupeKey: string;
}
