export type UserFaceSide = "left" | "center" | "right";

export const MIRROR_GUIDANCE =
  "这是一张镜面人脸图。请像平时照镜子一样对照：画面右侧是你的右脸，画面左侧是你的左脸，无需在脑中反转方向。";

export function getUserSideLabel(side: UserFaceSide): string {
  return side === "left" ? "你的左脸" : side === "right" ? "你的右脸" : "正面中线";
}

export function buildMoleDetailTitle(option: { title: string; userSide?: UserFaceSide; id: string }): string {
  const side = getUserSideLabel(option.userSide ?? "center");
  return side + " · " + option.title + " · " + option.id.replace("mole-", "");
}
