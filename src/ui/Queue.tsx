import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useStore } from '../state/StoreContext.js';
import { QueueItem } from '../state/types.js';

export function Queue() {
  const { state } = useStore();

  if (state.queue.length === 0) {
    return (
      <Box paddingY={1} justifyContent="center">
        <Text color="gray italic">Queue is empty. Press 'a' to add a URL.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      {state.queue.map((item, index) => (
        <QueueItemRow
          key={item.id}
          item={item}
          isSelected={index === state.selectedItemIndex}
          isEditing={index === state.selectedItemIndex && state.promptType === 'edit_limits'}
        />
      ))}
    </Box>
  );
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseTimestamp(ts: string): number | null {
  const parts = ts.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function validateLimits(start: string, end: string, item: QueueItem): string | null {
  if (item.type === 'video') {
    const s = parseTimestamp(start);
    const e = parseTimestamp(end);
    if (s === null || e === null) return 'Invalid time format (use M:SS)';
    if (s >= e) return 'Start must be less than End';
    if (item.duration && e > item.duration) return 'End exceeds video duration';
    if (s < 0) return 'Start cannot be negative';
  } else {
    const s = parseInt(start, 10);
    const eStr = end.trim().toLowerCase();
    const e = eStr === 'end' ? (item.playlistCount || Infinity) : parseInt(end, 10);
    
    if (isNaN(s) || isNaN(e)) return 'Invalid index number';
    if (s >= e && eStr !== 'end') return 'Start index must be less than End index';
    if (s < 1) return 'Start index must be >= 1';
    if (item.playlistCount && e > item.playlistCount) return 'End index exceeds playlist count';
  }
  return null;
}

function QueueItemRow({ item, isSelected, isEditing }: { item: QueueItem; isSelected: boolean; isEditing: boolean }) {
  const { dispatch } = useStore();
  
  const defaultStart = item.type === 'video' ? '0:00' : '1';
  const defaultEnd = item.type === 'video' ? formatDuration(item.duration) : (item.playlistCount?.toString() || 'End');

  const [startVal, setStartVal] = useState(item.startLimit || defaultStart);
  const [endVal, setEndVal] = useState(item.endLimit || defaultEnd);
  
  const [activeField, setActiveField] = useState<'start' | 'end'>('start');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing) {
      setStartVal(item.startLimit || defaultStart);
      setEndVal(item.endLimit || defaultEnd);
      setActiveField('start');
      setErrorMsg(null);
    }
  }, [isEditing, item.startLimit, item.endLimit, defaultStart, defaultEnd]);

  useInput((input, key) => {
    if (!isEditing) return;

    if (key.tab || key.leftArrow || key.rightArrow) {
      setActiveField(prev => prev === 'start' ? 'end' : 'start');
    } else if (key.return) {
      const err = validateLimits(startVal, endVal, item);
      if (err) {
        setErrorMsg(err);
        return;
      }
      setErrorMsg(null);
      dispatch({
        type: 'UPDATE_ITEM',
        payload: {
          id: item.id,
          data: {
            startLimit: startVal,
            endLimit: endVal,
          },
        },
      });
      dispatch({ type: 'CLOSE_PROMPT' });
    }
  }, { isActive: isEditing });

  let statusText = null;
  if (item.status === 'downloading') {
    statusText = <Text color="blue"> [{item.progress || 0}%]</Text>;
  } else if (item.status === 'completed') {
    statusText = <Text color="green"> [Done]</Text>;
  } else if (item.status === 'error') {
    statusText = <Text color="red"> [Error]</Text>;
  }

  const borderColor = isSelected ? 'cyan' : 'gray';

  return (
    <Box borderStyle="round" borderColor={borderColor} paddingX={1} flexDirection="column" marginBottom={1}>
      <Box flexDirection="row" justifyContent="space-between">
        <Box flexDirection="column" width="50%">
          <Text bold wrap="truncate-end">{item.title}{statusText}</Text>
          <Text color="gray">{item.type === 'video' ? 'Video' : 'Playlist'}</Text>
        </Box>

        <Box alignItems="center">
          <Box borderStyle="round" borderColor={isEditing && activeField === 'start' ? 'green' : 'gray'} paddingX={1}>
            {isEditing && activeField === 'start' ? (
              <TextInput value={startVal} onChange={setStartVal} />
            ) : (
              <Text>{item.startLimit || defaultStart}</Text>
            )}
          </Box>
          
          <Box paddingX={1}><Text>to</Text></Box>
          
          <Box borderStyle="round" borderColor={isEditing && activeField === 'end' ? 'green' : 'gray'} paddingX={1}>
            {isEditing && activeField === 'end' ? (
              <TextInput value={endVal} onChange={setEndVal} />
            ) : (
              <Text>{item.endLimit || defaultEnd}</Text>
            )}
          </Box>
        </Box>
      </Box>
      {errorMsg && isEditing && (
        <Box marginTop={1}>
          <Text color="red">Error: {errorMsg}</Text>
        </Box>
      )}
    </Box>
  );
}
