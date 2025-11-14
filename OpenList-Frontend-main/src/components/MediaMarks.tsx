import { Box, VStack, HStack, Text, Button } from "@hope-ui/solid"
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
  const [showAddForm, setShowAddForm] = createSignal(false)
  const [newTitle, setNewTitle] = createSignal("")
  const [newContent, setNewContent] = createSignal("")

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
      notify.error("Please enter a title")
      return
    }

    try {
      const currentTime = props.getCurrentTime()
      await createMediaMark(pathname(), {
        time_second: currentTime,
        title: newTitle(),
        content: newContent()
      })
      notify.success("Mark created successfully")
      setNewTitle("")
      setNewContent("")
      setShowAddForm(false)
      await loadMarks()
    } catch (error) {
      console.error("Failed to create mark:", error)
      notify.error("Failed to create mark")
    }
  }

  const handleDeleteMark = async (mark: MediaMark) => {
    if (!confirm(`Are you sure you want to delete "${mark.title}"?`)) {
      return
    }

    try {
      await deleteMediaMark(pathname(), { id: mark.id })
      notify.success("Mark deleted successfully")
      await loadMarks()
    } catch (error) {
      console.error("Failed to delete mark:", error)
      notify.error("Failed to delete mark")
    }
  }

  const handleJumpTo = (mark: MediaMark) => {
    props.onJumpTo(mark.time_second)
  }

  return (
    <VStack w="$full" spacing="$2" alignItems="stretch">
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$lg" fontWeight="$semibold">
          Media Marks ({marks().length})
        </Text>
        <Show when={props.isLoggedIn}>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm())}
            colorScheme="accent"
          >
            {showAddForm() ? "Cancel" : "Add Mark"}
          </Button>
        </Show>
      </HStack>

      <Show when={showAddForm()}>
        <Box p="$3" borderRadius="$md" border="1px solid $neutral6" bg="$neutral2">
          <VStack spacing="$2" alignItems="stretch">
            <Text fontSize="$sm" fontWeight="$medium">Add New Mark</Text>
            <input
              type="text"
              placeholder="Enter mark title"
              value={newTitle()}
              onInput={(e) => setNewTitle(e.currentTarget.value)}
              style={{
                padding: "8px",
                border: "1px solid #ccc",
                "border-radius": "4px",
                width: "100%"
              }}
            />
            <textarea
              placeholder="Enter mark description (optional)"
              value={newContent()}
              onInput={(e) => setNewContent(e.currentTarget.value)}
              rows={2}
              style={{
                padding: "8px",
                border: "1px solid #ccc",
                "border-radius": "4px",
                width: "100%",
                resize: "vertical"
              }}
            />
            <HStack spacing="$2">
              <Button size="sm" onClick={handleAddMark} disabled={!newTitle().trim()}>
                Create
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Show>

      <Show when={loading()}>
        <Text fontSize="$sm" color="$neutral11">Loading marks...</Text>
      </Show>

      <Show when={!props.isLoggedIn}>
        <Text fontSize="$sm" color="$neutral11">
          Please log in to view and create media marks.
        </Text>
      </Show>

      <Show when={props.isLoggedIn && marks().length === 0 && !loading()}>
        <Text fontSize="$sm" color="$neutral11">
          No marks yet. Click "Add Mark" to create your first mark.
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
                    Delete
                  </Button>
                </Show>
              </HStack>
            </Box>
          )}
        </For>
      </VStack>
    </VStack>
  )
}
