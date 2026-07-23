import { YiLishuGlyph } from "./YiLishuGlyph";

type YiBrandMarkProps = {
  variant?: "hero" | "compact";
  rings?: boolean;
};

export function YiBrandMark({
  variant = "hero",
  rings = variant === "hero",
}: YiBrandMarkProps) {
  return (
    <span className={`yi-brand-mark yi-brand-mark--${variant}`}>
      {rings && Array.from({ length: 5 }, (_, index) => (
        <span className={`mark-ring r${index + 1}`} aria-hidden="true" key={index} />
      ))}
      <YiLishuGlyph />
    </span>
  );
}
