import type { InterpretationItem } from "../../lib/yi/types";

const domainNames: Record<InterpretationItem["domain"], string> = {
  self: "自我", talent: "天赋", career: "事业", wealth: "财富",
  relationship: "关系", family: "家庭", rhythm: "节律",
};

const confidenceNames: Record<InterpretationItem["confidence"], string> = {
  high: "高置信", medium: "中等置信", limited: "有限置信",
};

export function DetailSection({ items }: { items: InterpretationItem[] }) {
  return (
    <section className="report-section">
      <header>
        <small>专业详批</small>
        <h1>七域详批</h1>
        <p>每一域三条观察；先读白话解释和典型场景，再展开优势、盲区与行动建议，最后按需核对专业判断、命理依据与边界提醒。</p>
      </header>
      <div className="detail-groups">
        {Object.entries(domainNames).map(([domain, label]) => (
          <section key={domain}>
            <h2>{label}</h2>
            {items.filter(item => item.domain === domain).map(item => (
              <article className={"reading-card reading-" + item.priority} key={item.id}>
                <header className="detail-summary">
                  <span>{item.professionalTitle} · {confidenceNames[item.confidence]}</span>
                  <h2>{item.innovationTitle}</h2>
                  <p>{item.plainLanguage}</p>
                </header>
                <section className="reading-scene">
                  <b>你可能见过这样的自己</b>
                  <p>{item.scenario}</p>
                </section>
                <details>
                  <summary>继续读懂这一判断</summary>
                  <div className="reading-contrast">
                    <section><b>优势版本</b><p>{item.advantageVersion}</p></section>
                    <section><b>失控版本</b><p>{item.shadowVersion}</p></section>
                  </div>
                  <section><b>自然镜像</b><p>{item.mirror}</p></section>
                  <div className="reading-actions">
                    <section><b>此刻可做</b><p>{item.actionNow}</p></section>
                    <section><b>长期练习</b><p>{item.actionLongTerm}</p></section>
                  </div>
                  <aside><b>使用边界</b><p>{item.caution}</p></aside>
                  <details className="reading-evidence">
                    <summary>为什么这样判断</summary>
                    <p><b>传统判断</b>{item.traditionalJudgment}</p>
                    <p><b>命盘依据</b>{item.basis}</p>
                    <p><b>理论传统</b>{item.sourceTradition}</p>
                    <p><b>参考依据</b>{item.sourceReferences.join("｜")}</p>
                  </details>
                </details>
              </article>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}
