import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  ButtonGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  createDisclosure,
} from "@hope-ui/solid"
import { createSignal, createEffect, For, Show } from "solid-js"
import { useRouter, useT } from "~/hooks"
import { listAllVideoMarks } from "~/utils/video-favorites"
import { listAllAudioMarks } from "~/utils/audio-favorites"
import type { VideoWithMarks, AudioWithMarks } from "~/types"
import { notify } from "~/utils"
import { AiOutlineVideoCamera, AiOutlineArrowLeft, AiOutlineAudio, AiOutlineEdit } from "solid-icons/ai"
import { BiRegularTimeFive } from "solid-icons/bi"
import { IconButton } from "@hope-ui/solid"
import { useNavigate } from "@solidjs/router"
import { SimpleRightToolbar } from "~/components/SimpleRightToolbar"

type MediaType = "video" | "audio"
type MediaWithMarks = VideoWithMarks | AudioWithMarks

interface FolderGroup {
  folderId: number  // 0表示未收藏的目录分组
  folderName: string  // 收藏文件夹名称 或 实际目录路径
  items: MediaWithMarks[]
}

// 自定义名称管理
const CUSTOM_NAMES_KEY = "media_marks_custom_names"

interface CustomNames {
  folders: Record<string, string>  // 原始路径 -> 自定义名称
  files: Record<string, string>    // 原始文件名 -> 自定义名称
}

