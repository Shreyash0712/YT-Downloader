import React, { createContext, useReducer, useContext, Dispatch } from 'react';
import { GlobalState, Action, Quality } from './types.js';

const initialState: GlobalState = {
  format: 'mp4',
  maxQuality: '1080p',
  isMergeMode: false,
  queue: [],
  isDownloading: false,
  selectedItemIndex: 0,
  isPromptOpen: false,
  promptType: null,
};

const qualities: Quality[] = ['480p', '720p', '1080p', 'best'];

function reducer(state: GlobalState, action: Action): GlobalState {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, queue: [...state.queue, action.payload] };
    case 'REMOVE_ITEM':
      return {
        ...state,
        queue: state.queue.filter((q) => q.id !== action.payload),
        selectedItemIndex: Math.max(0, Math.min(state.selectedItemIndex, state.queue.length - 2)),
      };
    case 'UPDATE_ITEM':
      return {
        ...state,
        queue: state.queue.map((q) =>
          q.id === action.payload.id ? { ...q, ...action.payload.data } : q
        ),
      };
    case 'TOGGLE_FORMAT':
      return { ...state, format: state.format === 'mp4' ? 'mp3' : 'mp4' };
    case 'CYCLE_QUALITY': {
      const currentIndex = qualities.indexOf(state.maxQuality);
      const nextIndex = (currentIndex + 1) % qualities.length;
      return { ...state, maxQuality: qualities[nextIndex] };
    }
    case 'TOGGLE_MERGE_MODE':
      return { ...state, isMergeMode: !state.isMergeMode };
    case 'SET_DOWNLOADING':
      return { ...state, isDownloading: action.payload };
    case 'MOVE_SELECTION': {
      if (state.queue.length === 0) return state;
      const step = action.payload === 'UP' ? -1 : 1;
      let nextIndex = state.selectedItemIndex + step;
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex >= state.queue.length) nextIndex = state.queue.length - 1;
      return { ...state, selectedItemIndex: nextIndex };
    }
    case 'OPEN_PROMPT':
      return { ...state, isPromptOpen: true, promptType: action.payload };
    case 'CLOSE_PROMPT':
      return { ...state, isPromptOpen: false, promptType: null };
    default:
      return state;
  }
}

const StoreContext = createContext<{ state: GlobalState; dispatch: Dispatch<Action> } | undefined>(
  undefined
);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
