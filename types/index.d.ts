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

/** The Skills picker: whether it is open and which page it shows. */
export type Picker = { isOpen: boolean; page: number }

declare module 'claude-code' {
  interface PluginState {
    'prompt-master': { run: Shaped<Run>; picker: Picker }
  }
}
