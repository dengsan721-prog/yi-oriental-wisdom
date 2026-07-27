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
    <header className="life-head life-head-simple"><div><YiBrandMark variant="compact" /><div><small>人生首页</small><b>{home.name}，欢迎回来</b></div></div><button onClick={() => setSection(section === "change" ? "record" : "change")}>{section === "change" ? "继续记录" : "改命"}</button></header>
    <div className="life-content">
      {section === "record" && <>
        <section className="life-purpose"><small>填写的意义</small><h1>记录自己的所见所闻所思所想</h1><p>每天写下一件事，看见当时的感受，定一个可执行的小计划。念、思、言、行一点点变正，人才会慢慢转念，然后改命。</p></section>
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
        <header><small>改命看板</small><h1>把记录养成会发芽的生活账本</h1><p>这里不替你下结论，只把月度、年度、相似事件和连续填写奖励摆出来，让你看见自己正在怎样变化。</p></header>
        <div className="life-data-cubes" aria-label="数据分析">
          <article className="life-data-cube"><small>本月记录</small><b>{monthEvents.length}</b><span>条</span></article>
          <article className="life-data-cube"><small>年度记录</small><b>{yearEvents.length}</b><span>条</span></article>
          <article className="life-data-cube"><small>连续填写</small><b>{streak}</b><span>天</span></article>
          <article className="life-data-cube"><small>正向计划</small><b>{countPositivePlans(profile.events)}</b><span>次</span></article>
        </div>
        <div className="life-summary-grid">
          <article><small>月度记录汇总 · 内容分析</small><h2>{home.monthlyTheme}</h2><p>这个月你已经写下 {monthEvents.length} 条生活线索。重点不是数量，而是它们把你的注意力带回现实：哪些事反复牵动情绪，哪些计划真的能落地，哪些关系需要更柔和的说法。</p></article>
          <article><small>年度记录汇总 · 数据分析</small><h2>{home.annualEntry?.theme ?? "今年的改命账本"}</h2><p>今年累计 {yearEvents.length} 条记录。记录越多，越能看见“我总在什么地方起念、犹豫、用力或退缩”，这就是年度复盘最有价值的地方。</p></article>
          <article className="life-sprout-card"><small>发芽</small><h2>相似事件与智慧启发</h2><p>{sprout.similar}</p><p>{sprout.wisdom}</p></article>
          <article className="life-reward-card"><small>称呼与徽章</small><h2>{reward.title}</h2><p>{reward.badge}</p></article>
        </div>
        <section className="life-panel life-recent-records"><header><small>最近记录</small><h2>回看不是责备自己，是重新选路</h2></header>{profile.events.slice(-4).reverse().map(event => <article key={event.id}><b>{event.title}</b><button className="record-delete" onClick={() => update(lifeProfileReducer(profile, { type: "delete-event", id: event.id }))}>删除</button><p>{event.date || "未设日期"} · {event.note || "暂无备注"}</p></article>)}<button className="life-report-link" onClick={onViewReport}>查看命盘报告</button></section>
      </section>}
      {storageError && <p className="storage-error" role="alert">{storageError}</p>}
      <footer className="life-privacy"><p>档案保存在当前网站来源的浏览器存储中；共用此设备及浏览器资料的人可能看到。出生地点不会保存或导出。</p><button onClick={downloadProfile}>导出 JSON</button><button onClick={removeLocalProfile}>清除本机档案</button></footer>
    </div>
  </section>;
}
