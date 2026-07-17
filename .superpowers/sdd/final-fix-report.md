# Final Findings 修复报告

## 结论

`final-findings.md` 的 10 项要求均已落实。未知时辰不再用正午伪造单一大运时间线；本机档案实施字段最小化、保存前确认、一次使用、导出与删除；GitHub Pages CTA 直达正式 Sites 产品。

## 修复清单

1. 未知时辰：`buildFortuneTimeline` 返回空，界面明确受影响范围为起运时刻、起运年龄和阶段年份。
2. 隐私：出生地点在档案创建、保存序列化和 JSON 导出三层移除；保存前列明字段，并提供“确认保存”与“仅本次使用”。准确说明同源浏览器存储和共享设备风险。
3. 录入：出生地点默认空、可选，明确不参与真太阳时校正且不保存。
4. Pages：首屏“开始排盘（进入在线产品）”直链 `https://yi-oriental-wisdom.dengsan721.chatgpt.site`；静态页继续明确只说明结构。
5. 商业合盘：专用规则覆盖投资/成本审批、利润/亏损、权限、暂停、退出和文档交接。
6. 年月内容：改称年度复盘计划模板、月度行动计划模板，并明确不是流年、月运或运势推断。
7. 免责声明：覆盖医疗、法律、投资和其他重大人生决定。
8. 称骨：加入通行表 v1、整理日期及异文不混算策略。
9. 生产配置：测试断言七个分区全部开放。
10. 导出：人生首页可导出不含出生地点的 JSON，保留修改错误处理和确认删除。

## TDD 与验证

- RED：新增回归测试首次运行 4 项失败，分别命中未知时辰、隐私最小化/命名、商业规则。
- 覆盖测试：4 文件，52/52 通过。
- 全量测试：`pnpm test`，10 文件，85/85 通过。
- Lint：`pnpm lint`，0 error、0 warning。
- 生产构建：Windows 下以 `$env:WRANGLER_LOG_PATH='.wrangler/wrangler.log'; pnpm exec vinext build` 等价执行，成功完成 5/5 环境构建。
- Rendered：`node --test tests/rendered-html.test.mjs`，2/2 通过；含正式 CTA 和静态说明断言。
- 禁用词扫描：对 `site/app site/components site/lib docs/index.html` 扫描既定人物、状态、价格及旧产品词，`BAN_SCAN_CLEAN`。
- Diff：`git diff --check` 退出码 0。

## 已知说明

- `package.json` 的 build 脚本使用 POSIX 行内环境变量语法，在 PowerShell 直接运行会报命令语法错误；本次未改动既有脚本，采用语义等价的 PowerShell 环境变量设置完成构建验证。
- `vinext build` 输出其既有路由静态分类提示（Unknown），构建仍为成功退出码 0。
