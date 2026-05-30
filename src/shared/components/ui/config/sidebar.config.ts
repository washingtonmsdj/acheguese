export const SIDEBAR_UI_CONFIG = {
  COOKIE_NAME: "sidebar:state",
  COOKIE_MAX_AGE_SECONDS: 60 * 60 * 24 * 7,
  WIDTH: "16rem",
  MOBILE_WIDTH: "18rem",
  ICON_WIDTH: "3rem",
  KEYBOARD_SHORTCUT: "b",
  SKELETON_WIDTH_PERCENT: {
    MIN: 50,
    RANGE: 40,
  },
} as const;
