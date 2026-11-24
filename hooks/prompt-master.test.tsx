import type { CommandInfo } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'prompt-master',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

const SURFACES = ['terminal', 'desktop', 'vscode', 'mobile'] as const

// The hooks below stand for the engine: a prompt box held in `box`, and a
// model that answers with a fixed rewrite.
const engine = (on: any, box: { text: string }, sent: string[], reply = 'Better prompt') => {
  on('command.register', () => ({ value: { command: 'prompt-master' } }))
  on('prompt.read', () => ({ value: { text: box.text, cursor: box.text.length } }))
  on('prompt.fill', (_: unknown, e: { text: string }) => {
    box.text = e.text
    return { isFilled: true }
  })
  on('prompt.submit', (_: unknown, e: { text: string }) => {
    sent.push(e.text)
    return { isSubmitted: true }
  })
  on('model.complete', (_: unknown, e: { prompt: string }) => {
    sent.push(`model:${e.prompt}`)
    return {
      value: {
        isAnswered: true,
        text: reply,
        usage: {
          input_tokens: 1,
          output_tokens: 1,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
      },
    }
  })
}

test('the button rewrites the draft into the box and sends nothing', async ($, on) => {
  const box = { text: '' }
  const sent: string[] = []
  engine(on, box, sent)

  for (const surface of SURFACES) {
    box.text = 'fix my essay intro'
    sent.length = 0
    const ui = await $.ui.mount({ ...BAND, surface })

    await ui.press({ key: 'prompt-master' })
    expect(box.text).toBe('Better prompt')
    // Only the model call went out: no prompt was submitted.
    expect(sent.filter(s => !s.startsWith('model:'))).toEqual([])
    expect(sent[0]).toContain('fix my essay intro')

    expect(await ui.find({ key: 'undo' })).toBeDefined()
    await ui.press({ key: 'undo' })
    expect(box.text).toBe('fix my essay intro')
    await ui.unmount()
  }
})

test('the slash command rewrites text given after it', async ($, on) => {
  const box = { text: '' }
  const sent: string[] = []
  engine(on, box, sent, '```\nA clearer prompt\n```')

  const out = await $.command.run({ command: 'prompt-master', args: 'plan my week' } as any)

  expect(box.text).toBe('A clearer prompt')
  expect(out.text).toContain('in your box')
  expect(sent[0]).toContain('plan my week')
})

test('an empty box rewrites nothing', async ($, on) => {
  const box = { text: '   ' }
  const sent: string[] = []
  engine(on, box, sent)

  const out = await $.command.run({ command: 'prompt-master', args: '' } as any)

  expect(sent).toEqual([])
  expect(out.text).toContain('type a rough prompt')
})

const COMMANDS: CommandInfo[] = [
  { name: 'compact', description: 'Built in', source: 'builtin' },
  { name: 'trader-scan-market', description: 'Scan the market', source: 'plugin', plugin: 'trader-skill' },
  { name: 'essay-outline', description: 'Outline an essay', source: 'user' },
  { name: 'prompt-master', description: 'This mod', source: 'plugin', plugin: 'prompt-master' },
  { name: 'github:pr', description: 'An MCP prompt', source: 'mcp' },
]

test('the Skills button lists installed skills and puts the chosen one in the box', async ($, on) => {
  const box = { text: '' }
  const sent: string[] = []
  engine(on, box, sent)
  on('command.list', () => ({ value: COMMANDS }))

  for (const surface of SURFACES) {
    box.text = 'draft about stocks'
    const ui = await $.ui.mount({ ...BAND, surface })

    await ui.press({ key: 'skills' })
    // Only the person's own skills show: no built-ins, MCP prompts or this mod.
    expect(await ui.find({ key: 'skill:essay-outline' })).toBeDefined()
    expect(await ui.find({ key: 'skill:trader-scan-market' })).toBeDefined()
    expect(await ui.find({ key: 'skill:compact' })).toBeUndefined()
    expect(await ui.find({ key: 'skill:github:pr' })).toBeUndefined()
    expect(await ui.find({ key: 'skill:prompt-master' })).toBeUndefined()

    await ui.press({ key: 'skill:trader-scan-market' })
    expect(box.text).toBe('/trader-scan-market draft about stocks')
    // The picker closes, nothing was sent, and the buttons are back.
    expect(sent).toEqual([])
    expect(await ui.find({ key: 'prompt-master' })).toBeDefined()
    await ui.unmount()
  }
})

test('picking another skill swaps the command and keeps the text', async ($, on) => {
  const box = { text: '/essay-outline my JFK essay' }
  const sent: string[] = []
  engine(on, box, sent)
  on('command.list', () => ({ value: COMMANDS }))

  const ui = await $.ui.mount({ ...BAND, surface: 'mobile' })
  await ui.press({ key: 'skills' })
  await ui.press({ key: 'skill:trader-scan-market' })
  expect(box.text).toBe('/trader-scan-market my JFK essay')
  await ui.unmount()
})

test('the picker pages through many skills', async ($, on) => {
  const box = { text: '' }
  engine(on, box, [])
  const many: CommandInfo[] = Array.from({ length: 12 }, (_, i) => ({
    name: `skill-${String(i).padStart(2, '0')}`,
    description: 'A skill',
    source: 'user' as const,
  }))
  on('command.list', () => ({ value: many }))

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.press({ key: 'skills' })
  expect(await ui.find({ key: 'skill:skill-00' })).toBeDefined()
  expect(await ui.find({ key: 'skill:skill-11' })).toBeUndefined()
  await ui.press({ key: 'more' })
  expect(await ui.find({ key: 'skill:skill-11' })).toBeDefined()
  await ui.press({ key: 'close' })
  expect(await ui.find({ key: 'skills' })).toBeDefined()
  await ui.unmount()
})
