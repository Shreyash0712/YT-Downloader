import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useStore } from '../state/StoreContext.js';
import { fetchMetadata } from '../core/metadata.js';
import crypto from 'node:crypto';

export function Prompt() {
  const { state, dispatch } = useStore();
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  if (!state.isPromptOpen || state.promptType !== 'add_url') {
    return null;
  }

  const promptLabel = 'Enter YouTube URL:';

  const handleSubmit = async (val: string) => {
    if (!val.trim()) {
      dispatch({ type: 'CLOSE_PROMPT' });
      return;
    }
    setIsFetching(true);
    setErrorMsg('');
    try {
      const meta = await fetchMetadata(val.trim());
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          id: crypto.randomUUID(),
          url: meta.url,
          title: meta.title,
          type: meta.type,
          status: 'idle',
          duration: meta.duration,
          playlistCount: meta.playlistCount,
        },
      });
      setInputValue(''); // Reset for next time
      dispatch({ type: 'CLOSE_PROMPT' });
    } catch (err: any) {
      setErrorMsg('Failed to fetch metadata. Check URL.');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Box marginTop={1} flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
      <Box>
        <Text color="cyan">{promptLabel} </Text>
        {isFetching ? (
          <Text color="yellow">Fetching metadata...</Text>
        ) : (
          <TextInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            placeholder="https://youtube.com/..."
          />
        )}
      </Box>
      {errorMsg && (
        <Box>
          <Text color="red">{errorMsg}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text color="gray">Press [Enter] to submit, or [Esc] to cancel (handled globally).</Text>
      </Box>
    </Box>
  );
}
