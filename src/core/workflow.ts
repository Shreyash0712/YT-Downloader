import { GlobalState, Action } from '../state/types.js';
import { Dispatch } from 'react';
import { downloadMedia, getFinalOutputDir } from './downloader.js';
import { mergeMedia, cleanupTempDir } from './merger.js';
import { resolveBinary } from './binaries.js';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';

export async function executeWorkflow(state: GlobalState, dispatch: Dispatch<Action>) {
  dispatch({ type: 'SET_DOWNLOADING', payload: true });

  const tempDirBase = path.join(process.cwd(), '.temp_ytdl');

  try {
    if (state.isMergeMode) {
      await fs.mkdir(tempDirBase, { recursive: true });
    }

    const ytDlpPath = await resolveBinary('yt-dlp');

    for (const item of state.queue) {
      if (item.status === 'completed') continue;

      dispatch({
        type: 'UPDATE_ITEM',
        payload: { id: item.id, data: { status: 'downloading', progress: 0 } },
      });

      try {
        const downloadProcess = downloadMedia({
          url: item.url,
          title: item.title,
          type: item.type,
          format: state.format,
          maxQuality: state.maxQuality,
          isMergeMode: state.isMergeMode,
          startLimit: item.startLimit,
          endLimit: item.endLimit,
          tempDir: state.isMergeMode ? tempDirBase : undefined,
        }, ytDlpPath);

        downloadProcess.stdout?.on('data', (chunk: any) => {
          const output = chunk.toString();
          // basic regex to parse yt-dlp [download] 45.3%
          const match = output.match(/\[download\]\s+([\d\.]+)\%/);
          if (match && match[1]) {
            dispatch({
              type: 'UPDATE_ITEM',
              payload: {
                id: item.id,
                data: { progress: parseFloat(match[1]) },
              },
            });
          }
        });

        await downloadProcess;

        if (state.isMergeMode) {
          dispatch({
            type: 'UPDATE_ITEM',
            payload: { id: item.id, data: { status: 'idle', progress: 100 } },
          });
        } else {
          dispatch({ type: 'REMOVE_ITEM', payload: item.id });
        }
      } catch (err: any) {
        dispatch({
          type: 'UPDATE_ITEM',
          payload: { id: item.id, data: { status: 'error', error: err.message } },
        });
        if (state.isMergeMode) throw err; // Abort merge if an item fails
      }
    }

    if (state.isMergeMode) {
      const successfulItems = state.queue.filter(q => q.status !== 'error');
      if (successfulItems.length > 0) {
        // Update status for all to merging
        for (const item of successfulItems) {
          dispatch({
            type: 'UPDATE_ITEM',
            payload: { id: item.id, data: { status: 'merging' } },
          });
        }
        
        // Merge into the directory of the first item
        const firstItem = successfulItems[0];
        const finalDir = getFinalOutputDir(firstItem?.title || 'Merged');
        const outputExt = state.format === 'mp4' ? 'mp4' : 'mp3';
        const finalFilename = `Merged_Queue.${outputExt}`;
        
        await mergeMedia(tempDirBase, finalDir, finalFilename);

        for (const item of successfulItems) {
          dispatch({ type: 'REMOVE_ITEM', payload: item.id });
        }
      }
    }
  } catch (err: any) {
    console.error('Workflow failed:', err);
  } finally {
    if (state.isMergeMode) {
      await cleanupTempDir(tempDirBase);
    }
    dispatch({ type: 'SET_DOWNLOADING', payload: false });
  }
}
