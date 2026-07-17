"use client";

import { useState } from "react";
import { buildLifeHome, type LifeProfile } from "../../lib/yi/life-profile";

type HomeSection = "overview" | "annual" | "monthly" | "events" | "relations";

export function LifeHome({ profile, onChange, onViewReport, onClear }: {
  profile: LifeProfile;
  onChange: (profile: LifeProfile) => void;
  onViewReport: () => void;
  onClear: () => void;
}) {
  const [section, setSection] = useState<HomeSection>("overview");
  const home = buildLifeHome(profile);

  function update(changes: Partial<LifeProfile>) {
    onChange({ ...profile, ...changes, updatedAt: new Date().toISOString() });
  }

  function addEvent(form: FormData) {
    const title = String(form.get("title") ?? "").trim();
    if (!title) return;
    update({ events: [...profile.events, { id: crypto.randomUUID(), title, date: String(form.get("date") ?? ""), note: String(form.get("note") ?? "").trim() }] });
  }

  function addRelation(form: FormData) {
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    update({ relations: [...profile.relations, { id: crypto.randomUUID(), name, relationship: "other", note: String(form.get("note") ?? "").trim() }] });
  }

  return <section className="life-home">
    <header className="life-head"><div><span className="mini-mark">艺</span><div><small>人生首页</small><b>{home.name}，欢迎回来</b></div></div><button onClick={onViewReport}>查看命盘报告</button></header>
    <nav className="life-nav" aria-label="人生首页入口">
      {([ ["overview", "首页"], ["annual", "年度"], ["monthly", "月度"], ["events", "事件"], ["relations", "关系"] ] as const).map(([id, label]) => <button key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}>{label}</button>)}
    </nav>
    <div className="life-content">
      {section === "overview" && <>
        <section className="life-hero"><small>当前阶段</small><h1>{home.currentStage}</h1><p>下一步：{home.nextAction}</p></section>
        <div className="life-grid">
          <button onClick={() => setSection("annual")}><small>{home.annualEntry?.year ?? "今年"}</small><b>{home.annualEntry?.theme ?? "查看年度地图"}</b><span>年度入口 →</span></button>
          <button onClick={() => setSection("monthly")}><small>本月节律</small><b>{home.monthlyTheme}</b><span>月度入口 →</span></button>
          <button onClick={() => setSection("events")}><small>{home.events.length} 个记录</small><b>重要事件</b><span>事件入口 →</span></button>
          <button onClick={() => setSection("relations")}><small>{home.relations.length} 个记录</small><b>关系观察</b><span>关系入口 →</span></button>
        </div>
        <section className="life-actions"><h2>行动清单</h2>{home.actions.map(action => <label key={action.id}><input type="checkbox" checked={action.done} onChange={() => update({ actions: profile.actions.map(item => item.id === action.id ? { ...item, done: !item.done } : item) })} />{action.text}</label>)}</section>
      </>}
      {section === "annual" && <section className="life-panel"><header><small>年度地图</small><h1>看清阶段，不替你决定</h1></header>{profile.annualMap.map(entry => <article key={entry.year}><b>{entry.year} · {entry.theme}</b><p>{entry.focus}</p></article>)}</section>}
      {section === "monthly" && <section className="life-panel"><header><small>月度节律</small><h1>把观察落到一个月</h1></header>{profile.monthlyRhythm.map(entry => <article key={entry.month}><b>{entry.month} · {entry.theme}</b><p>{entry.action}</p></article>)}</section>}
      {section === "events" && <section className="life-panel"><header><small>事件记录</small><h1>给重要变化留一条线索</h1></header><form action={addEvent} className="life-form"><input name="title" required placeholder="事件名称" aria-label="事件名称" /><input name="date" type="date" aria-label="事件日期" /><input name="note" placeholder="一条备注（可选）" aria-label="事件备注" /><button>添加事件</button></form>{profile.events.map(event => <article key={event.id}><b>{event.title}</b><p>{event.date || "未设日期"} · {event.note || "暂无备注"}</p></article>)}</section>}
      {section === "relations" && <section className="life-panel"><header><small>关系观察</small><h1>记录事实，也保留理解空间</h1></header><form action={addRelation} className="life-form"><input name="name" required placeholder="对方称呼" aria-label="关系称呼" /><input name="note" placeholder="你的观察（可选）" aria-label="关系观察" /><button>添加关系</button></form>{profile.relations.map(relation => <article key={relation.id}><b>{relation.name}</b><p>{relation.note || "暂无观察"}</p></article>)}</section>}
      <footer className="life-privacy"><p>档案只保存在当前设备的浏览器中。清除后无法恢复。</p><button onClick={() => window.confirm("确定清除当前设备上的人生档案吗？此操作无法恢复。") && onClear()}>清除本机档案</button></footer>
    </div>
  </section>;
}
