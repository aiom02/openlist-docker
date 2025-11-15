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
} from "@hope-ui/solid"
import { createSignal, createEffect, For, Show } from "solid-js"
import type { AudioFavoriteFolder } from "~/types"
import {
  listAudioFavoriteFolders,
  createAudioFavoriteFolder,
  createAudioFavorite,
} from "~/utils/audio-favorites"
import { useRouter } from "~/hooks"
import { notify } from "~/utils"
import { objStore } from "~/store"
import { buildMediaFingerprint } from "~/utils/media-marks"
import { useNavigate } from "@solidjs/router"

interface AudioFavoriteControlProps {
  isLoggedIn: boolean
}

export default function AudioFavoriteControl(props: AudioFavoriteControlProps) {
  const { pathname } = useRouter()
  const navigate = useNavigate()
  const [folders, setFolders] = createSignal<AudioFavoriteFolder[]>([])
  const [selectedFolderId, setSelectedFolderId] = createSignal<number | null>(null)
  const [loading, setLoading] = createSignal(false)
  const [showAddForm, setShowAddForm] = createSignal(false)
  const [showNewFolderForm, setShowNewFolderForm] = createSignal(false)
  const [showCreateFolderModal, setShowCreateFolderModal] = createSignal(false)
  const [note, setNote] = createSignal("")
  
  // New folder form fields
  const [newFolderName, setNewFolderName] = createSignal("")
  const [newFolderDesc, setNewFolderDesc] = createSignal("")

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
      const data = await listAudioFavoriteFolders()
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
      const newFolder = await createAudioFavoriteFolder({
        name: newFolderName(),
        description: newFolderDesc(),
      })
      notify.success("文件夹创建成功")
      setNewFolderName("")
      setNewFolderDesc("")
      setShowNewFolderForm(false)
      setShowCreateFolderModal(false)
      
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
  
  const handleGoToFavorites = () => {
    navigate("/audio-favorites")
  }

  const handleAddToFavorite = async () => {
    if (!selectedFolderId()) {
      notify.error("请选择一个收藏文件夹")
      return
    }

    try {
      const fingerprint = buildMediaFingerprint(objStore.obj)
      
      await createAudioFavorite({
        folder_id: selectedFolderId()!,
        storage_id: 0, // Will be filled by backend
        original_path: pathname(),
        file_name: objStore.obj.name,
        note: note(),
        fingerprint: fingerprint,
      })
      
      notify.success("已添加到收藏")
      setNote("")
      setShowAddForm(false)
    } catch (error) {
      console.error("Failed to add to favorites:", error)
      notify.error("添加到收藏失败")
    }
  }

  return (
    <VStack w="$full" spacing="$2" alignItems="stretch">
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$lg" fontWeight="$semibold">
          音频收藏
        </Text>
        <Show when={props.isLoggedIn}>
          <HStack spacing="$2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreateFolderModal(!showCreateFolderModal())}
            >
              新建收藏文件夹
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGoToFavorites}
            >
              我的收藏
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddForm(!showAddForm())}
              colorScheme="accent"
            >
              {showAddForm() ? "取消" : "添加到收藏"}
            </Button>
          </HStack>
        </Show>
      </HStack>

      <Show when={!props.isLoggedIn}>
        <Text fontSize="$sm" color="$neutral11">
          请登录后使用收藏功能
        </Text>
      </Show>

      {/* Standalone Create Folder Form */}
      <Show when={showCreateFolderModal()}>
        <Box p="$3" borderRadius="$md" border="1px solid $neutral6" bg="$neutral2">
          <VStack spacing="$3" alignItems="stretch">
            <Text fontSize="$sm" fontWeight="$medium">创建新收藏文件夹</Text>
            <Input
              placeholder="文件夹名称"
              value={newFolderName()}
              onInput={(e) => setNewFolderName(e.currentTarget.value)}
            />
            <Textarea
              placeholder="描述（可选）"
              value={newFolderDesc()}
              onInput={(e) => setNewFolderDesc(e.currentTarget.value)}
              rows={2}
            />
            <HStack spacing="$2">
              <Button
                size="sm"
                onClick={handleCreateFolder}
                disabled={!newFolderName().trim()}
                colorScheme="accent"
              >
                创建
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowCreateFolderModal(false)
                  setNewFolderName("")
                  setNewFolderDesc("")
                }}
              >
                取消
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Show>

      <Show when={showAddForm()}>
        <Box p="$3" borderRadius="$md" border="1px solid $neutral6" bg="$neutral2">
          <VStack spacing="$3" alignItems="stretch">
            <Text fontSize="$sm" fontWeight="$medium">添加到收藏文件夹</Text>
            
            {/* Folder Selection */}
            <Box>
              <Text fontSize="$xs" mb="$1" color="$neutral11">选择文件夹</Text>
              <HStack spacing="$2">
                <Box flex="1">
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
                </Box>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewFolderForm(!showNewFolderForm())}
                >
                  {showNewFolderForm() ? "取消" : "新建文件夹"}
                </Button>
              </HStack>
            </Box>

            {/* New Folder Form */}
            <Show when={showNewFolderForm()}>
              <Box p="$2" borderRadius="$md" bg="$neutral3">
                <VStack spacing="$2" alignItems="stretch">
                  <Text fontSize="$xs" fontWeight="$medium">创建新文件夹</Text>
                  <Input
                    size="sm"
                    placeholder="文件夹名称"
                    value={newFolderName()}
                    onInput={(e) => setNewFolderName(e.currentTarget.value)}
                  />
                  <Input
                    size="sm"
                    placeholder="描述（可选）"
                    value={newFolderDesc()}
                    onInput={(e) => setNewFolderDesc(e.currentTarget.value)}
                  />
                  <HStack spacing="$2">
                    <Button size="xs" onClick={handleCreateFolder}>
                      创建
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        setShowNewFolderForm(false)
                        setNewFolderName("")
                        setNewFolderDesc("")
                      }}
                    >
                      取消
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </Show>

            {/* Note */}
            <Box>
              <Text fontSize="$xs" mb="$1" color="$neutral11">备注（可选）</Text>
              <Textarea
                placeholder="添加备注信息"
                value={note()}
                onInput={(e) => setNote(e.currentTarget.value)}
                rows={2}
              />
            </Box>

            {/* Action Buttons */}
            <HStack spacing="$2">
              <Button
                size="sm"
                onClick={handleAddToFavorite}
                disabled={!selectedFolderId()}
                colorScheme="accent"
              >
                确认添加
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false)
                  setNote("")
                }}
              >
                取消
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Show>
    </VStack>
  )
}

