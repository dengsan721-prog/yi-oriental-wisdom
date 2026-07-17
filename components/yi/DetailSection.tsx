import type { InterpretationItem } from "../../lib/yi/types";

const domainNames: Record<InterpretationItem["domain"], string> = {
  self: "自我", talent: "天赋", career: "事业", wealth: "财富",
  relationship: "关系", family: "家庭", rhythm: "节律",
};

const confidenceNames: Record<InterpretationItem["confidence"], string> = {
  high: "高置信", medium: "中等置信", limited: "有限置信",
};

function firstSentence(text: string) {
  return text.match(/^.*?[。！？]/)?.[0] ?? text;
}

export function DetailSection({ items }: { items: InterpretationItem[] }) {
  return (
    <section className="report-section">
      <header>
        <small>专业详批</small>
        <h1>七域详批</h1>
        <p>每一域三条观察；先读一句白话摘要，需要时再展开依据、场景与行动。</p>
      </header>
      <div className="detail-groups">
        {Object.entries(domainNames).map(([domain, label]) => (
          <section key={domain}>
            <h2>{label}</h2>
            {items.filter(item => item.domain === domain).map(item => (
              <details key={item.id}>
                <summary>
                  <span className="detail-summary">
                    <b>{item.professionalTitle}</b>
                    <small>{item.innovationTitle} · {confidenceNames[item.confidence]}</small>
                    <span>{firstSentence(item.plainLanguage)}</span>
                  </span>
                </summary>
                <div className="seven-layers">
                  <p><b>专业判断</b>{item.professionalTitle}<small>创新叫法：{item.innovationTitle}</small></p>
                  <p><b>命理依据</b>{item.basis}</p>
                  <p><b>白话解释</b>{item.plainLanguage}</p>
                  <p><b>典型场景</b>{item.scenario}</p>
                  <p><b>自然镜像</b>{item.mirror}</p>
                  <p><b>行动建议</b>{item.action}</p>
                  <p><b>边界提醒</b>{item.caution}</p>
                  <p><b>理论传统</b>{item.sourceTradition}<small>规则版本：{item.sourceRuleIds.join("、")}</small></p>
                  <p><b>参考依据</b>{item.sourceReferences.join("；")}</p>
                </div>
              </details>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}
