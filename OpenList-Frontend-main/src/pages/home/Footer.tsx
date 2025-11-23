import { Anchor, HStack, VStack, IconButton, useColorMode } from "@hope-ui/solid"
import { Link } from "@solidjs/router"
import { AnchorWithBase } from "~/components"
import { useT } from "~/hooks"
import { me } from "~/store"
import { UserMethods } from "~/types"
import { BsMoon, BsSun } from "solid-icons/bs"

export const Footer = () => {
  const t = useT()
  const { colorMode, toggleColorMode } = useColorMode()
  
  return (
    <VStack class="footer" w="$full" py="$4">
      <HStack spacing="$1">
        <Anchor href="https://github.com/OpenListTeam/OpenList" external>
          {t("home.footer.powered_by")}
        </Anchor>
        <span>|</span>
        <AnchorWithBase
          as={Link}
          href={UserMethods.is_guest(me()) ? "/@login" : "/@manage"}
        >
          {t(UserMethods.is_guest(me()) ? "login.login" : "home.footer.manage")}
        </AnchorWithBase>
        <span>|</span>
        <IconButton
          aria-label={t(colorMode() === "dark" ? "home.toolbar.light_mode" : "home.toolbar.dark_mode")}
          icon={colorMode() === "dark" ? <BsSun /> : <BsMoon />}
          size="xs"
          variant="ghost"
          onClick={toggleColorMode}
        />
      </HStack>
    </VStack>
  )
}
