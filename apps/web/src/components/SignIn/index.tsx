import { Flex, Text } from "@gravity-ui/uikit";
import { LoginButton } from "@telegram-auth/react";
import { useFn } from "@mooduck/react";

export function SignIn() {
  const handleTelegramAuth = useFn(async (data: unknown) => {
    // TODO: send `data` to your backend for verification using @telegram-auth/server
    console.log("Telegram auth data", data);
  });

  return (
    <Flex direction='column' gap={4} width='300px' spacing={{ p: 8 }}>
      <Text variant='header-2'>MooDuck</Text>
      <Text>Sign in with Telegram to continue.</Text>

      <LoginButton
        botUsername={import.meta.env.VITE_TELEGRAM_BOT_USERNAME}
        buttonSize='large'
        cornerRadius={8}
        showAvatar
        onAuthCallback={handleTelegramAuth}
      />
    </Flex>
  );
}
