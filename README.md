# Prompt Master

Prompt Master turns a rough prompt into a clearer, stronger one before you send it.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install prompt-master --marketplace jeetpsinha-max/prompt-master
```

From a shell:

```
claude plugin install prompt-master --marketplace jeetpsinha-max/prompt-master
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `jeetpsinha-max/prompt-master`, then Add plugin.

## How to use it

1. Type a rough prompt in the prompt box.
2. Press **✦ Prompt Master**, the button just above the box. Or type `/prompt-master` and press Enter (you can also put the rough prompt after the command: `/prompt-master make my essay intro better`).
3. The rewritten prompt replaces your draft in the box. Read it, edit anything you like, then send it yourself. Prompt Master never sends anything on its own.

After a rewrite, **Undo** puts your original draft back and **Try again** asks for a fresh rewrite.

## What the rewrite does

It keeps your intent and every fact you gave (names, numbers, dates, links, code), and adds what the prompt is missing: the goal, context, scope, level of detail, tone and the output format. It doesn't invent facts about you, doesn't answer the prompt, and keeps a short prompt short when that's all it needs.

## Settings

`model` picks which Claude model does the rewrite: `sonnet` (default), `opus` or `haiku`. Each rewrite is one small model call on your account.

## Where it works

Prompt Master is a Claude Code mod. It draws its button in Claude Code: the terminal, the desktop app's Code tab, VS Code and Claude Code on mobile. It can't add a button to the regular claude.ai chat box.
