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
