import {
  Box,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  createDisclosure,
  Badge,
} from "@hope-ui/solid"
import { Show } from "solid-js"
import { GlobalAudioPlayer } from "./GlobalAudioPlayer"
import { playlistState } from "~/store/playlist"

export function FloatingPlayerButton() {
  const playerModal = createDisclosure()

  return (
    <>
      {/* Floating Action Button */}
      <Box
        position="fixed"
        bottom="$6"
        left="$6"
        zIndex="$modal"
      >
        <Box position="relative">
          <IconButton
            aria-label="Open Player"
            icon={<span style={{ "font-size": "24px" }}>🎵</span>}
            size="lg"
            colorScheme="accent"
            borderRadius="$full"
            boxShadow="$lg"
            onClick={playerModal.onOpen}
          />
          <Show when={playlistState.items.length > 0}>
            <Badge
              position="absolute"
              top="-$1"
              right="-$1"
              colorScheme="danger"
              borderRadius="$full"
              fontSize="$xs"
            >
              {playlistState.items.length}
            </Badge>
          </Show>
        </Box>
      </Box>

      {/* Player Modal */}
      <Modal
        opened={playerModal.isOpen()}
        onClose={playerModal.onClose}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalCloseButton />
          <ModalHeader>音频播放器</ModalHeader>
          <ModalBody>
            <GlobalAudioPlayer />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
