export const reviewStore = "万达店";

// Adapted from the supplied review examples for the fictional store in the demo.
export const reviewExamples = [
  {
    rating: 5,
    review: "招牌臊子面和尖椒肉夹馍都好吃。面条很劲道，辣子很香，吃完还想再来。",
    reply:
      "臊子面和尖椒肉夹馍都合您的口味，太开心了！谢谢您喜欢这口辣椒香和劲道的面。下次来，还是一碗面配一个馍，舒舒服服吃顿饭。"
  },
  {
    rating: 2.5,
    review: "常来吃，今天的牛肉泡馍汤太多，加点的牛肉也只有几片，挺失望的。",
    reply:
      "让您这次吃得失望了，实在抱歉。您提到汤多、加点的牛肉量少，我们会请后厨核对出品和加料分量。谢谢您常来，也谢谢您把问题说得这么具体。"
  },
  {
    rating: 3.5,
    review: "羊肉串好吃，摆得也干净。其他菜口味一般，凉菜的分量对这个价格来说有点少。",
    reply:
      "谢谢您夸羊肉串，也谢谢您直说凉菜的问题。我们会核对凉菜的分量，也会看看常点的菜还有哪些口味可以改进。希望下次您来，串以外也能吃到喜欢的菜。"
  }
] as const;

// Illustrative single-store cases. Staff hours, physical counts and reserves come from the manager.
export const cases = [
  {
    id: "beef",
    label: "牛肉补货",
    title: "周末那批牛肉，今天补多少？",
    question: "周五到周日只送这一次货。你算算，牛肉够用吗？",
    scope: "周四收档 · 同店、同规格净牛肉",
    prefix: "建议补",
    value: "15",
    unit: "公斤",
    summary: "预计还剩 12 公斤，周末备货目标 27 公斤。",
    action: "今晚盘点后下单，周五开档前到货。用 27 公斤减去实际库存，就是本次订量。",
    sources: [
      {
        title: "盘点与收货",
        source: "店长盘点＋收货单",
        detail: "周初盘到 18 公斤，本周两批各收 22、20 公斤。",
        fact: "可用量 60 公斤"
      },
      {
        title: "销量折算用料",
        source: "菜品销量＋套餐子菜＋成本卡",
        detail: "牛肉串 300 份 × 120 克，炖牛肉 60 份 × 200 克。",
        fact: "理论耗用 48 公斤"
      },
      {
        title: "收档余量",
        source: "盘点、收货与耗用合计",
        detail: "18 ＋ 42 − 48，得到周四收档的账面估算。",
        fact: "预计结余 12 公斤"
      },
      {
        title: "周末备货目标",
        source: "历史销量＋门店备货要求",
        detail: "上周五至周日按同配方耗用 24 公斤；店长要求留 3 公斤机动量。",
        fact: "备足 27 公斤"
      }
    ]
  },
  {
    id: "labor",
    label: "门店人效",
    title: "收入涨了，人效怎么反而低了？",
    question: "这周生意好了一点，新增工时用在哪个餐段更合适？",
    scope: "连续两周 · 同店午市和晚市",
    prefix: "每工时",
    value: "105",
    unit: "元",
    summary: "每工时收入从 120 元降到 105 元，下降 12.5%。",
    action:
      "先核对午市多出的 8 个工时用在备菜还是接单。下周试着错开午市到岗、在晚高峰交接，再对照每工时收入和出餐反馈。",
    sources: [
      {
        title: "营业收入",
        source: "门店营业汇总",
        detail: "上周 12,000 元，本周 12,600 元，净增 600 元。",
        fact: "收入增长 5%"
      },
      {
        title: "实际工时",
        source: "店长提供的出勤汇总",
        detail: "午市 40 → 48 小时，晚市 60 → 72 小时。",
        fact: "总工时增长 20%"
      },
      {
        title: "午市单量回落",
        source: "餐段营业与订单",
        detail: "150 → 140 单，单均 36 元。收入 5,400 → 5,040 元。",
        fact: "每工时 135 → 105 元"
      },
      {
        title: "增量来自晚市",
        source: "餐段营业与订单",
        detail: "165 → 189 单，单均 40 元。收入 6,600 → 7,560 元。",
        fact: "晚市多接 24 单"
      }
    ]
  }
] as const;

export const scenes = [
  ...cases.map((item) => ({ label: item.label, question: item.question })),
  { label: "自动回复", question: "把万达店加入自动回复名单" }
];
