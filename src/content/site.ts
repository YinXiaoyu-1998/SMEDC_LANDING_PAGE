export type Scenario = {
  key: string;
  tab: string;
  kicker: string;
  title: string[];
  body: string;
  outcome: string;
  link: { href: string; label: string; openReport?: boolean };
};

export const navigation = [
  { href: "#reports", label: "经营成果" },
  { href: "#workflow", label: "服务方式" },
  { href: "#contact", label: "联系" }
];

export const agents = [
  { name: "WorkBuddy", src: "/assets/agent-workbuddy.png" },
  { name: "TRAE", src: "/assets/agent-trae.png" },
  { name: "豆包工作", src: "/assets/agent-doubao-work.png" },
  { name: "Qoder", src: "/assets/agent-qoder.png" },
  { name: "Codex", src: "/assets/agent-codex.png" }
];

export const scenarios: Scenario[] = [
  {
    key: "analysis",
    tab: "经营分析",
    kicker: "经营分析",
    title: ["哪里变好了，", "哪里要多看一眼。"],
    body: "把收银、外卖与门店经营资料放到一起看。从企业到门店，从餐段到菜品，找到变化，再追到原因。",
    outcome: "按日掌握经营，按周、按月复盘。把分析变成下一次经营会可以讨论的事。",
    link: { href: "/samples/weekly-report.html", label: "看一份完整周报", openReport: true }
  },
  {
    key: "ledger",
    tab: "采购与供应链",
    kicker: "采购与供应链",
    title: ["每天收到的货，", "每一笔都有来处。"],
    body: "汇集采购、收货与供应链资料，整理每日采购台账。需要核对时，找得到记录，也找得到对应的原始单据。",
    outcome: "按门店、日期与品项查看；也能围绕您现有的采购流程，配置更多整理与核对工作。",
    link: { href: "#contact", label: "聊聊采购与供应链" }
  },
  {
    key: "reviews",
    tab: "顾客评价",
    kicker: "顾客评价",
    title: ["听见顾客的话，", "也把回应做好。"],
    body: "收集顾客评价，准备贴合门店语气的回复。选择先审核再发布，或按约定范围配置自动处理，把顾客反复提到的问题留给经营复盘。",
    outcome: "回复有门店的语气，反馈有后续的安排。",
    link: { href: "#contact", label: "聊聊评价管理" }
  },
  {
    key: "records",
    tab: "企业资料",
    kicker: "企业资料",
    title: ["该用的资料，", "到需要它的人手里。"],
    body: "经营报表、采购单据、流程与日常文档，集中整理、按权限使用。完全 AI 原生，全面支持主流 Agent 智能体基于您的企业资料工作，重要结论能追到来源。",
    outcome: "从现有资料开始，按需接入更多数据与业务流程。",
    link: { href: "#contact", label: "聊聊资料接入" }
  }
];

export const faqs = [
  {
    question: "需要更换现有的收银或管理系统吗？",
    answer:
      "从您正在使用的系统和已有资料出发，确认可用的导出或接入方式。具体支持范围，我们结合您的门店情况一起确认。"
  },
  {
    question: "工作能自动进行到什么程度？",
    answer:
      "资料整理、定期分析、台账与评价处理，可以按业务需要配置自动化。您决定工作频次和需要人工确认的环节，开发者也可以协助托管与持续扩展。"
  },
  {
    question: "费用怎么确定？",
    answer: "按具体需求面议。先聊门店规模、想解决的工作和需要的服务方式。"
  }
];

export const contact = {
  phone: "18514577162",
  email: "consyinxy@gmail.com",
  emailHref:
    "mailto:consyinxy@gmail.com?subject=%E4%BC%81%E4%B8%9A%E6%99%BA%E8%84%91%20SMEDC%20%E6%BC%94%E7%A4%BA%E9%A2%84%E7%BA%A6"
};
