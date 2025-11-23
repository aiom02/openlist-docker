import { VStack, HStack, Text, IconButton } from "@hope-ui/solid"
import { useNavigate } from "@solidjs/router"
import { GlobalAudioPlayer } from "~/components"
import { useTitle } from "~/hooks"
import { BiRegularArrowBack } from "solid-icons/bi"
import { SimpleRightToolbar } from "~/components/SimpleRightToolbar"

const AudioPlayerPage = () => {
  const navigate = useNavigate()
  useTitle("音频播放器")
  
  const handleGoBack = () => {
    window.history.back()
  }

  return (
    <VStack w="$full" minH="100vh" spacing="$4" p="$4">
      {/* Header */}
      <HStack w="$full" justifyContent="space-between" alignItems="center">
        <HStack spacing="$2" alignItems="center">
          <IconButton
            aria-label="返回"
            icon={<BiRegularArrowBack />}
            size="sm"
            variant="ghost"
            onClick={handleGoBack}
          />
          <Text fontSize="$2xl" fontWeight="$bold">
            🎵 音频播放器
          </Text>
        </HStack>
      </HStack>

      {/* Player */}
      <VStack w="$full" maxW="800px" mx="auto" spacing="$4">
        <GlobalAudioPlayer />
      </VStack>
      
      {/* Right Toolbar */}
      <SimpleRightToolbar />
    </VStack>
  )
}

export default AudioPlayerPage
