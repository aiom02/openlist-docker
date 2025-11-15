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
  listAudioFavoriteFolders,
  createAudioFavoriteFolder,
  deleteAudioFavoriteFolder,
  listAudioFavorites,
  deleteAudioFavorite,
} from "~/utils/audio-favorites"
import type { AudioFavoriteFolder, AudioFavorite } from "~/types/audio-favorite"
import { notify, encodePath } from "~/utils"
import { RiSystemDeleteBinLine } from "solid-icons/ri"
import { AiOutlineAudio, AiOutlineArrowLeft } from "solid-icons/ai"
import { useNavigate } from "@solidjs/router"

export default function AudioFavoritesPage() {
  const t = useT()
  const { to } = useRouter()
  const navigate = useNavigate()
  const [folders, setFolders] = createSignal<AudioFavoriteFolder[]>([])
  const [selectedFolder, setSelectedFolder] = createSignal<AudioFavoriteFolder | null>(null)
  const [audios, setAudios] = createSignal<AudioFavorite[]>([])
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
      const data = await listAudioFavoriteFolders()
      setFolders(data)
    } catch (error) {
      console.error("Failed to load folders:", error)
      notify.error(t("home.audio_favorites.failed_load_folders"))
    } finally {
      setLoading(false)
    }
  }

  const loadAudios = async (folderId: number) => {
    try {
      setLoading(true)
      const data = await listAudioFavorites(folderId)
      setAudios(data)
    } catch (error) {
      console.error("Failed to load audios:", error)
      notify.error("加载音频失败")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName().trim()) {
      notify.error(t("home.audio_favorites.enter_folder_name"))
      return
    }

    try {
      await createAudioFavoriteFolder({
        name: newFolderName(),
        description: newFolderDesc(),
      })
      notify.success(t("home.audio_favorites.folder_created"))
      setNewFolderName("")
      setNewFolderDesc("")
      createFolderModal.onClose()
      await loadFolders()
    } catch (error) {
      console.error("Failed to create folder:", error)
      notify.error(t("home.audio_favorites.failed_create_folder"))
    }
  }

  const handleDeleteFolder = async (folder: AudioFavoriteFolder) => {
    if (!confirm(t("home.audio_favorites.delete_folder_confirm", { name: folder.name }))) {
      return
    }

    try {
      await deleteAudioFavoriteFolder(folder.id)
      notify.success(t("home.audio_favorites.folder_deleted"))
      if (selectedFolder()?.id === folder.id) {
        setSelectedFolder(null)
        setAudios([])
      }
      await loadFolders()
    } catch (error) {
      console.error("Failed to delete folder:", error)
      notify.error("删除文件夹失败")
    }
  }

  const handleDeleteAudio = async (audio: AudioFavorite) => {
    if (!confirm(t("home.audio_favorites.delete_audio_confirm", { name: audio.file_name }))) {
      return
    }

    try {
      await deleteAudioFavorite(audio.id)
      notify.success(t("home.audio_favorites.audio_removed"))
      if (selectedFolder()) {
        await loadAudios(selectedFolder()!.id)
      }
    } catch (error) {
      console.error("Failed to delete audio:", error)
      notify.error(t("home.audio_favorites.failed_remove_audio"))
    }
  }

  const handleSelectFolder = (folder: AudioFavoriteFolder) => {
    setSelectedFolder(folder)
    loadAudios(folder.id)
  }

  const handlePlayAudio = (audio: AudioFavorite) => {
    // Navigate to audio file
    // Use encodePath to handle special characters in filename
    to(encodePath(audio.original_path))
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
                {t("home.audio_favorites.title")}
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
              onClick={() => navigate("/audio-favorites")}
            >
              我的收藏
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                if (selectedFolder()) {
                  notify.info("请从音频播放器添加音频到收藏")
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
                <Text color="$neutral11">{t("home.audio_favorites.no_folders")}</Text>
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

          {/* Audios list */}
          <GridItem colSpan={{ "@initial": 12, "@md": 8 }} overflow="auto">
            <Show
              when={selectedFolder()}
              fallback={
                <Box p="$8" textAlign="center">
                  <Text color="$neutral11">选择一个文件夹查看音频</Text>
                </Box>
              }
            >
              <VStack spacing="$2" alignItems="stretch">
                <Text fontSize="$lg" fontWeight="$semibold" mb="$2">
                  {t("home.audio_favorites.audios_in", { name: selectedFolder()!.name })}
                </Text>
                <Show when={loading()}>
                  <Text color="$neutral11">{t("home.body.loading")}</Text>
                </Show>
                <Show when={!loading() && audios().length === 0}>
                  <Text color="$neutral11">{t("home.audio_favorites.no_audios")}</Text>
                </Show>
                <For each={audios()}>
                  {(audio) => (
                    <Box
                      p="$3"
                      borderRadius="$md"
                      border="1px solid $neutral6"
                      bg="$neutral2"
                      cursor="pointer"
                      onClick={() => handlePlayAudio(audio)}
                      _hover={{
                        borderColor: "$accent8",
                        bg: "$accent2",
                      }}
                    >
                      <HStack justifyContent="space-between" alignItems="flex-start">
                        <HStack spacing="$3" flex="1">
                          <Box color="$accent10" fontSize="$2xl">
                            <AiOutlineAudio />
                          </Box>
                          <VStack alignItems="flex-start" spacing="$1" flex="1">
                            <Text fontWeight="$semibold">{audio.file_name}</Text>
                            <Text fontSize="$sm" color="$neutral11">
                              {audio.original_path}
                            </Text>
                            <Show when={audio.note}>
                              <Text fontSize="$sm" color="$neutral10">
                                {audio.note}
                              </Text>
                            </Show>
                          </VStack>
                        </HStack>
                        <IconButton
                          aria-label="Remove audio"
                          icon={<RiSystemDeleteBinLine />}
                          size="sm"
                          variant="ghost"
                          colorScheme="danger"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteAudio(audio)
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
          <ModalHeader>{t("home.audio_favorites.create_folder")}</ModalHeader>
          <ModalBody>
            <VStack spacing="$3" alignItems="stretch">
              <Box>
                <Text fontSize="$sm" fontWeight="$medium" mb="$2">
                  {t("home.audio_favorites.folder_name")}
                </Text>
                <Input
                  value={newFolderName()}
                  onInput={(e) => setNewFolderName(e.currentTarget.value)}
                  placeholder="输入文件夹名称"
                />
              </Box>
              <Box>
                <Text fontSize="$sm" fontWeight="$medium" mb="$2">
                  {t("home.audio_favorites.folder_description")}
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

