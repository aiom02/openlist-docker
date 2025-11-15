import { r } from "./request"
import type { AudioFavoriteFolder, AudioFavorite, AudioWithMarks } from "~/types/audio-favorite"

// Helper function to check response
const checkResp = (resp: any) => {
  if (resp.code !== 200) {
    throw new Error(resp.message || "Request failed")
  }
}

// Folder operations
export const listAudioFavoriteFolders = async (): Promise<AudioFavoriteFolder[]> => {
  const resp = await r.get("/audio_favorites/folder/list")
  checkResp(resp)
  return resp.data || []
}

export const getAudioFavoriteFolder = async (id: number): Promise<AudioFavoriteFolder> => {
  const resp = await r.get("/audio_favorites/folder/get", { params: { id } })
  checkResp(resp)
  return resp.data
}

export const createAudioFavoriteFolder = async (data: {
  name: string
  description?: string
  order?: number
}): Promise<AudioFavoriteFolder> => {
  const resp = await r.post("/audio_favorites/folder/create", data)
  checkResp(resp)
  return resp.data
}

export const updateAudioFavoriteFolder = async (data: {
  id: number
  name?: string
  description?: string
  order?: number
}): Promise<AudioFavoriteFolder> => {
  const resp = await r.post("/audio_favorites/folder/update", data)
  checkResp(resp)
  return resp.data
}

export const deleteAudioFavoriteFolder = async (id: number): Promise<void> => {
  const resp = await r.post("/audio_favorites/folder/delete", {}, { params: { id } })
  checkResp(resp)
}

// Audio operations
export const listAudioFavorites = async (folderId?: number): Promise<AudioFavorite[]> => {
  const resp = await r.get("/audio_favorites/list", { 
    params: folderId ? { id: folderId } : {} 
  })
  checkResp(resp)
  return resp.data || []
}

export const createAudioFavorite = async (data: {
  folder_id: number
  storage_id: number
  original_path: string
  file_name: string
  note?: string
  fingerprint?: string
}): Promise<AudioFavorite> => {
  const resp = await r.post("/audio_favorites/create", data)
  checkResp(resp)
  return resp.data
}

export const updateAudioFavorite = async (data: {
  id: number
  note: string
}): Promise<AudioFavorite> => {
  const resp = await r.post("/audio_favorites/update", data)
  checkResp(resp)
  return resp.data
}

export const deleteAudioFavorite = async (id: number): Promise<void> => {
  const resp = await r.post("/audio_favorites/delete", {}, { params: { id } })
  checkResp(resp)
}

// Get all audio marks
export const listAllAudioMarks = async (): Promise<AudioWithMarks[]> => {
  const resp = await r.get("/audio_favorites/all_marks")
  checkResp(resp)
  return resp.data || []
}

