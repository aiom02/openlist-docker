import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Grid,
  GridItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
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
import type { VideoFavoriteFolder, VideoFavorite } from "~/types"
import { notify } from "~/utils"
import { RiSystemDeleteBinLine } from "solid-icons/ri"
import { AiOutlineVideoCamera, AiOutlineArrowLeft } from "solid-icons/ai"
import { useNavigate } from "@solidjs/router"

export default function VideoFavoritesPage() {
  const t = useT()
  const { to } = useRouter()
  const navigate = useNavigate()
  const [folders, setFolders] = createSignal<VideoFavoriteFolder[]>([])
  const [selectedFolder, setSelectedFolder] = createSignal<VideoFavoriteFolder | null>(null)
  const [videos, setVideos] = createSignal<VideoFavorite[]>([])
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
      const data = await listVideoFavoriteFolders()
      setFolders(data)
    } catch (error) {
      console.error("Failed to load folders:", error)
      notify.error(t("home.favorites.failed_load_folders"))
    } finally {
      setLoading(false)
    }
  }

  const loadVideos = async (folderId: number) => {
    try {
      setLoading(true)
      const data = await listVideoFavorites(folderId)
      setVideos(data)
    } catch (error) {
      console.error("Failed to load videos:", error)
      notify.error("加载视频失败")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName().trim()) {
      notify.error(t("home.favorites.enter_folder_name"))
      return
    }

    try {
      await createVideoFavoriteFolder({
        name: newFolderName(),
        description: newFolderDesc(),
      })
      notify.success(t("home.favorites.folder_created"))
      setNewFolderName("")
      setNewFolderDesc("")
      createFolderModal.onClose()
      await loadFolders()
    } catch (error) {
      console.error("Failed to create folder:", error)
      notify.error(t("home.favorites.failed_create_folder"))
    }
  }

  const handleDeleteFolder = async (folder: VideoFavoriteFolder) => {
    if (!confirm(t("home.favorites.delete_folder_confirm", { name: folder.name }))) {
      return
    }

    try {
      await deleteVideoFavoriteFolder(folder.id)
      notify.success(t("home.favorites.folder_deleted"))
      if (selectedFolder()?.id === folder.id) {
        setSelectedFolder(null)
        setVideos([])
      }
      await loadFolders()
    } catch (error) {
      console.error("Failed to delete folder:", error)
      notify.error("删除文件夹失败")
    }
  }

  const handleDeleteVideo = async (video: VideoFavorite) => {
    if (!confirm(t("home.favorites.delete_video_confirm", { name: video.file_name }))) {
      return
    }

    try {
      await deleteVideoFavorite(video.id)
      notify.success(t("home.favorites.video_removed"))
      if (selectedFolder()) {
        await loadVideos(selectedFolder()!.id)
      }
    } catch (error) {
      console.error("Failed to delete video:", error)
      notify.error(t("home.favorites.failed_remove_video"))
    }
  }

  const handleSelectFolder = (folder: VideoFavoriteFolder) => {
    setSelectedFolder(folder)
    loadVideos(folder.id)
  }

  const handlePlayVideo = (video: VideoFavorite) => {
    // Navigate to video file
    to(video.original_path)
  }

  return (
    <Box p="$4" w="$full" h="100vh">
      <VStack spacing="$4" alignItems="stretch" h="$full">
        <VStack spacing="$3" alignItems="stretch">
          <HStack justifyContent="space-between" alignItems="center">
            <HStack spacing="$3" alignItems="center">
              <IconButton
                aria-label="返回"
                icon={<AiOutlineArrowLeft />}
                size="md"
                variant="ghost"
                onClick={() => navigate(-1)}
              />
              <Text fontSize="$2xl" fontWeight="$bold">
                {t("home.favorites.title")}
              </Text>
            </HStack>
          </HStack>
          <HStack spacing="$3" justifyContent="flex-start">
            <Button
              onClick={createFolderModal.onOpen}
              colorScheme="accent"
              size="md"
            >
              新建收藏文件夹
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate("/video-favorites")}
            >
              我的收藏
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                if (selectedFolder()) {
                  notify.info("请从视频播放器添加视频到收藏")
                } else {
                  notify.warning("请先创建或选择一个文件夹")
                }
              }}
            >
              添加到收藏
            </Button>
          </HStack>
        </VStack>

        <Grid templateColumns="repeat(12, 1fr)" gap="$4" flex="1" overflow="hidden">
          {/* Folders list */}
          <GridItem colSpan={{ "@initial": 12, "@md": 4 }} overflow="auto">
            <VStack spacing="$2" alignItems="stretch">
              <Text fontSize="$lg" fontWeight="$semibold" mb="$2">
                收藏文件夹
              </Text>
              <Show when={loading() && folders().length === 0}>
                <Text color="$neutral11">{t("home.body.loading")}</Text>
              </Show>
              <Show when={!loading() && folders().length === 0}>
                <Text color="$neutral11">{t("home.favorites.no_folders")}</Text>
              </Show>
              <For each={folders()}>
                {(folder) => (
                  <Box
                    p="$3"
                    borderRadius="$md"
                    border="1px solid"
                    borderColor={
                      selectedFolder()?.id === folder.id ? "$accent9" : "$neutral6"
                    }
                    bg={selectedFolder()?.id === folder.id ? "$accent3" : "$neutral2"}
                    cursor="pointer"
                    onClick={() => handleSelectFolder(folder)}
                    _hover={{
                      borderColor: "$accent8",
                      bg: "$accent2",
                    }}
                  >
                    <HStack justifyContent="space-between" alignItems="flex-start">
                      <VStack alignItems="flex-start" spacing="$1" flex="1">
                        <Text fontWeight="$semibold">{folder.name}</Text>
                        <Show when={folder.description}>
                          <Text fontSize="$sm" color="$neutral11">
                            {folder.description}
                          </Text>
                        </Show>
                      </VStack>
                      <IconButton
                        aria-label="Delete folder"
                        icon={<RiSystemDeleteBinLine />}
                        size="sm"
                        variant="ghost"
                        colorScheme="danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFolder(folder)
                        }}
                      />
                    </HStack>
                  </Box>
                )}
              </For>
            </VStack>
          </GridItem>

          {/* Videos list */}
          <GridItem colSpan={{ "@initial": 12, "@md": 8 }} overflow="auto">
            <Show
              when={selectedFolder()}
              fallback={
                <Box p="$8" textAlign="center">
                  <Text color="$neutral11">选择一个文件夹查看视频</Text>
                </Box>
              }
            >
              <VStack spacing="$2" alignItems="stretch">
                <Text fontSize="$lg" fontWeight="$semibold" mb="$2">
                  {t("home.favorites.videos_in", { name: selectedFolder()!.name })}
                </Text>
                <Show when={loading()}>
                  <Text color="$neutral11">{t("home.body.loading")}</Text>
                </Show>
                <Show when={!loading() && videos().length === 0}>
                  <Text color="$neutral11">{t("home.favorites.no_videos")}</Text>
                </Show>
                <For each={videos()}>
                  {(video) => (
                    <Box
                      p="$3"
                      borderRadius="$md"
                      border="1px solid $neutral6"
                      bg="$neutral2"
                      cursor="pointer"
                      onClick={() => handlePlayVideo(video)}
                      _hover={{
                        borderColor: "$accent8",
                        bg: "$accent2",
                      }}
                    >
                      <HStack justifyContent="space-between" alignItems="flex-start">
                        <HStack spacing="$3" flex="1">
                          <Box color="$accent10" fontSize="$2xl">
                            <AiOutlineVideoCamera />
                          </Box>
                          <VStack alignItems="flex-start" spacing="$1" flex="1">
                            <Text fontWeight="$semibold">{video.file_name}</Text>
                            <Text fontSize="$sm" color="$neutral11">
                              {video.original_path}
                            </Text>
                            <Show when={video.note}>
                              <Text fontSize="$sm" color="$neutral10">
                                {video.note}
                              </Text>
                            </Show>
                          </VStack>
                        </HStack>
                        <IconButton
                          aria-label="Remove video"
                          icon={<RiSystemDeleteBinLine />}
                          size="sm"
                          variant="ghost"
                          colorScheme="danger"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteVideo(video)
                          }}
                        />
                      </HStack>
                    </Box>
                  )}
                </For>
              </VStack>
            </Show>
          </GridItem>
        </Grid>
      </VStack>

      {/* Create Folder Modal */}
      <Modal opened={createFolderModal.isOpen()} onClose={createFolderModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>{t("home.favorites.create_folder")}</ModalHeader>
          <ModalBody>
            <VStack spacing="$3" alignItems="stretch">
              <Box>
                <Text fontSize="$sm" fontWeight="$medium" mb="$2">
                  {t("home.favorites.folder_name")}
                </Text>
                <Input
                  value={newFolderName()}
                  onInput={(e) => setNewFolderName(e.currentTarget.value)}
                  placeholder="输入文件夹名称"
                />
              </Box>
              <Box>
                <Text fontSize="$sm" fontWeight="$medium" mb="$2">
                  {t("home.favorites.folder_description")}
                </Text>
                <Textarea
                  value={newFolderDesc()}
                  onInput={(e) => setNewFolderDesc(e.currentTarget.value)}
                  placeholder="输入描述（可选）"
                  rows={3}
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
    </Box>
  )
}

