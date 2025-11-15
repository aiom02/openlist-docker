export interface AudioFavoriteFolder {
  id: number
  user_id: number
  name: string
  description: string
  order: number
  created_at: string
  updated_at: string
}

export interface AudioFavorite {
  id: number
  user_id: number
  folder_id: number
  storage_id: number
  original_path: string
  file_name: string
  note: string
  fingerprint: string
  created_at: string
}

export interface AudioWithMarks {
  folder_id: number
  folder_name: string
  audio_id: number
  file_name: string
  original_path: string
  storage_id: number
  marks: Array<{
    id: number
    time_second: number
    title: string
    content: string
  }>
}

