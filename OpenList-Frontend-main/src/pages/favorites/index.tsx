import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  ButtonGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  Textarea,
  createDisclosure,
  IconButton,
} from "@hope-ui/solid"
import { createSignal, createEffect, For, Show } from "solid-js"
import { useRouter, useT } from "~/hooks"
import {
  listVideoFavoriteFolders,
  createVideoFavoriteFolder,
  deleteVideoFavoriteFolder,
  listVideoFavorites,
  deleteVideoFavorite,
} from "~/utils/video-favorites"
import {
  listAudioFavoriteFolders,
  createAudioFavoriteFolder,
  deleteAudioFavoriteFolder,
  listAudioFavorites,
  deleteAudioFavorite,
} from "~/utils/audio-favorites"
import {
  listImageFavoriteFolders,
  createImageFavoriteFolder,
  deleteImageFavoriteFolder,
  listImageFavorites,
  deleteImageFavorite,
} from "~/utils/image-favorites"
import type { VideoFavoriteFolder, VideoFavorite } from "~/types"
import type { AudioFavoriteFolder, AudioFavorite } from "~/types/audio-favorite"
import type { ImageFavoriteFolder, ImageFavorite } from "~/types/image-favorite"
import { notify, encodePath } from "~/utils"
import { RiSystemDeleteBinLine } from "solid-icons/ri"
import { AiOutlineVideoCamera, AiOutlineArrowLeft, AiOutlineAudio, AiOutlinePicture } from "solid-icons/ai"
import { useNavigate } from "@solidjs/router"
import { SimpleRightToolbar } from "~/components/SimpleRightToolbar"

type MediaType = "video" | "audio" | "image"
type FavoriteFolder = VideoFavoriteFolder | AudioFavoriteFolder | ImageFavoriteFolder
type FavoriteItem = VideoFavorite | AudioFavorite | ImageFavorite

