import api from './client'

export interface UploadResult {
  url: string
  fileName: string
  mediaType: string
  fileSize: number
}

export const uploadsApi = {
  upload: (file: File): Promise<UploadResult> => {
    const form = new FormData()
    form.append('file', file)
    return api.post<UploadResult>('/uploads', form).then(r => r.data)
  },
}
