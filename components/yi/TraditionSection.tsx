import type { BirthInput, FourPillarsResult } from "../../lib/yi/types";
import { ReferenceAtlasSection } from "./ReferenceAtlasSection";

export function TraditionSection({ chart, birth }: { chart: FourPillarsResult; birth: BirthInput }) {
  return <section className="report-section tradition-section"><header><small>传统技法</small><h1>先看标准图，再读生活翻译</h1><p>相面、面痣、手纹与星座分别提供文化观察；选择最接近的一项，再与八字主盘和真实经历交叉核验。</p></header><ReferenceAtlasSection chart={chart} birth={birth} /></section>;
}
