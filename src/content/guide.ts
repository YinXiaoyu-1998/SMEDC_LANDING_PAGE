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
  lead: "选一条路线，把提示词发给对应电脑的 Codex。",
  routesLabel: "三条路线 · 按现在的情况选一条",
  note: "已有其他电脑执行同类任务，请选 C。同一台电脑尽量在同一段聊天中继续。",
  heroImage: "/assets/automation-guide-hero.webp",
  heroAlt: "闭店后的餐馆里，经理在笔记本前核对当天的定时任务。",
  footerNotes: [
    "SMEDC 企业资料中枢 · 复制提示词后，发给本步标明电脑的 Codex；核对完成标志，再继续下一步。",
    "更新：2026-11-14。适用于 macOS Codex；版本与操作以当前官方技能及实际检查结果为准。"
  ]
};
