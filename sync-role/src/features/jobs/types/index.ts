export type JobStatus = 'saved' | 'applied' | 'interviewing' | 'rejected' | 'offer'

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
}

export interface JobPosting {
  id: string
  title: string
  company: string
  sourceUrl: string
  status: JobStatus
  createdAt: string
  location: string
  salary: string
  description: string
  recruiterName: string
  publishedAt: string
  employmentType: string
  workMode: string
  seniority: string
  technologies: string[]
  ownershipNote: Note[]
  deletedAt: string | null
}
