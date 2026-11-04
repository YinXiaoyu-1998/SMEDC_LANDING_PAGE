# 定时任务指南插图：位置与提示词

`public/guides/automation-user-guide.html` 的首屏与路线 C 已按下面的方向生成并插入两张配图。
本文保留提示词、尺寸与替换方法，方便以后重做或换图。两处都按落地页的视觉方向来：暖调、写实、
餐馆现场感，暗部为主，画面里不要出现可读文字或聊天界面文案。

## 通用风格

- 写实纪实摄影，不是插画或 3D 渲染
- 暖调钨丝灯与自然窗光混合，暗部保留细节，轻微胶片颗粒
- 低饱和、偏棕与墨色，和官网的 #22211f / #a62924 相配
- 景深自然，主体清晰，背景轻微虚化
- 横构图或 4:3；主体偏一侧，另一侧留出干净的暗部（便于叠字）
- 不出现：可读的文字、品牌 Logo、二维码、水印、畸形手指、正对镜头的清晰人脸

生成后转成 WebP（质量 82–84），文件名和尺寸见下；替换同名文件后重新 `npm run build`。

---

## 插图 1 · 指南首页主图

- 文件：`public/assets/automation-guide-hero.webp`
- 尺寸：1448 × 1086（4:3）
- 位置：指南首屏整幅背景，深色渐变覆盖左侧，标题与说明叠在其上
- 状态：已插入。换图时替换同名 WebP 即可，建议保持 4:3 横构图，主体放在画面右侧，左侧留出暗部
- alt：`闭店后的餐馆里，经理在笔记本前核对当天的定时任务。`

中文提示词：

> 写实纪实摄影。深夜打烊后的中式小餐馆一角，暖色台灯下，一位穿深色围裙的中年店主
> 坐在木桌旁，侧后方视角，正看着一台打开笔记本的暖色屏幕。桌面有手写点菜单、收货单、
> 计算器、搪瓷茶杯和一支笔，纸张上的字迹模糊不可读。背景是虚化的厨房灶台与余温蒸汽，
> 窗外是深夜的街灯。整体暗调、低饱和，棕与墨色为主，轻微胶片颗粒，安静而专注的气氛。
> 人物不露正脸，画面左侧留出大面积深色负空间。无文字、无 Logo、无水印。

English prompt:

> Editorial documentary photograph. Late night after closing in a small Chinese restaurant.
> A middle-aged owner in a dark apron sits at a wooden table, seen from behind at a
> three-quarter angle, looking at the warm screen of an open laptop. On the table: a handwritten
> order pad, receiving slips, a calculator, an enamel teacup, a pen; handwriting blurred and
> unreadable. Background: softly out of focus kitchen range with lingering steam, street lamps
> outside the window. Dark, desaturated palette of brown and ink, subtle film grain, quiet and
> focused mood. Face not visible. Large clean dark negative space on the left. No text, no logos,
> no watermark, natural anatomy.

Negative prompt（如模型支持）：

> text, letters, readable UI, logo, watermark, extra fingers, deformed hands, harsh flash,
> neon colors, stock-photo smile, front-facing portrait, 3D render, illustration

---

## 插图 2 · 路线 C 换机横幅

- 文件：`public/assets/automation-guide-handover.webp`
- 尺寸：源图 1448 × 1086（4:3）；页面按 2:1 裁切显示，保留中间两台电脑和交接动作
- 位置：路线 C“旧电脑已经无法使用？先看恢复条件”之后、步骤列表之前
- 状态：已插入。换图时替换同名 WebP 即可，新图建议主体居中，便于 2:1 裁切
- alt：`旧电脑和新电脑并排，一只手把资料从旧电脑递向新电脑。`

中文提示词：

> 写实纪实摄影。一张旧木桌上并排摆着两台 Mac 笔记本：左边一台边缘有磨损和旧贴纸，
> 屏幕微暗；右边一台干净崭新，屏幕发出柔和的暖光。一只手正把一张没有文字的文件夹
> 从左侧电脑旁移向右侧，动作自然。清晨侧光从窗外照入，桌面有咖啡杯、纸质记录本和
> 几支笔，背景是虚化的餐馆后厨或办公室。暖调、低饱和、轻微胶片颗粒，安静而有序。
> 屏幕内容虚化不可读，无文字、无 Logo、无水印。

English prompt:

> Editorial documentary photograph. Two Mac laptops side by side on an old wooden table:
> the left one worn, with scuffed edges and old stickers, screen dim; the right one clean and
> new, glowing with soft warm light. A hand naturally slides a blank paper folder from the left
> laptop toward the right. Early morning side light from a window; a coffee cup, paper notebook
> and pens on the table; blurred restaurant kitchen or back office in the background. Warm,
> desaturated, subtle film grain, calm and orderly. Screens blurred and unreadable. No text,
> no logos, no watermark, natural anatomy.

Negative prompt：

> text, readable screen, logo, watermark, extra fingers, deformed hands, floating laptops,
> neon lighting, 3D render, illustration, cluttered desk

---

## 可选：第三张（暂未放位置）

如果以后想在“开始前准备什么？”旁边加一张小图，可以用这个方向：
桌面俯拍，一台合上的 Mac、企业管理员账号的手写便签（字迹不可读）、美团/邮箱的图标只以
模糊纸片代替、一杯茶和一支笔；暖调侧光，留白充足，1200 × 800。提示词在上面的基础上替换
主体即可，注意仍然不要出现可读文字和品牌 Logo。

## 插入后的检查

1. 把新图放进 `public/assets/` 并覆盖同名文件，运行 `npm run build`。
2. 本地预览 `http://127.0.0.1:4173/guides/automation-user-guide.html`，确认首屏和路线 C 的图片裁切正常。
3. 手机宽度（≤760px）下再看一次，确认首屏背景上的文字仍然清楚，路线 C 横幅保持 2:1。
4. `npm test` 会检查指南仍然只引用站内资源、没有内联脚本或样式。
