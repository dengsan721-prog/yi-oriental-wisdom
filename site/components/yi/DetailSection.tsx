import type { InterpretationItem } from "../../lib/yi/types";
import { SceneLineArt } from "./SceneLineArt";

const domainNames: Record<InterpretationItem["domain"], string> = {
  self: "开局 · 我是谁", talent: "技能 · 手里有什么招", career: "事业 · 去哪里闯关", wealth: "财帛 · 资源怎么流动",
  relationship: "关系 · 同伴与羁绊", family: "家族 · 来处与传承", rhythm: "节律 · 何时进退",
};

const cleanBackendTerms = (value: string) => value
  .replace(/产品支持度/g, "现实线索")
  .replace(/产品计分/g, "参考分值")
  .replace(/支持结构/g, "铺垫")
  .replace(/规则协商/g, "互动方式")
  .replace(/来自(?:EightCharAPI|排盘引擎)/g, "")
  .replace(/EightCharAPI|EightChar|排盘引擎/g, "")
  .replace(/使用边界/g, "参考范围")
  .replace(/理论传统/g, "命理传统")
  .replace(/参考依据/g, "参照线索")
  .replace(/高置信|中等置信|有限置信/g, "")
  .trim();

const detailVerse = (item: InterpretationItem) => {
  const domain = domainNames[item.domain].split(" · ")[0];
  return `${domain}先稳心，顺时不贪功；逆时先收手，留灯照来路。`;
};

export function DetailSection({ items }: { items: InterpretationItem[] }) {
  return (
    <section className="report-section detail-report">
      <header>
        <small>专业祥批</small>
        <h1>七域祥批</h1>
        <p>每一域像一段命运副本：先看伏笔，再读故事，最后带走一个能落地的小动作。</p>
      </header>
      <div className="detail-groups waterfall-grid">
        {Object.entries(domainNames).map(([domain, label]) => (
          <section key={domain}>
            <h2>{label}</h2>
            {items.filter(item => item.domain === domain).map(item => (
              <details className={"reading-card reading-" + item.priority + " waterfall-card waterfall-card--illustrated"} key={item.id}>
                <summary className="detail-summary">
                  <SceneLineArt kind="detail" />
                  <small>命盘小模块</small>
                  <span className="detail-professional-label">{cleanBackendTerms(item.professionalTitle)}</span>
                  <h2>起手式 · {cleanBackendTerms(item.innovationTitle)}</h2>
                  <p>{cleanBackendTerms(item.plainLanguage)}</p>
                  <section className="reading-scene">
                    <b>开局镜头</b>
                    <p>{cleanBackendTerms(item.scenario)}</p>
                  </section>
                  <span className="waterfall-open-hint">点开阅读 · 收起回到总览</span>
                </summary>
                <div className="waterfall-card-body">
                  <section className="xiangpi-professional"><b>命盘判断</b><p>先看这一格在命盘里的位置，再看它落到现实生活时怎样显形；不端术语吓人，只把关节说清。</p></section>
                  <section className="xiangpi-story-lead"><b>白话故事</b><p>这一卡像副本提示：顺风时怎样借势，逆风时哪里容易乱，破局时先做哪一手。</p></section>
                  <div className="reading-contrast">
                    <section><b>顺风局</b><p>{cleanBackendTerms(item.advantageVersion)}</p></section>
                    <section><b>逆风局</b><p>{cleanBackendTerms(item.shadowVersion)}</p></section>
                  </div>
                  <section><b>自然镜像</b><p>{cleanBackendTerms(item.mirror)}</p></section>
                  <div className="reading-actions">
                    <section><b>今天破局</b><p>{cleanBackendTerms(item.actionNow)}</p></section>
                    <section><b>长期练功</b><p>{cleanBackendTerms(item.actionLongTerm)}</p></section>
                  </div>
                  <section className="xiangpi-verse"><b>破局口诀 · 顺口溜</b><p>{detailVerse(item)}</p></section>
                  <aside><b>入心提醒</b><p>{cleanBackendTerms(item.caution)}</p></aside>
                  <details className="reading-evidence">
                    <summary>命盘判断</summary>
                    <p><b>命理判断</b>{cleanBackendTerms(item.traditionalJudgment)}</p>
                    <p><b>判断口径</b>{cleanBackendTerms(item.basis)}</p>
                    <p><b>命理传统</b>{cleanBackendTerms(item.sourceTradition)}</p>
                    {item.sourceReferences.map(reference => <p key={reference}><b>经典参照</b>{cleanBackendTerms(reference)}</p>)}
                  </details>
                </div>
              </details>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}
