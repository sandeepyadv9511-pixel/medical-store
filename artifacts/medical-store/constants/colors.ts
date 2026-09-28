/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#16324F',
    tint: '#0D8B8B',

    // Core surfaces
    background: '#F7FBFA',
    foreground: '#16324F',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#16324F',

    // Primary action color (buttons, links, active states)
    primary: '#0D8B8B',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E6F3F0',
    secondaryForeground: '#1E5E5B',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EDF4F2',
    mutedForeground: '#66807D',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#E9F6F1',
    accentForeground: '#0D6F68',

    // Destructive actions (delete, error states)
    destructive: '#D95B5B',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#D5E5E1',
    input: '#C9DDD8',
  },

  dark: {
    text: '#E9F5F2',
    tint: '#56C7B8',
    background: '#102624',
    foreground: '#E9F5F2',
    card: '#17332F',
    cardForeground: '#E9F5F2',
    primary: '#56C7B8',
    primaryForeground: '#102624',
    secondary: '#24453F',
    secondaryForeground: '#D6F1EA',
    muted: '#1A3733',
    mutedForeground: '#9BBAB2',
    accent: '#245249',
    accentForeground: '#CBECE4',
    destructive: '#F07A7A',
    destructiveForeground: '#201313',
    border: '#2B4C46',
    input: '#3A5F57',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 16,
};

export default colors;
