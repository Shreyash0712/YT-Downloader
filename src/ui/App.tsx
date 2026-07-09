import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useStore } from '../state/StoreContext.js';
import { Queue } from './Queue.js';
import { Prompt } from './Prompt.js';
import Gradient from 'ink-gradient';

export function App() {
  const { state, dispatch } = useStore();
  const [terminalHeight, setTerminalHeight] = useState(process.stdout.rows || 24);

  useEffect(() => {
    const onResize = () => setTerminalHeight(process.stdout.rows);
    process.stdout.on('resize', onResize);
    return () => {
      process.stdout.off('resize', onResize);
    };
  }, []);

  useInput((input, key) => {
    if (state.isPromptOpen) {
      if (key.escape) {
        dispatch({ type: 'CLOSE_PROMPT' });
      }
      return;
    }

    if (key.upArrow) {
      dispatch({ type: 'MOVE_SELECTION', payload: 'UP' });
    } else if (key.downArrow) {
      dispatch({ type: 'MOVE_SELECTION', payload: 'DOWN' });
    } else if (key.return) {
      if (state.queue.length > 0) {
        dispatch({ type: 'OPEN_PROMPT', payload: 'edit_limits' });
      }
    } else if (input === 'a') {
      dispatch({ type: 'OPEN_PROMPT', payload: 'add_url' });
    } else if (input === 'v') {
      dispatch({ type: 'TOGGLE_FORMAT' });
    } else if (input === 'q') {
      dispatch({ type: 'CYCLE_QUALITY' });
    } else if (input === 'm') {
      dispatch({ type: 'TOGGLE_MERGE_MODE' });
    } else if (input === 'r') {
      const selectedItem = state.queue[state.selectedItemIndex];
      if (selectedItem) {
        dispatch({ type: 'REMOVE_ITEM', payload: selectedItem.id });
      }
    } else if (input === 'd') {
      // We handle download in index.tsx
    }
  });

  return (
    <Box flexDirection="column" padding={1} width="100%" minHeight={terminalHeight}>

      {/* HEADER */}
      <Box justifyContent="space-between" alignItems="center" marginBottom={1} flexWrap="wrap" gap={1}>
        <Box borderStyle="single" borderColor="cyanBright" paddingX={2}>
          <Gradient name="pastel">
            <Text bold>MUX - YT</Text>
          </Gradient>
        </Box>
        <Box flexDirection="column" alignItems="flex-end">
          <Box gap={1}>
            <Box borderStyle="round" borderColor="blue" paddingX={1}>
              <Text color="blueBright">Format: {state.format.toUpperCase()}</Text>
            </Box>
            <Box borderStyle="round" borderColor="yellow" paddingX={1}>
              <Text color="yellowBright">Res: {state.maxQuality}</Text>
            </Box>
            <Box borderStyle="round" borderColor={state.isMergeMode ? 'magenta' : 'gray'} paddingX={1}>
              <Text color={state.isMergeMode ? 'magentaBright' : 'gray'}>Merge: {state.isMergeMode ? 'ON' : 'OFF'}</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* MAIN BODY: 1/4 hotkeys, 3/4 queue */}
      <Box flexDirection="row" width="100%" gap={2} flexGrow={1}>

        {/* LEFT COLUMN: HOTKEYS */}
        <Box flexDirection="column" width="25%" borderStyle="round" borderColor="blue" padding={1}>
          <Box marginBottom={1} justifyContent="center">
            <Text bold color="blueBright" underline>HOTKEYS</Text>
          </Box>
          <Box flexDirection="column">
            <Text><Text color="yellowBright" bold> ↑ / ↓ </Text> : Navigate Queue</Text>
            <Text><Text color="yellowBright" bold> Enter </Text> : Edit Selection</Text>
            <Text><Text color="yellowBright" bold> ← / → </Text> : Switch Field</Text>
            <Text><Text color="yellowBright" bold>   a   </Text> : Add URL</Text>
            <Text><Text color="yellowBright" bold>   v   </Text> : Toggle Format</Text>
            <Text><Text color="yellowBright" bold>   q   </Text> : Cycle Quality</Text>
            <Text><Text color="yellowBright" bold>   m   </Text> : Toggle Merge</Text>
            <Text><Text color="yellowBright" bold>   r   </Text> : Remove Item</Text>
            <Text><Text color="yellowBright" bold>   d   </Text> : Start Download</Text>
            <Text><Text color="yellowBright" bold>  ESC  </Text> : Close Prompt</Text>
            <Text><Text color="yellowBright" bold> Ctrl+C </Text>: Quit App</Text>
          </Box>
        </Box>

        {/* RIGHT COLUMN: QUEUE */}
        <Box flexDirection="column" width="75%" borderStyle="round" borderColor="magenta" padding={1}>
          <Box marginBottom={1}>
            <Text bold color="magentaBright" underline>QUEUE ({state.queue.length})</Text>
          </Box>
          <Box flexDirection="column" flexGrow={1}>
            <Queue />
          </Box>
        </Box>

      </Box>

      <Prompt />
    </Box>
  );
}
