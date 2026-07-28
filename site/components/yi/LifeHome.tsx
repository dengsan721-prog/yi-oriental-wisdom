"use client";

import { useState } from "react";
import { buildLifeHome, exportLifeProfile, lifeProfileReducer, type LifeProfile, type StorageResult } from "../../lib/yi/life-profile";
import { YiBrandMark } from "./YiBrandMark";

type HomeSection = "record" | "change";

const todayKey = () => new Date().toISOString().slice(0, 10);
const monthKey = () => todayKey().slice(0, 7);
const yearKey = () => todayKey().slice(0, 4);
const cleanRecordNote = (value: string) => value.trim().replace(/\s+/g, " ");
const countPositivePlans = (events: { note: string }[]) => events.filter(event => /计划：.+/.test(event.note)).length;

function streakDays(events: { date: string }[]) {
  const days = [...new Set(events.map(event => event.date).filter(Boolean))].sort().reverse();
  if (!days.length) return 0;
  let streak = 1;
  const cursor = new Date(`${days[0]}T00:00:00`);
  for (const day of days.slice(1)) {
    cursor.setDate(cursor.getDate() - 1);
    if (day !== cursor.toISOString().slice(0, 10)) break;
    streak += 1;
  }
  return streak;
}

function badgeFor(streak: number) {
  if (streak >= 21) return { title: "改命修习者", badge: "连续二十一天，念、思、言、行已经开始形成新惯性。" };
  if (streak >= 7) return { title: "转念行者", badge: "连续一周看见自己，下一步就是把看见变成选择。" };
  if (streak >= 3) return { title: "初芽记录者", badge: "连续三天没有断，心里的芽已经露头。" };
  return { title: "今日启程者", badge: "先写一条，命不是一锤定音，是每天的念头在改方向。" };
}

function sproutFrom(events: { title: string; note: string }[]) {
  const latest = events[events.length - 1];
  if (!latest) return {
    similar: "还没有可发芽的记录。先写下一件今天真实发生的小事，系统会从你的记录里找相似处。",
    wisdom: "发芽不是预测未来，而是把重复出现的念头、关系和行动看清楚：看清之后，才谈得上转念，然后改命。",
  };
  const keyword = latest.title.slice(0, 2);
  const matched = [...events].reverse().find(event => event !== latest && event.title.includes(keyword));
  return {
    similar: matched ? `你曾写过“${matched.title}”，它和今天的“${latest.title}”都在提醒你：同一类事情又出现了。` : `今天的“${latest.title}”还没有明显同类记录，先把它养成一颗种子。`,
    wisdom: "遇事先不急着定输赢，先问自己：我刚才起了什么念？这个念头会推着我说什么话、做什么事？把这一问记下来，很多命运的岔路口就亮了。",
  };
}

