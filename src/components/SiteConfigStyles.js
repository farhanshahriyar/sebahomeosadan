/**
 * Injects dynamic CSS custom properties from site_config into the page.
 * This allows the Appearance → Primary/Accent colors to override the defaults.
 */
export default function SiteConfigStyles({ config }) {
  if (!config) return null;

  const { primary_color, accent_color } = config;

  // Only inject if at least one color is set and differs from defaults
  const hasCustomPrimary = primary_color && primary_color !== "#0d7a3e";
  const hasCustomAccent = accent_color && accent_color !== "#f48840";

  if (!hasCustomPrimary && !hasCustomAccent) return null;

  // Generate darker/lighter variants from hex
  function adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(2.55 * percent)));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + Math.round(2.55 * percent)));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + Math.round(2.55 * percent)));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  let css = ":root {\n";
  if (hasCustomPrimary) {
    css += `  --primary: ${primary_color};\n`;
    css += `  --primary-dark: ${adjustBrightness(primary_color, -20)};\n`;
    css += `  --primary-light: ${adjustBrightness(primary_color, 20)};\n`;
  }
  if (hasCustomAccent) {
    css += `  --accent: ${accent_color};\n`;
    css += `  --accent-hover: ${adjustBrightness(accent_color, 15)};\n`;
  }
  css += "}";

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
