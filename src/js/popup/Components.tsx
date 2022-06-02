import * as React from "react";
import { Flex, Box, Image, Text, Button } from "rebass";

interface PageParams {
  url: any,
  moveUp: any,
  moveDown: any
}

function Page({ url, moveUp, moveDown }: PageParams) {
  return (
    <Flex key={url} alignItems="center">
      <Box>
        <Image src={url} my={1} width={0.95} height="100px" />
      </Box>
      <Flex flexDirection="column" justifyContent="around" width={0.05}>
        {moveUp && (
          <Text css={{ cursor: "pointer" }} onClick={moveUp}>
            ⬆️
          </Text>
        )}
        {moveDown && (
          <Text css={{ cursor: "pointer" }} onClick={moveDown}>
            ⬇️
          </Text>
        )}
      </Flex>
    </Flex>
  )
};

interface ResetButtonParams {
  reset: any,
  children: any
}

function ResetButton({ reset, children }: ResetButtonParams) {
  return (
    <Button
      onClick={reset}
      css={{
        "text-align": "right",
        background: "#FAFAFA",
        border: "1px solid red"
      }}
      color="red"
      p={1}
    >
      {children}
    </Button>
  )
};

interface CheckboxParams {
  checked: boolean,
  onChange: any,
  children: any
}

function Checkbox({ checked, onChange, children }: CheckboxParams) {
  return (
    <Box my={1}>
      <label>
        <input type="checkbox" checked={checked} onChange={onChange} />
        {children}
      </label>
    </Box>
  )
};

export { Page, ResetButton, Checkbox };