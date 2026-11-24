export type Phase = 'idle' | 'working' | 'done' | 'held' | 'error'

export type Run = {
  phase: Phase
  /** The draft as it stood before the rewrite, for Undo. */
  original: string
  /** The rewrite, kept when the box changed while it ran. */
  rewrite: string
  /** A short line for an error. */
  note: string
}

declare module 'claude-code' {
  interface PluginState {
    'prompt-master': { run: Shaped<Run> }
  }
}