export function LifeHome({ profile, onChange, onViewReport, onClear }: {
  profile: LifeProfile;
  onChange: (profile: LifeProfile) => StorageResult;
  onViewReport: () => void;
  onClear: () => StorageResult;
}) {
  const [section, setSection] = useState<HomeSection>("record");
  const [storageError, setStorageError] = useState("");
  const home = buildLifeHome(profile);
  const monthEvents = profile.events.filter(event => event.date.startsWith(monthKey()));
  const yearEvents = profile.events.filter(event => event.date.startsWith(yearKey()));
  const streak = streakDays(profile.events);
  const reward = badgeFor(streak);
  const sprout = sproutFrom(profile.events);

  function update(next: LifeProfile) {
    const result = onChange({ ...next, updatedAt: new Date().toISOString() });
    setStorageError(result.ok ? "" : "本机档案保存失败，请检查浏览器存储权限或空间。你的修改尚未保存。");
  }

  function addDailyRecord(form: FormData) {
    const title = cleanRecordNote(String(form.get("title") ?? ""));
    if (!title) return;
    const feeling = cleanRecordNote(String(form.get("feeling") ?? ""));
    const plan = cleanRecordNote(String(form.get("plan") ?? ""));
    update(lifeProfileReducer(profile, { type: "add-event", event: { id: crypto.randomUUID(), title, date: todayKey(), note: `感受：${feeling || "未填写"}｜计划：${plan || "先观察一天"}` } }));
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
    <header className="life-head life-head-simple"><div><YiBrandMark variant="compact" /><div><small>人生首页</small><b>{home.name}，欢迎回来</b></div></div><div className="life-head-actions"><button className="life-report-return" onClick={onViewReport}>回看命盘报告</button><button onClick={() => setSection(section === "change" ? "record" : "change")}>{section === "change" ? "继续记录" : "改命记录"}</button></div></header>
    <div className="life-content">
      {section === "record" && <>
        <section className="life-purpose"><small>了凡式改命记录</small><h1>今天遇到的小怪，也能变成通关记录</h1><p>把一件事写成一枚经验值：看见当时起了什么念，承认哪里做错，补上一点善意，再定一个明天能做到的小招。念、思、言、行一关一关校正，人就不是被剧情推着走，而是在自己的副本里慢慢升级、转念、改命。</p></section>
        <section className="life-record-window" aria-label="每日记录窗口">
          <header><small>今日一记</small><h2>先把生活留下一笔</h2><p>不求玄妙，求真实。写得越朴素，复盘时越有力量。</p></header>
          <form action={addDailyRecord} className="life-form life-daily-form">
            <label><span>事件</span><input name="title" required placeholder="今天发生了什么？" aria-label="今天发生的一件事" /></label>
            <label><span>感受</span><textarea name="feeling" placeholder="当时心里是什么滋味？" aria-label="当下感受" /></label>
            <label><span>计划</span><textarea name="plan" placeholder="接下来准备怎么做？越小越好。" aria-label="下一步计划" /></label>
            <button>写下这一条</button>
          </form>
        </section>
      </>}
      {section === "change" && <section className="life-change-dashboard">
        <header><small>修行进度</small><h1>把每天的小怪，炼成自己的改命地图</h1><p>每一条记录都是一次把命运方向盘拿回来的练习：按了凡四训的顺序，立命、改过、积善、谦德——先知道自己要往哪走，再修正今天失手的一招，把一个好念头落成行动，最后保持谦下复盘，继续升级。</p></header>
        <div className="life-data-cubes" aria-label="数据分析">
          <article className="life-data-cube"><small>本月打怪</small><b>{monthEvents.length}</b><span>条通关记录</span></article>
          <article className="life-data-cube"><small>年度主线</small><b>{yearEvents.length}</b><span>次剧情推进</span></article>
          <article className="life-data-cube"><small>连续填写</small><b>{streak}</b><span>天</span></article>
          <article className="life-data-cube"><small>行动善念</small><b>{countPositivePlans(profile.events)}</b><span>个小招已定</span></article>
        </div>
        <div className="life-summary-grid">
          <article><small>本月打怪 · 内容分析</small><h2>{home.monthlyTheme}</h2><p>这个月你已经写下 {monthEvents.length} 条生活线索。它们像副本里的怪物图鉴：哪些事反复牵动情绪，哪些话一出口就变成误会，哪些计划真的能落地，都会慢慢显形。</p></article>
          <article><small>年度主线 · 数据分析</small><h2>{home.annualEntry?.theme ?? "今年的改命账本"}</h2><p>今年累计 {yearEvents.length} 条记录。记录越多，越能看见“我总在什么地方起念、犹豫、用力或退缩”。看见不是责备，是从命运剧情里找到下一次可以改写的分岔口。</p></article>
          <article className="life-sprout-card"><small>善念发芽</small><h2>相似事件与智慧启发</h2><p>{sprout.similar}</p><p>{sprout.wisdom}</p></article>
          <article className="life-reward-card"><small>称号徽章</small><h2>{reward.title}</h2><p>{reward.badge}</p></article>
        </div>
        <section className="life-panel life-recent-records"><header><small>最近记录</small><h2>回看不是责备自己，是重新选路</h2></header>{profile.events.slice(-4).reverse().map(event => <article key={event.id}><b>{event.title}</b><button className="record-delete" onClick={() => update(lifeProfileReducer(profile, { type: "delete-event", id: event.id }))}>删除</button><p>{event.date || "未设日期"} · {event.note || "暂无备注"}</p></article>)}<button className="life-report-link" onClick={onViewReport}>查看命盘报告</button></section>
      </section>}
      {storageError && <p className="storage-error" role="alert">{storageError}</p>}
      <footer className="life-privacy"><p>档案保存在当前网站来源的浏览器存储中；共用此设备及浏览器资料的人可能看到。出生地点不会保存或导出。</p><button onClick={downloadProfile}>导出 JSON</button><button onClick={removeLocalProfile}>清除本机档案</button></footer>
    </div>
  </section>;
}
