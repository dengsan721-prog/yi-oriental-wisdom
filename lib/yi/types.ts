export type ElementName = "木" | "火" | "土" | "金" | "水";

export type BirthInput = {
  name: string;
  date: string;
  time: string | null;
  location: string;
  gender: "female" | "male" | "unspecified";
  timeConfidence: "exact" | "approximate" | "unknown";
};

export type Pillar = {
  stem: string;
  branch: string;
  element: ElementName;
  branchElement: ElementName;
  label: string;
};

export type FourPillarsResult = {
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null };
  elementCounts: Record<ElementName, number>;
  confidence: "high" | "medium" | "limited";
  disclaimer: string;
};
