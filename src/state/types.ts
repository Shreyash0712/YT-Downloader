import { MediaType } from '../core/metadata.js';

export type Quality = '480p' | '720p' | '1080p' | 'best';
export type Format = 'mp4' | 'mp3';
export type Status = 'idle' | 'downloading' | 'merging' | 'completed' | 'error';

export interface QueueItem {
  id: string;
  url: string;
  title: string;
  type: MediaType;
  status: Status;
  startLimit?: string;
  endLimit?: string;
  progress?: number;
  error?: string;
  duration?: number;
  playlistCount?: number;
}

export interface GlobalState {
  format: Format;
  maxQuality: Quality;
  isMergeMode: boolean;
  queue: QueueItem[];
  isDownloading: boolean;
  // UI states
  selectedItemIndex: number;
  isPromptOpen: boolean;
  promptType: 'add_url' | 'edit_limits' | null;
}

export type Action =
  | { type: 'ADD_ITEM'; payload: QueueItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_ITEM'; payload: { id: string; data: Partial<QueueItem> } }
  | { type: 'TOGGLE_FORMAT' }
  | { type: 'CYCLE_QUALITY' }
  | { type: 'TOGGLE_MERGE_MODE' }
  | { type: 'SET_DOWNLOADING'; payload: boolean }
  | { type: 'MOVE_SELECTION'; payload: 'UP' | 'DOWN' }
  | { type: 'OPEN_PROMPT'; payload: 'add_url' | 'edit_limits' }
  | { type: 'CLOSE_PROMPT' };
