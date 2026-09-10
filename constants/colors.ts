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
    text: '#F6F0E4',
    tint: '#D6A84A',
    background: '#0B0B0A',
    foreground: '#F6F0E4',
    card: '#151513',
    cardForeground: '#F6F0E4',
    primary: '#D6A84A',
    primaryForeground: '#17130A',
    secondary: '#201E19',
    secondaryForeground: '#E8D7B5',
    muted: '#24221D',
    mutedForeground: '#9A9386',
    accent: '#332A18',
    accentForeground: '#F0C96A',
    destructive: '#D96B62',
    destructiveForeground: '#FFF8F4',
    border: '#302C24',
    input: '#27241E',
  },
  dark: {
    text: '#F6F0E4',
    tint: '#D6A84A',
    background: '#0B0B0A',
    foreground: '#F6F0E4',
    card: '#151513',
    cardForeground: '#F6F0E4',
    primary: '#D6A84A',
    primaryForeground: '#17130A',
    secondary: '#201E19',
    secondaryForeground: '#E8D7B5',
    muted: '#24221D',
    mutedForeground: '#9A9386',
    accent: '#332A18',
    accentForeground: '#F0C96A',
    destructive: '#D96B62',
    destructiveForeground: '#FFF8F4',
    border: '#302C24',
    input: '#27241E',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
