import "aplayer/dist/APlayer.min.css"
import "./GlobalAudioPlayer.css"
import APlayer from "aplayer"
import {
  Box,
  Button,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectPlaceholder,
  SelectValue,
  SelectContent,
  SelectListbox,
  SelectOption,
  SelectOptionText,
  SelectOptionIndicator,
  createDisclosure,
  useColorMode,
} from "@hope-ui/solid"
import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import {
  playlistState,
  setPlaylistState,
  playNext,
  playPrevious,
  togglePlay,
  setPlayMode,
  setSleepTimer,
  cancelSleepTimer,
  checkSleepTimer,
  removeFromPlaylist,
  removeMultipleFromPlaylist,
  clearPlaylist,
  reorderPlaylistItem,
  playItem,
  type PlayMode,
} from "~/store/playlist"
import { getMainColor, me } from "~/store"
import { notify } from "~/utils"
import {
  listAudioFavoriteFolders,
  createAudioFavoriteFolder,
  createAudioFavorite,
} from "~/utils/audio-favorites"
import { createMediaMark } from "~/utils/media-marks"
import { buildMediaFingerprint } from "~/utils/media-marks"
import type { AudioFavoriteFolder } from "~/types/audio-favorite"

export function GlobalAudioPlayer() {
  let ap: any
  let playerContainer: HTMLDivElement | undefined
  const { colorMode } = useColorMode()
  const [draggedIndex, setDraggedIndex] = createSignal<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = createSignal<number | null>(null)
  const sleepTimerModal = createDisclosure()
  const seekSettingsModal = createDisclosure()
  const addToFavoriteModal = createDisclosure()
  const createFolderModal = createDisclosure()
  const addMarkModal = createDisclosure()
  const [customMinutes, setCustomMinutes] = createSignal(30)
  const [customSeconds, setCustomSeconds] = createSignal(0)
  const [isInternalUpdate, setIsInternalUpdate] = createSignal(false)
  const [seekSeconds, setSeekSeconds] = createSignal(3)
  const [sleepTimeRemaining, setSleepTimeRemaining] = createSignal("")
  const [selectedItems, setSelectedItems] = createSignal<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = createSignal(false)
  const [backgroundPlayEnabled, setBackgroundPlayEnabled] = createSignal(
    localStorage.getItem("background-play-enabled") === "true"
  )
  
  // 收藏相关状态
  const [folders, setFolders] = createSignal<AudioFavoriteFolder[]>([])
  const [selectedFolderId, setSelectedFolderId] = createSignal<number | null>(null)
  const [favoriteNote, setFavoriteNote] = createSignal("")
  const [newFolderName, setNewFolderName] = createSignal("")
  const [newFolderDesc, setNewFolderDesc] = createSignal("")
  
  // 标记相关状态
  const [markTitle, setMarkTitle] = createSignal("")
  const [markContent, setMarkContent] = createSignal("")
  
  // 检查是否登录
  const isLoggedIn = () => {
    const user = me()
    return user && user.id
  }
  
  // 加载收藏文件夹
  const loadFolders = async () => {
    if (!isLoggedIn()) return
    try {
      const data = await listAudioFavoriteFolders()
      setFolders(data)
      if (data.length > 0 && !selectedFolderId()) {
        setSelectedFolderId(data[0].id)
      }
    } catch (error) {
      console.error("Failed to load folders:", error)
      notify.error("加载收藏文件夹失败")
    }
  }
  
  // 创建收藏文件夹
  const handleCreateFolder = async () => {
    if (!newFolderName().trim()) {
      notify.error("请输入文件夹名称")
      return
    }
    try {
      const newFolder = await createAudioFavoriteFolder({
        name: newFolderName(),
        description: newFolderDesc(),
      })
      notify.success("文件夹创建成功")
      setNewFolderName("")
      setNewFolderDesc("")
      createFolderModal.onClose()
      await loadFolders()
      if (newFolder && newFolder.id) {
        setSelectedFolderId(newFolder.id)
      }
    } catch (error) {
      console.error("Failed to create folder:", error)
      notify.error("创建文件夹失败")
    }
  }
  
  // 添加到收藏
  const handleAddToFavorite = async () => {
    if (!isLoggedIn()) {
      notify.error("请先登录")
      return
    }
    
    if (playlistState.currentIndex < 0 || playlistState.items.length === 0) {
      notify.error("请先选择要收藏的音频")
      return
    }
    
    // 打开模态框并加载文件夹
    await loadFolders()
    addToFavoriteModal.onOpen()
  }
  
  // 确认添加到收藏
  const handleConfirmAddToFavorite = async () => {
    if (!selectedFolderId()) {
      notify.error("请选择一个收藏文件夹")
      return
    }
    
    try {
      const currentItem = playlistState.items[playlistState.currentIndex]
      
      // 调试：打印当前项信息
      console.log("🔍 收藏调试信息:")
      console.log("  - 文件名:", currentItem.name)
      console.log("  - 路径:", currentItem.path)
      console.log("  - storage_id:", currentItem.storage_id)
      console.log("  - size:", currentItem.size)
      
      // 检查路径是否包含storage信息
      if (!currentItem.path.startsWith('/')) {
        notify.error("路径格式错误：缺少storage前缀。请重新添加到播放列表。")
        console.error("❌ 路径不包含storage前缀:", currentItem.path)
        return
      }
      
      // 构建指纹（使用文件名和大小生成hash）
      let fingerprint = currentItem.path
      if (currentItem.size !== undefined) {
        // 使用与音频文件界面相同的指纹生成方法
        const str = `${currentItem.name}_${currentItem.size}`
        let hash = 2166136261
        for (let i = 0; i < str.length; i++) {
          hash ^= str.charCodeAt(i)
          hash = Math.imul(hash, 16777619)
        }
        fingerprint = (hash >>> 0).toString(16).padStart(8, '0')
        console.log("  - fingerprint:", fingerprint)
      } else {
        console.warn("⚠️ 缺少size信息，使用路径作为fingerprint")
      }
      
      const favoriteData = {
        folder_id: selectedFolderId()!,
        storage_id: currentItem.storage_id || 0,
        original_path: currentItem.path,
        file_name: currentItem.name,
        note: favoriteNote(),
        fingerprint: fingerprint,
      }
      
      console.log("📤 发送收藏请求:", favoriteData)
      
      await createAudioFavorite(favoriteData)
      
      notify.success(`已添加 "${currentItem.name}" 到收藏`)
      setFavoriteNote("")
      addToFavoriteModal.onClose()
    } catch (error) {
      console.error("Failed to add to favorites:", error)
      notify.error("添加到收藏失败")
    }
  }
  
  // 添加标记
  const handleAddMark = () => {
    if (!isLoggedIn()) {
      notify.error("请先登录")
      return
    }
    
    if (playlistState.currentIndex < 0 || playlistState.items.length === 0) {
      notify.error("请先选择要添加标记的音频")
      return
    }
    
    addMarkModal.onOpen()
  }
  
  // 确认添加标记
  const handleConfirmAddMark = async () => {
    if (!markTitle().trim()) {
      notify.error("请输入标记标题")
      return
    }
    
    try {
      const currentItem = playlistState.items[playlistState.currentIndex]
      const currentTime = ap ? ap.audio.currentTime : 0
      
      await createMediaMark(currentItem.path, {
        time_second: currentTime,
        title: markTitle(),
        content: markContent()
      })
      
      notify.success(`已为 "${currentItem.name}" 添加标记`)
      setMarkTitle("")
      setMarkContent("")
      addMarkModal.onClose()
    } catch (error) {
      console.error("Failed to create mark:", error)
      notify.error("添加标记失败")
    }
  }
  
  // 切换后台播放
  const toggleBackgroundPlay = () => {
    const newValue = !backgroundPlayEnabled()
    setBackgroundPlayEnabled(newValue)
    localStorage.setItem("background-play-enabled", newValue.toString())
    
    if (newValue) {
      notify.success("后台播放已启用")
      updateMediaSession()
    } else {
      notify.success("后台播放已禁用")
      clearMediaSession()
    }
  }
  
  // 更新 Media Session
  const updateMediaSession = () => {
    if (!backgroundPlayEnabled() || !('mediaSession' in navigator)) return
    
    const currentItem = playlistState.items[playlistState.currentIndex]
    if (!currentItem) return
    
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentItem.name,
      artist: currentItem.artist || 'Unknown',
      artwork: currentItem.cover ? [
        { src: currentItem.cover, sizes: '512x512', type: 'image/png' }
      ] : []
    })
    
    navigator.mediaSession.setActionHandler('play', () => {
      if (ap) ap.play()
    })
    
    navigator.mediaSession.setActionHandler('pause', () => {
      if (ap) ap.pause()
    })
    
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      playPrevious()
    })
    
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      playNext()
    })
    
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      if (ap) ap.seek(Math.max(0, ap.audio.currentTime - seekSeconds()))
    })
    
    navigator.mediaSession.setActionHandler('seekforward', () => {
      if (ap) ap.seek(Math.min(ap.audio.duration, ap.audio.currentTime + seekSeconds()))
    })
  }
  
  // 清除 Media Session
  const clearMediaSession = () => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
      navigator.mediaSession.setActionHandler('seekbackward', null)
      navigator.mediaSession.setActionHandler('seekforward', null)
    }
  }

  onMount(() => {
    console.log("Initializing APlayer...")
    // Initialize APlayer
    ap = new APlayer({
      container: playerContainer,
      mini: false,
      autoplay: false,
      theme: getMainColor(),
      loop: "none",
      order: "list",
      preload: "auto",
      volume: 1.0,
      mutex: true,
      listFolded: false,
      lrcType: 3,
      audio: [],
    })

    console.log("APlayer initialized:", ap)

    // Listen to APlayer events
    ap.on("play", () => {
      console.log("🎵 APlayer play event, isInternalUpdate:", isInternalUpdate())
      if (!isInternalUpdate()) {
        console.log("Setting playlist state to playing: true")
        setPlaylistState("isPlaying", true)
      }
    })

    ap.on("pause", () => {
      console.log("⏸️ APlayer pause event, isInternalUpdate:", isInternalUpdate())
      if (!isInternalUpdate()) {
        console.log("Setting playlist state to playing: false")
        setPlaylistState("isPlaying", false)
      }
    })

    ap.on("ended", () => {
      console.log("🔚 APlayer ended event, playMode:", playlistState.playMode)
      setPlaylistState("isPlaying", false)
      
      if (checkSleepTimer()) {
        console.log("😴 Sleep timer expired, stopping")
        return
      }
      
      // Handle different play modes
      if (playlistState.playMode === "single") {
        console.log("🔂 Single loop mode - replaying current song")
        // Single loop - replay current song
        setTimeout(() => {
          if (ap) {
            console.log("Seeking to 0 and replaying")
            ap.seek(0)
            setPlaylistState("isPlaying", true)
          }
        }, 100)
      } else {
        console.log("🔁 List/Random mode - playing next")
        // List or random - play next
        setTimeout(() => {
          playNext()
        }, 100)
      }
    })

    // Add more event listeners for debugging
    ap.on("loadstart", () => {
      console.log("📥 APlayer loadstart event")
    })

    ap.on("canplay", () => {
      console.log("✅ APlayer canplay event")
    })

    ap.on("error", (e: any) => {
      console.error("❌ APlayer error:", e)
    })
    
    // Listen to list switch event (when user clicks on APlayer's built-in playlist)
    ap.on("listswitch", (index: any) => {
      console.log("🔀 APlayer listswitch event, index:", index.index)
      if (!isInternalUpdate()) {
        console.log("Updating playlist state currentIndex to:", index.index)
        setPlaylistState("currentIndex", index.index)
      }
    })

    // Check sleep timer periodically and update display
    const timerInterval = setInterval(() => {
      if (checkSleepTimer() && ap && playlistState.isPlaying) {
        setPlaylistState("isPlaying", false)
        ap.pause()
      }
      
      // Update sleep timer display
      if (playlistState.sleepTimer) {
        const remaining = Math.max(0, playlistState.sleepTimer - Date.now())
        const minutes = Math.floor(remaining / 60000)
        const seconds = Math.floor((remaining % 60000) / 1000)
        setSleepTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`)
      } else {
        setSleepTimeRemaining("")
      }
    }, 1000)

    onCleanup(() => {
      clearInterval(timerInterval)
      ap?.destroy()
    })
  })
  
  // 监听主题变化，更新APlayer样式
  createEffect(() => {
    const isDark = colorMode() === "dark"
    if (playerContainer) {
      if (isDark) {
        playerContainer.classList.add("aplayer-dark")
      } else {
        playerContainer.classList.remove("aplayer-dark")
      }
    }
  })
  
  // 监听播放状态变化，更新Media Session
  createEffect(() => {
    if (backgroundPlayEnabled() && playlistState.currentIndex >= 0) {
      updateMediaSession()
    }
  })
  
  // 监听播放/暂停状态，更新Media Session播放状态
  createEffect(() => {
    if (backgroundPlayEnabled() && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = playlistState.isPlaying ? 'playing' : 'paused'
    }
  })

  // Sync playlist with APlayer
  createEffect(() => {
    if (!ap) return

    const items = playlistState.items
    if (items.length > 0) {
      ap.list.clear()
      items.forEach((item) => {
        ap.list.add({
          name: item.name,
          artist: item.artist,
          url: item.url,
          cover: item.cover,
          lrc: item.lrc,
        })
      })
    } else {
      ap.list.clear()
    }
  })

  // Sync current index
  createEffect(() => {
    if (!ap) return
    const index = playlistState.currentIndex
    if (index >= 0 && index < playlistState.items.length) {
      // Only switch if it's a different song
      if (ap.list.index !== index) {
        console.log("Switching to song index:", index)
        ap.list.switch(index)
      }
      if (playlistState.isPlaying) {
        ap.play()
      }
    }
  })

  // Sync play/pause state
  createEffect(() => {
    if (!ap) {
      console.log("⚠️ ap not ready yet")
      return
    }
    console.log("🔄 Syncing play state:", playlistState.isPlaying, "Current ap state:", !ap.audio.paused)
    setIsInternalUpdate(true)
    
    try {
      if (playlistState.isPlaying) {
        console.log("▶️ Calling ap.play()")
        ap.play()
      } else {
        console.log("⏸️ Calling ap.pause()")
        ap.pause()
      }
    } catch (error) {
      console.error("Error in play/pause:", error)
    }
    
    setTimeout(() => {
      setIsInternalUpdate(false)
      console.log("🔄 Internal update flag cleared")
    }, 50)
  })

  const handleRemove = (id: string, e: Event) => {
    e.stopPropagation()
    removeFromPlaylist(id)
  }

  const handlePlayItem = (index: number) => {
    playItem(index)
  }

  // 前进后退功能
  const handleSeekBackward = () => {
    if (ap && ap.audio) {
      const currentTime = ap.audio.currentTime
      const newTime = Math.max(0, currentTime - seekSeconds())
      ap.seek(newTime)
      console.log(`⏪ Seek backward ${seekSeconds()}s: ${currentTime} -> ${newTime}`)
    }
  }

  const handleSeekForward = () => {
    if (ap && ap.audio) {
      const currentTime = ap.audio.currentTime
      const duration = ap.audio.duration || 0
      const newTime = Math.min(duration, currentTime + seekSeconds())
      ap.seek(newTime)
      console.log(`⏩ Seek forward ${seekSeconds()}s: ${currentTime} -> ${newTime}`)
    }
  }

  // 修复上一首下一首功能
  const handlePrevious = () => {
    console.log("🎵 Previous button clicked")
    if (playlistState.items.length > 0) {
      playPrevious()
    }
  }

  const handleNext = () => {
    console.log("🎵 Next button clicked")
    if (playlistState.items.length > 0) {
      playNext()
    }
  }

  // 批量选择相关函数
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode())
    if (!isSelectionMode()) {
      setSelectedItems(new Set<string>())
    }
  }

  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems())
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const selectAllItems = () => {
    const allIds = new Set(playlistState.items.map(item => item.id))
    setSelectedItems(allIds)
  }

  const clearSelection = () => {
    setSelectedItems(new Set<string>())
  }

  const deleteSelectedItems = () => {
    const idsToDelete = Array.from(selectedItems())
    if (idsToDelete.length > 0) {
      removeMultipleFromPlaylist(idsToDelete)
      setSelectedItems(new Set<string>())
      setIsSelectionMode(false)
    }
  }

  const handleClearPlaylist = () => {
    if (confirm("确定要清空整个播放列表吗？")) {
      clearPlaylist()
      setSelectedItems(new Set<string>())
      setIsSelectionMode(false)
    }
  }

  const getPlayModeIcon = () => {
    switch (playlistState.playMode) {
      case "single":
        return "🔂"
      case "random":
        return "🔀"
      case "list":
      default:
        return "🔁"
    }
  }

  const getPlayModeText = () => {
    switch (playlistState.playMode) {
      case "single":
        return "单曲循环"
      case "random":
        return "随机播放"
      case "list":
      default:
        return "列表循环"
    }
  }

  const cyclePlayMode = () => {
    const modes: PlayMode[] = ["list", "random", "single"]
    const currentIndex = modes.indexOf(playlistState.playMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setPlayMode(nextMode)
  }

  const handleSetSleepTimer = (minutes: number, seconds: number = 0) => {
    const totalMinutes = minutes + seconds / 60
    setSleepTimer(totalMinutes)
    sleepTimerModal.onClose()
  }

  const formatSleepTimer = () => {
    if (!playlistState.sleepTimer) return ""
    const remaining = Math.max(0, playlistState.sleepTimer - Date.now())
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Drag and drop handlers
  const handleDragStart = (index: number, e: DragEvent) => {
    setDraggedIndex(index)
    e.dataTransfer!.effectAllowed = "move"
  }

  const handleDragOver = (index: number, e: DragEvent) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    const from = draggedIndex()
    const to = dragOverIndex()
    if (from !== null && to !== null && from !== to) {
      reorderPlaylistItem(from, to)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    handleDragEnd()
  }

  return (
    <VStack w="$full" spacing="$4" alignItems="stretch" p="$4">
      {/* Top Actions */}
      <HStack justifyContent="center" spacing="$4">
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddToFavorite}
          disabled={playlistState.currentIndex < 0 || playlistState.items.length === 0 || !isLoggedIn()}
        >
          ❤️ 添加到收藏
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddMark}
          disabled={playlistState.currentIndex < 0 || playlistState.items.length === 0 || !isLoggedIn()}
        >
          🏷️ 添加标记
        </Button>
      </HStack>

      {/* Player Controls - 6个控制按钮 */}
      <HStack justifyContent="center" spacing="$2">
        <IconButton
          aria-label="Previous"
          icon={<span>⏮️</span>}
          size="sm"
          onClick={handlePrevious}
          disabled={playlistState.items.length === 0}
        />
        <IconButton
          aria-label="Play/Pause"
          icon={<span>{playlistState.isPlaying ? "⏸️" : "▶️"}</span>}
          size="md"
          onClick={() => {
            console.log("🎯 Toggle play clicked!")
            console.log("Current playlist state:", playlistState.isPlaying)
            console.log("Current APlayer state:", ap ? !ap.audio.paused : "ap not ready")
            console.log("Playlist items count:", playlistState.items.length)
            console.log("Current index:", playlistState.currentIndex)
            togglePlay()
            console.log("After togglePlay, new state:", !playlistState.isPlaying)
          }}
          disabled={playlistState.items.length === 0}
          colorScheme="accent"
        />
        <IconButton
          aria-label="Next"
          icon={<span>⏭️</span>}
          size="sm"
          onClick={handleNext}
          disabled={playlistState.items.length === 0}
        />
        <IconButton
          aria-label="Seek Backward"
          icon={<span>⏪</span>}
          size="sm"
          onClick={handleSeekBackward}
          disabled={playlistState.items.length === 0}
          title={`后退 ${seekSeconds()} 秒`}
        />
        <IconButton
          aria-label="Seek Forward"
          icon={<span>⏩</span>}
          size="sm"
          onClick={handleSeekForward}
          disabled={playlistState.items.length === 0}
          title={`前进 ${seekSeconds()} 秒`}
        />
        <IconButton
          aria-label="Seek Settings"
          icon={<span>⚙️</span>}
          size="sm"
          onClick={seekSettingsModal.onOpen}
          title="设置前进后退秒数"
        />
      </HStack>

      {/* Mode Controls - 列表循环、睡眠定时、后台播放 */}
      <HStack justifyContent="center" spacing="$2">
        <Button
          size="sm"
          variant="ghost"
          onClick={cyclePlayMode}
          title={getPlayModeText()}
        >
          {getPlayModeIcon()} {getPlayModeText()}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={sleepTimerModal.onOpen}
          colorScheme={playlistState.sleepTimer ? "success" : undefined}
        >
          ⏰ {sleepTimeRemaining() || "睡眠定时"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleBackgroundPlay}
          colorScheme={backgroundPlayEnabled() ? "success" : undefined}
          title={backgroundPlayEnabled() ? "后台播放已启用" : "后台播放已禁用"}
        >
          📱 {backgroundPlayEnabled() ? "后台播放" : "后台播放"}
        </Button>
      </HStack>

      {/* Audio Player */}
      <Box ref={playerContainer} w="$full" />

      {/* Playlist */}
      <VStack spacing="$2" alignItems="stretch" maxH="400px" overflowY="auto">
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$lg" fontWeight="$semibold">
            播放列表 ({playlistState.items.length})
          </Text>
          <HStack spacing="$2">
            <Show when={playlistState.items.length > 0}>
              <Button
                size="xs"
                variant="ghost"
                onClick={toggleSelectionMode}
                colorScheme={isSelectionMode() ? "accent" : undefined}
              >
                {isSelectionMode() ? "取消选择" : "批量选择"}
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={handleClearPlaylist}
                colorScheme="danger"
              >
                清空列表
              </Button>
            </Show>
          </HStack>
        </HStack>
        
        <Show when={isSelectionMode() && playlistState.items.length > 0}>
          <HStack spacing="$2" alignItems="center">
            <Button size="xs" onClick={selectAllItems}>
              全选
            </Button>
            <Button size="xs" onClick={clearSelection}>
              取消全选
            </Button>
            <Show when={selectedItems().size > 0}>
              <Button 
                size="xs" 
                colorScheme="danger" 
                onClick={deleteSelectedItems}
              >
                删除选中 ({selectedItems().size})
              </Button>
            </Show>
          </HStack>
        </Show>
        <Show
          when={playlistState.items.length > 0}
          fallback={
            <Text color="$neutral11" textAlign="center" py="$8">
              播放列表为空，浏览音频时点击"添加到播放列表"
            </Text>
          }
        >
          <For each={playlistState.items}>
            {(item, index) => (
              <HStack
                spacing="$2"
                p="$2"
                borderRadius="$md"
                bg={
                  selectedItems().has(item.id)
                    ? "$accent2"
                    : index() === playlistState.currentIndex
                    ? "$accent3"
                    : dragOverIndex() === index()
                    ? "$neutral4"
                    : "$neutral2"
                }
                cursor="pointer"
                onClick={(e) => {
                  if (isSelectionMode()) {
                    e.stopPropagation()
                    toggleItemSelection(item.id)
                  } else {
                    handlePlayItem(index())
                  }
                }}
                draggable={!isSelectionMode()}
                onDragStart={(e) => !isSelectionMode() && handleDragStart(index(), e)}
                onDragOver={(e) => !isSelectionMode() && handleDragOver(index(), e)}
                onDragEnd={!isSelectionMode() ? handleDragEnd : undefined}
                onDrop={!isSelectionMode() ? handleDrop : undefined}
              >
                <Show when={isSelectionMode()}>
                  <input
                    type="checkbox"
                    checked={selectedItems().has(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ margin: "0" }}
                  />
                </Show>
                <Box flex="1" minW="0">
                  <Text
                    fontSize="$sm"
                    fontWeight={
                      index() === playlistState.currentIndex ? "$semibold" : "$normal"
                    }
                    noOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text fontSize="$xs" color="$neutral11" noOfLines={1}>
                    {item.artist}
                  </Text>
                </Box>
                <Show when={!isSelectionMode()}>
                  <IconButton
                    aria-label="Remove"
                    icon={<span>❌</span>}
                    size="xs"
                    variant="ghost"
                    onClick={(e) => handleRemove(item.id, e)}
                  />
                </Show>
              </HStack>
            )}
          </For>
        </Show>
      </VStack>

      {/* Sleep Timer Modal */}
      <Modal opened={sleepTimerModal.isOpen()} onClose={sleepTimerModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>睡眠定时</ModalHeader>
          <ModalBody>
            <VStack spacing="$3" alignItems="stretch">
              <Text fontSize="$sm" color="$neutral11">
                设置定时后，播放器将在指定时间后自动停止播放
              </Text>
              <HStack spacing="$2" flexWrap="wrap">
                <Button size="sm" onClick={() => handleSetSleepTimer(15)}>
                  15分钟
                </Button>
                <Button size="sm" onClick={() => handleSetSleepTimer(30)}>
                  30分钟
                </Button>
                <Button size="sm" onClick={() => handleSetSleepTimer(45)}>
                  45分钟
                </Button>
                <Button size="sm" onClick={() => handleSetSleepTimer(60)}>
                  60分钟
                </Button>
              </HStack>
              <HStack spacing="$2" alignItems="center">
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={customMinutes()}
                  onInput={(e) => setCustomMinutes(parseInt(e.currentTarget.value) || 0)}
                  style={{
                    padding: "8px",
                    border: "1px solid #ccc",
                    "border-radius": "4px",
                    width: "80px",
                  }}
                />
                <Text fontSize="$sm">分</Text>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customSeconds()}
                  onInput={(e) => setCustomSeconds(parseInt(e.currentTarget.value) || 0)}
                  style={{
                    padding: "8px",
                    border: "1px solid #ccc",
                    "border-radius": "4px",
                    width: "80px",
                  }}
                />
                <Text fontSize="$sm">秒</Text>
                <Button
                  size="sm"
                  onClick={() => handleSetSleepTimer(customMinutes(), customSeconds())}
                  colorScheme="accent"
                  disabled={customMinutes() === 0 && customSeconds() === 0}
                >
                  设置
                </Button>
              </HStack>
              <Show when={playlistState.sleepTimer}>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="danger"
                  onClick={() => {
                    cancelSleepTimer()
                    sleepTimerModal.onClose()
                  }}
                >
                  取消定时
                </Button>
              </Show>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Seek Settings Modal */}
      <Modal opened={seekSettingsModal.isOpen()} onClose={seekSettingsModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>前进后退设置</ModalHeader>
          <ModalBody>
            <VStack spacing="$3" alignItems="stretch">
              <Text fontSize="$sm" color="$neutral11">
                设置点击前进/后退按钮时跳转的秒数
              </Text>
              <HStack spacing="$2" flexWrap="wrap">
                <Button 
                  size="sm" 
                  onClick={() => setSeekSeconds(3)}
                  colorScheme={seekSeconds() === 3 ? "accent" : undefined}
                >
                  3秒
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setSeekSeconds(5)}
                  colorScheme={seekSeconds() === 5 ? "accent" : undefined}
                >
                  5秒
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setSeekSeconds(10)}
                  colorScheme={seekSeconds() === 10 ? "accent" : undefined}
                >
                  10秒
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setSeekSeconds(15)}
                  colorScheme={seekSeconds() === 15 ? "accent" : undefined}
                >
                  15秒
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setSeekSeconds(30)}
                  colorScheme={seekSeconds() === 30 ? "accent" : undefined}
                >
                  30秒
                </Button>
              </HStack>
              <HStack spacing="$2" alignItems="center">
                <Text fontSize="$sm">自定义:</Text>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={seekSeconds()}
                  onInput={(e) => setSeekSeconds(parseInt(e.currentTarget.value) || 3)}
                  style={{
                    padding: "8px",
                    border: "1px solid #ccc",
                    "border-radius": "4px",
                    width: "80px",
                  }}
                />
                <Text fontSize="$sm">秒</Text>
              </HStack>
              <Text fontSize="$xs" color="$neutral10">
                当前设置: 前进/后退 {seekSeconds()} 秒
              </Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 添加到收藏模态框 */}
      <Modal opened={addToFavoriteModal.isOpen()} onClose={addToFavoriteModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>添加音频到收藏</ModalHeader>
          <ModalBody>
            <VStack spacing="$3" alignItems="stretch">
              <Box>
                <Text fontSize="$sm" mb="$2" fontWeight="$medium">
                  选择收藏文件夹
                </Text>
                <Select
                  value={selectedFolderId()?.toString()}
                  onChange={(value) => setSelectedFolderId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectPlaceholder>选择收藏文件夹</SelectPlaceholder>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectListbox>
                      <For each={folders()}>
                        {(folder) => (
                          <SelectOption value={folder.id.toString()}>
                            <SelectOptionText>{folder.name}</SelectOptionText>
                            <SelectOptionIndicator />
                          </SelectOption>
                        )}
                      </For>
                    </SelectListbox>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  mt="$2"
                  onClick={createFolderModal.onOpen}
                >
                  + 新建收藏文件夹
                </Button>
              </Box>

              <Box>
                <Text fontSize="$sm" mb="$2" fontWeight="$medium">
                  备注（可选）
                </Text>
                <Textarea
                  value={favoriteNote()}
                  onInput={(e) => setFavoriteNote(e.currentTarget.value)}
                  placeholder="添加备注..."
                  rows={3}
                />
              </Box>

              <Button
                colorScheme="accent"
                onClick={handleConfirmAddToFavorite}
                disabled={!selectedFolderId()}
              >
                确认添加
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 创建收藏文件夹模态框 */}
      <Modal opened={createFolderModal.isOpen()} onClose={createFolderModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>新建收藏文件夹</ModalHeader>
          <ModalBody>
            <VStack spacing="$3" alignItems="stretch">
              <Box>
                <Text fontSize="$sm" mb="$2" fontWeight="$medium">
                  文件夹名称
                </Text>
                <Input
                  value={newFolderName()}
                  onInput={(e) => setNewFolderName(e.currentTarget.value)}
                  placeholder="输入文件夹名称"
                />
              </Box>

              <Box>
                <Text fontSize="$sm" mb="$2" fontWeight="$medium">
                  描述（可选）
                </Text>
                <Textarea
                  value={newFolderDesc()}
                  onInput={(e) => setNewFolderDesc(e.currentTarget.value)}
                  placeholder="输入描述..."
                  rows={3}
                />
              </Box>

              <HStack spacing="$2" justifyContent="flex-end">
                <Button variant="ghost" onClick={createFolderModal.onClose}>
                  取消
                </Button>
                <Button colorScheme="accent" onClick={handleCreateFolder}>
                  创建
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 添加标记模态框 */}
      <Modal opened={addMarkModal.isOpen()} onClose={addMarkModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>添加音频标记</ModalHeader>
          <ModalBody>
            <VStack spacing="$3" alignItems="stretch">
              <Box>
                <Text fontSize="$sm" mb="$2" fontWeight="$medium">
                  标记标题
                </Text>
                <Input
                  value={markTitle()}
                  onInput={(e) => setMarkTitle(e.currentTarget.value)}
                  placeholder="输入标记标题"
                />
              </Box>

              <Box>
                <Text fontSize="$sm" mb="$2" fontWeight="$medium">
                  标记内容（可选）
                </Text>
                <Textarea
                  value={markContent()}
                  onInput={(e) => setMarkContent(e.currentTarget.value)}
                  placeholder="输入标记内容..."
                  rows={4}
                />
              </Box>

              <Show when={ap}>
                <Text fontSize="$xs" color="$neutral11">
                  当前时间: {Math.floor(ap?.audio?.currentTime || 0)} 秒
                </Text>
              </Show>

              <HStack spacing="$2" justifyContent="flex-end">
                <Button variant="ghost" onClick={addMarkModal.onClose}>
                  取消
                </Button>
                <Button colorScheme="accent" onClick={handleConfirmAddMark}>
                  添加标记
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  )
}
