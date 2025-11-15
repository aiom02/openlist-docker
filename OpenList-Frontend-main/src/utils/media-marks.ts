import { r } from "~/utils"
import type { MediaMark, CreateMediaMarkRequest, UpdateMediaMarkRequest, DeleteMediaMarkRequest } from "~/types/media-mark"
import type { Obj } from "~/types"

// Build media fingerprint for identifying videos
export const buildMediaFingerprint = (obj: Obj): string => {
  // Simple fingerprint based on file name and size
  // Use a simple hash algorithm that works synchronously
  const str = `${obj.name}_${obj.size}`
  
  // Simple string hash function (FNV-1a)
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  
  // Convert to hex string
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export const listMediaMarks = async (path: string, password: string = ""): Promise<MediaMark[]> => {
  const resp = await r.post("/fs/other", {
    path,
    password,
    method: "media_marks_list"
  })
  return resp.data || []
}

export const createMediaMark = async (
  path: string, 
  data: CreateMediaMarkRequest,
  password: string = ""
): Promise<MediaMark> => {
  const resp = await r.post("/fs/other", {
    path,
    password,
    method: "media_marks_create",
    data
  })
  return resp.data
}

export const updateMediaMark = async (
  path: string,
  data: UpdateMediaMarkRequest, 
  password: string = ""
): Promise<MediaMark> => {
  const resp = await r.post("/fs/other", {
    path,
    password,
    method: "media_marks_update",
    data
  })
  return resp.data
}

export const deleteMediaMark = async (
  path: string,
  data: DeleteMediaMarkRequest,
  password: string = ""
): Promise<void> => {
  await r.post("/fs/other", {
    path,
    password,
    method: "media_marks_delete",
    data
  })
}
