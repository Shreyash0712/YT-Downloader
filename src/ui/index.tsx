import React, { useEffect, useState } from 'react';
import { render, useApp, Box, Text, useInput } from 'ink';
import { StoreProvider, useStore } from '../state/StoreContext.js';
import { App } from './App.js';
import { ensureDependencies } from '../core/system.js';
import { executeWorkflow } from '../core/workflow.js';

function Root() {
  const { state, dispatch } = useStore();
  const { exit } = useApp();
  const [setupStatus, setSetupStatus] = useState<{ isReady: boolean; message: string; percent?: number; error?: string }>({
    isReady: false,
    message: 'Checking system dependencies...',
  });

  useEffect(() => {
    ensureDependencies((percent, message) => {
      setSetupStatus({ isReady: false, message, percent });
    }).then(() => {
      setSetupStatus({ isReady: true, message: 'Ready' });
    }).catch((err) => {
      setSetupStatus({ isReady: false, message: 'Dependency error', error: err.message });
    });
  }, []);

  useInput((input, key) => {
    if (!setupStatus.isReady) {
      if (input === 'q' || (key && key.escape)) {
        exit();
      }
      return;
    }

    if (input === 'd' && !state.isPromptOpen && !state.isDownloading && state.queue.length > 0) {
      executeWorkflow(state, dispatch).then(() => {
        // Workflow finished
      }).catch(err => {
        console.error('Workflow error:', err);
      });
    }
  });

  if (setupStatus.error) {
    return (
      <Box flexDirection="column" padding={2} borderStyle="single" borderColor="red">
        <Text bold color="red">❌ Dependency Setup Error</Text>
        <Box marginTop={1}>
          <Text color="yellow">{setupStatus.error}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Press Q or Esc to exit.</Text>
        </Box>
      </Box>
    );
  }

  if (!setupStatus.isReady) {
    return (
      <Box flexDirection="column" padding={2} borderStyle="single" borderColor="cyanBright">
        <Text bold color="cyanBright">⚡ Mux-YT Dependency Verification & Setup</Text>
        <Box marginTop={1}>
          <Text color="white">{setupStatus.message}</Text>
        </Box>
        {typeof setupStatus.percent === 'number' && (
          <Box marginTop={1}>
            <Text color="green">[{'█'.repeat(Math.floor(setupStatus.percent / 5))}{' '.repeat(20 - Math.floor(setupStatus.percent / 5))}] </Text>
            <Text color="yellow">{setupStatus.percent}%</Text>
          </Box>
        )}
      </Box>
    );
  }

  return <App />;
}

console.clear();

render(
  <StoreProvider>
    <Root />
  </StoreProvider>
);
