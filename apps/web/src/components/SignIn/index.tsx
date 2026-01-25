import { Button, Flex, Text } from "@gravity-ui/uikit";
import { getRequest } from "../../models/api";
import { MoodValueControl } from "../MoodValueControl";
import { useState } from "react";
import { TMoodValue } from "../../models/mood/definitions";

export function SignIn() {
  const [mood, setMood] = useState<TMoodValue | undefined>(undefined);

  return (
    <Flex direction='column' gap={4} width='300px' spacing={{ p: 8 }}>
      <Text variant='header-2'>MooDuck</Text>
      <Text>Work in progress</Text>

      <MoodValueControl value={mood} onUpdate={setMood} />

      <Button
        autoFocus
        onClick={() => {
          getRequest("/api/mood/listMoodEntries");
        }}
      >
        List
      </Button>
    </Flex>
  );
}
