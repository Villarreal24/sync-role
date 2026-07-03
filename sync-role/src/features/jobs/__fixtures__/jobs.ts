import type { JobPosting, JobStatus } from '../types'

export function makeJob(overrides: Partial<JobPosting> = {}): JobPosting {
  return {
    id: 'job-1',
    title: 'AI Engineer',
    company: 'Acme Inc',
    sourceUrl: 'https://example.com/jobs/1',
    status: 'saved',
    createdAt: '2026-05-01T00:00:00Z',
    location: 'Remote',
    salary: '$5,000 - $8,000 per month',
    description: 'An exciting role working on LLM infrastructure.',
    recruiterName: 'Jane Recruiter',
    publishedAt: '2026-05-15',
    employmentType: 'Full-time',
    workMode: 'Remote',
    seniority: 'Mid',
    technologies: ['Python', 'PyTorch', 'Docker'],
    ...overrides,
  }
}

export function makeJobList(): JobPosting[] {
  return [
    makeJob({
      id: 'j-1',
      title: 'Software Engineer',
      company: 'casacode',
      status: 'saved',
      workMode: 'On-site',
      employmentType: undefined,
      seniority: undefined,
      technologies: [],
      location: 'Guadalajara',
      salary: '$27,000 MXN/monthly',
      createdAt: '2026-05-01T10:00:00Z',
      publishedAt: '2026-05-01',
    }),
    makeJob({
      id: 'j-2',
      title: 'AI Engineer (LLMs, RAG)',
      company: 'Veloz IT',
      status: 'applied',
      workMode: 'Remote',
      employmentType: 'Full-time',
      seniority: 'Mid',
      createdAt: '2026-05-05T10:00:00Z',
      publishedAt: '2026-05-04',
    }),
    makeJob({
      id: 'j-3',
      title: 'Full Stack Software Engineer',
      company: 'ULTRASIST S.A. DE C.V.',
      status: 'applied',
      workMode: 'Remote',
      seniority: 'Mid',
      createdAt: '2026-05-10T10:00:00Z',
      publishedAt: '2026-05-08',
    }),
    makeJob({
      id: 'j-4',
      title: 'Sr Software Engineer',
      company: 'Coforge',
      status: 'applied',
      workMode: 'On-site',
      seniority: 'Senior',
      salary: '$75,000 MXN/monthly',
      createdAt: '2026-05-15T10:00:00Z',
      publishedAt: '2026-05-12',
    }),
    makeJob({
      id: 'j-5',
      title: 'Backend Developer',
      company: 'TechFlow',
      status: 'interviewing',
      workMode: 'Hybrid',
      seniority: 'Mid',
      salary: '$60,000 MXN/monthly',
      createdAt: '2026-05-20T10:00:00Z',
      publishedAt: '2026-05-18',
    }),
  ]
}

export const STATUSES: JobStatus[] = ['saved', 'applied', 'interviewing', 'rejected', 'offer']
