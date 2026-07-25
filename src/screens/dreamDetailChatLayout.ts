/**
 * Layout contract for the DreamDetail “Exploring the dream” nested chat.
 *
 * The chat sits inside the page ScrollView with a bounded height so the inner
 * ScrollView can scroll independently (`nestedScrollEnabled`).
 *
 * Do NOT put `overflow: 'hidden'` on this style or on the parent Exploring card
 * (`chatSection`). On iOS/Android that clips the viewport and often steals/kills
 * nested scroll — users then only see the first section (e.g. Core Shift + one
 * paragraph) and cannot reach Reflective Questions. Also avoid `flex: 1` on the
 * card inside the page ScrollView; it can collapse the nested chat to ~0 height
 * while streaming partials arrive.
 */
export const DREAM_DETAIL_CHAT_SCROLL_MAX_HEIGHT = 400;

export const dreamDetailChatScrollViewStyle = {
  maxHeight: DREAM_DETAIL_CHAT_SCROLL_MAX_HEIGHT,
  flexGrow: 0,
} as const;

export const DREAM_DETAIL_CHAT_SCROLL_TEST_ID = 'dream-detail-chat-scroll';
