import { r } from "./request"
import type { ImageFavoriteFolder, ImageFavorite } from "~/types/image-favorite"

// Helper function to check response
const checkResp = (resp: any) => {
  if (resp.code !== 200) {
    throw new Error(resp.message || "Request failed")
  }
}

// Folder operations
export const listImageFavoriteFolders = async (): Promise<ImageFavoriteFolder[]> => {
  const resp = await r.get("/image_favorites/folder/list")
  checkResp(resp)
  return resp.data || []
}

export const getImageFavoriteFolder = async (id: number): Promise<ImageFavoriteFolder> => {
  const resp = await r.get("/image_favorites/folder/get", { params: { id } })
  checkResp(resp)
  return resp.data
}

export const createImageFavoriteFolder = async (data: {
  name: string
  description?: string
  order?: number
}): Promise<ImageFavoriteFolder> => {
  const resp = await r.post("/image_favorites/folder/create", data)
  checkResp(resp)
  return resp.data
}

export const updateImageFavoriteFolder = async (data: {
  id: number
  name?: string
  description?: string
  order?: number
}): Promise<ImageFavoriteFolder> => {
  const resp = await r.post("/image_favorites/folder/update", data)
  checkResp(resp)
  return resp.data
}

export const deleteImageFavoriteFolder = async (id: number): Promise<void> => {
  const resp = await r.post("/image_favorites/folder/delete", {}, { params: { id } })
  checkResp(resp)
}

// Image operations
export const listImageFavorites = async (folderId?: number): Promise<ImageFavorite[]> => {
  const resp = await r.get("/image_favorites/list", { 
    params: folderId ? { id: folderId } : {} 
  })
  checkResp(resp)
  return resp.data || []
}

export const createImageFavorite = async (data: {
  folder_id: number
  storage_id: number
  original_path: string
  file_name: string
  note?: string
  fingerprint?: string
}): Promise<ImageFavorite> => {
  const resp = await r.post("/image_favorites/create", data)
  checkResp(resp)
  return resp.data
}

export const updateImageFavorite = async (data: {
  id: number
  note: string
}): Promise<ImageFavorite> => {
  const resp = await r.post("/image_favorites/update", data)
  checkResp(resp)
  return resp.data
}

export const deleteImageFavorite = async (id: number): Promise<void> => {
  const resp = await r.post("/image_favorites/delete", {}, { params: { id } })
  checkResp(resp)
}

