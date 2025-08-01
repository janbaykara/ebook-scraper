//updated to use Chakra UI components instead of rebass
import { Box, Flex, Image, Text, Button, VStack } from '@chakra-ui/react';

type PageParams = {
  url: string;
  index?: number;
  moveUp?: () => void;
  moveDown?: () => void;
  deletePage?: () => void;
};

function Page({ url, moveUp, moveDown, deletePage }: PageParams) {
  return (
    <Flex
      alignItems="center"
      gap={2}
      p={2}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      bg="gray.50"
      width="100%"
    >
      <Box flex="0 0 auto">
        <Image
          src={url}
          width="120px"
          height="90px"
          objectFit="cover"
          borderRadius="sm"
          border="1px solid"
          borderColor="gray.300"
        />
      </Box>
      <Box flex="1" />
      <VStack gap={1} minWidth="80px">
        {moveUp && (
          <Button onClick={moveUp} size="xs" variant="ghost" colorPalette="blue" width="100%">
            ^
          </Button>
        )}
        {moveDown && (
          <Button onClick={moveDown} size="xs" variant="ghost" colorPalette="blue" width="100%">
            v
          </Button>
        )}
        {deletePage && (
          <Button onClick={deletePage} size="xs" variant="ghost" colorPalette="red" width="100%">
            x
          </Button>
        )}
      </VStack>
    </Flex>
  );
}

type ResetButtonParams = {
  reset: () => void;
  children: React.ReactNode;
};

function ResetButton({ reset, children }: ResetButtonParams) {
  return (
    <Button onClick={reset} colorPalette="red" variant="outline" size="sm">
      {children}
    </Button>
  );
}

type CheckboxParams = {
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  children: React.ReactNode;
};

function CheckboxComponent({ checked, onChange, children }: CheckboxParams) {
  return (
    <Box my={1}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input type="checkbox" checked={checked} onChange={onChange} />
        <Text fontSize="sm">{children}</Text>
      </label>
    </Box>
  );
}

export { Page, ResetButton, CheckboxComponent as Checkbox };
