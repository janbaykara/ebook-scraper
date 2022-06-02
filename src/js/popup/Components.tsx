import * as React from "react";
import { Flex, Box, Image, Text, Button } from "rebass";

export const Page: React.SFC<{
  url: string;
  moveUp: any;
  moveDown: any;
}> = ({ url, moveUp, moveDown }) => (
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
);

export const ResetButton: React.SFC<{ reset: any, styleOverride?: any }> = ({ reset, styleOverride, children }) => (
  <Button
    onClick={reset}
    css={styleOverride ? styleOverride : {
      "text-align": "right",
      background: "#FAFAFA",
      border: "1px solid red"
    }}
    color="red"
    p={1}
  >
    {children}
  </Button>
);

export const Checkbox: React.SFC<{
  checked: boolean;
  onChange: any;
}> = ({ checked, onChange, children }) => (
  <Box my={1}>
    <label>
      <input type="checkbox" checked={checked} onChange={onChange} />
      {children}
    </label>
  </Box>
);
