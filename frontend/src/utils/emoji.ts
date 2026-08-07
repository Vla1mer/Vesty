const ZERO_WIDTH_JOINER = "\\u200D";
const VARIATION_SELECTOR = "\\uFE0F";

const EMOJI_ONLY = new RegExp(
  `^(?:\\p{Extended_Pictographic}|\\p{Emoji_Modifier}|${VARIATION_SELECTOR}|${ZERO_WIDTH_JOINER}|\\s)+$`,
  "u"
);

const HAS_PICTOGRAPH = /\p{Extended_Pictographic}/u;
const PICTOGRAPHS = /\p{Extended_Pictographic}/gu;
const JOINERS = new RegExp(ZERO_WIDTH_JOINER, "g");

export const MAX_STANDALONE_EMOJI = 3;

const SEGMENTER =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

function countGraphemes(text: string): number {
  if (SEGMENTER) return [...SEGMENTER.segment(text)].length;

  const pictographs = text.match(PICTOGRAPHS)?.length ?? 0;
  const joiners = text.match(JOINERS)?.length ?? 0;
  return Math.max(pictographs - joiners, 0);
}

export function isStandaloneEmoji(content: string | null | undefined): boolean {
  const text = content?.trim() ?? "";
  if (!text || !HAS_PICTOGRAPH.test(text) || !EMOJI_ONLY.test(text)) return false;

  return countGraphemes(text) <= MAX_STANDALONE_EMOJI;
}
