import type { dimensions } from "./feature-image-dimensions";

export const reportSample = {
  url: "/samples/weekly-report.html",
  period: "2026 年 11 月 16–22 日"
};

export type FeatureImage = {
  kind: "image";
  file: keyof typeof dimensions;
  caption: string;
  alt: string;
  source?: string;
};

export type AgentExample = {
  kind: "agent";
  caption: string;
  question: string;
  answer: string;
  source?: string;
};

type Feature = {
  id: string;
  title: string;
  description: string;
  visuals: (FeatureImage | AgentExample)[];
};

const image = (
  file: FeatureImage["file"],
  caption: string,
  alt: string,
  source?: string
): FeatureImage => ({
  kind: "image",
  file,
  caption,
  alt,
  source
});

const example = (
  caption: string,
  question: string,
  answer: string,
  source?: string
): AgentExample => ({ kind: "agent", caption, question, answer, source });

export const featureGroups: { title: string; features: Feature[] }[] = [
  {
    title: "经营分析",
    features: [
      {
        id: "reports",
        title: "多店经营周报",
        description: "经营会前先看哪些门店值得借鉴、哪些要复盘，再把收入变化追到餐段、档口和菜品。",
        visuals: [
          image("weekly-report-preview.webp", "经营顾问反馈", "新版周报的经营顾问反馈和逐店分析"),
          image("report-quadrant.webp", "门店四象限", "按增长和经营表现对照门店分布的四象限"),
          image(
            "report-attribution.webp",
            "档口归因的数据说明",
            "新版周报说明本期可用数据与档口归因的覆盖范围"
          )
        ]
      },
      {
        id: "operating-data",
        title: "经营数据归集与查询",
        description:
          "按门店和营业日归集营业、菜品销售、店内订单和平台外卖订单，需要时用 Agent 查询和对比。",
        visuals: [
          example(
            "从收入追到单量和客单价",
            "示例东城店这周午市收入下降，是订单少了还是客单价低了？",
            "对比这家店本周和上周同一组营业日的午市，营业汇总从 18,360 元降到 16,320 元。店内少了 30 单（240→210），单均仍是 68 元。平台外卖收入两周都是 2,040 元。菜品销量里，午市套餐从 62 份降到 45 份，可优先复盘。",
            "营业汇总、店内订单、菜品销量、平台外卖订单 · 模拟数据"
          )
        ]
      },
      {
        id: "dish-catalog",
        title: "菜品、套餐与档口归属",
        description: "维护总部菜品规格、套餐组成和所属部门，复盘时核对实际售出的子菜及其收入归属。",
        visuals: [
          example(
            "核对总部套餐组成",
            "双人午市套餐里，主菜可以选什么？",
            "主菜二选一：炖羊肉（小份）或烤鸡腿（单份）。时蔬是固定子菜。",
            "总部菜品和套餐目录 · 模拟数据"
          ),
          example(
            "核对实际售出子菜",
            "示例东城店上周这个套餐实际选了什么？",
            "炖羊肉小份 18 份，归热菜档口。烤鸡腿单份 12 份，归烧烤档口。",
            "同店套餐子菜销售与部门归属 · 模拟数据"
          )
        ]
      },
      {
        id: "cost-cards",
        title: "菜品成本卡与配方",
        description: "按菜品和规格核对标准用料、每份用量和门店例外配方，供后厨备料时参考。",
        visuals: [
          example(
            "核对本店适用的配方",
            "示例东城店的羊肉串，单份需要多少净羊肉？",
            "羊肉串（单份）标准配方为净羊肉 75 克。该店这份记录没有适用的例外配方，可按每份 75 克估算。",
            "羊肉串单份成本卡 · 模拟数据"
          )
        ]
      }
    ]
  },
  {
    title: "门店执行",
    features: [
      {
        id: "inspections",
        title: "门店巡检与反馈",
        description:
          "总部维护检查标准，门店记录状态、评分、评价和照片，也可以让自己的 Agent 根据现场证据填表并提出复查建议。",
        visuals: [
          image(
            "inspection-template.webp",
            "总部设置检查标准",
            "巡检模板编辑器中的冷藏柜食材标签检查题"
          ),
          example(
            "根据现场证据填报",
            "示例东城店巡检，发现两盒食材未贴标签，已补贴品名和日期。请填到冷藏柜食材标签题。",
            "已把现场事实写入巡检记录。建议下一班交接时抽查冷藏柜标签。",
            "店长现场记录 · 模拟数据"
          ),
          image(
            "inspection-sheet.webp",
            "门店巡检卷上的记录",
            "巡检填报页的冷藏柜食材标签检查题和现场评价"
          )
        ]
      },
      {
        id: "ledger",
        title: "收货台账与检疫凭证",
        description:
          "将配送收货单与检疫照片整理成每日台账，门店可按进货日期下载 PDF 以备核对和检查。",
        visuals: [
          image(
            "ledger-download.webp",
            "按门店和日期查找台账",
            "台账 PDF 下载中心的门店日期筛选和查询结果"
          ),
          image(
            "ledger-real-sample.webp",
            "每日台账成品节选",
            "从实际门店台账制作的脱敏 PDF 截图，展示收货单号、食品、规格、金额、供货单位等 11 列",
            "台账 PDF · 脱敏样例"
          )
        ]
      },
      {
        id: "reviews",
        title: "顾客评价与回复",
        description:
          "汇集美团和大众点评评价，为待回复的文字评价准备草稿。负责人可集中审阅、按批准范围发布，再核对回复状态。",
        visuals: [
          image(
            "reviews-workbook.webp",
            "评价与拟回复审阅表",
            "模拟顾客评价与对应处理状态及商家回复草稿",
            "评价审阅表 · 模拟数据"
          ),
          example(
            "明确发布范围",
            "我已核对审阅表。只发布示例东城店这次明确通过的两条回复，发布后帮我核对。",
            "我会按已确认的门店和两条记录处理，并把平台核对结果写回审阅记录。",
            "评价处理任务 · 模拟数据"
          )
        ]
      }
    ]
  },
  {
    title: "总部管理",
    features: [
      {
        id: "documents",
        title: "企业资料检索与溯源",
        description:
          "用自己的话查制度、SOP 和业务文档，并从回答定位原文。会员或供应商档案也可按权限查询。",
        visuals: [
          example(
            "从回答回到原文",
            "闭店时，晚班领班要核对什么？",
            "核对冷藏柜标签、留存交接记录并签字。原文写道：「晚班领班检查冷藏备料的品名、日期与保质期限，并在交接表签字。」",
            "《门店闭店与交接 SOP》· 模拟原文"
          )
        ]
      },
      {
        id: "directory",
        title: "门店、部门与员工档案",
        description: "总部统一维护门店和部门，登记员工所在部门和门店，也可登记集团直属员工。",
        visuals: [
          image("directory-list.webp", "查看员工和归属", "员工档案里的员工、部门和所属门店列表"),
          image("directory-edit.webp", "登记员工归属", "员工档案界面选择所属门店和部门")
        ]
      },
      {
        id: "permissions",
        title: "账号权限与资料密级",
        description:
          "管理员按资料类别、门店范围和密级分配读取权限，让各门店和区域负责人查看自己的业务范围。",
        visuals: [
          image("permissions-grant.webp", "查看账号的业务授权", "示例账号的业务授权类别和门店范围"),
          image("permissions-category.webp", "设置资料类别密级", "权限管理中的资料类别及所需密级")
        ]
      }
    ]
  },
  {
    title: "接入与自动化",
    features: [
      {
        id: "automation",
        title: "企业自动任务",
        description:
          "用指定电脑定时执行每日数据入库、评价处理和经营周报，并查看执行状态。可按门店和渠道处理评价，或按门店分组汇总整周经营数据。",
        visuals: [
          image("workflows-config.webp", "配置每日数据入库", "企业自动任务的每日入库配置"),
          image(
            "workflows-options.webp",
            "配置评价处理与自然周周报",
            "评价处理的门店和渠道配置，以及自然周经营周报的门店组和邮件交付配置"
          ),
          image("workflows-status.webp", "核对最近运行", "任务运行状态与执行电脑")
        ]
      },
      {
        id: "integrations",
        title: "用自己的 Agent 接入",
        description:
          "从熟悉的 Agent 发起安装，再在企业智脑网页确认登录，按本人权限查询资料与处理工作。",
        visuals: [image("agent-login.webp", "企业智脑登录确认", "企业智脑第一方设备授权确认页面")]
      }
    ]
  }
];
