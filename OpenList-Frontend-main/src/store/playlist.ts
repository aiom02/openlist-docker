import { createSignal } from "solid-js"
import { createStore } from "solid-js/store"

// 本地存储键名
const PLAYLIST_STORAGE_KEY = "openlist_audio_playlist"
const PLAYLIST_STATE_STORAGE_KEY = "openlist_audio_playlist_state"

// 从本地存储加载播放列表
function loadPlaylistFromStorage(): PlaylistItem[] {
  try {
    const stored = localStorage.getItem(PLAYLIST_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Failed to load playlist from storage:", error)
    return []
  }
}

// 从本地存储加载播放状态
function loadPlaylistStateFromStorage() {
  try {
    const stored = localStorage.getItem(PLAYLIST_STATE_STORAGE_KEY)
    if (stored) {
      const state = JSON.parse(stored)
      return {
        currentIndex: state.currentIndex || -1,
        playMode: state.playMode || "list",
      }
    }
  } catch (error) {
    console.error("Failed to load playlist state from storage:", error)
  }
  return {
    currentIndex: -1,
    playMode: "list" as PlayMode,
  }
}

// 保存播放列表到本地存储
function savePlaylistToStorage(items: PlaylistItem[]) {
  try {
    localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(items))
  } catch (error) {
    console.error("Failed to save playlist to storage:", error)
  }
}

// 保存播放状态到本地存储
function savePlaylistStateToStorage(currentIndex: number, playMode: PlayMode) {
  try {
    localStorage.setItem(PLAYLIST_STATE_STORAGE_KEY, JSON.stringify({
      currentIndex,
      playMode,
    }))
  } catch (error) {
    console.error("Failed to save playlist state to storage:", error)
  }
}

export interface PlaylistItem {
  id: string // unique identifier
  name: string
  artist: string
  url: string
  cover: string
  lrc?: string
  path: string // original path for reference
  storage_id?: number // storage id for favorites
  size?: number // file size for fingerprint generation
}

export type PlayMode = "list" | "random" | "single"

interface PlaylistState {
  items: PlaylistItem[]
  currentIndex: number
  isPlaying: boolean
  playMode: PlayMode
  sleepTimer: number | null // timestamp when to stop
  sleepDuration: number // duration in minutes
}

// 从本地存储初始化状态
const savedItems = loadPlaylistFromStorage()
const savedState = loadPlaylistStateFromStorage()

const [playlistState, setPlaylistState] = createStore<PlaylistState>({
  items: savedItems,
  currentIndex: savedState.currentIndex,
  isPlaying: false,
  playMode: savedState.playMode,
  sleepTimer: null,
  sleepDuration: 0,
})

// Signal for player visibility
const [isPlayerVisible, setIsPlayerVisible] = createSignal(false)

// Add item to playlist (prepend - newer items go first)
export function addToPlaylist(item: PlaylistItem) {
  const exists = playlistState.items.some((i) => i.id === item.id)
  if (!exists) {
    setPlaylistState("items", [item, ...playlistState.items])
    // If this is the first item, set it as current
    if (playlistState.items.length === 1) {
      setPlaylistState("currentIndex", 0)
    }
    // 保存到本地存储
    savePlaylistToStorage(playlistState.items)
    savePlaylistStateToStorage(playlistState.currentIndex, playlistState.playMode)
  }
}

// Remove multiple items from playlist
export function removeMultipleFromPlaylist(ids: string[]) {
  if (ids.length === 0) return
  
  const currentItem = playlistState.items[playlistState.currentIndex]
  const newItems = playlistState.items.filter((item) => !ids.includes(item.id))
  
  setPlaylistState("items", newItems)
  
  // 调整当前播放索引
  if (currentItem && newItems.length > 0) {
    const newIndex = newItems.findIndex((item) => item.id === currentItem.id)
    if (newIndex !== -1) {
      setPlaylistState("currentIndex", newIndex)
    } else {
      // 当前播放的歌曲被删除了
      setPlaylistState("currentIndex", Math.min(playlistState.currentIndex, newItems.length - 1))
      setPlaylistState("isPlaying", false)
    }
  } else {
    setPlaylistState("currentIndex", -1)
    setPlaylistState("isPlaying", false)
  }
  
  // 保存到本地存储
  savePlaylistToStorage(newItems)
  savePlaylistStateToStorage(playlistState.currentIndex, playlistState.playMode)
}

