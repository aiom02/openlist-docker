import {
  Box,
  VStack,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  createDisclosure,
  Textarea,
} from "@hope-ui/solid"
import { createSignal, createEffect, For, Show } from "solid-js"
import { useRouter, useT } from "~/hooks"
import { useNavigate } from "@solidjs/router"
import {
  listVideoFavoriteFolders,
  createVideoFavoriteFolder,
  createVideoFavorite,
} from "~/utils/video-favorites"
import type { VideoFavoriteFolder } from "~/types"
import { notify } from "~/utils"
import { objStore } from "~/store"
import { buildMediaFingerprint } from "~/utils/media-marks"

interface VideoMenuButtonProps {
  onAddedToFavorites?: () => void
}

export function VideoMenuButton(props: VideoMenuButtonProps) {
  const t = useT()
  const { pathname } = useRouter()
  const navigate = useNavigate()
  const [folders, setFolders] = createSignal<VideoFavoriteFolder[]>([])
  const [selectedFolderId, setSelectedFolderId] = createSignal<number | null>(null)
  const [note, setNote] = createSignal("")
  const [showCreateFolder, setShowCreateFolder] = createSignal(false)
  const [newFolderName, setNewFolderName] = createSignal("")
  const [newFolderDesc, setNewFolderDesc] = createSignal("")

  const addModal = createDisclosure()

  const loadFolders = async () => {
    try {
      const data = await listVideoFavoriteFolders()
      setFolders(data)
      if (data.length > 0 && !selectedFolderId()) {
        setSelectedFolderId(data[0].id)
      }
    } catch (error) {
      console.error("Failed to load folders:", error)
      notify.error(t("home.favorites.failed_load_folders"))
    }
  }

  createEffect(() => {
    if (addModal.isOpen()) {
      loadFolders()
    }
  })

  const handleCreateFolder = async () => {
    if (!newFolderName().trim()) {
      notify.error(t("home.favorites.enter_folder_name"))
      return
    }

    try {
      const newFolder = await createVideoFavoriteFolder({
        name: newFolderName(),
        description: newFolderDesc(),
      })
      notify.success(t("home.favorites.folder_created"))
      setNewFolderName("")
      setNewFolderDesc("")
      setShowCreateFolder(false)
      await loadFolders()
      setSelectedFolderId(newFolder.id)
    } catch (error) {
      console.error("Failed to create folder:", error)
      notify.error(t("home.favorites.failed_create_folder"))
    }
  }

  const handleAddToFavorites = async () => {
    if (!selectedFolderId()) {
      notify.error(t("home.favorites.select_folder_first"))
      return
    }

    try {
      const fingerprint = buildMediaFingerprint(objStore.obj)
      
      await createVideoFavorite({
        folder_id: selectedFolderId()!,
        storage_id: 0, // Will be filled by backend
        original_path: pathname(),
        file_name: objStore.obj.name,
        note: note(),
        fingerprint: fingerprint,
      })
      
      notify.success(t("home.favorites.video_added"))
      setNote("")
      addModal.onClose()
      props.onAddedToFavorites?.()
    } catch (error: any) {
      console.error("Failed to add to favorites:", error)
      if (error?.message?.includes("already exists")) {
        notify.error("该视频已在此文件夹中")
      } else {
        notify.error(t("home.favorites.failed_add_video"))
      }
    }
  }

  const handleViewFavorites = () => {
    navigate("/favorites")
  }

  const handleViewAllMarks = () => {
    navigate("/media-marks")
  }

  return (
    <>
      <Box class="video-menu-button">
        <Button
          size="sm"
          variant="outline"
          onClick={addModal.onOpen}
        >
          {t("home.video_menu.more")}
        </Button>
      </Box>

      <Modal opened={addModal.isOpen()} onClose={addModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>视频操作</ModalHeader>
          <ModalBody>
            <VStack spacing="$4" alignItems="stretch">
              <Button
                onClick={handleViewFavorites}
                variant="outline"
                w="$full"
              >
                {t("home.video_menu.view_favorites")}
              </Button>

              <Button
                onClick={handleViewAllMarks}
                variant="outline"
                w="$full"
              >
                {t("home.video_menu.view_all_bookmarks")}
              </Button>

              <Box borderTop="1px solid $neutral6" pt="$4">
                <Text fontSize="$lg" fontWeight="$semibold" mb="$3">
                  {t("home.video_menu.add_to_favorites")}
                </Text>

                <Show
                  when={!showCreateFolder()}
                  fallback={
                    <VStack spacing="$3" alignItems="stretch">
                      <input
                        type="text"
                        placeholder={t("home.favorites.folder_name")}
                        value={newFolderName()}
                        onInput={(e) => setNewFolderName(e.currentTarget.value)}
                        style={{
                          padding: "8px",
                          border: "1px solid #ccc",
                          "border-radius": "4px",
                          width: "100%",
                        }}
                      />
                      <Textarea
                        placeholder={t("home.favorites.folder_description")}
                        value={newFolderDesc()}
                        onInput={(e) => setNewFolderDesc(e.currentTarget.value)}
                        rows={2}
                      />
                      <Box display="flex" gap="$2">
                        <Button onClick={handleCreateFolder} size="sm">
                          创建
                        </Button>
                        <Button
                          onClick={() => setShowCreateFolder(false)}
                          variant="ghost"
                          size="sm"
                        >
                          取消
                        </Button>
                      </Box>
                    </VStack>
                  }
                >
                  <VStack spacing="$3" alignItems="stretch">
                    <Show
                      when={folders().length > 0}
                      fallback={
                        <Text color="$neutral11">
                          {t("home.favorites.no_folders")}
                        </Text>
                      }
                    >
                      <Box>
                        <Text fontSize="$sm" fontWeight="$medium" mb="$2">
                          {t("home.favorites.select_folder")}
                        </Text>
                        <select
                          value={selectedFolderId() || ""}
                          onChange={(e) =>
                            setSelectedFolderId(Number(e.currentTarget.value))
                          }
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #ccc",
                            "border-radius": "4px",
                          }}
                        >
                          <For each={folders()}>
                            {(folder) => (
                              <option value={folder.id}>{folder.name}</option>
                            )}
                          </For>
                        </select>
                      </Box>

                      <Box>
                        <Text fontSize="$sm" fontWeight="$medium" mb="$2">
                          {t("home.favorites.note_optional")}
                        </Text>
                        <Textarea
                          placeholder={t("home.favorites.add_note")}
                          value={note()}
                          onInput={(e) => setNote(e.currentTarget.value)}
                          rows={3}
                        />
                      </Box>

                      <Button
                        colorScheme="accent"
                        onClick={handleAddToFavorites}
                        w="$full"
                      >
                        添加到收藏
                      </Button>
                    </Show>

                    <Button
                      onClick={() => setShowCreateFolder(true)}
                      variant="ghost"
                      size="sm"
                    >
                      {t("home.favorites.create_new_folder")}
                    </Button>
                  </VStack>
                </Show>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={addModal.onClose}>
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

