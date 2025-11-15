export interface ImageFavoriteFolder {
  id: number
  user_id: number
  name: string
  description: string
  order: number
  created_at: string
  updated_at: string
}

export interface ImageFavorite {
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

