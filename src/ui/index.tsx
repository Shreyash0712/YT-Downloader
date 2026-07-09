import React, { useEffect } from 'react';
import { render, useApp } from 'ink';
import { StoreProvider, useStore } from '../state/StoreContext.js';
import { App } from './App.js';
import { checkDependencies } from '../core/system.js';
import { executeWorkflow } from '../core/workflow.js';
import { useInput } from 'ink';

function Root() {
  const { state, dispatch } = useStore();
  const { exit } = useApp();

  useEffect(() => {
    checkDependencies().catch((err) => {
      console.error(err.message);
      exit();
    });
  }, [exit]);

  useInput((input, key) => {
    if (input === 'd' && !state.isPromptOpen && !state.isDownloading && state.queue.length > 0) {
      executeWorkflow(state, dispatch).then(() => {
        // Workflow finished
      }).catch(err => {
        console.error('Workflow error:', err);
      });
    }
  });

  return <App />;
}

console.clear();

render(
  <StoreProvider>
    <Root />
  </StoreProvider>
);
