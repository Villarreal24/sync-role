import type { Locale } from '@/shared/copy/locale'
import { useLocale } from '@/shared/copy/locale'
import { COMMON_COPY_EN, COMMON_COPY_ES, type CommonCopy } from '@/shared/copy/common'
import type { JobStatus } from './types'

export interface JobsCopy {
  statusLabels: Record<JobStatus, string>
  common: { search: string; noJobs: string }
  searchPlaceholder: string
  board: { errorTitle: string; errorDescription: string }
  list: {
    vacancyCompany: string
    status: string
    modality: string
    salary: string
    publishDate: string
    postulationDate: string
    actions: string
  }
  card: {
    recruiterPrefix: string
    showDescription: string
    hideDescription: string
    openSource: string
    openSourceTooltip: string
    deleteJob: string
    seeMore: string
    showLess: string
  }
  actions: {
    viewSource: string
    changeStatus: string
    delete: string
    openMenu: string
  }
  sheet: {
    details: string
    publishedAt: string
    appliedAt: string
    technologies: string
    description: string
    notes: string
    addNote: string
    addNotePlaceholder: string
    noteTitlePlaceholder: string
    noNotes: string
    sourceLink: string
    close: string
    recruiter: string
    location: string
    salary: string
    status: string
    noteSaveError: string
    saveNote: string
    cancelEdit: string
    editNotePlaceholder: string
  }
}

function makeJobsCopy(common: CommonCopy): JobsCopy {
  return {
    statusLabels: {
      saved: 'Saved',
      applied: 'Applied',
      interviewing: 'Interviewing',
      rejected: 'Rejected',
      offer: 'Offer',
    },
    common: { search: common.search, noJobs: 'No jobs yet' },
    searchPlaceholder: 'Search by title or company...',
    board: {
      errorTitle: 'Failed to load jobs',
      errorDescription: 'Make sure the backend server is running.',
    },
    list: {
      vacancyCompany: 'Vacancy / Company',
      status: 'Status',
      modality: 'Modality',
      salary: 'Salary',
      publishDate: 'Publish date',
      postulationDate: 'Postulation date',
      actions: 'Actions',
    },
    card: {
      recruiterPrefix: 'Recruiter:',
      showDescription: 'Show description',
      hideDescription: 'Hide description',
      openSource: 'Open source',
      openSourceTooltip: 'View posting',
      deleteJob: 'Delete job',
      seeMore: 'See more...',
      showLess: 'Show less',
    },
    actions: {
      viewSource: 'View source',
      changeStatus: 'Change status',
      delete: 'Delete',
      openMenu: 'Open menu',
    },
    sheet: {
      details: 'Details',
      publishedAt: 'Published',
      appliedAt: 'Applied',
      technologies: 'Technologies',
      description: 'Description',
      notes: 'Notes',
      addNote: 'Add',
      addNotePlaceholder: 'Write a note...',
      noteTitlePlaceholder: 'Note title (optional)',
      noNotes: 'No notes yet',
      sourceLink: 'Open source',
      close: 'Close',
      recruiter: 'Recruiter',
      location: 'Location',
      salary: 'Salary',
      status: 'Status',
      noteSaveError: 'Failed to save note. Check your connection and try again.',
      saveNote: 'Save',
      cancelEdit: 'Cancel',
      editNotePlaceholder: 'Edit note...',
    },
  }
}

function makeJobsCopyEs(common: CommonCopy): JobsCopy {
  return {
    statusLabels: {
      saved: 'Guardada',
      applied: 'Postulada',
      interviewing: 'Entrevista',
      rejected: 'Rechazada',
      offer: 'Oferta',
    },
    common: { search: common.search, noJobs: 'No hay postulaciones aún' },
    searchPlaceholder: 'Buscar por título o empresa...',
    board: {
      errorTitle: 'Error al cargar las postulaciones',
      errorDescription: 'Asegúrate de que el servidor backend esté corriendo.',
    },
    list: {
      vacancyCompany: 'Puesto / Empresa',
      status: 'Estado',
      modality: 'Modalidad',
      salary: 'Salario',
      publishDate: 'Fecha de publicación',
      postulationDate: 'Fecha de postulación',
      actions: 'Acciones',
    },
    card: {
      recruiterPrefix: 'Reclutador:',
      showDescription: 'Mostrar descripción',
      hideDescription: 'Ocultar descripción',
      openSource: 'Abrir fuente',
      openSourceTooltip: 'Ver publicación',
      deleteJob: 'Eliminar postulación',
      seeMore: 'Ver más...',
      showLess: 'Ver menos',
    },
    actions: {
      viewSource: 'Ver fuente',
      changeStatus: 'Cambiar estado',
      delete: 'Eliminar',
      openMenu: 'Abrir menú',
    },
    sheet: {
      details: 'Detalles',
      publishedAt: 'Publicado',
      appliedAt: 'Postulado',
      technologies: 'Tecnologías',
      description: 'Descripción',
      notes: 'Notas',
      addNote: 'Agregar',
      addNotePlaceholder: 'Escribe una nota...',
      noteTitlePlaceholder: 'Título de la nota (opcional)',
      noNotes: 'Sin notas aún',
      sourceLink: 'Abrir fuente',
      close: 'Cerrar',
      recruiter: 'Reclutador',
      location: 'Ubicación',
      salary: 'Salario',
      status: 'Estado',
      noteSaveError: 'No se pudo guardar la nota. Revisa tu conexión e intentalo de nuevo.',
      saveNote: 'Guardar',
      cancelEdit: 'Cancelar',
      editNotePlaceholder: 'Editar nota...',
    },
  }
}

const TABLE: Record<Locale, JobsCopy> = {
  en: makeJobsCopy(COMMON_COPY_EN),
  es: makeJobsCopyEs(COMMON_COPY_ES),
}

export function useJobsCopy(): JobsCopy {
  const { locale } = useLocale()
  return TABLE[locale]
}
