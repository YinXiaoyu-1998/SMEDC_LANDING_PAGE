/** Fictional, same-store lunch service. Money is in yuan. */
export const lunch = {
  previous: { day: "上周四", orders: 100, revenue: 5200 },
  current: { day: "本周四", orders: 84, revenue: 4368 }
};

export const fewerOrders = lunch.previous.orders - lunch.current.orders;
export const revenueGap = lunch.previous.revenue - lunch.current.revenue;
export const money = (value: number) => value.toLocaleString("zh-CN");

export const scenes = [
  { label: "午市复盘", question: "昨天午市，堂食怎么少收了八百多？" },
  { label: "收货核对", question: "昨天那批牛肉，收货单和检疫照片一起给我看看。" },
  { label: "评价回复", question: "这条说上菜慢。帮我拟一句，我看看再发。" }
] as const;