export default function FavoritesPage() {
  const t = useT()
  const { to } = useRouter()
  const navigate = useNavigate()
  
  const [mediaType, setMediaType] = createSignal<MediaType>("video")
  const [videoFolders, setVideoFolders] = createSignal<VideoFavoriteFolder[]>([])
  const [audioFolders, setAudioFolders] = createSignal<AudioFavoriteFolder[]>([])
  const [imageFolders, setImageFolders] = createSignal<ImageFavoriteFolder[]>([])
  const [selectedFolder, setSelectedFolder] = createSignal<FavoriteFolder | null>(null)
  const [items, setItems] = createSignal<FavoriteItem[]>([])
  const [loading, setLoading] = createSignal(false)

  const createFolderModal = createDisclosure()
  const [newFolderName, setNewFolderName] = createSignal("")
  const [newFolderDesc, setNewFolderDesc] = createSignal("")

  createEffect(() => {
    loadFolders()
  })

  const loadFolders = async () => {
    try {
      setLoading(true)
      if (mediaType() === "video") {
        const data = await listVideoFavoriteFolders()
        setVideoFolders(data)
      } else if (mediaType() === "audio") {
        const data = await listAudioFavoriteFolders()
        setAudioFolders(data)
      } else {
        const data = await listImageFavoriteFolders()
        setImageFolders(data)
      }
    } catch (error) {
      console.error("Failed to load folders:", error)
      notify.error("加载收藏文件夹失败")
    } finally {
      setLoading(false)
    }
  }

  const loadItems = async (folderId: number) => {
    try {
      setLoading(true)
      if (mediaType() === "video") {
        const data = await listVideoFavorites(folderId)
        setItems(data)
      } else if (mediaType() === "audio") {
        const data = await listAudioFavorites(folderId)
        setItems(data)
      } else {
        const data = await listImageFavorites(folderId)
        setItems(data)
      }
    } catch (error) {
      console.error("Failed to load items:", error)
      notify.error("加载收藏内容失败")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName().trim()) {
      notify.error("请输入文件夹名称")
      return
    }

    try {
      if (mediaType() === "video") {
        await createVideoFavoriteFolder({
          name: newFolderName(),
          description: newFolderDesc(),
        })
      } else if (mediaType() === "audio") {
        await createAudioFavoriteFolder({
          name: newFolderName(),
          description: newFolderDesc(),
        })
      } else {
        await createImageFavoriteFolder({
          name: newFolderName(),
          description: newFolderDesc(),
        })
      }
      notify.success("文件夹创建成功")
      setNewFolderName("")
      setNewFolderDesc("")
      createFolderModal.onClose()
      await loadFolders()
    } catch (error) {
      console.error("Failed to create folder:", error)
      notify.error("创建文件夹失败")
    }
  }

  const handleDeleteFolder = async (folder: FavoriteFolder) => {
    if (!confirm(`确定要删除文件夹 "${folder.name}" 吗？`)) {
      return
    }

    try {
      if (mediaType() === "video") {
        await deleteVideoFavoriteFolder(folder.id)
      } else if (mediaType() === "audio") {
        await deleteAudioFavoriteFolder(folder.id)
      } else {
        await deleteImageFavoriteFolder(folder.id)
      }
      notify.success("文件夹删除成功")
      if (selectedFolder()?.id === folder.id) {
        setSelectedFolder(null)
        setItems([])
      }
      await loadFolders()
    } catch (error) {
      console.error("Failed to delete folder:", error)
      notify.error("删除文件夹失败")
    }
  }

  const handleDeleteItem = async (item: FavoriteItem) => {
    const fileName = (item as VideoFavorite | AudioFavorite | ImageFavorite).file_name
    if (!confirm(`确定要移除 "${fileName}" 吗？`)) {
      return
    }

    try {
      if (mediaType() === "video") {
        await deleteVideoFavorite(item.id)
      } else if (mediaType() === "audio") {
        await deleteAudioFavorite(item.id)
      } else {
        await deleteImageFavorite(item.id)
      }
      notify.success("移除成功")
      if (selectedFolder()) {
        await loadItems(selectedFolder()!.id)
      }
    } catch (error) {
      console.error("Failed to delete item:", error)
      notify.error("移除失败")
    }
  }

  const handleSelectFolder = (folder: FavoriteFolder) => {
    setSelectedFolder(folder)
    loadItems(folder.id)
  }

  const handlePlayItem = (item: FavoriteItem) => {
    // Navigate to file with encodePath to handle special characters
    to(encodePath((item as VideoFavorite | AudioFavorite | ImageFavorite).original_path))
  }

  const handleMediaTypeChange = (type: MediaType) => {
    setMediaType(type)
    setSelectedFolder(null)
    setItems([])
    loadFolders()
  }

  const currentFolders = () => {
    if (mediaType() === "video") return videoFolders()
    if (mediaType() === "audio") return audioFolders()
    return imageFolders()
  }
  
  const getMediaTypeName = () => {
    if (mediaType() === "video") return "视频"
    if (mediaType() === "audio") return "音频"
    return "图片"
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
            我的收藏
          </Text>
        </HStack>
        <Button onClick={loadFolders} variant="outline">
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
          {/* 视频/音频/图片切换按钮 */}
          <VStack spacing="$2" w="$full">
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
            <Button
              w="$full"
              variant={mediaType() === "image" ? "solid" : "outline"}
              colorScheme={mediaType() === "image" ? "accent" : "neutral"}
              onClick={() => handleMediaTypeChange("image")}
              leftIcon={<AiOutlinePicture />}
            >
              图片
            </Button>
          </VStack>

          {/* 新建文件夹按钮 */}
          <Button
            w="$full"
            colorScheme="accent"
            variant="outline"
            onClick={createFolderModal.onOpen}
          >
            新建收藏文件夹
          </Button>

          {/* 文件夹列表 */}
          <Show when={loading()}>
            <Text color="$neutral11" fontSize="$sm">加载中...</Text>
          </Show>

          <Show when={!loading() && currentFolders().length === 0}>
            <Box p="$4" textAlign="center">
              <Text color="$neutral11" fontSize="$sm">
                还没有{getMediaTypeName()}收藏文件夹
              </Text>
              <Text color="$neutral10" fontSize="$xs" mt="$2">
                点击上方按钮创建一个！
              </Text>
            </Box>
          </Show>

          <Show when={!loading() && currentFolders().length > 0}>
            <VStack spacing="$2" alignItems="stretch">
              <Text fontSize="$sm" fontWeight="$semibold" color="$neutral11" mb="$1">
                收藏文件夹
              </Text>
              <For each={currentFolders()}>
                {(folder) => (
                  <HStack spacing="$1" w="$full" alignItems="center">
                    <Button
                      variant={selectedFolder()?.id === folder.id ? "solid" : "ghost"}
                      colorScheme={selectedFolder()?.id === folder.id ? "accent" : "neutral"}
                      justifyContent="space-between"
                      flex="1"
                      minH="$10"
                      h="auto"
                      py="$2"
                      onClick={() => handleSelectFolder(folder)}
                    >
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
                        {folder.name}
                      </Text>
                    </Button>
                    <IconButton
                      aria-label="删除文件夹"
                      icon={<RiSystemDeleteBinLine />}
                      size="sm"
                      variant="ghost"
                      colorScheme="danger"
                      onClick={() => handleDeleteFolder(folder)}
                    />
                  </HStack>
                )}
              </For>
            </VStack>
          </Show>
        </VStack>

        {/* 右侧内容面板 */}
        <Box flex="1">
          <Show when={selectedFolder() === null}>
            <Box p="$8" textAlign="center">
              <Text color="$neutral11" fontSize="$lg">
                请选择左侧的收藏文件夹查看内容
              </Text>
            </Box>
          </Show>

          <Show when={selectedFolder() !== null}>
            <VStack spacing="$3" alignItems="stretch">
              <HStack justifyContent="space-between" alignItems="center">
                <VStack alignItems="flex-start" spacing="$1">
                  <Text fontSize="$xl" fontWeight="$semibold" color="$accent10">
                    {selectedFolder()!.name}
                  </Text>
                  <Show when={selectedFolder()!.description}>
                    <Text fontSize="$sm" color="$neutral11">
                      {selectedFolder()!.description}
                    </Text>
                  </Show>
                </VStack>
              </HStack>

              <Show when={items().length === 0}>
                <Box p="$8" textAlign="center">
                  <Text color="$neutral11">
                    此文件夹中还没有{getMediaTypeName()}
                  </Text>
                  <Text color="$neutral10" fontSize="$sm" mt="$2">
                    从{getMediaTypeName()}预览页面添加收藏！
                  </Text>
                </Box>
              </Show>

              <For each={items()}>
                {(item) => {
                  const typedItem = item as VideoFavorite | AudioFavorite
                  return (
                    <Box
                      p="$3"
                      borderRadius="$md"
                      border="1px solid $neutral6"
                      bg="$neutral2"
                      cursor="pointer"
                      onClick={() => handlePlayItem(item)}
                      _hover={{
                        borderColor: "$accent8",
                        bg: "$accent2",
                      }}
                    >
                      <HStack justifyContent="space-between" alignItems="flex-start">
                        <HStack spacing="$3" flex="1">
                          <Box color="$accent10" fontSize="$2xl">
                            {mediaType() === "video" ? (
                              <AiOutlineVideoCamera />
                            ) : mediaType() === "audio" ? (
                              <AiOutlineAudio />
                            ) : (
                              <AiOutlinePicture />
                            )}
                          </Box>
                          <VStack alignItems="flex-start" spacing="$1" flex="1">
                            <Show 
                              when={typedItem.note}
                              fallback={
                                <Text 
                                  fontWeight="$semibold"
                                  style={{
                                    "word-break": "break-word",
                                    "white-space": "normal",
                                    "line-height": "1.4"
                                  }}
                                >
                                  {typedItem.file_name}
                                </Text>
                              }
                            >
                              <Text 
                                fontWeight="$semibold"
                                style={{
                                  "word-break": "break-word",
                                  "white-space": "normal",
                                  "line-height": "1.4"
                                }}
                              >
                                {typedItem.note}
                              </Text>
                              <Text fontSize="$sm" color="$neutral11">
                                {typedItem.file_name}
                              </Text>
                            </Show>
                          </VStack>
                        </HStack>
                        <IconButton
                          aria-label="移除"
                          icon={<RiSystemDeleteBinLine />}
                          size="sm"
                          variant="ghost"
                          colorScheme="danger"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteItem(item)
                          }}
                        />
                      </HStack>
                    </Box>
                  )
                }}
              </For>
            </VStack>
          </Show>
        </Box>
      </HStack>

      {/* 新建文件夹对话框 */}
      <Modal opened={createFolderModal.isOpen()} onClose={createFolderModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>
            新建{getMediaTypeName()}收藏文件夹
          </ModalHeader>
          <ModalBody>
            <VStack spacing="$3" alignItems="stretch">
              <Box>
                <Text fontSize="$sm" color="$neutral11" mb="$2">
                  文件夹名称 <Text as="span" color="$danger9">*</Text>
                </Text>
                <Input
                  value={newFolderName()}
                  onInput={(e) => setNewFolderName(e.currentTarget.value)}
                  placeholder="输入文件夹名称"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleCreateFolder()
                    }
                  }}
                />
              </Box>
              <Box>
                <Text fontSize="$sm" color="$neutral11" mb="$2">
                  描述（可选）
                </Text>
                <Textarea
                  value={newFolderDesc()}
                  onInput={(e) => setNewFolderDesc(e.currentTarget.value)}
                  placeholder="输入描述"
                  minH="$20"
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing="$2">
              <Button variant="ghost" onClick={createFolderModal.onClose}>
                取消
              </Button>
              <Button colorScheme="accent" onClick={handleCreateFolder}>
                创建
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Right Toolbar */}
      <SimpleRightToolbar />
    </Box>
  )
}

