import type { ReactNode } from "react";

export type SceneLineArtKind =
  | "opening"
  | "animal"
  | "career"
  | "relationship"
  | "turn"
  | "history"
  | "mature"
  | "idiom"
  | "proverb"
  | "poem"
  | "music"
  | "jay"
  | "closing"
  | "chart"
  | "story"
  | "scene"
  | "detail"
  | "herb"
  | "mountain"
  | "book"
  | "oracle"
  | "qimen"
  | "sprout"
  | "badge"
  | "fortune"
  | "zodiac";

const drawings: Record<SceneLineArtKind, ReactNode> = {
  opening: <>
    <path d="M16 60c12-25 30-36 54-36 13 0 24 3 34 10" />
    <path d="M25 58c15-6 31-5 48 4" />
    <path d="M62 23l5-9 5 9" />
  </>,
  animal: <>
    <path d="M20 53c8-18 25-28 48-28 18 0 28 8 32 24" />
    <path d="M36 34l-8-11M80 34l11-10" />
    <path d="M45 51c9 5 20 5 30 0" />
  </>,
  career: <>
    <path d="M21 60h76" />
    <path d="M30 58V37l16-10 16 10v21" />
    <path d="M69 58V24h20v34" />
    <path d="M38 45h8M75 33h7M75 43h7" />
  </>,
  relationship: <>
    <path d="M30 48c0-14 20-21 30-7 10-14 30-7 30 7 0 12-16 21-30 29-14-8-30-17-30-29Z" />
    <path d="M22 29c13-8 24-8 35 0M63 29c12-8 24-8 36 0" />
  </>,
  turn: <>
    <path d="M21 59c20 0 22-31 42-31h22" />
    <path d="M78 19l12 9-12 9" />
    <path d="M30 39l10 8 11-19" />
  </>,
  history: <>
    <path d="M28 62V24c16-8 32 8 48 0v38c-16 8-32-8-48 0Z" />
    <path d="M76 24h18v36" />
    <path d="M40 34h21M40 45h24" />
  </>,
  mature: <>
    <path d="M20 62h80" />
    <path d="M31 61c3-22 13-35 29-43 16 8 26 21 29 43" />
    <path d="M45 43c10 6 20 6 30 0" />
  </>,
  idiom: <>
    <path d="M25 22h70v43H25Z" />
    <path d="M38 34h20M38 47h42" />
    <path d="M70 23c3 14 8 25 19 33" />
  </>,
  proverb: <>
    <path d="M22 58c18-18 34-27 52-27 9 0 17 3 24 8" />
    <path d="M35 45c9 5 18 7 28 6" />
    <path d="M82 28l9-8 5 11" />
  </>,
  poem: <>
    <path d="M28 20h49l15 15v32H28Z" />
    <path d="M77 20v16h15" />
    <path d="M40 39h28M40 51h40" />
  </>,
  music: <>
    <path d="M36 56c0 6-5 10-12 10s-12-4-12-10 5-10 12-10 12 4 12 10Z" />
    <path d="M36 56V20l45-8v34" />
    <path d="M81 46c0 6-5 10-12 10s-12-4-12-10 5-10 12-10 12 4 12 10Z" />
  </>,
  jay: <>
    <path d="M34 57c0 5-5 9-11 9s-11-4-11-9 5-9 11-9 11 4 11 9Z" />
    <path d="M34 57V25c18 1 32-2 50-10v31" />
    <path d="M84 46c0 5-5 9-11 9s-11-4-11-9 5-9 11-9 11 4 11 9Z" />
  </>,
  closing: <>
    <path d="M23 62c11-25 28-38 51-38 10 0 19 2 28 7" />
    <path d="M45 52l14 12 31-34" />
    <path d="M36 36h18M68 24h14" />
  </>,
  chart: <>
    <path d="M24 20h72v44H24Z" />
    <path d="M42 20v44M60 20v44M78 20v44M24 35h72M24 50h72" />
    <path d="M31 28h5M49 43h5M67 58h5M85 28h5" />
  </>,
  story: <>
    <path d="M20 62c15-20 30-31 47-31 12 0 23 5 33 15" />
    <path d="M36 55c9-9 18-14 29-14 8 0 15 3 22 9" />
    <path d="M58 25l7-12 7 12" />
  </>,
  scene: <>
    <path d="M20 62h80" />
    <path d="M31 62V38l15-10 15 10v24" />
    <path d="M69 62V29h20v33" />
    <path d="M40 48h8M75 39h8M75 50h8" />
  </>,
  detail: <>
    <path d="M21 60c18-26 37-37 59-33" />
    <path d="M31 42c8 2 16 7 24 15" />
    <path d="M76 25l14 3-5 14" />
    <path d="M63 56c9-9 18-13 29-13" />
  </>,
  herb: <>
    <path d="M58 65V24" />
    <path d="M58 48c-18-2-29-12-33-29 17 1 28 10 33 29Z" />
    <path d="M58 38c18-3 30-13 35-28-17 0-30 10-35 28Z" />
    <path d="M58 62c14-2 24-10 29-23-14 0-24 8-29 23Z" />
    <path d="M28 67h61" />
  </>,
  mountain: <>
    <path d="M18 64h84" />
    <path d="M27 63l22-38 16 24 12-16 19 30" />
    <path d="M49 25l7 15 9-8" />
    <path d="M40 55c14-6 27-6 40 0" />
  </>,
  book: <>
    <path d="M22 23c15-7 27-5 38 4v43c-11-9-23-11-38-4Z" />
    <path d="M60 27c11-9 23-11 38-4v43c-15-7-27-5-38 4Z" />
    <path d="M60 27v43M34 37h14M72 37h14M34 49h18M72 49h18" />
  </>,
  oracle: <>
    <path d="M38 19h44l5 50H33Z" />
    <path d="M34 27h52M36 60h48" />
    <path d="M46 18l-5-12M56 18l-1-14M66 18l4-13M76 18l9-10" />
    <path d="M49 35h22M47 46h26" />
  </>,
  qimen: <>
    <circle cx="60" cy="42" r="26" />
    <path d="M60 16v52M34 42h52M42 24l36 36M78 24 42 60" />
    <path d="M60 6l6 12h-12ZM60 78l-6-12h12ZM18 42l12-6v12ZM102 42l-12 6V36Z" />
  </>,
  sprout: <>
    <path d="M60 68V36" />
    <path d="M60 48c-15-1-25-10-30-25 15 0 26 8 30 25Z" />
    <path d="M60 40c15-1 26-9 30-24-16 0-26 8-30 24Z" />
    <path d="M31 69h58" />
    <path d="M25 58c8 6 15 9 23 10M95 58c-8 6-15 9-23 10" />
  </>,
  badge: <>
    <circle cx="60" cy="36" r="22" />
    <path d="M48 58l-7 15 19-8 19 8-7-15" />
    <path d="M50 36l7 7 14-16" />
    <path d="M38 18l-9-8M82 18l9-8" />
  </>,
  fortune: <>
    <path d="M18 64c16-22 34-32 54-30 13 1 23 6 30 16" />
    <path d="M33 57c9-8 18-12 28-12 9 0 17 3 25 9" />
    <circle cx="36" cy="24" r="8" />
    <path d="M36 32v19M28 42h16M36 51l-8 13M36 51l10 13" />
  </>,
  zodiac: <>
    <circle cx="60" cy="39" r="25" />
    <path d="M31 39c11-22 47-28 58 0" />
    <path d="M42 54c10 10 26 12 38 0" />
    <path d="M47 35h1M73 35h1" />
    <path d="M60 16V7M41 23l-7-7M79 23l7-7M60 64v9" />
  </>,
};

export function SceneLineArt({
  kind,
  className = "",
}: {
  kind: SceneLineArtKind;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={`scene-line-art scene-line-art--${kind}${className ? ` ${className}` : ""}`}
      focusable="false"
      viewBox="0 0 120 80"
    >
      {drawings[kind]}
    </svg>
  );
}

export function CollapseSectionButton({
  label = "收起，回到总览",
  quiet = false,
}: {
  label?: string;
  quiet?: boolean;
}) {
  return <button className={quiet ? "collapse-section-button collapse-section-button--quiet" : "collapse-section-button"} data-collapse-section="true" type="button">{label}</button>;
}
