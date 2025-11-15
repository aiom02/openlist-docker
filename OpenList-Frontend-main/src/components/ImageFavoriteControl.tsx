import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  SelectTrigger,
  SelectPlaceholder,
  SelectValue,
  SelectContent,
  SelectListbox,
  SelectOption,
  SelectOptionText,
  SelectOptionIndicator,
  Input,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  createDisclosure,
} from "@hope-ui/solid"
import { createSignal, createEffect, For, Show } from "solid-js"
import type { ImageFavoriteFolder } from "~/types/image-favorite"
import {
  listImageFavoriteFolders,
  createImageFavoriteFolder,
  createImageFavorite,
} from "~/utils/image-favorites"
import { useRouter } from "~/hooks"
import { notify } from "~/utils"
import { objStore } from "~/store"

interface ImageFavoriteControlProps {
  isLoggedIn: boolean
}

export default function ImageFavoriteControl(props: ImageFavoriteControlProps) {
  const { pathname } = useRouter()
  const [folders, setFolders] = createSignal<ImageFavoriteFolder[]>([])
  const [selectedFolderId, setSelectedFolderId] = createSignal<number | null>(null)
  const [loading, setLoading] = createSignal(false)
  const [note, setNote] = createSignal("")
  
  // New folder form fields
  const [newFolderName, setNewFolderName] = createSignal("")
  const [newFolderDesc, setNewFolderDesc] = createSignal("")
  
  // Modal controls
  const addToFavoriteModal = createDisclosure()
  const createFolderModal = createDisclosure()

  // Load folders when component mounts
  createEffect(() => {
    if (props.isLoggedIn) {
      loadFolders()
    } else {
      setFolders([])
    }
  })

  const loadFolders = async () => {
    try {
      setLoading(true)
      const data = await listImageFavoriteFolders()
      setFolders(data)
      
      // Auto-select first folder if exists
      if (data.length > 0 && !selectedFolderId()) {
        setSelectedFolderId(data[0].id)
      }
    } catch (error) {
      console.error("Failed to load folders:", error)
      notify.error("加载收藏文件夹失败")
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
      const newFolder = await createImageFavoriteFolder({
        name: newFolderName(),
        description: newFolderDesc(),
      })
      notify.success("文件夹创建成功")
      setNewFolderName("")
      setNewFolderDesc("")
      createFolderModal.onClose()
      
      // Reload folders and select the new one
      await loadFolders()
      if (newFolder && newFolder.id) {
        setSelectedFolderId(newFolder.id)
      }
    } catch (error) {
      console.error("Failed to create folder:", error)
      notify.error("创建文件夹失败")
    }
  }

  const handleAddToFavorite = async () => {
    if (!selectedFolderId()) {
      notify.error("请选择一个收藏文件夹")
      return
    }

    try {
      await createImageFavorite({
        folder_id: selectedFolderId()!,
        storage_id: 0, // Will be filled by backend
        original_path: pathname(),
        file_name: objStore.obj.name,
        note: note(),
        fingerprint: "",
      })
      
      notify.success("已添加到收藏")
      setNote("")
      setSelectedFolderId(null)
      addToFavoriteModal.onClose()
    } catch (error) {
      console.error("Failed to add to favorites:", error)
      notify.error("添加到收藏失败")
    }
  }

  return (
    <>
      <HStack w="$full" justifyContent="flex-end" spacing="$2">
        <Show when={props.isLoggedIn}>
          <Button
            size="sm"
            onClick={addToFavoriteModal.onOpen}
            colorScheme="accent"
          >
            添加到收藏
          </Button>
        </Show>
        <Show when={!props.isLoggedIn}>
          <Text fontSize="$sm" color="$neutral11">
            请登录后使用收藏功能
          </Text>
        </Show>
      </HStack>

      {/* 添加到收藏模态框 */}
      <Modal opened={addToFavoriteModal.isOpen()} onClose={addToFavoriteModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>添加图片到收藏</ModalHeader>
          <ModalBody>
            <VStack spacing="$3" alignItems="stretch">
              <Box>
                <Text fontSize="$sm" mb="$2" fontWeight="$medium">选择收藏文件夹</Text>
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
                <Text fontSize="$sm" mb="$2" fontWeight="$medium">备注（可选）</Text>
                <Textarea
                  placeholder="添加备注信息"
                  value={note()}
                  onInput={(e) => setNote(e.currentTarget.value)}
                  rows={3}
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing="$2">
              <Button
                onClick={handleAddToFavorite}
                disabled={!selectedFolderId()}
                colorScheme="accent"
              >
                确认添加
              </Button>
              <Button
                variant="ghost"
                onClick={addToFavoriteModal.onClose}
              >
                取消
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 新建文件夹模态框 */}
      <Modal opened={createFolderModal.isOpen()} onClose={createFolderModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>新建图片收藏文件夹</ModalHeader>
          <ModalBody>
            <VStack spacing="$3" alignItems="stretch">
              <Box>
                <Text fontSize="$sm" mb="$2" fontWeight="$medium">
                  文件夹名称 <Text as="span" color="$danger9">*</Text>
                </Text>
                <Input
                  placeholder="输入文件夹名称"
                  value={newFolderName()}
                  onInput={(e) => setNewFolderName(e.currentTarget.value)}
                />
              </Box>
              <Box>
                <Text fontSize="$sm" mb="$2" fontWeight="$medium">描述（可选）</Text>
                <Textarea
                  placeholder="输入文件夹描述"
                  value={newFolderDesc()}
                  onInput={(e) => setNewFolderDesc(e.currentTarget.value)}
                  rows={3}
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing="$2">
              <Button
                onClick={handleCreateFolder}
                disabled={!newFolderName().trim()}
                colorScheme="accent"
              >
                创建
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  createFolderModal.onClose()
                  setNewFolderName("")
                  setNewFolderDesc("")
                }}
              >
                取消
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
