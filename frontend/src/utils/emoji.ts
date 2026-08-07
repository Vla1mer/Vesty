const EMOJI_ONLY =
  /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|️|‍|\s)+$/u;

const HAS_PICTOGRAPH = /\p{Extended_Pictographic}/u;

export const MAX_STANDALONE_EMOJI = 3;

function countGraphemes(text: string): number {
  if (typeof Intl.Segmenter !== "function") return [...text].length;

  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return [...segmenter.segment(text)].length;
}

export function isStandaloneEmoji(content: string | null | undefined): boolean {
  const text = content?.trim() ?? "";
  if (!text || !HAS_PICTOGRAPH.test(text) || !EMOJI_ONLY.test(text)) return false;

  return countGraphemes(text) <= MAX_STANDALONE_EMOJI;
}
