"use client";

import { useState } from "react";
import { buildLifeHome, exportLifeProfile, lifeProfileReducer, type LifeProfile, type StorageResult } from "../../lib/yi/life-profile";

type HomeSection = "overview" | "annual" | "monthly" | "events" | "relations";

export function LifeHome({ profile, onChange, onViewReport, onClear }: {
  profile: LifeProfile;
  onChange: (profile: LifeProfile) => StorageResult;
  onViewReport: () => void;
  onClear: () => StorageResult;
}) {
  const [section, setSection] = useState<HomeSection>("overview");
  const [storageError, setStorageError] = useState("");
  const home = buildLifeHome(profile);

  function update(next: LifeProfile) {
    const result = onChange({ ...next, updatedAt: new Date().toISOString() });
    setStorageError(result.ok ? "" : "本机档案保存失败，请检查浏览器存储权限或空间。你的修改尚未保存。");
  }

  function addEvent(form: FormData) {
    const title = String(form.get("title") ?? "").trim();
    if (!title) return;
    update(lifeProfileReducer(profile, { type: "add-event", event: { id: crypto.randomUUID(), title, date: String(form.get("date") ?? ""), note: String(form.get("note") ?? "").trim() } }));
  }

  function addRelation(form: FormData) {
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    update(lifeProfileReducer(profile, { type: "add-relation", relation: { id: crypto.randomUUID(), name, relationship: "other", note: String(form.get("note") ?? "").trim() } }));
  }

  function removeLocalProfile() {
    if (!window.confirm("确定清除当前设备上的人生档案吗？此操作无法恢复。")) return;
    const result = onClear();
    if (!result.ok) setStorageError("本机档案清除失败，请检查浏览器存储权限后重试。");
  }
  function downloadProfile() {
    const url = URL.createObjectURL(new Blob([exportLifeProfile(profile)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "yi-life-profile.json"; anchor.click(); URL.revokeObjectURL(url);
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
          <button onClick={() => setSection("annual")}><small>{home.annualEntry?.year ?? "今年"}</small><b>{home.annualEntry?.theme ?? "查看年度复盘计划"}</b><span>年度计划入口 →</span></button>
          <button onClick={() => setSection("monthly")}><small>本月行动计划</small><b>{home.monthlyTheme}</b><span>月度计划入口 →</span></button>
          <button onClick={() => setSection("events")}><small>{home.events.length} 个记录</small><b>重要事件</b><span>事件入口 →</span></button>
          <button onClick={() => setSection("relations")}><small>{home.relations.length} 个记录</small><b>关系观察</b><span>关系入口 →</span></button>
        </div>
        <section className="life-actions"><h2>行动清单</h2>{home.actions.map(action => <label key={action.id}><input type="checkbox" checked={action.done} onChange={() => update(lifeProfileReducer(profile, { type: "toggle-action", id: action.id }))} />{action.text}</label>)}</section>
      </>}
      {section === "annual" && <section className="life-panel"><header><small>年度复盘与计划模板</small><h1>看清阶段，不替你决定</h1><p>以下为固定行动模板，不是流年或运势推断。</p></header>{profile.annualMap.map(entry => <article key={entry.year}><b>{entry.year} · {entry.theme}</b><p>{entry.focus}</p></article>)}</section>}
      {section === "monthly" && <section className="life-panel"><header><small>月度行动计划模板</small><h1>把观察落到一个月</h1><p>以下为固定行动模板，不是月运或运势推断。</p></header>{profile.monthlyRhythm.map(entry => <article key={entry.month}><b>{entry.month} · {entry.theme}</b><p>{entry.action}</p></article>)}</section>}
      {section === "events" && <section className="life-panel"><header><small>可添加、可删除的本机事件记录</small><h1>给重要变化留一条线索</h1></header><form action={addEvent} className="life-form"><input name="title" required placeholder="事件名称" aria-label="事件名称" /><input name="date" type="date" aria-label="事件日期" /><input name="note" placeholder="一条备注（可选）" aria-label="事件备注" /><button>添加事件</button></form>{profile.events.map(event => <article key={event.id}><b>{event.title}</b><button className="record-delete" onClick={() => update(lifeProfileReducer(profile, { type: "delete-event", id: event.id }))}>删除</button><p>{event.date || "未设日期"} · {event.note || "暂无备注"}</p></article>)}</section>}
      {section === "relations" && <section className="life-panel"><header><small>可添加、可删除的本机关系记录</small><h1>记录事实，也保留理解空间</h1></header><form action={addRelation} className="life-form"><input name="name" required placeholder="对方称呼" aria-label="关系称呼" /><input name="note" placeholder="你的观察（可选）" aria-label="关系观察" /><button>添加关系</button></form>{profile.relations.map(relation => <article key={relation.id}><b>{relation.name}</b><button className="record-delete" onClick={() => update(lifeProfileReducer(profile, { type: "delete-relation", id: relation.id }))}>删除</button><p>{relation.note || "暂无观察"}</p></article>)}</section>}
      {storageError && <p className="storage-error" role="alert">{storageError}</p>}
      <footer className="life-privacy"><p>档案保存在当前网站来源的浏览器存储中；共用此设备及浏览器资料的人可能看到。出生地点不会保存或导出。</p><button onClick={downloadProfile}>导出 JSON</button><button onClick={removeLocalProfile}>清除本机档案</button></footer>
    </div>
  </section>;
}
