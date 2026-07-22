import { getAllSources } from "../../lib/yi/sources";

export function ChapterSources({ sourceIds, note }: { sourceIds: readonly string[]; note?: string }) {
  const registry = new Map(getAllSources().map(source => [source.id, source]));
  const sources = [...new Set(sourceIds)]
    .map(id => registry.get(id))
    .filter((source): source is NonNullable<typeof source> => Boolean(source));
  if (!sources.length) return null;

  return <aside className="source-note chapter-sources">
    <b>本章依据与使用边界</b>
    {note && <p>{note}</p>}
    <details><summary>查看本章来源（{sources.length}）</summary><ul>{sources.map(source => <li key={source.id}>
      <b>{source.title}</b> · {source.category} · {source.grade}<br />
      <span>用途：{source.role}</span><br />
      <span>{source.editionNote}</span><br />
      <span>使用边界：{source.boundary}</span>
      {source.url && <> <a href={source.url} target="_blank" rel="noreferrer">外部来源</a></>}
    </li>)}</ul></details>
  </aside>;
}
