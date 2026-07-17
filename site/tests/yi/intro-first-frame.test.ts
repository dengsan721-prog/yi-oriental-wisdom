import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { YiExperience } from "../../components/yi/YiExperience";

describe("public intro first frame", () => {
  it("shows only the ritual identity while local storage is being restored", () => {
    const html = renderToStaticMarkup(createElement(YiExperience));

    expect(html).toContain('aria-label="艺"');
    expect(html).toContain("看见命局");
    expect(html).toContain("读懂时运");
    expect(html).toContain("开始排盘");
    expect(html).not.toContain("建立出生坐标");
    expect(html).not.toContain("请确认出生信息");
    expect(html).not.toContain("正在读取本机档案");
    expect(html).not.toMatch(/<(?:p|small)\b/);
  });
});
