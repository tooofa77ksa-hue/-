---
name: arabic-kids-game-audio
description: >-
  Generates and installs the full Arabic voice + sound-effects audio package
  for the "شُعلة لغتي" (Shu'lat Lughati) kids' educational game — real TTS
  voice lines (Azure Speech / ElevenLabs, warm cheerful Arabic female voice,
  never robotic Web Speech API) plus procedurally-synthesized MP3 sound
  effects (pop/sparkle/twinkle/whoosh-style), written to
  public/audio/voice/ and public/audio/sfx/, with the manifest, READMEs,
  build and in-app verification all done automatically. Use this skill
  whenever the user asks (in Arabic or English) to "ولّد أصوات اللعبة",
  "ولّد حزمة أصوات شُعلة لغتي كاملة", "generate game audio", "generate the
  voice pack", "add sound effects to the game", or otherwise wants the
  game's missing voice/SFX audio files produced and wired up — even if they
  just say something like "الصوت ناقص" or "أضف أصوات للعبة". Also use it to
  check what's missing (which files exist vs. which need an env var) or to
  regenerate/refresh the audio manifest after adding files manually.
---

# Arabic Kids Game Audio

Generates the complete audio package (human voice lines + sound effects)
for شُعلة لغتي's `/play` game and installs it so it works with zero further
code changes. This is a real, runnable pipeline — not a checklist to follow
by hand. **Always run the bundled scripts; don't hand-roll the steps.**

## Why this skill exists

`src/game/audio/AudioManager.ts` was built from day one to gracefully
degrade: every voice line and every sound effect has a fixed filename it
*tries* to load, and silently falls back (to a WebAudio-synthesized SFX, or
to no voice at all) if the file isn't there yet. That means the game has
always worked with **zero** audio files. This skill's only job is to fill
in the optional files that make it sound better — it never needs to touch
game logic, Firestore, security rules, or question/result data, and none of
its scripts do.

## Before running anything: read the current state

1. Read `src/game/audio/AudioManager.ts` — specifically `VOICE_SLOTS`,
   `EVENT_SFX`, and the newer `EVENT_SFX_FILE` map. These are the filenames
   the running app actually looks for. If someone renamed a `GameEvent` or
   added a new one since this skill was written, the tables below need a
   matching update — don't generate files under names nothing reads.
2. Read `.claude/skills/arabic-kids-game-audio/scripts/lib/audioTable.ts` —
   this is the single source of truth for every phrase and every SFX this
   skill knows how to produce. It's already kept in sync with
   `AudioManager.ts`'s filenames (including two intentional renames — see
   the comment at the top of that file about `close_01`→`almost_01` and
   `ready_01`→`rocket_ready_01` — don't "fix" those by introducing a second,
   near-duplicate file; the existing slot already covers that phrase).

## Running the pipeline

From the project root:

```bash
npx tsx .claude/skills/arabic-kids-game-audio/scripts/run-all.ts
```

This does all ten steps the user expects in one go: generates every
synthesizable SFX, attempts voice generation via whichever TTS provider is
configured, writes/refreshes `public/audio/audio-manifest.json` and both
`README.md` files from what's actually on disk, verifies every file is a
real playable MP3, runs `npm run build`, and prints one final report. Re-run
it any time — everything is idempotent (existing files are skipped unless
you pass `--force`).

You can also run any single step on its own (each file works standalone and
is independently useful — see "Individual scripts" below), but for the
"ولّد أصوات اللعبة" trigger, just run `run-all.ts` and report back what it
printed. Don't paraphrase a fake summary — paste the real counts from its
final report block.

### Voice generation needs a TTS provider — and that's normal to not have

Voice lines require **AZURE_SPEECH_KEY** (+ `AZURE_SPEECH_REGION`, defaults
to voice `ar-SA-ZariyahNeural`) or, failing that, **ELEVENLABS_API_KEY** +
**ELEVENLABS_VOICE_ID**, read only from environment variables — never ask the
user for a key and hardcode it, never commit one. If neither is set,
`generate-voice.ts` doesn't fail the whole run: it skips just the voice step
and prints one line naming the one env var to add. That's the correct,
complete behavior for that case — don't apologize for it or try to work
around it with `Web Speech API` or any other robotic-sounding fallback; the
user has explicitly ruled that out because it doesn't fit a game for young
girls. If she says she's added the key, just re-run `run-all.ts`.

