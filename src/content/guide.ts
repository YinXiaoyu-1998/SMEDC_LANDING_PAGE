import data from "./guide.json";

export type GuidePrompt = { label: string; text: string; id: string };
export type GuideStep = {
  where: string;
  title: string;
  body: string[];
  prompt?: GuidePrompt;
  done?: { label: string; text: string };
  note?: { summary: string; text: string };
};
export type GuideRoute = {
  key: "a" | "b" | "c";
  toolbar: string;
  label: string;
  title: string;
  intro: string;
  pathNote: string;
  prep: { summary: string; heading: string; items: string[]; note: string };
  extraDetails: { summary: string; text: string }[];
  steps: GuideStep[];
  help: {
    label: string;
    title: string;
    sheets: { title: string; prompt: GuidePrompt }[];
    details: { summary: string; text: string }[];
  };
};
export type GuideChoice = {
  key: "a" | "b" | "c";
  number: string;
  title: string;
  description: string;
  cta: string;
};

const guide = data as unknown as { choices: GuideChoice[]; routes: GuideRoute[] };
export const guideChoices = guide.choices;
export const guideRoutes = guide.routes;

export const guideCopy = {
  eyebrow: "先选你要做的事",
  titleLines: ["你想怎么", "使用定时任务？"],
  lead: "点击与你现在情况最接近的一项，只看这条路线的完整步骤。",
  routesLabel: "三条路线 · 按现在的情况选一条",
  note: "如果公司已有另一台电脑在执行同一套任务，你想换到自己的电脑，请选 C。每条路线都包含需要的版本检查、登录、配置和核验步骤。",
  heroImage: "/assets/automation-guide-hero.webp",
  heroAlt: "闭店后的餐馆里，经理在笔记本前核对当天的定时任务。",
  footerNotes: [
    "SMEDC 企业资料中枢 · 通用操作指南 · 可保存到本机离线阅读。点击“复制提示词”后，粘贴到本步标明电脑的 Codex 聊天框并发送；等它完成，再看“看到这些才继续”。",
    "更新：2026-11-02。对应官方客户端 0.16.0 与工作流 1.0.1。准备检查与真实运行结果分别核验。"
  ]
};
