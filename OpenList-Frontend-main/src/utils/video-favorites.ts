import { r } from "./request"
import type { VideoFavoriteFolder, VideoFavorite, VideoWithMarks } from "~/types/video-favorite"

// Helper function to check response
const checkResp = (resp: any) => {
  if (resp.code !== 200) {
    throw new Error(resp.message || "Request failed")
  }
}

// Folder operations
export const listVideoFavoriteFolders = async (): Promise<VideoFavoriteFolder[]> => {
  const resp = await r.get("/video_favorites/folder/list")
  checkResp(resp)
  return resp.data || []
}

export const getVideoFavoriteFolder = async (id: number): Promise<VideoFavoriteFolder> => {
  const resp = await r.get("/video_favorites/folder/get", { params: { id } })
  checkResp(resp)
  return resp.data
}

export const createVideoFavoriteFolder = async (data: {
  name: string
  description?: string
  order?: number
}): Promise<VideoFavoriteFolder> => {
  const resp = await r.post("/video_favorites/folder/create", data)
  checkResp(resp)
  return resp.data
}

export const updateVideoFavoriteFolder = async (data: {
  id: number
  name?: string
  description?: string
  order?: number
}): Promise<VideoFavoriteFolder> => {
  const resp = await r.post("/video_favorites/folder/update", data)
  checkResp(resp)
  return resp.data
}

export const deleteVideoFavoriteFolder = async (id: number): Promise<void> => {
  const resp = await r.post("/video_favorites/folder/delete", {}, { params: { id } })
  checkResp(resp)
}

// Video operations
export const listVideoFavorites = async (folderId?: number): Promise<VideoFavorite[]> => {
  const resp = await r.get("/video_favorites/list", { 
    params: folderId ? { id: folderId } : {} 
  })
  checkResp(resp)
  return resp.data || []
}

export const createVideoFavorite = async (data: {
  folder_id: number
  storage_id: number
  original_path: string
  file_name: string
  note?: string
  fingerprint?: string
}): Promise<VideoFavorite> => {
  const resp = await r.post("/video_favorites/create", data)
  checkResp(resp)
  return resp.data
}

export const updateVideoFavorite = async (data: {
  id: number
  note: string
}): Promise<VideoFavorite> => {
  const resp = await r.post("/video_favorites/update", data)
  checkResp(resp)
  return resp.data
}

export const deleteVideoFavorite = async (id: number): Promise<void> => {
  const resp = await r.post("/video_favorites/delete", {}, { params: { id } })
  checkResp(resp)
}

// Get all video marks
export const listAllVideoMarks = async (): Promise<VideoWithMarks[]> => {
  const resp = await r.get("/video_favorites/all_marks")
  checkResp(resp)
  return resp.data || []
}

