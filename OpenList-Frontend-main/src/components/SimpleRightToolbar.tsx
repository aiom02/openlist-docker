import { Box, createDisclosure, VStack, useColorMode } from "@hope-ui/solid"
import { createMemo } from "solid-js"
import { RightIcon } from "~/pages/home/toolbar/Icon"
import { CgMoreO } from "solid-icons/cg"
import { BsBookmarks, BsMoon, BsSun, BsPlayCircle } from "solid-icons/bs"
import { RiSystemRefreshLine } from "solid-icons/ri"
import { BiRegularArrowBack } from "solid-icons/bi"
import { AiOutlineHeart } from "solid-icons/ai"
import { useNavigate } from "@solidjs/router"
import { Motion } from "solid-motionone"
import { me } from "~/store"

export const SimpleRightToolbar = () => {
  const { isOpen, onToggle } = createDisclosure({
    defaultIsOpen: localStorage.getItem("more-open") === "true",
    onClose: () => localStorage.setItem("more-open", "false"),
    onOpen: () => localStorage.setItem("more-open", "true"),
  })
  const margin = createMemo(() => (isOpen() ? "$4" : "$5"))
  const navigate = useNavigate()
  const { colorMode, toggleColorMode } = useColorMode()
  
  const isLoggedIn = createMemo(() => {
    const user = me()
    return user && user.id
  })
  
  const handleGoBack = () => {
    window.history.back()
  }
  
  const handleRefresh = () => {
    window.location.reload()
  }
  
  return (
    <Box
      class="left-toolbar-box"
      pos="fixed"
      right={margin()}
      bottom={margin()}
    >
      {isOpen() ? (
        <VStack
          class="left-toolbar"
          p="$1"
          rounded="$lg"
          spacing="$1"
          bgColor="$neutral1"
          as={Motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          // @ts-ignore
          transition={{ duration: 0.2 }}
        >
          <VStack spacing="$1" class="left-toolbar-in">
            <RightIcon
              as={RiSystemRefreshLine}
              tips="refresh"
              onClick={handleRefresh}
            />
            <RightIcon
              as={BiRegularArrowBack}
              tips="go_back"
              onClick={handleGoBack}
            />
            {isLoggedIn() && (
              <RightIcon
                as={AiOutlineHeart}
                tips="my_favorites"
                onClick={() => navigate("/audio-favorites")}
              />
            )}
            {isLoggedIn() && (
              <RightIcon
                as={BsBookmarks}
                tips="my_media_marks"
                onClick={() => navigate("/media-marks")}
              />
            )}
            <RightIcon
              as={BsPlayCircle}
              tips="audio_player"
              onClick={() => navigate("/audio-player")}
            />
            <RightIcon
              as={colorMode() === "dark" ? BsSun : BsMoon}
              tips={colorMode() === "dark" ? "light_mode" : "dark_mode"}
              onClick={toggleColorMode}
            />
          </VStack>
          <RightIcon tips="more" as={CgMoreO} onClick={onToggle} />
        </VStack>
      ) : (
        <RightIcon
          class="toolbar-toggle"
          as={CgMoreO}
          onClick={onToggle}
        />
      )}
    </Box>
  )
}