### SFX generation needs nothing — it always works

All 11 synthesizable sound effects (everything except `applause_short`) are
built offline from scratch as raw PCM samples and encoded to real MP3 via
`@breezystack/lamejs` (a pure-JS encoder — no ffmpeg, no network, no API
key). This step should never fail for lack of configuration; if it does,
something is actually broken and worth investigating rather than explaining
away.

`applause_short.mp3` is the one deliberate exception — a synthesized
"clap" from simple tones/noise sounds obviously fake, so it's left for a
real recording or a licensed SFX library. The manifest and README both
mark it clearly as missing-by-design, not as a bug.

## Individual scripts (all under `scripts/`)

- `generate-sfx.ts` — synthesizes the 11 SFX files. `--force` regenerates
  ones that already exist.
- `generate-voice.ts` — calls the configured TTS provider for all 14 voice
  phrases (10 tied to existing `GameEvent`s, 4 bonus lines — see next
  section). `--force` regenerates existing ones.
- `update-manifest.ts` — rescans `public/audio/voice/` and
  `public/audio/sfx/` from scratch and rewrites
  `public/audio/audio-manifest.json` plus both READMEs purely from what's
  actually present on disk. Safe and useful to run on its own — e.g. if the
  user manually drops in files she recorded herself or generated on
  ElevenLabs's website, running just this script picks them up correctly
  (it reads `public/audio/.generation-log.json` for provider/voice
  metadata when available, and falls back to a plain "unknown provider"
  note otherwise — it never invents metadata).
- `verify-and-build.ts` — sanity-checks every file the manifest says exists
  is a real, non-corrupt MP3 (checks the MPEG frame sync / ID3 header, not
  just that the file is non-empty), then runs `npm run build`.
- `run-all.ts` — runs all of the above in order and prints the combined
  report. This is what "ولّد أصوات اللعبة" should invoke.

`scripts/lib/` holds the shared building blocks: `audioTable.ts` (phrase +
SFX tables, described above), `pcm.ts` + `mp3.ts` (the offline synthesis →
MP3 encoding pipeline), `paths.ts` (resolves the project root and refuses
to run from the wrong directory), and `log.ts` (the small
provider/voice/timestamp log used for README metadata — never logs a key).

## The bonus voice lines aren't wired to a UI moment yet

Four of the fourteen phrases (`start_01`, `choose_game_01`, `great_01`,
`yasalam_01`) don't correspond to an existing `GameEvent` — they were
requested as general-purpose lines for future use. `AudioManager.ts` has a
`playVoiceLine(slot: string)` method ready for them, but nothing calls it.
Don't invent a call site on your own initiative (e.g. wiring `start_01`
into `ModeSelect` mount) unless the user asks for that specifically — this
skill's job is producing the audio, not redesigning when things play.
Mention in your final report that these four are generated-but-unwired if
that's their state, so she can ask for the wiring separately if she wants
it.

## After running: what to tell the user

Keep it short and concrete, matching what she actually asked for
originally — voice line counts, SFX counts, whether the build passed, and
if applicable, the one env var needed to unblock voice generation next
time. If she's watching the browser, mention she can trigger a correct/
wrong answer in any of the three `/play` games to hear the new SFX
immediately (voice lines need the TTS step to have actually run — SFX
always plays regardless, since it never needed a key).

## Guardrails (don't relitigate these — they're already decided)

- Never write an API key into any file in this repo, committed or not.
  Read only from `process.env`.
- Never generate a placeholder/silent audio file and call it done — a
  missing file (graceful, silent skip) is always better than a fake one.
- Never fall back to Web Speech API or any other robotic TTS as a
  "temporary" voice file. No voice file at all is the correct fallback —
  the game already handles that cleanly.
- Never touch Firestore schema, security rules, question/result data, auth,
  or scene/game logic from this skill. Everything it does lives under
  `public/audio/`, `src/game/audio/AudioManager.ts` (already integrated —
  don't need to re-touch it on a normal run), and its own
  `.claude/skills/arabic-kids-game-audio/` directory.
- If `AudioManager.ts`'s event tables and this skill's `audioTable.ts` ever
  drift out of sync (someone edits one without the other), fix that first —
  a manifest that promises a file for an event the code doesn't map is
  worse than not having a manifest.
