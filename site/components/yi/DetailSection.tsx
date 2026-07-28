import type { InterpretationItem } from "../../lib/yi/types";

const domainNames: Record<InterpretationItem["domain"], string> = {
  self: "开局 · 我是谁", talent: "技能 · 手里有什么招", career: "事业 · 去哪里闯关", wealth: "财帛 · 资源怎么流动",
  relationship: "关系 · 同伴与羁绊", family: "家族 · 来处与传承", rhythm: "节律 · 何时进退",
};

const cleanBackendTerms = (value: string) => value
  .replace(/产品支持度/g, "支持度线索")
  .replace(/产品计分/g, "支持度分值")
  .replace(/EightCharAPI/g, "排盘引擎")
  .replace(/使用边界/g, "参考范围")
  .replace(/理论传统/g, "命理传统")
  .replace(/参考依据/g, "参照线索")
  .replace(/高置信|中等置信|有限置信/g, "")
  .trim();

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
              <details className={"reading-card reading-" + item.priority + " waterfall-card"} key={item.id}>
                <summary className="detail-summary">
                  <small>命盘小模块</small>
                  <span className="detail-professional-label">{cleanBackendTerms(item.professionalTitle)}</span>
                  <h2>伏笔 · {cleanBackendTerms(item.innovationTitle)}</h2>
                  <p>{cleanBackendTerms(item.plainLanguage)}</p>
                  <section className="reading-scene">
                    <b>故事开场</b>
                    <p>{cleanBackendTerms(item.scenario)}</p>
                  </section>
                  <span className="waterfall-open-hint">点开阅读 · 收起回到总览</span>
                </summary>
                <div className="waterfall-card-body">
                  <section className="xiangpi-professional"><b>专业判断</b><p>先看这一格在命盘里的位置，再看它落到现实生活时怎样显形。</p></section>
                  <section><b>白话故事</b><p>这一卡不急着下结论，先把得势、失衡和当下可做的动作拆开看。</p></section>
                  <div className="reading-contrast">
                    <section><b>得势时</b><p>{cleanBackendTerms(item.advantageVersion)}</p></section>
                    <section><b>失衡时</b><p>{cleanBackendTerms(item.shadowVersion)}</p></section>
                  </div>
                  <section><b>自然镜像</b><p>{cleanBackendTerms(item.mirror)}</p></section>
                  <div className="reading-actions">
                    <section><b>此刻可做</b><p>{cleanBackendTerms(item.actionNow)}</p></section>
                    <section><b>长期练习</b><p>{cleanBackendTerms(item.actionLongTerm)}</p></section>
                  </div>
                  <aside><b>提醒</b><p>{cleanBackendTerms(item.caution)}</p></aside>
                  <details className="reading-evidence">
                    <summary>专业判断</summary>
                    <p><b>命理判断</b>{cleanBackendTerms(item.traditionalJudgment)}</p>
                    <p><b>结构口径</b>{cleanBackendTerms(item.basis)}</p>
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
