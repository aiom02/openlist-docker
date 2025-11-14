export interface MediaMark {
  id: number
  time_second: number
  title: string
  content: string
}

export interface CreateMediaMarkRequest {
  time_second: number
  title: string
  content: string
}

export interface UpdateMediaMarkRequest {
  id: number
  time_second: number
  title: string
  content: string
}

export interface DeleteMediaMarkRequest {
  id: number
}