const loadCustomNames = (): CustomNames => {
  try {
    const stored = localStorage.getItem(CUSTOM_NAMES_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("Failed to load custom names:", error)
  }
  return { folders: {}, files: {} }
}

const saveCustomNames = (names: CustomNames) => {
  try {
    localStorage.setItem(CUSTOM_NAMES_KEY, JSON.stringify(names))
  } catch (error) {
    console.error("Failed to save custom names:", error)
  }
}

export default function MediaMarksPage() {
  const t = useT()
  const { to } = useRouter()
  const navigate = useNavigate()
  
  const [mediaType, setMediaType] = createSignal<MediaType>("video")
  const [videoMarks, setVideoMarks] = createSignal<VideoWithMarks[]>([])
  const [audioMarks, setAudioMarks] = createSignal<AudioWithMarks[]>([])
  const [loading, setLoading] = createSignal(false)
  const [selectedFolderName, setSelectedFolderName] = createSignal<string | null>(null)
  
  // 自定义名称状态
  const [customNames, setCustomNames] = createSignal<CustomNames>(loadCustomNames())
  const [editingType, setEditingType] = createSignal<"folder" | "file">("folder")
  const [editingOriginalName, setEditingOriginalName] = createSignal("")
  const [editingNewName, setEditingNewName] = createSignal("")
  const editModal = createDisclosure()

  createEffect(() => {
    loadMarks()
  })

  const loadMarks = async () => {
    try {
      setLoading(true)
      if (mediaType() === "video") {
        const data = await listAllVideoMarks()
        setVideoMarks(data)
      } else {
        const data = await listAllAudioMarks()
        setAudioMarks(data)
      }
    } catch (error) {
      console.error("Failed to load marks:", error)
      notify.error(t("home.bookmarks.failed_load"))
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    } else {
      return `${minutes}:${secs.toString().padStart(2, "0")}`
    }
  }

  const handlePlayFromMark = (media: MediaWithMarks, timeSecond: number) => {
    // Ensure the path starts with / for absolute navigation
    let path = media.original_path
    if (!path.startsWith('/')) {
      path = '/' + path
    }
    // Navigate to media with time parameter
    to(`${path}?t=${timeSecond}`)
  }

  const handleMediaTypeChange = (type: MediaType) => {
    setMediaType(type)
    setSelectedFolderName(null)
    loadMarks()
  }

  // Get current media marks based on type
  const currentMarks = () => {
    return mediaType() === "video" ? videoMarks() : audioMarks()
  }

  // Extract directory path from file path
  const getDirectoryPath = (filePath: string): string => {
    const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
    if (lastSlash === -1) return "根目录"
    return filePath.substring(0, lastSlash)
  }

  // Extract file name from file path (only the name after last slash)
  const getFileName = (filePath: string): string => {
    const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
    if (lastSlash === -1) return filePath
    return filePath.substring(lastSlash + 1)
  }

  // 获取文件夹显示名称（优先使用自定义名称）
  const getFolderDisplayName = (originalName: string): string => {
    return customNames().folders[originalName] || originalName
  }

  // 获取文件显示名称（优先使用自定义名称）
  const getFileDisplayName = (originalName: string): string => {
    return customNames().files[originalName] || getFileName(originalName)
  }

  // 打开编辑对话框
  const openEditDialog = (type: "folder" | "file", originalName: string) => {
    setEditingType(type)
    setEditingOriginalName(originalName)
    const currentCustomName = type === "folder" 
      ? customNames().folders[originalName] 
      : customNames().files[originalName]
    setEditingNewName(currentCustomName || (type === "file" ? getFileName(originalName) : originalName))
    editModal.onOpen()
  }

  // 保存自定义名称
  const saveCustomName = () => {
    const newName = editingNewName().trim()
    if (!newName) {
      notify.error("名称不能为空")
      return
    }

    const names = { ...customNames() }
    const type = editingType()
    const originalName = editingOriginalName()

    if (type === "folder") {
      if (newName === originalName) {
        // 如果改回原名，则删除自定义名称
        delete names.folders[originalName]
      } else {
        names.folders[originalName] = newName
      }
    } else {
      const originalFileName = getFileName(originalName)
      if (newName === originalFileName) {
        // 如果改回原名，则删除自定义名称
        delete names.files[originalName]
      } else {
        names.files[originalName] = newName
      }
    }

    setCustomNames(names)
    saveCustomNames(names)
    editModal.onClose()
    notify.success("名称已更新")
  }

  // 删除自定义名称（恢复原名）
  const resetCustomName = () => {
    const names = { ...customNames() }
    const type = editingType()
    const originalName = editingOriginalName()

    if (type === "folder") {
      delete names.folders[originalName]
    } else {
      delete names.files[originalName]
    }

    setCustomNames(names)
    saveCustomNames(names)
    editModal.onClose()
    notify.success("已恢复原始名称")
  }

  // Group media by folder
  const folderGroups = (): FolderGroup[] => {
    const groups = new Map<string, FolderGroup>()
    const marks = currentMarks()
    
    marks.forEach((media) => {
      let groupKey: string
      let folderName: string
      let folderId: number
      
      // 如果是已收藏的文件，按收藏文件夹分组
      if (media.folder_id && media.folder_id !== 0) {
        groupKey = `favorite_${media.folder_id}`
        folderName = media.folder_name
        folderId = media.folder_id
      } else {
        // 未收藏的文件，按实际目录路径分组
        const dirPath = getDirectoryPath(media.original_path)
        groupKey = `path_${dirPath}`
        folderName = dirPath
        folderId = 0
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          folderId,
          folderName,
          items: [],
        })
      }
      groups.get(groupKey)!.items.push(media)
    })
    
    return Array.from(groups.values())
  }

  // Get selected folder's items
  const selectedFolderItems = () => {
    const folderName = selectedFolderName()
    if (folderName === null) return []
    
    const folder = folderGroups().find((g) => g.folderName === folderName)
    return folder?.items || []
  }

  return (
    <Box p="$4" w="$full" minH="100vh">
      {/* 顶部标题栏 */}
      <HStack justifyContent="space-between" alignItems="center" mb="$4">
        <HStack spacing="$3" alignItems="center">
          <IconButton
            aria-label="返回"
            icon={<AiOutlineArrowLeft />}
            size="md"
            variant="ghost"
            onClick={() => navigate(-1)}
          />
          <Text fontSize="$2xl" fontWeight="$bold">
            我的标记
          </Text>
        </HStack>
        <Button onClick={loadMarks} variant="outline">
          刷新
        </Button>
      </HStack>

      {/* 主内容区域 */}
      <HStack alignItems="stretch" spacing="$4" minH="calc(100vh - 120px)">
        {/* 左侧面板 */}
        <VStack
          w="280px"
          spacing="$3"
          alignItems="stretch"
          borderRight="1px solid $neutral6"
          pr="$4"
        >
          {/* 视频/音频切换按钮 */}
          <ButtonGroup attached w="$full">
            <Button
              flex="1"
              variant={mediaType() === "video" ? "solid" : "outline"}
              colorScheme={mediaType() === "video" ? "accent" : "neutral"}
              onClick={() => handleMediaTypeChange("video")}
              leftIcon={<AiOutlineVideoCamera />}
            >
              视频
            </Button>
            <Button
              flex="1"
              variant={mediaType() === "audio" ? "solid" : "outline"}
              colorScheme={mediaType() === "audio" ? "accent" : "neutral"}
              onClick={() => handleMediaTypeChange("audio")}
              leftIcon={<AiOutlineAudio />}
            >
              音频
            </Button>
          </ButtonGroup>

          {/* 文件夹列表 */}
          <Show when={loading()}>
            <Text color="$neutral11" fontSize="$sm">加载中...</Text>
          </Show>

          <Show when={!loading() && currentMarks().length === 0}>
            <Box p="$4" textAlign="center">
              <Text color="$neutral11" fontSize="$sm">
                暂无{mediaType() === "video" ? "视频" : "音频"}标记
              </Text>
            </Box>
          </Show>

          <Show when={!loading() && currentMarks().length > 0}>
            <VStack spacing="$2" alignItems="stretch">
              <Text fontSize="$sm" fontWeight="$semibold" color="$neutral11" mb="$1">
                文件夹
              </Text>
              <For each={folderGroups()}>
                {(folder) => (
                  <HStack spacing="$1" w="$full" alignItems="stretch">
                    <Button
                      variant={selectedFolderName() === folder.folderName ? "solid" : "ghost"}
                      colorScheme={selectedFolderName() === folder.folderName ? "accent" : "neutral"}
                      justifyContent="flex-start"
                      flex="1"
                      minH="$10"
                      h="auto"
                      py="$2"
                      onClick={() => setSelectedFolderName(folder.folderName)}
                    >
                      <HStack spacing="$2" w="$full" alignItems="center">
                        <Text 
                          flex="1" 
                          textAlign="left" 
                          fontSize="$sm"
                          style={{
                            "word-break": "break-word",
                            "white-space": "normal",
                            "line-height": "1.4"
                          }}
                        >
                          {getFolderDisplayName(folder.folderName)}
                        </Text>
                        <Text fontSize="$xs" color="$neutral11" flexShrink="0">
                          {folder.items.length}
                        </Text>
                      </HStack>
                    </Button>
                    <Box display="flex" alignItems="center" flexShrink="0">
                      <IconButton
                        aria-label="编辑文件夹名称"
                        icon={<AiOutlineEdit />}
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog("folder", folder.folderName)}
                      />
                    </Box>
                  </HStack>
                )}
              </For>
            </VStack>
          </Show>
        </VStack>

        {/* 右侧内容面板 */}
        <Box flex="1">
          <Show when={selectedFolderName() === null}>
            <Box p="$8" textAlign="center">
              <Text color="$neutral11" fontSize="$lg">
                请选择左侧的文件夹查看{mediaType() === "video" ? "视频" : "音频"}标记
              </Text>
            </Box>
          </Show>

          <Show when={selectedFolderName() !== null}>
            <VStack spacing="$3" alignItems="stretch">
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$xl" fontWeight="$semibold" color="$accent10">
                  {getFolderDisplayName(selectedFolderName()!)}
                </Text>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<AiOutlineEdit />}
                  onClick={() => openEditDialog("folder", selectedFolderName()!)}
                >
                  编辑文件夹名称
                </Button>
              </HStack>

              <Accordion allowMultiple>
                <For each={selectedFolderItems()}>
                  {(media) => (
                    <AccordionItem
                      border="1px solid $neutral6"
                      borderRadius="$md"
                      mb="$2"
                      bg="$neutral2"
                    >
                      <AccordionButton
                        p="$3"
                      >
                        <HStack flex="1" spacing="$3" alignItems="stretch">
                          <Box color="$accent10" fontSize="$xl" mt="$0_5" flexShrink="0">
                            {mediaType() === "video" ? (
                              <AiOutlineVideoCamera />
                            ) : (
                              <AiOutlineAudio />
                            )}
                          </Box>
                          <VStack alignItems="flex-start" spacing="$1" flex="1" minW="0">
                            <Text 
                              fontWeight="$semibold"
                              style={{
                                "word-break": "break-word",
                                "white-space": "normal",
                                "line-height": "1.4"
                              }}
                            >
                              {getFileDisplayName(media.file_name)}
                            </Text>
                            <Text fontSize="$sm" color="$neutral11">
                              {media.marks.length} 个标记
                            </Text>
                          </VStack>
                          <Box display="flex" alignItems="center" flexShrink="0">
                            <IconButton
                              aria-label="编辑文件名称"
                              icon={<AiOutlineEdit />}
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditDialog("file", media.file_name)
                              }}
                            />
                          </Box>
                        </HStack>
                        <AccordionIcon ml="$2" flexShrink="0" alignSelf="center" />
                      </AccordionButton>
                      <AccordionPanel p="$3" bg="$neutral1">
                        <VStack spacing="$2" alignItems="stretch">
                          <For each={media.marks}>
                            {(mark, index) => (
                              <Box
                                p="$3"
                                borderRadius="$md"
                                border="1px solid $neutral6"
                                bg="$loContrast"
                                cursor="pointer"
                                onClick={() => handlePlayFromMark(media, mark.time_second)}
                              >
                                <HStack justifyContent="space-between" alignItems="flex-start">
                                  <VStack alignItems="flex-start" spacing="$1" flex="1">
                                    <HStack spacing="$2" alignItems="center">
                                      <Text fontSize="$xs" color="$neutral11">
                                        ({index() + 1})
                                      </Text>
                                      <HStack spacing="$2" alignItems="center">
                                        <BiRegularTimeFive />
                                        <Text
                                          fontSize="$sm"
                                          fontWeight="$medium"
                                          color="$accent10"
                                        >
                                          {formatTime(mark.time_second)}
                                        </Text>
                                      </HStack>
                                      <Text fontSize="$sm" fontWeight="$semibold">
                                        {mark.title}
                                      </Text>
                                    </HStack>
                                    <Show when={mark.content}>
                                      <Text fontSize="$xs" color="$neutral11" lineHeight="$5">
                                        {mark.content}
                                      </Text>
                                    </Show>
                                  </VStack>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    colorScheme="accent"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePlayFromMark(media, mark.time_second)
                                    }}
                                  >
                                    播放
                                  </Button>
                                </HStack>
                              </Box>
                            )}
                          </For>
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  )}
                </For>
              </Accordion>
            </VStack>
          </Show>
        </Box>
      </HStack>

      {/* 编辑名称对话框 */}
      <Modal opened={editModal.isOpen()} onClose={editModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>
            {editingType() === "folder" ? "编辑文件夹名称" : "编辑文件名称"}
          </ModalHeader>
          <ModalBody>
            <VStack spacing="$3" alignItems="stretch">
              <Box>
                <Text fontSize="$sm" color="$neutral11" mb="$2">
                  原始名称:
                </Text>
                <Text 
                  fontSize="$sm" 
                  fontWeight="$medium" 
                  p="$2" 
                  bg="$neutral3" 
                  borderRadius="$md"
                  style={{
                    "word-break": "break-word",
                    "white-space": "normal",
                    "line-height": "1.5"
                  }}
                >
                  {editingType() === "file" ? getFileName(editingOriginalName()) : editingOriginalName()}
                </Text>
              </Box>
              <Box>
                <Text fontSize="$sm" color="$neutral11" mb="$2">
                  显示名称:
                </Text>
                <Input
                  value={editingNewName()}
                  onInput={(e) => setEditingNewName(e.currentTarget.value)}
                  placeholder="输入自定义显示名称"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      saveCustomName()
                    }
                  }}
                />
              </Box>
              <Text fontSize="$xs" color="$neutral10">
                提示: 自定义名称仅用于显示，不会影响实际文件路径和与后端的交互。
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing="$2" w="$full" justifyContent="space-between">
              <Button
                variant="subtle"
                colorScheme="neutral"
                onClick={resetCustomName}
              >
                恢复原名
              </Button>
              <HStack spacing="$2">
                <Button variant="ghost" onClick={editModal.onClose}>
                  取消
                </Button>
                <Button colorScheme="accent" onClick={saveCustomName}>
                  保存
                </Button>
              </HStack>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Right Toolbar */}
      <SimpleRightToolbar />
    </Box>
  )
}

