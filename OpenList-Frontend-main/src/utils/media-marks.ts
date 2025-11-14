import { r } from "~/utils"
import type { MediaMark, CreateMediaMarkRequest, UpdateMediaMarkRequest, DeleteMediaMarkRequest } from "~/types/media-mark"

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
