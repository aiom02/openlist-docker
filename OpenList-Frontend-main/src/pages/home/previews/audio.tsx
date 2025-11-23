import "aplayer/dist/APlayer.min.css"
import "./audio.css"
import APlayer from "aplayer"
import { Box, VStack, HStack, Button } from "@hope-ui/solid"
import { onCleanup, onMount } from "solid-js"
import { useLink, useRouter, useTitle } from "~/hooks"
import { getMainColor, getSetting, getSettingBool, objStore, me } from "~/store"
import { ObjType, StoreObj } from "~/types"
import { baseName, fsGet } from "~/utils"
import MediaMarks from "~/components/MediaMarks"
import { AudioFavoriteControl } from "~/components"
import { addToPlaylist, type PlaylistItem } from "~/store/playlist"
import { notify } from "~/utils"

const Preview = () => {
  const { proxyLink, rawLink, previewPage } = useLink()
  const { searchParams, pathname } = useRouter()
  let audios = objStore.objs.filter((obj) => obj.type === ObjType.AUDIO)
  if (audios.length === 0 || searchParams["from"] === "search") {
    audios = [objStore.obj]
  }
  let ap: any
  const objToAudio = (obj: StoreObj) => {
    let lrc = undefined
    const lrcObj = objStore.objs.find((o) => {
      return baseName(o.name) === baseName(obj.name) && o.name.endsWith(".lrc")
    })
    if (lrcObj) {
      lrc = proxyLink(lrcObj, true)
    }
    let cover = undefined
    const coverObj = objStore.objs.find((o) => {
      return (
        o.type === ObjType.IMAGE &&
        (baseName(o.name).toLowerCase() === baseName(obj.name).toLowerCase() ||
          baseName(o.name).toLowerCase() === "front" ||
          baseName(o.name).toLowerCase() === "cover" ||
          baseName(o.name).toLowerCase() === "folder")
      )
    })
    if (coverObj) {
      cover = rawLink(coverObj, true)
    } else {
      cover =
        obj.thumb ||
        getSetting("audio_cover") ||
        "https://res.oplist.org/logo/logo.svg"
    }
    const audio = {
      name: obj.name,
      artist: "Unknown",
      url: rawLink(obj, true),
      cover: cover,
      lrc: lrc,
    }
    if (objStore.provider === "NeteaseMusic") {
      const matched = obj.name.match(/((.+)\s-\s)?(.+)\.(mp3|flac)/)
      audio.artist = matched?.[2] || "Unknown"
      audio.name = matched?.[3] || obj.name
      const lrcURL = new URL(previewPage(obj).replace(/\.(mp3|flac)/, ".lrc"))
      audio.lrc = decodeURIComponent(lrcURL.pathname)
    }
    return audio
  }
  onMount(() => {
    ap = new APlayer({
      container: document.querySelector("#audio-player"),
      mini: false,
      autoplay: getSettingBool("audio_autoplay"),
      theme: getMainColor(),
      loop: "all",
      order: "list",
      preload: "auto",
      volume: 1.0,
      mutex: true,
      listFolded: false,
      lrcType: objStore.provider === "NeteaseMusic" ? 1 : 3,
      audio: audios.map(objToAudio),
    })

    // Apply monkey patch to fix https://github.com/DIYgod/APlayer/issues/283
    const _switch = ap.lrc.switch
    const _update = ap.lrc.update
    ap.lrc.switch = (index: any) => {
      ap.lrc.update = () => {}
      _switch.call(ap.lrc, index)
      ap.lrc.update = _update
    }

    if (objStore.provider === "NeteaseMusic") {
      ap.on("loadstart", () => {
        const i = ap.list.index
        if (!ap.list.audios[i].lrc) return
        const lrcURL = ap.list.audios[i].lrc
        fsGet(lrcURL).then((resp) => {
          ap.lrc.async = true
          ap.lrc.parsed[i] = undefined
          ap.list.audios[i].lrc = resp.data.raw_url
          ap.lrc.switch(i) // fetch lrc into `parsed`
          ap.list.audios[i].lrc = ""
          ap.lrc.async = false
        })
      })
    }
    const curIndex = audios.findIndex((obj) => obj.name === objStore.obj.name)
    if (curIndex !== -1) {
      ap.list.switch(curIndex)
    }
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("seekto", (evt) =>
        ap.seek(evt.seekTime),
      )
      if (ap.list.audios.length > 1) {
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          ap.skipBack()
        })
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          ap.skipForward()
        })
      }
      ap.on("play", () => {
        const current = ap.list.audios[ap.list.index]
        useTitle(current.name)
        navigator.mediaSession.metadata = new MediaMetadata({
          title: current.name,
          artist: current.artist === "Unknown" ? undefined : current.artist,
          artwork: [
            {
              src: current.cover,
            },
          ],
        })
      })
    }
  })
  onCleanup(() => {
    ap?.destroy()
  })
  
  // Media marks functionality
  const handleJumpToTime = (timeSecond: number) => {
    if (ap) {
      ap.seek(timeSecond)
      ap.play()
    }
  }
  
  const getCurrentTime = () => {
    return ap ? ap.audio.currentTime : 0
  }
  
  const isLoggedIn = () => {
    const user = me()
    return user && user.id && !user.guest
  }
  
  const handleAddToPlaylist = () => {
    if (!ap || !ap.list.audios[ap.list.index]) {
      notify.error("无法获取当前音频信息")
      return
    }
    
    const currentAudio = ap.list.audios[ap.list.index]
    const currentObj = audios[ap.list.index]
    
    // 构建完整路径（包含storage信息）
    let fullPath: string
    
    if (audios.length === 1 || searchParams["from"] === "search") {
      // 单个音频，直接使用pathname()
      fullPath = pathname()
    } else {
      // 文件夹中的多个音频
      // currentObj.path 可能是相对路径（如 \jok\地铁\xxx）或完整路径
      if (currentObj.path.startsWith('/')) {
        // 已经是完整路径（正斜杠开头）
        fullPath = currentObj.path
      } else if (currentObj.path.startsWith('\\')) {
        // Windows风格的相对路径，转换为正斜杠并添加storage前缀
        // 从pathname()中提取storage前缀（第一段路径）
        const pathParts = pathname().split('/').filter(p => p)
        const storageName = pathParts[0] || ''
        // 转换反斜杠为正斜杠
        const normalizedPath = currentObj.path.replace(/\\/g, '/')
        fullPath = `/${storageName}${normalizedPath}`
      } else {
        // 其他情况，使用pathname作为基础
        fullPath = `${pathname()}/${currentObj.path}`
      }
    }
    
    console.log("📝 添加到播放列表:")
    console.log("  - 文件名:", currentAudio.name)
    console.log("  - 原始路径:", currentObj.path)
    console.log("  - 当前目录:", pathname())
    console.log("  - 完整路径:", fullPath)
    console.log("  - 大小:", currentObj.size)
    
    const playlistItem: PlaylistItem = {
      id: `${fullPath}-${Date.now()}`,
      name: currentAudio.name,
      artist: currentAudio.artist || "Unknown",
      url: currentAudio.url,
      cover: currentAudio.cover,
      lrc: currentAudio.lrc,
      path: fullPath,
      storage_id: 0, // Will be filled by backend based on path
      size: currentObj.size,
    }
    
    addToPlaylist(playlistItem)
    notify.success("已添加到播放列表")
  }
  
  return (
    <VStack w="$full" spacing="$4" alignItems="stretch">
      <Box w="$full" id="audio-player" />
      <HStack w="$full" justifyContent="space-between">
        <Button
          size="sm"
          colorScheme="accent"
          onClick={handleAddToPlaylist}
        >
          添加到播放列表
        </Button>
        <AudioFavoriteControl isLoggedIn={isLoggedIn()} />
      </HStack>
      <MediaMarks
        onJumpTo={handleJumpToTime}
        getCurrentTime={getCurrentTime}
        isLoggedIn={isLoggedIn()}
      />
    </VStack>
  )
}

export default Preview