// Remove item from playlist
export function removeFromPlaylist(id: string) {
  const index = playlistState.items.findIndex((i) => i.id === id)
  if (index !== -1) {
    setPlaylistState("items", (items) => items.filter((i) => i.id !== id))
    // Adjust current index if needed
    if (index < playlistState.currentIndex) {
      setPlaylistState("currentIndex", playlistState.currentIndex - 1)
    } else if (index === playlistState.currentIndex) {
      // If removing current item, stop playing
      setPlaylistState("isPlaying", false)
      if (playlistState.items.length > 0) {
        setPlaylistState("currentIndex", Math.min(index, playlistState.items.length - 1))
      } else {
        setPlaylistState("currentIndex", -1)
      }
    }
    // 保存到本地存储
    savePlaylistToStorage(playlistState.items)
    savePlaylistStateToStorage(playlistState.currentIndex, playlistState.playMode)
  }
}

// Reorder playlist item
export function reorderPlaylistItem(fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return
  
  const items = [...playlistState.items]
  const [removed] = items.splice(fromIndex, 1)
  items.splice(toIndex, 0, removed)
  
  // Update current index
  let newCurrentIndex = playlistState.currentIndex
  if (fromIndex === playlistState.currentIndex) {
    newCurrentIndex = toIndex
  } else if (fromIndex < playlistState.currentIndex && toIndex >= playlistState.currentIndex) {
    newCurrentIndex--
  } else if (fromIndex > playlistState.currentIndex && toIndex <= playlistState.currentIndex) {
    newCurrentIndex++
  }
  
  setPlaylistState("items", items)
  setPlaylistState("currentIndex", newCurrentIndex)
  
  // 保存到本地存储
  savePlaylistToStorage(items)
  savePlaylistStateToStorage(newCurrentIndex, playlistState.playMode)
}

// Clear playlist
export function clearPlaylist() {
  setPlaylistState("items", [])
  setPlaylistState("currentIndex", -1)
  setPlaylistState("isPlaying", false)
  // 保存到本地存储
  savePlaylistToStorage([])
  savePlaylistStateToStorage(-1, playlistState.playMode)
}

// Play specific item
export function playItem(index: number) {
  if (index >= 0 && index < playlistState.items.length) {
    setPlaylistState("currentIndex", index)
    setPlaylistState("isPlaying", true)
    // 保存到本地存储
    savePlaylistStateToStorage(index, playlistState.playMode)
  }
}

// Get next item index based on play mode
export function getNextIndex(): number {
  if (playlistState.items.length === 0) return -1
  
  switch (playlistState.playMode) {
    case "single":
      return playlistState.currentIndex
    case "random":
      return Math.floor(Math.random() * playlistState.items.length)
    case "list":
    default:
      return (playlistState.currentIndex + 1) % playlistState.items.length
  }
}

// Get previous item index
export function getPreviousIndex(): number {
  if (playlistState.items.length === 0) return -1
  
  switch (playlistState.playMode) {
    case "single":
      return playlistState.currentIndex
    case "random":
      return Math.floor(Math.random() * playlistState.items.length)
    case "list":
    default:
      return playlistState.currentIndex === 0
        ? playlistState.items.length - 1
        : playlistState.currentIndex - 1
  }
}

// Play next
export function playNext() {
  const nextIndex = getNextIndex()
  if (nextIndex !== -1) {
    playItem(nextIndex)
  }
}

// Play previous
export function playPrevious() {
  const prevIndex = getPreviousIndex()
  if (prevIndex !== -1) {
    playItem(prevIndex)
  }
}

// Toggle play/pause
export function togglePlay() {
  setPlaylistState("isPlaying", !playlistState.isPlaying)
}

// Set play mode
export function setPlayMode(mode: PlayMode) {
  setPlaylistState("playMode", mode)
  // 保存到本地存储
  savePlaylistStateToStorage(playlistState.currentIndex, mode)
}

// Set sleep timer (duration in minutes)
export function setSleepTimer(minutes: number) {
  if (minutes > 0) {
    setPlaylistState("sleepTimer", Date.now() + minutes * 60 * 1000)
    setPlaylistState("sleepDuration", minutes)
  } else {
    setPlaylistState("sleepTimer", null)
    setPlaylistState("sleepDuration", 0)
  }
}

// Cancel sleep timer
export function cancelSleepTimer() {
  setPlaylistState("sleepTimer", null)
  setPlaylistState("sleepDuration", 0)
}

// Check if sleep timer expired
export function checkSleepTimer(): boolean {
  if (playlistState.sleepTimer && Date.now() >= playlistState.sleepTimer) {
    setPlaylistState("isPlaying", false)
    cancelSleepTimer()
    return true
  }
  return false
}

export {
  playlistState,
  setPlaylistState,
  isPlayerVisible,
  setIsPlayerVisible,
}
