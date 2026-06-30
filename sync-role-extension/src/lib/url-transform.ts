interface SiteTransformer {
  hostname: RegExp
  test: (url: URL) => boolean
  transform: (url: URL) => string | null
}

const TRANSFORMERS: SiteTransformer[] = [
  {
    hostname: /(^|\.)indeed\.com$/i,
    test: (url) => url.searchParams.has("vjk") && !url.pathname.startsWith("/viewjob"),
    transform: (url) => {
      const jk = url.searchParams.get("vjk")
      return jk ? `${url.origin}/viewjob?jk=${jk}` : null
    },
  },
  {
    hostname: /(^|\.)linkedin\.com$/i,
    test: (url) => url.searchParams.has("currentJobId") && !url.pathname.startsWith("/jobs/view/"),
    transform: (url) => {
      const id = url.searchParams.get("currentJobId")
      return id ? `https://www.linkedin.com/jobs/view/${id}/` : null
    },
  },
  {
    hostname: /(^|\.)occ\.com\.mx$/i,
    test: (url) => url.pathname.startsWith("/empleos/") && url.searchParams.has("jobid"),
    transform: (url) => {
      const id = url.searchParams.get("jobid")
      return id ? `${url.origin}/empleo/${id}` : null
    },
  },
]

export function transformJobUrl(raw: string): string {
  try {
    const url = new URL(raw)
    for (const t of TRANSFORMERS) {
      if (t.hostname.test(url.hostname) && t.test(url)) {
        const transformed = t.transform(url)
        if (transformed) return transformed
      }
    }
  } catch {
    // invalid URL, return raw
  }
  return raw
}
