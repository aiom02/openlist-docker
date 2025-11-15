import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Button,
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
import type { MediaMark } from "~/types/media-mark"
import { listMediaMarks, createMediaMark, deleteMediaMark } from "~/utils/media-marks"
import { useRouter } from "~/hooks"
import { notify } from "~/utils"

interface MediaMarksProps {
  onJumpTo: (timeSecond: number) => void
  getCurrentTime: () => number
  isLoggedIn: boolean
}

export default function MediaMarks(props: MediaMarksProps) {
  const { pathname } = useRouter()
  const [marks, setMarks] = createSignal<MediaMark[]>([])
  const [loading, setLoading] = createSignal(false)
  const [newTitle, setNewTitle] = createSignal("")
  const [newContent, setNewContent] = createSignal("")
  
  // Modal control
  const addMarkModal = createDisclosure()

  // Load marks when component mounts or path changes
  createEffect(() => {
    console.log("MediaMarks component mounted, isLoggedIn:", props.isLoggedIn)
    if (props.isLoggedIn) {
      loadMarks()
    } else {
      setMarks([])
    }
  })

  const loadMarks = async () => {
    try {
      setLoading(true)
      const data = await listMediaMarks(pathname())
      setMarks(data)
    } catch (error) {
      console.error("Failed to load media marks:", error)
      notify.error("Failed to load media marks")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }
  }

  const handleAddMark = async () => {
    if (!newTitle().trim()) {
      notify.error("请输入标记标题")
      return
    }

    try {
      const currentTime = props.getCurrentTime()
      await createMediaMark(pathname(), {
        time_second: currentTime,
        title: newTitle(),
        content: newContent()
      })
      notify.success("标记添加成功")
      setNewTitle("")
      setNewContent("")
      addMarkModal.onClose()
      await loadMarks()
    } catch (error) {
      console.error("Failed to create mark:", error)
      notify.error("添加标记失败")
    }
  }

  const handleDeleteMark = async (mark: MediaMark) => {
    if (!confirm(`确定要删除标记 "${mark.title}" 吗？`)) {
      return
    }

    try {
      await deleteMediaMark(pathname(), { id: mark.id })
      notify.success("标记删除成功")
      await loadMarks()
    } catch (error) {
      console.error("Failed to delete mark:", error)
      notify.error("删除标记失败")
    }
  }

  const handleJumpTo = (mark: MediaMark) => {
    props.onJumpTo(mark.time_second)
  }

  return (
    <>
      <VStack w="$full" spacing="$2" alignItems="stretch">
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$lg" fontWeight="$semibold">
            媒体标记 ({marks().length})
          </Text>
          <Show when={props.isLoggedIn}>
            <Button
              size="sm"
              onClick={addMarkModal.onOpen}
              colorScheme="accent"
            >
              添加标记
            </Button>
          </Show>
        </HStack>

        <Show when={loading()}>
          <Text fontSize="$sm" color="$neutral11">加载中...</Text>
        </Show>

        <Show when={!props.isLoggedIn}>
          <Text fontSize="$sm" color="$neutral11">
            请登录后使用标记功能
          </Text>
        </Show>

        <Show when={props.isLoggedIn && marks().length === 0 && !loading()}>
          <Text fontSize="$sm" color="$neutral11">
            暂无标记，点击"添加标记"创建第一个标记
          </Text>
        </Show>

        <VStack spacing="$1" alignItems="stretch">
          <For each={marks()}>
            {(mark) => (
              <Box
                p="$2"
                borderRadius="$md"
                border="1px solid $neutral6"
                style={{ cursor: "pointer" }}
                onClick={() => handleJumpTo(mark)}
              >
                <HStack justifyContent="space-between" alignItems="flex-start">
                  <VStack alignItems="flex-start" spacing="$1" flex="1">
                    <HStack spacing="$2" alignItems="center">
                      <Text fontSize="$sm" fontWeight="$medium" color="$accent10">
                        {formatTime(mark.time_second)}
                      </Text>
                      <Text fontSize="$sm" fontWeight="$semibold">
                        {mark.title}
                      </Text>
                    </HStack>
                    <Show when={mark.content}>
                      <Text fontSize="$xs" color="$neutral11" lineHeight="$4">
                        {mark.content}
                      </Text>
                    </Show>
                  </VStack>
                  
                  <Show when={props.isLoggedIn}>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteMark(mark)
                      }}
                    >
                      删除
                    </Button>
                  </Show>
                </HStack>
              </Box>
            )}
          </For>
        </VStack>
      </VStack>

      {/* 添加标记模态框 */}
      <Modal opened={addMarkModal.isOpen()} onClose={addMarkModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>添加媒体标记</ModalHeader>
          <ModalBody>
            <VStack spacing="$3" alignItems="stretch">
              <Box>
                <Text fontSize="$sm" mb="$2" fontWeight="$medium">
                  标记标题 <Text as="span" color="$danger9">*</Text>
                </Text>
                <Input
                  placeholder="输入标记标题"
                  value={newTitle()}
                  onInput={(e) => setNewTitle(e.currentTarget.value)}
                />
              </Box>
              <Box>
                <Text fontSize="$sm" mb="$2" fontWeight="$medium">描述（可选）</Text>
                <Textarea
                  placeholder="输入标记描述"
                  value={newContent()}
                  onInput={(e) => setNewContent(e.currentTarget.value)}
                  rows={3}
                />
              </Box>
              <Text fontSize="$xs" color="$neutral11">
                当前时间点：{formatTime(props.getCurrentTime())}
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing="$2">
              <Button
                onClick={handleAddMark}
                disabled={!newTitle().trim()}
                colorScheme="accent"
              >
                添加
              </Button>
              <Button
                variant="ghost"
                onClick={addMarkModal.onClose}
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
