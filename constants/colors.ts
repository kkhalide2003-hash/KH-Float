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
    text: '#F7F2E8',
    tint: '#D7A33D',
    background: '#0B0B0A',
    foreground: '#F7F2E8',
    card: '#151513',
    cardForeground: '#F7F2E8',
    primary: '#D7A33D',
    primaryForeground: '#0B0B0A',
    secondary: '#211F19',
    secondaryForeground: '#F7F2E8',
    muted: '#1B1A17',
    mutedForeground: '#A9A397',
    accent: '#B9892F',
    accentForeground: '#0B0B0A',
    destructive: '#D4655A',
    destructiveForeground: '#FFF8F2',
    border: '#302C23',
    input: '#29261F',
    success: '#7EBB86',
    overlay: '#10100E',
  },
  radius: 22,
};

export default colors;
