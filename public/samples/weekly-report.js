/* eslint-disable -- Adapted runtime from the supplied, anonymized weekly report. */

// SVG presentation attributes keep chart legends compatible with the report's content security policy.
function reportSwatch(color, className = "swatch") {
  return `<svg class="${className}" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><rect width="10" height="10" rx="2" fill="${color}"/></svg>`;
}

const data = JSON.parse(document.getElementById("report-data").textContent);
const weeklyDashboard = Boolean(document.getElementById("weekly-panel-source"));
const stores = data.comparison;
const fmtWan = (v) => {
  const raw = Number(v || 0) / 10000;
  const value = Math.abs(raw) < 0.05 ? 0 : raw;
  return `${value.toLocaleString("zh-CN", { maximumFractionDigits: 1 })}万`;
};
const fmtNum = (v) => Number(v || 0).toLocaleString("zh-CN", { maximumFractionDigits: 0 });
const fmtYuan = (v) => `${Number(v || 0).toLocaleString("zh-CN", { maximumFractionDigits: 1 })}元`;
const fmtPct = (v) =>
  v === null || v === undefined || v === "" ? "N/A" : `${(Number(v) * 100).toFixed(1)}%`;
const cleanName = (s) => String(s || "");
const htmlText = (value) =>
  String(value ?? "").replace(
    /[&<>\"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;" })[character]
  );
const colors = {
  teal: "#006d77",
  blue: "#2f5b9f",
  green: "#3a7d44",
  amber: "#b85c00",
  red: "#b23a48",
  violet: "#7557a6",
  orange: "#d96b3b",
  yellow: "#c89b18",
  yellowFill: "#f2c94c",
  maximum: "#2f80ed",
  maximumStroke: "#1c5fb8",
  minimum: "#e5484d",
  minimumStroke: "#b42318"
};
const segmentGroups = data.segment_groups || [];
let selectedTrendKey = "__all__";
let selectedTrendGrain = data.meta.report_grain || "week";
let trendStart = 0,
  trendEnd = null;
let selectedHourlyKey = "__all__";
let selectedStallMixKey = "__all__";
const selectedProductSalesPer10kKeys = { orderRevenue: "__all__", grossSales: "__all__" };
const productSalesPer10kPanels = [
  {
    stateKey: "orderRevenue",
    dataKey: "product_sales_per_10k_order_revenue",
    selectId: "productSalesPer10kStoreSelect",
    searchId: "productSalesPer10kSearch",
    statusId: "productSalesPer10kStatus",
    tableId: "productSalesPer10kTable",
    denominatorLabel: "订单营业收入"
  },
  {
    stateKey: "grossSales",
    dataKey: "product_sales_per_10k_gross_sales",
    selectId: "productSalesPer10kGrossStoreSelect",
    searchId: "productSalesPer10kGrossSearch",
    statusId: "productSalesPer10kGrossStatus",
    tableId: "productSalesPer10kGrossTable",
    denominatorLabel: "营业额"
  }
];
const stallPalette = [
  "#006d77",
  "#2f5b9f",
  "#3a7d44",
  "#b85c00",
  "#7557a6",
  "#d96b3b",
  "#b23a48",
  "#c89b18",
  "#4b5563",
  "#0f766e",
  "#9aa7b5"
];
const currentTrendYear =
  String(data.meta?.target_windows?.current?.end || "").slice(0, 4) || "本年";
const yoyTrendYear = String(data.meta?.target_windows?.yoy?.end || "").slice(0, 4) || "同期";

function setText(id, value) {
  document.getElementById(id).textContent = value;
}
function svg(tag, attrs = {}) {
  const el = document.createElementNS("http:" + "//www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}
function positionTooltip(tip, container, event, options = {}) {
  const bounds = container.getBoundingClientRect();
  const gap = options.gap ?? 12;
  const cursorX = Number.isFinite(event.clientX) ? event.clientX - bounds.left : bounds.width / 2;
  const cursorY = Number.isFinite(event.clientY) ? event.clientY - bounds.top : bounds.height / 2;
  tip.style.display = "block";
  tip.style.left = "0px";
  tip.style.top = "0px";
  const tipWidth = tip.offsetWidth || 0;
  const tipHeight = tip.offsetHeight || 0;
  let x = cursorX + gap;
  let y = cursorY - tipHeight / 2;
  if (x + tipWidth + 8 > bounds.width) x = cursorX - tipWidth - gap;
  x = Math.max(8, Math.min(x, bounds.width - tipWidth - 8));
  y = Math.max(8, Math.min(y, bounds.height - tipHeight - 8));
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
}
function renderMeta() {
  const meta = data.meta;
  document.getElementById("metaChips").innerHTML = [
    `本周：${meta.target_windows.current.start}-${meta.target_windows.current.end}`,
    `环比：${meta.target_windows.previous.start}-${meta.target_windows.previous.end}`,
    `同比：${meta.target_windows.yoy.start}-${meta.target_windows.yoy.end}`,
    `门店：${meta.store_count}家`
  ]
    .map((x) => `<span class="chip">${x}</span>`)
    .join("");
  if (meta.store_name_contains?.length) {
    const scope = document.createElement("span");
    scope.className = "chip";
    scope.textContent = `门店名称包含：${meta.store_name_contains.join("、")}（全体门店为筛选后合计）`;
    document.getElementById("metaChips").appendChild(scope);
  }
}
function renderKpis() {
  const k = data.kpis;
  if (!weeklyDashboard) {
    setText("heroRevenue", fmtWan(k.current_revenue));
    setText("heroWow", fmtPct(k.wow_pct));
    setText("heroYoy", fmtPct(k.yoy_pct));
  }
  const cards = [
    [
      "业务收入",
      fmtWan(k.current_revenue),
      `环比 ${fmtPct(k.wow_pct)} / 同比 ${fmtPct(k.yoy_pct)}`
    ],
    [
      "客流量",
      fmtNum(k.current_customers),
      `环比 ${fmtPct(k.wow_customer_pct)} / 同比 ${fmtPct(k.yoy_customer_pct)}`
    ],
    [
      "开台数",
      fmtNum(k.current_tables),
      `环比 ${fmtPct(k.wow_table_pct)} / 同比 ${fmtPct(k.yoy_table_pct)}`
    ],
    [
      "门店分型",
      `${k.star_count} 明星 / ${k.problem_count} 问题`,
      segmentGroups
        .map((g) => `${g.label} ${g.star_count} 明星/${g.problem_count} 问题`)
        .join("；") || "按门店类型内收入中位数与环比 0% 划分象限"
    ]
  ];
  document.getElementById("kpiCards").innerHTML = cards
    .map(
      (c) =>
        `<div class="card"><div class="label">${c[0]}</div><div class="value">${c[1]}</div><div class="foot">${htmlText(c[2])}</div></div>`
    )
    .join("");
}
function ruleColor(name) {
  return name === "明星门店"
    ? colors.green
    : name === "问题门店"
      ? colors.red
      : name === "高基盘承压"
        ? colors.amber
        : colors.blue;
}
function renderRules() {
  const rules = data.segment_rules;
  const bucketSegmentSummary = segmentGroups
    .map(
      (group) =>
        `${group.label}：收入中位数 ${fmtWan(group.revenue_threshold)}，${group.star_count} 明星 / ${group.problem_count} 问题`
    )
    .join("；");
  document.getElementById("segmentRules").innerHTML = `
        <div class="rule-note" id="bucketSegmentSummary">门店分型基准：全体门店统一比较；${htmlText(bucketSegmentSummary)}。横轴统一使用环比增长率 ${fmtPct(rules.growth_threshold)}。四象限只定义经营位置，预警项用于补充复盘优先级。</div>
        <div class="rule-grid">
          ${rules.items
            .map(
              (item) => `<div class="rule">
            <div class="rule-title">${reportSwatch(ruleColor(item.name), "dot")}${item.name}</div>
            <p>${item.logic}</p>
            <small>${item.use}</small>
          </div>`
            )
            .join("")}
        </div>
        <div class="rule-note">预警补充：${rules.warnings}</div>`;
}
function renderHorizontalBar(id, rows, field, formatter, color) {
  const el = document.getElementById(id);
  const w = 760,
    h = Math.max(300, rows.length * 32 + 48),
    left = 150,
    right = 80;
  const max = Math.max(...rows.map((r) => Math.abs(Number(r[field] || 0))), 1);
  const root = svg("svg", { viewBox: `0 0 ${w} ${h}` });
  rows.forEach((r, i) => {
    const y = 28 + i * 32;
    const val = Number(r[field] || 0);
    const bw = (Math.abs(val) / max) * (w - left - right);
    root.appendChild(
      svg("text", {
        x: left - 8,
        y: y + 15,
        "text-anchor": "end",
        "font-size": "12",
        fill: "#344054"
      })
    ).textContent = cleanName(r["门店名称"]);
    root.appendChild(svg("rect", { x: left, y, width: bw, height: 18, rx: 4, fill: color }));
    root.appendChild(
      svg("text", { x: left + bw + 8, y: y + 14, "font-size": "12", fill: "#657386" })
    ).textContent = formatter(val);
  });
  el.innerHTML = "";
  el.appendChild(root);
}
function renderBucketedRevenueRanking() {
  const el = document.getElementById("revenueBar");
  const groups = segmentGroups.length
    ? segmentGroups
    : [
        { label: "全体门店", rows: stores, revenue_threshold: data.segment_rules.revenue_threshold }
      ];
  const w = 760,
    left = 150,
    right = 80,
    groupGap = 40;
  const rowH = 30;
  const totalRows = groups.reduce((sum, group) => sum + (group.rows || []).length, 0);
  const h = Math.max(320, totalRows * rowH + groups.length * groupGap + 36);
  const max = Math.max(
    ...groups.flatMap((group) => (group.rows || []).map((r) => Number(r.current_net_revenue || 0))),
    1
  );
  const root = svg("svg", { viewBox: `0 0 ${w} ${h}` });
  let y = 26;
  groups.forEach((group) => {
    root.appendChild(
      svg("text", {
        x: left - 8,
        y: y,
        "text-anchor": "end",
        "font-size": "12",
        fill: "#172033",
        "font-weight": "800"
      })
    ).textContent = `${group.label}（${group.store_count || (group.rows || []).length}家）`;
    root.appendChild(
      svg("text", { x: left, y: y, "font-size": "11", fill: "#657386" })
    ).textContent = `中位数 ${fmtWan(group.revenue_threshold || 0)}`;
    y += 12;
    (group.rows || []).forEach((r) => {
      y += rowH;
      const val = Number(r.current_net_revenue || 0);
      const bw = (val / max) * (w - left - right);
      root.appendChild(
        svg("text", {
          x: left - 8,
          y: y + 5,
          "text-anchor": "end",
          "font-size": "12",
          fill: "#344054"
        })
      ).textContent = cleanName(r["门店名称"]);
      root.appendChild(
        svg("rect", { x: left, y: y - 11, width: bw, height: 18, rx: 4, fill: colors.teal })
      );
      root.appendChild(
        svg("text", { x: left + bw + 8, y: y + 3, "font-size": "12", fill: "#657386" })
      ).textContent = fmtWan(val);
    });
    y += groupGap - 10;
  });
  el.innerHTML = "";
  el.appendChild(root);
}
function renderGrowthBar() {
  const el = document.getElementById("growthBar");
  const rows = stores
    .slice()
    .sort((a, b) => Number(b.wow_net_revenue_pct || 0) - Number(a.wow_net_revenue_pct || 0));
  const primaryMetrics = [
    { field: "wow_net_revenue_pct", label: "业务收入环比", color: "#006d77" },
    { field: "yoy_net_revenue_pct", label: "业务收入同比", color: "#1d4ed8" }
  ];
  const channelRows = [
    {
      label: "堂食",
      metrics: [
        {
          field: "wow_dine_in_revenue_pct",
          label: "堂食环比",
          shortLabel: "环比",
          color: "#2e7d32"
        },
        {
          field: "yoy_dine_in_revenue_pct",
          label: "堂食同比",
          shortLabel: "同比",
          color: "#7c3aed"
        }
      ]
    },
    {
      label: "外卖",
      metrics: [
        {
          field: "wow_delivery_revenue_pct",
          label: "外卖环比",
          shortLabel: "环比",
          color: "#f59e0b"
        },
        {
          field: "yoy_delivery_revenue_pct",
          label: "外卖同比",
          shortLabel: "同比",
          color: "#dc2626"
        }
      ]
    }
  ];
  const primaryValues = rows.flatMap((row) =>
    primaryMetrics.map((metric) => Number(row[metric.field] || 0))
  );
  const channelValues = rows.flatMap((row) =>
    channelRows.flatMap((channel) =>
      channel.metrics.map((metric) => Number(row[metric.field] || 0))
    )
  );
  const primaryMax = Math.max(...primaryValues.map((value) => Math.abs(value)), 0.01);
  const channelMax = Math.max(...channelValues.map((value) => Math.abs(value)), 0.01);

  function signedGrowthAxis(rawValue, color, maxValue, ariaLabel) {
    const hasValue = rawValue !== null && rawValue !== undefined && rawValue !== "";
    const value = hasValue ? Number(rawValue) : null;
    const w = 420,
      h = 28,
      mid = 210,
      maxBar = 154;
    const root = svg("svg", {
      viewBox: `0 0 ${w} ${h}`,
      role: "img",
      "aria-label": `${ariaLabel} ${fmtPct(value)}`
    });
    root.appendChild(svg("line", { x1: mid, y1: 2, x2: mid, y2: h - 2, stroke: "#cbd8e3" }));
    if (value === null || !Number.isFinite(value)) {
      root.appendChild(
        svg("text", { x: mid + 8, y: 18, "font-size": "11", fill: "#8a97a8" })
      ).textContent = "N/A";
      return root;
    }
    const width = (Math.abs(value) / maxValue) * maxBar;
    const x = value >= 0 ? mid : mid - width;
    root.appendChild(
      svg("rect", {
        x,
        y: 8,
        width: Math.max(width, value === 0 ? 1 : 2),
        height: 12,
        rx: 3,
        fill: color
      })
    );
    root.appendChild(
      svg("text", {
        x: value >= 0 ? x + width + 8 : x - 8,
        y: 18,
        "text-anchor": value >= 0 ? "start" : "end",
        "font-size": "11",
        fill: "#657386",
        "font-weight": "700"
      })
    ).textContent = fmtPct(value);
    return root;
  }

  const legend = document.createElement("div");
  legend.className = "growth-legend";
  primaryMetrics.forEach((metric) => {
    const item = document.createElement("span");
    item.innerHTML = `${reportSwatch(metric.color)}${metric.label}`;
    legend.appendChild(item);
  });
  const axisNote = document.createElement("span");
  axisNote.textContent = "每项独立成行；0% 为中心线";
  legend.appendChild(axisNote);

  const board = document.createElement("div");
  board.className = "growth-board";
  rows.forEach((row, index) => {
    const store = document.createElement("section");
    store.className = "growth-store";

    const head = document.createElement("div");
    head.className = "growth-store-head";
    const storeName = document.createElement("div");
    storeName.className = "growth-store-name";
    storeName.textContent = cleanName(row["门店名称"]);

    const primary = document.createElement("div");
    primary.className = "growth-primary";
    primaryMetrics.forEach((metric) => {
      const metricRow = document.createElement("div");
      metricRow.className = "growth-primary-row";
      const label = document.createElement("span");
      label.className = "growth-metric-label";
      label.textContent = metric.label;
      const axis = document.createElement("div");
      axis.className = "growth-axis";
      axis.appendChild(signedGrowthAxis(row[metric.field], metric.color, primaryMax, metric.label));
      metricRow.append(label, axis);
      primary.appendChild(metricRow);
    });

    const detailId = `growth-channel-detail-${index}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "growth-toggle";
    button.textContent = "查看渠道明细 ▾";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", detailId);
    button.setAttribute("aria-label", `${cleanName(row["门店名称"])} 查看渠道明细`);
    head.append(storeName, primary, button);

    const detail = document.createElement("div");
    detail.id = detailId;
    detail.className = "growth-channel-detail";
    detail.hidden = true;
    channelRows.forEach((channel) => {
      const channelRow = document.createElement("div");
      channelRow.className = "growth-channel-row";
      const channelName = document.createElement("div");
      channelName.className = "growth-channel-name";
      channelName.textContent = channel.label;
      channelRow.appendChild(channelName);
      channel.metrics.forEach((metric) => {
        const metricCell = document.createElement("div");
        metricCell.className = "growth-channel-metric";
        const label = document.createElement("span");
        label.className = "growth-metric-label";
        label.textContent = metric.shortLabel;
        label.style.color = metric.color;
        const axis = document.createElement("div");
        axis.className = "growth-axis";
        axis.appendChild(
          signedGrowthAxis(row[metric.field], metric.color, channelMax, metric.label)
        );
        metricCell.append(label, axis);
        channelRow.appendChild(metricCell);
      });
      detail.appendChild(channelRow);
    });

    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(expanded));
      detail.hidden = !expanded;
      button.textContent = expanded ? "收起渠道明细 ▴" : "查看渠道明细 ▾";
      button.setAttribute(
        "aria-label",
        `${cleanName(row["门店名称"])} ${expanded ? "收起渠道明细" : "查看渠道明细"}`
      );
    });
    store.append(head, detail);
    board.appendChild(store);
  });
  el.innerHTML = "";
  el.append(legend, board);
}
function renderBucketedScatter() {
  const el = document.getElementById("scatter");
  const groups = segmentGroups.length
    ? segmentGroups
    : [
        {
          label: "全体门店",
          rows: stores,
          revenue_threshold: data.segment_rules.revenue_threshold,
          growth_threshold: 0
        }
      ];
  const w = 760,
    panelH = 260,
    h = Math.max(330, groups.length * panelH + 18),
    left = 58,
    right = 28,
    topPad = 34,
    bottom = 40;
  const root = svg("svg", { viewBox: `0 0 ${w} ${h}` });
  groups.forEach((group, groupIndex) => {
    const rows = group.rows || [];
    const top = groupIndex * panelH + topPad;
    const axisBottom = (groupIndex + 1) * panelH - bottom;
    const xs = rows.map((r) => Number(r.wow_net_revenue_pct || 0));
    const ys = rows.map((r) => Number(r.current_net_revenue || 0));
    const minX = Math.min(...xs, -0.01),
      maxX = Math.max(...xs, 0.01),
      maxY = Math.max(...ys, 1);
    const revenueThreshold = Number(group.revenue_threshold || 0);
    const growthThreshold = Number(group.growth_threshold || 0);
    const xScale = (v) => left + ((v - minX) / (maxX - minX || 1)) * (w - left - right);
    const yScale = (v) => axisBottom - (v / maxY) * (axisBottom - top);
    root.appendChild(
      svg("text", {
        x: left,
        y: top - 14,
        "font-size": "13",
        fill: "#172033",
        "font-weight": "800"
      })
    ).textContent = `${group.label}四象限`;
    root.appendChild(
      svg("text", {
        x: w - right,
        y: top - 14,
        "text-anchor": "end",
        "font-size": "11",
        fill: "#657386"
      })
    ).textContent = `收入中位数 ${fmtWan(revenueThreshold)}`;
    root.appendChild(
      svg("line", { x1: left, y1: axisBottom, x2: w - right, y2: axisBottom, stroke: "#9aa7b5" })
    );
    root.appendChild(
      svg("line", { x1: left, y1: top, x2: left, y2: axisBottom, stroke: "#9aa7b5" })
    );
    root.appendChild(
      svg("line", {
        x1: xScale(growthThreshold),
        y1: top,
        x2: xScale(growthThreshold),
        y2: axisBottom,
        stroke: "#cfd9e3",
        "stroke-dasharray": "5 5"
      })
    );
    root.appendChild(
      svg("line", {
        x1: left,
        y1: yScale(revenueThreshold),
        x2: w - right,
        y2: yScale(revenueThreshold),
        stroke: "#cfd9e3",
        "stroke-dasharray": "5 5"
      })
    );
    const placedLabels = [];
    [
      ["高基盘承压", left + 26, top + 17, colors.amber],
      ["明星门店", Math.min(w - right - 88, xScale(growthThreshold) + 10), top + 17, colors.green],
      ["问题门店", left + 10, axisBottom - 12, colors.red],
      [
        "成长观察",
        Math.min(w - right - 88, xScale(growthThreshold) + 10),
        axisBottom - 12,
        colors.blue
      ]
    ].forEach(([label, x, y, color]) => {
      placedLabels.push({ x, y });
      root.appendChild(
        svg("text", { x, y, "font-size": "10", fill: color, "font-weight": "800", opacity: 0.78 })
      ).textContent = label;
    });
    rows.forEach((r) => {
      const seg = r.segment;
      const fill =
        seg === "明星门店"
          ? colors.green
          : seg === "问题门店"
            ? colors.red
            : seg === "高基盘承压"
              ? colors.amber
              : colors.blue;
      const radius = 7 + Math.min(12, Number(r.current_discount_rate || 0) * 35);
      const cx = xScale(Number(r.wow_net_revenue_pct || 0));
      const cy = yScale(Number(r.current_net_revenue || 0));
      const marker = svg("circle", { cx, cy, r: radius, fill, opacity: 0.82 });
      const tooltip = svg("title");
      tooltip.textContent = `${cleanName(r["门店名称"])} · 收入 ${fmtWan(r.current_net_revenue)} · 环比 ${fmtPct(r.wow_net_revenue_pct)} · ${seg}`;
      marker.appendChild(tooltip);
      root.appendChild(marker);
      let anchor = "start";
      let lx = cx + radius + 4;
      let ly = cy + 4;
      if (cx > w - right - 90) {
        anchor = "end";
        lx = cx - radius - 4;
      }
      let guard = 0;
      while (
        placedLabels.some((p) => Math.abs(p.x - lx) < 92 && Math.abs(p.y - ly) < 15) &&
        guard < 8
      ) {
        ly += 15;
        if (ly > axisBottom - 8) ly = cy - 12 - guard * 10;
        guard += 1;
      }
      placedLabels.push({ x: lx, y: ly });
      root.appendChild(
        svg("text", {
          x: lx,
          y: ly,
          "text-anchor": anchor,
          "font-size": "11",
          fill: "#344054",
          stroke: "#fff",
          "stroke-width": 3,
          "paint-order": "stroke"
        })
      ).textContent = cleanName(r["门店名称"]);
    });
  });
  root.appendChild(
    svg("text", {
      x: w / 2,
      y: h - 10,
      "text-anchor": "middle",
      "font-size": "12",
      fill: "#657386"
    })
  ).textContent = "环比增长率";
  el.innerHTML = "";
  el.appendChild(root);
}
function currentTrendView() {
  return (
    (data.trend_by_grain || {})[selectedTrendGrain] || {
      entities: data.trend_entities || [{ key: "__all__", label: "全体门店", rows: data.trend }],
      note: data.trend_note || ""
    }
  );
}
function currentTrendEntity() {
  const entities = currentTrendView().entities;
  return (
    entities.find((item) => item.key === selectedTrendKey) ||
    entities[0] || { key: "__all__", label: "全体门店", rows: [] }
  );
}
function setTrendRange(start, end) {
  const count = (currentTrendEntity().rows || []).length;
  if (!count) return;
  trendStart = Math.max(0, Math.min(Math.round(start), count - 1));
  trendEnd = Math.max(trendStart, Math.min(Math.round(end), count - 1));
  renderTrend();
}
function renderTrendControls() {
  const rows = currentTrendEntity().rows || [];
  const presetOptions = {
    day: [
      [7, "最近 7 天"],
      [30, "最近 30 天"],
      [90, "最近 90 天"],
      [0, "全年"]
    ],
    week: [
      [2, "最近 2 周"],
      [5, "最近 5 周"],
      [16, "最近 16 周"],
      [0, "全年"]
    ],
    month: [
      [2, "最近 2 个月"],
      [6, "最近 6 个月"],
      [0, "全年"]
    ]
  };
  const presets = document.getElementById("trendPresets");
  presets.replaceChildren();
  presetOptions[selectedTrendGrain].forEach(([size, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.size = size;
    button.addEventListener("click", () => {
      const count = (currentTrendEntity().rows || []).length;
      setTrendRange(size ? Math.max(0, count - size) : 0, count - 1);
    });
    presets.appendChild(button);
  });
  ["trendStartSelect", "trendEndSelect"].forEach((id) => {
    const select = document.getElementById(id);
    select.replaceChildren();
    rows.forEach((row, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = row.current_week_range || row.week_label;
      select.appendChild(option);
    });
    select.disabled = !rows.length;
    select.onchange = () => {
      const value = Number(select.value);
      if (id === "trendStartSelect") setTrendRange(value, Math.max(value, trendEnd));
      else setTrendRange(Math.min(trendStart, value), value);
    };
  });
  const navigator = document.getElementById("trendNavigator");
  if (navigator.dataset.bound) return;
  navigator.dataset.bound = "true";
  let drag = null;
  const boundary = (event) => {
    const bounds = navigator.getBoundingClientRect();
    const count = (currentTrendEntity().rows || []).length;
    return Math.max(
      0,
      Math.min(count, Math.round(((event.clientX - bounds.left) / bounds.width) * count))
    );
  };
  navigator.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !(currentTrendEntity().rows || []).length) return;
    const mode = event.target.getAttribute("data-drag") || "select";
    drag = { mode, anchor: boundary(event), start: trendStart, end: trendEnd };
    navigator.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  navigator.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const value = boundary(event);
    const count = (currentTrendEntity().rows || []).length;
    if (drag.mode === "start") setTrendRange(Math.min(value, drag.end), drag.end);
    else if (drag.mode === "end") setTrendRange(drag.start, Math.max(drag.start, value - 1));
    else if (drag.mode === "pan") {
      const offset = Math.max(-drag.start, Math.min(value - drag.anchor, count - 1 - drag.end));
      setTrendRange(drag.start + offset, drag.end + offset);
    } else setTrendRange(Math.min(value, drag.anchor), Math.max(value, drag.anchor) - 1);
  });
  const endDrag = () => {
    drag = null;
  };
  navigator.addEventListener("pointerup", endDrag);
  navigator.addEventListener("pointercancel", endDrag);
  navigator.addEventListener("lostpointercapture", endDrag);
}
function trendExtremes(values) {
  const min = Math.min(...values),
    max = Math.max(...values);
  return (value) =>
    min === max ? "normal" : value === min ? "low" : value === max ? "high" : "normal";
}
const trendBarColors = { normal: colors.yellowFill, low: colors.minimum, high: colors.maximum };
const trendValuePresent = (value) => value !== null && value !== undefined && value !== "";
function renderTrendNavigator(rows, currentField, priorField) {
  const el = document.getElementById("trendNavigator");
  const root = svg("svg", {
    viewBox: "0 0 1120 64",
    preserveAspectRatio: "none",
    "aria-hidden": "true"
  });
  root.appendChild(
    svg("rect", {
      x: 0,
      y: 0,
      width: 1120,
      height: 64,
      rx: 6,
      fill: "#f4f7fa",
      "data-drag": "select"
    })
  );
  const max = Math.max(
    1,
    ...rows.flatMap((row) => [Number(row[currentField] || 0), Number(row[priorField] || 0)])
  );
  if (weeklyDashboard) {
    const width = 1120 / rows.length;
    const currentValues = rows
      .map((row) => row[currentField])
      .filter(trendValuePresent)
      .map(Number);
    const extreme = trendExtremes(currentValues);
    rows.forEach((row, index) => {
      if (!trendValuePresent(row[currentField])) return;
      const value = Number(row[currentField]);
      const height = Math.max(0, (value / max) * 48);
      root.appendChild(
        svg("rect", {
          x: (index + 0.15) * width,
          y: 56 - height,
          width: width * 0.7,
          height,
          fill: trendBarColors[extreme(value)],
          "pointer-events": "none"
        })
      );
    });
  }
  (weeklyDashboard ? [priorField] : [currentField, priorField]).forEach((field, series) => {
    let segment = [];
    const flush = () => {
      if (segment.length)
        root.appendChild(
          svg("polyline", {
            points: segment.join(" "),
            fill: "none",
            stroke: colors.yellow,
            "stroke-width": 2,
            ...(series ? { "stroke-dasharray": "5 4" } : {}),
            "pointer-events": "none"
          })
        );
      segment = [];
    };
    rows.forEach((row, index) => {
      const value = row[field];
      if (value === null || value === undefined || value === "") {
        flush();
        return;
      }
      segment.push(`${((index + 0.5) / rows.length) * 1120},${56 - (Number(value) / max) * 48}`);
    });
    flush();
  });
  const startX = (trendStart / rows.length) * 1120;
  const endX = ((trendEnd + 1) / rows.length) * 1120;
  [
    [0, startX],
    [endX, 1120 - endX]
  ].forEach(([x, width]) =>
    root.appendChild(
      svg("rect", {
        x,
        y: 0,
        width,
        height: 64,
        fill: "#dbe4ef",
        opacity: 0.65,
        "data-drag": "select"
      })
    )
  );
  root.appendChild(
    svg("rect", {
      x: startX,
      y: 1,
      width: endX - startX,
      height: 62,
      fill: "#2563eb",
      "fill-opacity": 0.08,
      stroke: "#2563eb",
      "stroke-width": 2,
      "data-drag": "pan"
    })
  );
  [
    [startX, "start"],
    [endX, "end"]
  ].forEach(([x, mode]) => {
    root.appendChild(
      svg("rect", {
        x: Math.max(0, Math.min(1104, x - 8)),
        y: 0,
        width: 16,
        height: 64,
        rx: 4,
        fill: "#2563eb",
        "data-drag": mode
      })
    );
  });
  el.replaceChildren(root);
}
function renderTrendSelector() {
  const select = document.getElementById("trendStoreSelect");
  const entities = currentTrendView().entities;
  select.replaceChildren();
  entities.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.key;
    option.textContent = cleanName(item.label);
    select.appendChild(option);
  });
  selectedTrendKey = currentTrendEntity().key;
  select.value = selectedTrendKey;
  select.onchange = () => {
    selectedTrendKey = select.value;
    renderTrend();
  };
  const grainSelect = document.getElementById("trendGrainSelect");
  grainSelect.replaceChildren();
  [
    ["day", "日"],
    ["week", "周"],
    ["month", "月"]
  ].forEach(([grain, label]) => {
    if (!(data.trend_by_grain || {})[grain] && grain !== data.meta.report_grain) return;
    const option = document.createElement("option");
    option.value = grain;
    option.textContent = label;
    grainSelect.appendChild(option);
  });
  grainSelect.value = selectedTrendGrain;
  grainSelect.onchange = () => {
    selectedTrendGrain = grainSelect.value;
    trendStart = 0;
    trendEnd = null;
    renderTrendSelector();
    renderTrend();
  };
  renderTrendControls();
}
function renderTrend() {
  const el = document.getElementById("trend");
  const entity = currentTrendEntity();
  const allRows = entity.rows || [];
  if (!allRows.length) {
    el.replaceChildren();
    document.getElementById("trendNavigator").replaceChildren();
    document.getElementById("trendControls").hidden = true;
    return;
  }
  trendEnd = Math.min(trendEnd ?? allRows.length - 1, allRows.length - 1);
  trendStart = Math.min(trendStart, trendEnd);
  const rows = allRows.slice(trendStart, trendEnd + 1);
  const yearLabel = (field, fallback) => {
    const first = String(rows[0][field] || "").slice(0, 4);
    const last = String(rows[rows.length - 1][field] || "").slice(11, 15);
    return first && last ? (first === last ? first : `${first}–${last}`) : fallback;
  };
  const currentLabel = yearLabel("current_week_range", currentTrendYear);
  const priorLabel = yearLabel("prior_week_range", yoyTrendYear);
  const isAllStores = entity.key === "__all__";
  const units = { day: "天", week: "周", month: "个月" };
  const basis = { day: "每日", week: "完整周", month: "完整自然月" }[selectedTrendGrain];
  document.getElementById("trendTitle").textContent =
    `最近一年收入趋势（${allRows.length} ${units[selectedTrendGrain]}）`;
  const comparisonLabel = weeklyDashboard
    ? "柱状＝本期，点线＝同期"
    : `实线=${currentLabel}，虚线=${priorLabel}同期`;
  document.getElementById("trendMetricLabel").textContent =
    `${basis} · ${isAllStores ? "整体" : cleanName(entity.label)}业务收入（万元）；${comparisonLabel}`;
  document.getElementById("trendControls").hidden = false;
  const w = 1120,
    h = 360,
    left = 82,
    right = 84,
    top = 34,
    bottom = 78;
  const hasComparisonShape = rows.some(
    (r) =>
      Object.prototype.hasOwnProperty.call(r, "current_net_revenue") ||
      Object.prototype.hasOwnProperty.call(r, "prior_net_revenue")
  );
  const currentField = hasComparisonShape ? "current_net_revenue" : "net_revenue";
  const priorField = "prior_net_revenue";
  const allValues = rows.flatMap((r) => [Number(r[currentField] || 0), Number(r[priorField] || 0)]);
  const max = Math.max(...allValues, 1);
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = magnitude / 2;
  const yMax = Math.ceil(max / step) * step;
  const yScale = (v) => h - bottom - (Number(v || 0) / yMax) * (h - top - bottom);
  const plotWidth = w - left - right;
  const barWidth = Math.min(44, (plotWidth / rows.length) * 0.66);
  const xScale = (i) =>
    weeklyDashboard || rows.length === 1
      ? left + ((i + 0.5) * plotWidth) / rows.length
      : left + (i / (rows.length - 1)) * plotWidth;
  const root = svg("svg", { viewBox: `0 0 ${w} ${h}` });
  [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
    const value = yMax * t;
    const y = yScale(value);
    root.appendChild(svg("line", { x1: left, y1: y, x2: w - right, y2: y, stroke: "#e6edf3" }));
    root.appendChild(
      svg("text", {
        x: left - 10,
        y: y + 4,
        "text-anchor": "end",
        "font-size": "11",
        fill: "#657386"
      })
    ).textContent = fmtWan(value);
  });
  root.appendChild(svg("line", { x1: left, y1: top, x2: left, y2: h - bottom, stroke: "#9aa7b5" }));
  root.appendChild(
    svg("line", { x1: left, y1: h - bottom, x2: w - right, y2: h - bottom, stroke: "#9aa7b5" })
  );

  function trendPoints(field) {
    return rows
      .map((r, i) => {
        const raw = r[field];
        if (!trendValuePresent(raw)) return null;
        const x = xScale(i);
        const y = yScale(Number(raw || 0));
        return [x, y, r, Number(raw || 0), i];
      })
      .filter(Boolean);
  }
  const currentBars = new Map();
  function drawCurrentBars() {
    const points = trendPoints(currentField);
    const extreme = trendExtremes(points.map((point) => point[3]));
    const baseline = yScale(0);
    points.forEach(([x, y, , value, index]) => {
      const level = extreme(value);
      const bar = svg("rect", {
        x: x - barWidth / 2,
        y: Math.min(baseline, y),
        width: barWidth,
        height: Math.abs(baseline - y),
        fill: trendBarColors[level],
        "fill-opacity": 0.62,
        "data-trend-current-bar": level
      });
      currentBars.set(index, bar);
      root.appendChild(bar);
    });
    const last = points.at(-1);
    if (last) {
      root.appendChild(
        svg("text", {
          x: last[0],
          y: last[1] - 9,
          "text-anchor": "middle",
          "font-size": "11",
          fill: colors.yellow,
          "font-weight": "800"
        })
      ).textContent = fmtWan(last[3]);
    }
  }
  function drawTrendLine(field, color, dash, rangeField) {
    const points = trendPoints(field);
    if (!points.length) return;
    const values = points.map(([, , , value]) => value);
    const minValue = Math.min(...values),
      maxValue = Math.max(...values);
    const hasDistinctExtremes = points.length > 1 && minValue !== maxValue;
    const segments = [];
    points.forEach((point) => {
      const last = segments[segments.length - 1];
      if (!last || point[4] !== last[last.length - 1][4] + 1) segments.push([point]);
      else last.push(point);
    });
    segments.forEach((segment) =>
      root.appendChild(
        svg("polyline", {
          points: segment.map((p) => `${p[0]},${p[1]}`).join(" "),
          fill: "none",
          stroke: color,
          "stroke-width": 3,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          ...(dash ? { "stroke-dasharray": dash } : {})
        })
      )
    );
    points.forEach(([x, y, r, value], i) => {
      if (points.length > 60 && i !== points.length - 1 && value !== minValue && value !== maxValue)
        return;
      const isMin = hasDistinctExtremes && value === minValue;
      const isMax = hasDistinctExtremes && value === maxValue;
      const point = svg("circle", {
        cx: x,
        cy: y,
        r: 5,
        fill: isMin ? colors.minimum : isMax ? colors.maximum : colors.yellowFill,
        stroke: isMin ? colors.minimumStroke : isMax ? colors.maximumStroke : color,
        "stroke-width": 2,
        class: "interactive-chart-mark"
      });
      const weekLabel = String(r.week_label || "");
      const pointRange = String(r[rangeField] || weekLabel);
      const title = svg("title", {});
      title.textContent = `${pointRange} 业务收入：${fmtWan(value)}`;
      point.appendChild(title);
      root.appendChild(point);
      if (i === points.length - 1) {
        const labelY = field === priorField ? y + 19 : y - 9;
        root.appendChild(
          svg("text", {
            x: x - 7,
            y: labelY,
            "text-anchor": "end",
            "font-size": "11",
            fill: color,
            "font-weight": "800"
          })
        ).textContent = fmtWan(value);
      }
    });
  }
  if (weeklyDashboard) drawCurrentBars();
  else
    drawTrendLine(
      currentField,
      colors.yellow,
      "",
      hasComparisonShape ? "current_week_range" : "week_label"
    );
  if (hasComparisonShape)
    drawTrendLine(priorField, colors.yellow, weeklyDashboard ? "" : "7 5", "prior_week_range");

  rows.forEach((r, i) => {
    const x = xScale(i);
    if (i % Math.max(1, Math.ceil(rows.length / 10)) === 0 || i === rows.length - 1) {
      const anchor = i === rows.length - 1 ? "end" : "middle";
      const tx = i === rows.length - 1 ? x - 4 : x;
      root.appendChild(
        svg("text", {
          x: tx,
          y: h - 42,
          "text-anchor": anchor,
          "font-size": "10",
          fill: "#657386",
          transform: `rotate(-32 ${tx} ${h - 42})`
        })
      ).textContent = r.current_week_range
        ? String(r.current_week_range).slice(0, 10)
        : String(r.week_label);
    }
  });
  if (weeklyDashboard) {
    root.appendChild(
      svg("rect", {
        x: left + 203,
        y: 9,
        width: 16,
        height: 12,
        fill: trendBarColors.normal,
        "fill-opacity": 0.62
      })
    );
  } else {
    root.appendChild(
      svg("line", {
        x1: left + 190,
        y1: 15,
        x2: left + 232,
        y2: 15,
        stroke: colors.yellow,
        "stroke-width": 3,
        "stroke-linecap": "round"
      })
    );
  }
  root.appendChild(
    svg("text", { x: left + 240, y: 19, "font-size": "11", fill: "#657386" })
  ).textContent = weeklyDashboard ? `本期 · ${currentLabel}` : currentLabel;
  if (hasComparisonShape) {
    root.appendChild(
      svg("line", {
        x1: left + 362,
        y1: 15,
        x2: left + 404,
        y2: 15,
        stroke: colors.yellow,
        "stroke-width": 3,
        "stroke-linecap": "round",
        ...(!weeklyDashboard ? { "stroke-dasharray": "7 5" } : {})
      })
    );
    if (weeklyDashboard)
      root.appendChild(
        svg("circle", {
          cx: left + 383,
          cy: 15,
          r: 4,
          fill: colors.yellowFill,
          stroke: colors.yellow
        })
      );
    root.appendChild(
      svg("text", { x: left + 412, y: 19, "font-size": "11", fill: "#657386" })
    ).textContent = weeklyDashboard ? `同期 · ${priorLabel}` : `${priorLabel}同期`;
  }
  root.appendChild(
    svg("text", { x: left, y: 18, "font-size": "12", fill: "#657386", "font-weight": "700" })
  ).textContent = "业务收入（万元）";
  el.innerHTML = "";
  el.appendChild(root);
  const guide = svg("line", {
    x1: left,
    x2: left,
    y1: top,
    y2: h - bottom,
    stroke: "#657386",
    "stroke-width": 1,
    "stroke-dasharray": "4 4",
    visibility: "hidden",
    "pointer-events": "none",
    "data-trend-guide": "true"
  });
  root.appendChild(guide);
  const markers = [currentField, priorField].map((field, series) => {
    if (weeklyDashboard && !series) return null;
    const marker = svg("circle", {
      r: 6,
      fill: series ? "white" : colors.yellowFill,
      stroke: colors.yellow,
      "stroke-width": 3,
      visibility: "hidden",
      "pointer-events": "none",
      "data-trend-marker": field
    });
    root.appendChild(marker);
    return marker;
  });
  const readout = document.getElementById("trendReadout");
  let activeIndex = rows.length - 1;
  const valueText = (value) =>
    value === null || value === undefined || value === "" ? "暂无记录" : fmtYuan(value);
  const showIndex = (index, visible = true) => {
    activeIndex = Math.max(0, Math.min(rows.length - 1, index));
    const row = rows[activeIndex];
    const x = xScale(activeIndex);
    if (weeklyDashboard) {
      root.querySelector("[data-active-trend-bar]")?.removeAttribute("data-active-trend-bar");
      if (visible) currentBars.get(activeIndex)?.setAttribute("data-active-trend-bar", "");
    }
    guide.setAttribute("x1", x);
    guide.setAttribute("x2", x);
    guide.setAttribute("visibility", visible ? "visible" : "hidden");
    [currentField, priorField].forEach((field, series) => {
      if (!markers[series]) return;
      const value = row[field];
      const present = trendValuePresent(value);
      markers[series].setAttribute("cx", x);
      markers[series].setAttribute("cy", yScale(value));
      markers[series].setAttribute("visibility", visible && present ? "visible" : "hidden");
    });
    readout.replaceChildren();
    [
      [row.current_week_range || row.week_label, row[currentField], "本期"],
      [row.prior_week_range, row[priorField], "同期"]
    ].forEach(([range, value, label]) => {
      const line = document.createElement("div");
      const dateLabel =
        range && range.slice(0, 10) === range.slice(11) ? range.slice(0, 10) : range;
      line.textContent = `${label} ${dateLabel || "无对应日期"} · 业务收入：${valueText(value)}`;
      readout.appendChild(line);
    });
  };
  const overlay = svg("rect", {
    x: left,
    y: top,
    width: w - left - right,
    height: h - top - bottom,
    fill: "transparent",
    tabindex: 0,
    role: "img",
    "aria-label": "收入趋势，左右方向键逐期查看，Home 和 End 跳到首尾",
    "data-trend-overlay": "true",
    class: "trend-pointer-overlay"
  });
  overlay.addEventListener("pointermove", (event) => {
    const bounds = root.getBoundingClientRect();
    const matrix = root.getScreenCTM?.();
    const x = matrix
      ? (event.clientX - matrix.e) / matrix.a
      : ((event.clientX - bounds.left) / bounds.width) * w;
    const fraction = (x - left) / plotWidth;
    showIndex(
      weeklyDashboard
        ? Math.floor(fraction * rows.length)
        : Math.round(fraction * (rows.length - 1))
    );
  });
  overlay.addEventListener("pointerleave", () => showIndex(rows.length - 1, false));
  overlay.addEventListener("focus", () => showIndex(activeIndex));
  overlay.addEventListener("blur", () => showIndex(rows.length - 1, false));
  overlay.addEventListener("keydown", (event) => {
    const next = {
      ArrowLeft: activeIndex - 1,
      ArrowRight: activeIndex + 1,
      Home: 0,
      End: rows.length - 1
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    showIndex(next);
  });
  root.appendChild(overlay);
  showIndex(rows.length - 1, false);
  document.getElementById("trendStartSelect").value = trendStart;
  document.getElementById("trendEndSelect").value = trendEnd;
  const start = rows[0].current_week_range || rows[0].week_label;
  const end = rows[rows.length - 1].current_week_range || rows[rows.length - 1].week_label;
  const label =
    start.includes("-") && start.length === 21
      ? `${start.slice(0, 10)} 至 ${end.slice(11)}`
      : `${start} 至 ${end}`;
  document.getElementById("trendRangeLabel").textContent =
    `当前显示：${label}（${rows.length} ${units[selectedTrendGrain]}） · ${currentTrendView().note}`;
  document.querySelectorAll("#trendPresets button").forEach((button) => {
    const size = Number(button.dataset.size) || allRows.length;
    button.disabled = !allRows.length;
    button.setAttribute(
      "aria-pressed",
      String(trendEnd === allRows.length - 1 && rows.length === Math.min(size, allRows.length))
    );
  });
  renderTrendNavigator(allRows, currentField, priorField);
}
function renderMixBars() {
  const rows = stores;
  const el = document.getElementById("mixBar");
  const w = 760,
    h = Math.max(310, rows.length * 32 + 46),
    left = 150,
    right = 70;
  const root = svg("svg", { viewBox: `0 0 ${w} ${h}` });
  const max = Math.max(...rows.map((r) => Number(r.current_net_revenue || 0)), 1);
  rows.forEach((r, i) => {
    const y = 26 + i * 32;
    const total = Number(r.current_net_revenue || 0);
    const dine = Number(r.current_dine_in_revenue || 0);
    const del = Number(r.current_delivery_revenue || 0);
    const other = Math.max(0, total - dine - del);
    let x = left;
    root.appendChild(
      svg("text", {
        x: left - 8,
        y: y + 15,
        "text-anchor": "end",
        "font-size": "12",
        fill: "#344054"
      })
    ).textContent = cleanName(r["门店名称"]);
    [
      [dine, colors.teal],
      [del, colors.blue],
      [other, colors.amber]
    ].forEach(([v, c]) => {
      const bw = (v / max) * (w - left - right);
      root.appendChild(svg("rect", { x, y, width: bw, height: 18, rx: 2, fill: c }));
      x += bw;
    });
    root.appendChild(
      svg("text", {
        x: left + (total / max) * (w - left - right) + 8,
        y: y + 14,
        "font-size": "12",
        fill: "#657386"
      })
    ).textContent = fmtWan(total);
  });
  el.innerHTML = "";
  el.appendChild(root);
}
function renderPlatformBars() {
  const rows = stores;
  const el = document.getElementById("platformBar");
  const w = 760,
    h = Math.max(310, rows.length * 32 + 46),
    left = 150,
    right = 70;
  const max = Math.max(
    ...rows.map(
      (r) =>
        Number(r.current_meituan_delivery_revenue || 0) +
        Number(r.current_eleme_delivery_revenue || 0) +
        Number(r.current_jd_delivery_revenue || 0)
    ),
    1
  );
  const root = svg("svg", { viewBox: `0 0 ${w} ${h}` });
  rows.forEach((r, i) => {
    const y = 26 + i * 32;
    const vals = [
      [Number(r.current_meituan_delivery_revenue || 0), colors.green],
      [Number(r.current_eleme_delivery_revenue || 0), colors.violet],
      [Number(r.current_jd_delivery_revenue || 0), colors.orange]
    ];
    let x = left,
      total = vals.reduce((s, v) => s + v[0], 0);
    root.appendChild(
      svg("text", {
        x: left - 8,
        y: y + 15,
        "text-anchor": "end",
        "font-size": "12",
        fill: "#344054"
      })
    ).textContent = cleanName(r["门店名称"]);
    vals.forEach(([v, c]) => {
      const bw = (v / max) * (w - left - right);
      root.appendChild(svg("rect", { x, y, width: bw, height: 18, rx: 2, fill: c }));
      x += bw;
    });
    root.appendChild(
      svg("text", {
        x: left + (total / max) * (w - left - right) + 8,
        y: y + 14,
        "font-size": "12",
        fill: "#657386"
      })
    ).textContent = fmtWan(total);
  });
  el.innerHTML = "";
  el.appendChild(root);
}
function currentStallMixEntity() {
  const entities = data.stall_sales_mix?.entities || [];
  return entities.find((item) => item.key === selectedStallMixKey) || entities[0];
}
function renderStallMixSelector() {
  const select = document.getElementById("stallMixStoreSelect");
  if (!select) return;
  const entities = data.stall_sales_mix?.entities || [];
  if (!entities.length) {
    select.innerHTML = "";
    return;
  }
  select.innerHTML = entities
    .map((item) => `<option value="${item.key}">${cleanName(item.label)}</option>`)
    .join("");
  if (!entities.some((item) => item.key === selectedStallMixKey))
    selectedStallMixKey = entities[0].key;
  select.value = selectedStallMixKey;
  select.addEventListener("change", () => {
    selectedStallMixKey = select.value;
    renderStallSalesMix();
  });
}
function describeArc(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  const outerStart = [cx + rOuter * Math.cos(startAngle), cy + rOuter * Math.sin(startAngle)];
  const outerEnd = [cx + rOuter * Math.cos(endAngle), cy + rOuter * Math.sin(endAngle)];
  const innerStart = [cx + rInner * Math.cos(endAngle), cy + rInner * Math.sin(endAngle)];
  const innerEnd = [cx + rInner * Math.cos(startAngle), cy + rInner * Math.sin(startAngle)];
  return [
    `M ${outerStart[0]} ${outerStart[1]}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd[0]} ${outerEnd[1]}`,
    `L ${innerStart[0]} ${innerStart[1]}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerEnd[0]} ${innerEnd[1]}`,
    "Z"
  ].join(" ");
}
function renderStallSalesMix() {
  const pie = document.getElementById("stallMixPie");
  const tableBody = document.querySelector("#stallMixTable tbody");
  const label = document.getElementById("stallMixTotalLabel");
  const mix = data.stall_sales_mix || {};
  if (!mix.enabled) {
    document.getElementById("stall-mix").hidden = true;
    return;
  }
  const entity = currentStallMixEntity();
  if (!entity) return;
  const rows = entity.rows || [];
  if (label) label.textContent = `${cleanName(entity.label)}店内营业收入 ${fmtWan(entity.total)}`;

  const w = 760,
    h = 340,
    cx = 218,
    cy = 170,
    rOuter = 122,
    rInner = 68;
  const root = svg("svg", { viewBox: `0 0 ${w} ${h}` });
  const tip = document.createElement("div");
  tip.className = "chart-tooltip";
  let start = -Math.PI / 2;
  rows.forEach((row, index) => {
    const value = Number(row.value || 0);
    const angle = (value / Math.max(entity.total, 1)) * Math.PI * 2;
    const end = start + angle;
    const fill = stallPalette[index % stallPalette.length];
    if (angle > 0.0001) {
      const slice = svg("path", {
        d: describeArc(cx, cy, rOuter, rInner, start, end),
        fill,
        stroke: "#fff",
        "stroke-width": 2,
        class: "interactive-chart-mark"
      });
      slice.addEventListener("mousemove", (event) => {
        tip.innerHTML = `<strong>${row.name}</strong>${fmtWan(value)}<br>占比：${fmtPct(row.share)}`;
        positionTooltip(tip, pie, event);
      });
      slice.addEventListener("mouseleave", () => {
        tip.style.display = "none";
      });
      root.appendChild(slice);
    }
    start = end;
  });
  root.appendChild(
    svg("text", {
      x: cx,
      y: cy - 4,
      "text-anchor": "middle",
      "font-size": "13",
      fill: "#657386",
      "font-weight": "760"
    })
  ).textContent = cleanName(entity.label);
  root.appendChild(
    svg("text", {
      x: cx,
      y: cy + 24,
      "text-anchor": "middle",
      "font-size": "24",
      fill: "#172033",
      "font-weight": "840"
    })
  ).textContent = fmtWan(entity.total);
  const legendX = 390;
  rows.forEach((row, index) => {
    const y = 42 + index * 25;
    root.appendChild(
      svg("rect", {
        x: legendX,
        y: y - 10,
        width: 11,
        height: 11,
        rx: 2,
        fill: stallPalette[index % stallPalette.length]
      })
    );
    const name =
      String(row.name || "").length > 18 ? `${String(row.name).slice(0, 18)}...` : row.name;
    root.appendChild(
      svg("text", {
        x: legendX + 18,
        y: y,
        "font-size": "12",
        fill: "#344054",
        "font-weight": "700"
      })
    ).textContent = name;
    root.appendChild(
      svg("text", { x: w - 28, y: y, "text-anchor": "end", "font-size": "12", fill: "#657386" })
    ).textContent = fmtPct(row.share);
  });
  pie.innerHTML = "";
  pie.appendChild(root);
  pie.appendChild(tip);

  if (tableBody) {
    tableBody.innerHTML = rows
      .map(
        (row, index) => `
          <tr>
            <td>${reportSwatch(stallPalette[index % stallPalette.length])}${row.name}</td>
            <td>${fmtWan(row.value)}</td>
            <td>${fmtPct(row.share)}</td>
            <td>${row.quantity === null || row.quantity === undefined ? "-" : fmtNum(row.quantity)}</td>
          </tr>
        `
      )
      .join("");
  }
}
function currentProductSalesPer10kEntity(panel) {
  const entities = data[panel.dataKey]?.entities || [];
  return (
    entities.find((item) => item.key === selectedProductSalesPer10kKeys[panel.stateKey]) ||
    entities[0]
  );
}
function renderProductSalesPer10kSelector() {
  productSalesPer10kPanels.forEach((panel) => {
    const select = document.getElementById(panel.selectId);
    const input = document.getElementById(panel.searchId);
    if (!select || !input) return;
    const entities = data[panel.dataKey]?.entities || [];
    select.innerHTML = entities
      .map((item) => `<option value="${item.key}">${cleanName(item.label)}</option>`)
      .join("");
    if (!entities.some((item) => item.key === selectedProductSalesPer10kKeys[panel.stateKey])) {
      selectedProductSalesPer10kKeys[panel.stateKey] = entities[0]?.key || "__all__";
    }
    select.value = selectedProductSalesPer10kKeys[panel.stateKey];
    select.addEventListener("change", () => {
      selectedProductSalesPer10kKeys[panel.stateKey] = select.value;
      renderProductSalesPer10kPanel(panel);
    });
    input.addEventListener("input", () => renderProductSalesPer10kPanel(panel));
  });
}
function renderProductSalesPer10kPanel(panel) {
  const body = document.querySelector(`#${panel.tableId} tbody`);
  const input = document.getElementById(panel.searchId);
  const status = document.getElementById(panel.statusId);
  const metric = data[panel.dataKey] || {};
  if (!body || !status) return;
  if (!metric.enabled) {
    body.innerHTML = `<tr><td colspan="5">${metric.meta?.reason || "产品万元销量需要同时提供菜品主题数据和菜品库。"}</td></tr>`;
    status.textContent = "未启用";
    return;
  }
  const entity = currentProductSalesPer10kEntity(panel);
  if (!entity || entity.available === false) {
    body.innerHTML = `<tr><td colspan="5">${entity?.unavailable_reason || `当前区间${panel.denominatorLabel}不可用，无法计算。`}</td></tr>`;
    status.textContent = "不可计算";
    return;
  }
  const query = String(input?.value || "")
    .trim()
    .toLocaleLowerCase("zh-CN");
  const allRows = entity?.rows || [];
  const matchedRows = query
    ? allRows.filter((row) =>
        String(row.search_names || row.name || "")
          .toLocaleLowerCase("zh-CN")
          .includes(query)
      )
    : allRows;
  const products = matchedRows.filter((row) => row.record_kind !== "fee");
  const fees = matchedRows.filter((row) => row.record_kind === "fee");
  const rows = query ? products : products.slice(0, 10);
  const feeRows = query ? fees : fees.slice(0, 10);
  status.textContent = query
    ? `找到 ${matchedRows.length} 项（收费记录单列） · 当前区间${panel.denominatorLabel} ${fmtWan(entity?.total_denominator || 0)}`
    : `实物与饮品 Top 10 · 收费记录 ${fees.length} 项（展示前10项，可搜索） · 当前区间${panel.denominatorLabel} ${fmtWan(entity?.total_denominator || 0)}`;
  body.innerHTML = rows
    .map(
      (row) => `<tr>
        <td>${htmlText(row.name)}</td>
        <td>${htmlText(row.sales_class)}</td>
        <td>${htmlText(row.stall)}</td>
        <td>${fmtNum(row.quantity)} 原品项单位</td>
        <td>${row.units_per_10k === null || row.units_per_10k === undefined ? "<b>N/A</b>" : `<b>${fmtNum(row.units_per_10k)}</b> 原品项单位/万元`}</td>
      </tr>`
    )
    .join("");
  if (feeRows.length)
    body.innerHTML +=
      '<tr><th colspan="5" scope="colgroup">餐具与收费记录（单列，不作实物备货依据）</th></tr>' +
      feeRows
        .map(
          (row) => `<tr>
        <td>${htmlText(row.name)}</td><td>${htmlText(row.sales_class)}</td><td>${htmlText(row.stall)}</td>
        <td>${fmtNum(row.quantity)} 原品项单位</td><td>收费/选择记录</td></tr>`
        )
        .join("");
  if (!rows.length && !feeRows.length)
    body.innerHTML = '<tr><td colspan="5">没有匹配的产品</td></tr>';
}
function renderProductSalesPer10k() {
  const enabled = productSalesPer10kPanels.some((panel) => data[panel.dataKey]?.enabled);
  document.getElementById("product-sales-per-10k").hidden = !enabled;
  if (!enabled) return;
  productSalesPer10kPanels.forEach(renderProductSalesPer10kPanel);
}
function renderDriverBar() {
  const groups = segmentGroups
    .map((group) => ({
      label: group.label,
      rows: (group.rows || []).filter((r) => r.segment === "问题门店").slice(0, 4)
    }))
    .filter((group) => group.rows.length);
  const fallbackRows = stores.filter((r) => r.segment === "问题门店").slice(0, 6);
  const renderGroups = groups.length
    ? groups
    : [{ label: "问题门店", rows: fallbackRows.length ? fallbackRows : stores.slice(-6) }];
  const el = document.getElementById("driverBar");
  const totalRows = renderGroups.reduce((sum, group) => sum + group.rows.length, 0);
  const w = 1120,
    h = Math.max(430, totalRows * 76 + renderGroups.length * 42 + 70),
    left = 180,
    mid = 575,
    right = 120;
  const vals = renderGroups.flatMap((group) =>
    group.rows.flatMap((r) => [
      Number(r.wow_order_volume_contribution || 0),
      Number(r.wow_aov_contribution || 0),
      Number(r.wow_dine_in_delta || 0),
      Number(r.wow_delivery_delta || 0)
    ])
  );
  const max = Math.max(...vals.map((v) => Math.abs(v)), 1);
  const root = svg("svg", { viewBox: `0 0 ${w} ${h}` });
  [
    ["量贡献", colors.blue, 0],
    ["价贡献", colors.teal, 72],
    ["堂食变化", colors.green, 144],
    ["外卖变化", colors.amber, 232]
  ].forEach(([label, color, xOff]) => {
    root.appendChild(
      svg("rect", { x: left + xOff, y: 16, width: 12, height: 12, rx: 2, fill: color })
    );
    root.appendChild(
      svg("text", { x: left + xOff + 18, y: 27, "font-size": "12", fill: "#657386" })
    ).textContent = label;
  });
  root.appendChild(svg("line", { x1: mid, y1: 46, x2: mid, y2: h - 26, stroke: "#d9e2ea" }));
  let y = 58;
  renderGroups.forEach((group) => {
    root.appendChild(
      svg("text", {
        x: left - 8,
        y: y + 16,
        "text-anchor": "end",
        "font-size": "12",
        fill: "#172033",
        "font-weight": "800"
      })
    ).textContent = `${group.label}问题`;
    y += 28;
    group.rows.forEach((r, i) => {
      if (i > 0) {
        root.appendChild(
          svg("line", {
            x1: left,
            y1: y - 14,
            x2: w - right,
            y2: y - 14,
            stroke: "#d9e2ea",
            "stroke-dasharray": "5 6"
          })
        );
      }
      root.appendChild(
        svg("text", {
          x: left - 8,
          y: y + 25,
          "text-anchor": "end",
          "font-size": "12",
          fill: "#344054"
        })
      ).textContent = cleanName(r["门店名称"]);
      [
        [Number(r.wow_order_volume_contribution || 0), colors.blue, 0],
        [Number(r.wow_aov_contribution || 0), colors.teal, 16],
        [Number(r.wow_dine_in_delta || 0), colors.green, 32],
        [Number(r.wow_delivery_delta || 0), colors.amber, 48]
      ].forEach(([v, c, off]) => {
        const bw = (Math.abs(v) / max) * 360;
        const x = v >= 0 ? mid : mid - bw;
        root.appendChild(
          svg("rect", { x, y: y + off, width: bw, height: 12, rx: 2, fill: c, opacity: 0.9 })
        );
        root.appendChild(
          svg("text", {
            x: v >= 0 ? x + bw + 7 : x - 7,
            y: y + off + 10,
            "text-anchor": v >= 0 ? "start" : "end",
            "font-size": "11",
            fill: "#657386"
          })
        ).textContent = fmtWan(v);
      });
      y += 76;
    });
    y += 14;
  });
  el.innerHTML = "";
  el.appendChild(root);
}
function renderTable() {
  const body = document.querySelector("#storeTable tbody");
  const tagClass = (segment) =>
    segment === "明星门店"
      ? "star"
      : segment === "问题门店"
        ? "problem"
        : segment === "高基盘承压"
          ? "pressure"
          : segment === "成长观察"
            ? "growth"
            : "";
  const rows = stores
    .map(
      (r) => `<tr>
        <td>${cleanName(r["门店名称"])}</td>
        <td>${htmlText(r.store_size || "未分组")}</td>
        <td><span class="tag ${tagClass(r.segment)}">${r.segment}</span></td>
        <td>${fmtWan(r.current_net_revenue)}</td>
        <td>${fmtPct(r.wow_net_revenue_pct)}</td>
        <td>${fmtPct(r.yoy_net_revenue_pct)}</td>
        <td>${fmtWan(r.current_dine_in_revenue)}</td>
        <td>${fmtWan(r.current_delivery_revenue)}</td>
        <td>${fmtNum(r.current_customer_count)}</td>
        <td>${fmtNum(r.current_consumed_tables)}</td>
        <td>${fmtYuan(r.current_post_discount_aov)}</td>
        <td>${fmtPct(r.current_discount_rate)}</td>
        <td>${r.top_stall_signal || ""}</td>
        <td>${r.top_daypart_signal || ""}</td>
        <td>${htmlText(r.top_negative_factor || r.segment_reason || "")}</td>
      </tr>`
    )
    .join("");
  body.innerHTML = rows;
  document.querySelectorAll("#storeTable th[data-key]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      stores.sort((a, b) => {
        const av = a[key],
          bv = b[key];
        const na = Number(av),
          nb = Number(bv);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return nb - na;
        return String(av || "").localeCompare(String(bv || ""), "zh-CN");
      });
      renderTable();
    });
  });
}
function renderActions() {
  const groups = {};
  stores.forEach((r) => {
    const key = `${r.store_size || "未分组"} · ${r.segment}`;
    groups[key] = groups[key] || [];
    groups[key].push(cleanName(r["门店名称"]));
  });
  const hint = (k) =>
    k === "明星门店"
      ? "沉淀可复制打法"
      : k === "问题门店"
        ? "优先复盘负向因素"
        : k === "高基盘承压"
          ? "防止高收入门店继续滑坡"
          : "验证增长是否可持续";
  document.getElementById("actionList").innerHTML = Object.entries(groups)
    .map(([k, arr]) => {
      const segment = k.split(" · ")[1] || k;
      return `<div class="card action-card"><div class="label">${htmlText(k)}</div><div class="space-above-small">${arr.join("、")}</div><div class="foot">${hint(segment)}</div></div>`;
    })
    .join("");
}
function fmtDeltaWan(v) {
  if (v === null || v === undefined || v === "") return "N/A";
  const value = Number(v || 0);
  if (!Number.isFinite(value)) return "N/A";
  const sign = value > 0 ? "+" : "";
  return `${sign}${fmtWan(value)}`;
}
function dishList(rows) {
  if (!rows || !rows.length) return '<span class="label">暂无代表菜品</span>';
  return rows
    .map(
      (row) =>
        `<span class="tag attribution-tag">${row["菜品名称"]} ${fmtDeltaWan(row.income_delta)}</span>`
    )
    .join("");
}
function renderStallAttribution() {
  const root = document.getElementById("stallAttribution");
  const stall = data.stall_attribution || {};
  if (!stall.enabled) {
    root.innerHTML = `<div class="callout report-unavailable">
          <strong>本周档口归因暂无可用数据</strong>
          <p>需要按档口匹配的菜品收入才能对比环比、同比并定位代表菜品。本期报告的餐段与时段归因仍可查看。</p>
          <a href="#/alpha/chart/9">查看时段归因 →</a>
        </div>`;
    return;
  }
  const match = stall.match_summary || {};
  const drivers = stall.drivers || [];
  const yoyDrivers = stall.yoy_drivers || [];
  const basis = (stall.meta && stall.meta.basis) || "菜品主题数据“菜品收入” × 菜品库“基础分类”。";
  const coverage = (stall.meta && stall.meta.period_coverage) || {};
  const missing = ["current", "previous", "yoy"]
    .filter((key) => !(coverage[key] && Number(coverage[key].rows || 0) > 0))
    .map((key) => coverage[key]?.label || key);
  const coverageNote = missing.length
    ? `<div class="callout space-below">部分期间菜品数据不足，相关档口和菜品变化暂不显示。</div>`
    : "";
  const rowHtml = (rows) =>
    rows
      .map(
        (row) => `<tr>
        <td>${cleanName(row["门店名称"])}</td>
        <td>${row.basis}</td>
        <td>${row.top_negative_stall || ""}</td>
        <td>${fmtDeltaWan(row.top_negative_income_delta)}</td>
        <td>${dishList(row.negative_dishes)}</td>
        <td>${row.top_positive_stall || ""}</td>
        <td>${fmtDeltaWan(row.top_positive_income_delta)}</td>
        <td>${dishList(row.positive_dishes)}</td>
      </tr>`
      )
      .join("");
  root.innerHTML = `
        ${coverageNote}
        <div class="grid-3">
          <div class="card"><div class="label">菜品行匹配率</div><div class="value">${fmtPct(match.match_rate)}</div><div class="foot">关联名称匹配 ${fmtNum(match.linked_name_matched_rows)} / 原名回退 ${fmtNum(match.primary_name_fallback_rows)} / 未匹配 ${fmtNum(match.unmatched_rows)} / 重名 ${fmtNum(match.ambiguous_rows)}</div></div>
          <div class="card"><div class="label">菜品库规模</div><div class="value">${fmtNum(match.catalog_rows)}</div><div class="foot">基础分类档口 ${fmtNum(match.catalog_stall_count)} 个</div></div>
          <div class="card"><div class="label">归因口径</div><div class="value">环比 + 同比</div><div class="foot">按菜品收入变化排序</div></div>
        </div>
        <div class="callout space-above">${basis}</div>
        <div class="panel full-row space-above">
          <div class="panel-head"><h3>环比档口归因：门店主要变化</h3><span class="label">负向档口 / 正向档口 / 代表菜品</span></div>
          <div class="table-wrap"><table aria-label="经营事实表"><thead><tr><th scope="col">门店</th><th scope="col">口径</th><th scope="col">负向档口</th><th scope="col">负向变化</th><th scope="col">负向代表菜品</th><th scope="col">正向档口</th><th scope="col">正向变化</th><th scope="col">正向代表菜品</th></tr></thead><tbody>${rowHtml(drivers)}</tbody></table></div>
        </div>
        <div class="panel full-row space-above">
          <div class="panel-head"><h3>同比档口归因</h3><span class="label">用于识别结构性改善或退化</span></div>
          <div class="table-wrap"><table aria-label="经营事实表"><thead><tr><th scope="col">门店</th><th scope="col">口径</th><th scope="col">负向档口</th><th scope="col">负向变化</th><th scope="col">负向代表菜品</th><th scope="col">正向档口</th><th scope="col">正向变化</th><th scope="col">正向代表菜品</th></tr></thead><tbody>${rowHtml(yoyDrivers)}</tbody></table></div>
        </div>`;
}
function slotList(rows) {
  if (!rows || !rows.length) return '<span class="label">无明显变化</span>';
  return rows
    .map(
      (row) =>
        `<span class="tag attribution-tag">${row["餐段"]} ${row["时段"]} ${fmtDeltaWan(row.net_revenue_delta)}</span>`
    )
    .join("");
}
function renderDaypartAttribution() {
  const root = document.getElementById("daypartAttribution");
  const daypart = data.daypart_attribution || {};
  if (!daypart.enabled) {
    document.getElementById("daypart-drivers").hidden = true;
    return;
  }
  const drivers = daypart.drivers || [];
  const yoyDrivers = daypart.yoy_drivers || [];
  const basis = (daypart.meta && daypart.meta.basis) || "营业分组表“时段”字段。";
  const rowHtml = (rows) =>
    rows
      .map(
        (row) => `<tr>
        <td>${cleanName(row["门店名称"])}</td>
        <td>${row.basis}</td>
        <td>${slotList(row.negative_slots)}</td>
        <td>${fmtDeltaWan(row.top_negative_net_revenue_delta)}</td>
        <td>${slotList(row.positive_slots)}</td>
        <td>${fmtDeltaWan(row.top_positive_net_revenue_delta)}</td>
      </tr>`
      )
      .join("");
  root.innerHTML = `
        <div class="grid-3">
          <div class="card"><div class="label">归因维度</div><div class="value">餐段 × 时段</div><div class="foot">来自营业分组表</div></div>
          <div class="card"><div class="label">归因口径</div><div class="value">环比 + 同比</div><div class="foot">按订单营业收入变化排序</div></div>
          <div class="card"><div class="label">展示规则</div><div class="value">Top 3</div><div class="foot">每店负向 / 正向时段</div></div>
        </div>
        <div class="callout space-above">${basis}</div>
        <div class="panel full-row space-above">
          <div class="panel-head"><h3>环比时段归因：门店主要变化</h3><span class="label">负向时段 / 正向时段</span></div>
          <div class="table-wrap"><table aria-label="经营事实表"><thead><tr><th scope="col">门店</th><th scope="col">口径</th><th scope="col">负向时段 Top 3</th><th scope="col">最大负向变化</th><th scope="col">正向时段 Top 3</th><th scope="col">最大正向变化</th></tr></thead><tbody>${rowHtml(drivers)}</tbody></table></div>
        </div>
        <div class="panel full-row space-above">
          <div class="panel-head"><h3>同比时段归因</h3><span class="label">用于识别结构性改善或退化</span></div>
          <div class="table-wrap"><table aria-label="经营事实表"><thead><tr><th scope="col">门店</th><th scope="col">口径</th><th scope="col">负向时段 Top 3</th><th scope="col">最大负向变化</th><th scope="col">正向时段 Top 3</th><th scope="col">最大正向变化</th></tr></thead><tbody>${rowHtml(yoyDrivers)}</tbody></table></div>
        </div>`;
}
function hourlyEntity() {
  const entities = data.hourly_revenue_entities || [
    { key: "__all__", label: "全体门店", rows: [] }
  ];
  return entities.find((item) => item.key === selectedHourlyKey) || entities[0];
}
function renderHourlySelector() {
  const select = document.getElementById("hourlyStoreSelect");
  const entities = data.hourly_revenue_entities || [
    { key: "__all__", label: "全体门店", rows: [] }
  ];
  select.innerHTML = entities
    .map((item) => `<option value="${item.key}">${cleanName(item.label)}</option>`)
    .join("");
  select.value = selectedHourlyKey;
  select.addEventListener("change", () => {
    selectedHourlyKey = select.value;
    renderHourlyRevenueBar();
  });
}
function renderHourlyRevenueBar() {
  const el = document.getElementById("hourlyRevenueBar");
  const entity = hourlyEntity();
  const rows = entity.rows || [];
  if (!rows.some((row) => Number(row.net_revenue || 0))) {
    document.getElementById("dayparts").hidden = true;
    return;
  }
  const isAllStores = entity.key === "__all__";
  document.getElementById("hourlyRevenueLabel").textContent =
    `本周，${isAllStores ? "整体" : cleanName(entity.label)}业务收入（万元）`;
  const w = 1120,
    h = 350,
    left = 74,
    right = 34,
    top = 34,
    bottom = 62;
  const max = Math.max(...rows.map((r) => Number(r.net_revenue || 0)), 1);
  const yMax = Math.ceil(max / 10000) * 10000 || 1;
  const yScale = (v) => h - bottom - (Number(v || 0) / yMax) * (h - top - bottom);
  const plotW = w - left - right;
  const slot = plotW / 24;
  const barW = Math.max(12, Math.min(28, slot * 0.64));
  const root = svg("svg", { viewBox: `0 0 ${w} ${h}` });
  const tip = document.createElement("div");
  tip.className = "chart-tooltip";
  const showTip = (event, row) => {
    tip.innerHTML = `<strong>${Number(row.hour)}点</strong>业务收入：${fmtWan(row.net_revenue)}`;
    positionTooltip(tip, el, event);
  };
  const hideTip = () => {
    tip.style.display = "none";
  };
  [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
    const value = yMax * t;
    const y = yScale(value);
    root.appendChild(svg("line", { x1: left, y1: y, x2: w - right, y2: y, stroke: "#e6edf3" }));
    root.appendChild(
      svg("text", {
        x: left - 10,
        y: y + 4,
        "text-anchor": "end",
        "font-size": "11",
        fill: "#657386"
      })
    ).textContent = fmtWan(value);
  });
  root.appendChild(svg("line", { x1: left, y1: top, x2: left, y2: h - bottom, stroke: "#9aa7b5" }));
  root.appendChild(
    svg("line", { x1: left, y1: h - bottom, x2: w - right, y2: h - bottom, stroke: "#9aa7b5" })
  );
  rows.forEach((row, i) => {
    const value = Number(row.net_revenue || 0);
    const x = left + i * slot + (slot - barW) / 2;
    const y = yScale(value);
    const height = h - bottom - y;
    const bar = svg("rect", {
      x,
      y,
      width: barW,
      height: Math.max(1, height),
      rx: 4,
      fill: colors.teal,
      opacity: 0.9,
      class: "interactive-chart-mark"
    });
    const title = svg("title", {});
    title.textContent = `${Number(row.hour)}点 业务收入：${fmtWan(value)}`;
    bar.appendChild(title);
    bar.addEventListener("mousemove", (event) => showTip(event, row));
    bar.addEventListener("mouseleave", hideTip);
    root.appendChild(bar);
    root.appendChild(
      svg("text", {
        x: x + barW / 2,
        y: h - 38,
        "text-anchor": "middle",
        "font-size": "10",
        fill: "#657386"
      })
    ).textContent = `${Number(row.hour)}点`;
  });
  const peak = rows.reduce(
    (best, row) => (Number(row.net_revenue || 0) > Number(best.net_revenue || 0) ? row : best),
    rows[0] || { hour: "00", net_revenue: 0 }
  );
  root.appendChild(
    svg("text", { x: left, y: 18, "font-size": "12", fill: "#657386", "font-weight": "700" })
  ).textContent = "业务收入（万元）";
  root.appendChild(
    svg("text", { x: w - right, y: 18, "text-anchor": "end", "font-size": "11", fill: "#657386" })
  ).textContent = `峰值：${Number(peak.hour)}点 ${fmtWan(peak.net_revenue)}`;
  el.innerHTML = "";
  el.appendChild(root);
  el.appendChild(tip);
}
function renderGaps() {
  const messages = data.data_gaps || [];
  const notice = document.getElementById("missingDataNotice");
  if (messages.length) {
    notice.hidden = false;
    notice.innerHTML = `<b>数据提示：</b>${messages.join("；")}`;
  }
  document.getElementById("dataGaps").hidden = true;
  const hideSection = (id) => {
    const section = document.getElementById(id);
    if (section) section.hidden = true;
    const link = document.querySelector(`.nav a[href="#${id}"]`);
    if (link) link.hidden = true;
  };
  const availability = data.availability || {};
  if (!availability.current) {
    if (!weeklyDashboard) document.querySelector(".hero .summary").hidden = true;
    [
      "summary",
      "ranking",
      "stores",
      "channels",
      "stall-mix",
      "product-sales-per-10k",
      "drivers",
      "stall-drivers",
      "daypart-drivers",
      "dayparts"
    ].forEach(hideSection);
    return;
  }
  if (!availability.trend) document.getElementById("trend").closest(".panel").hidden = true;
  if (!availability.channels) hideSection("channels");
  if (!data.stall_sales_mix?.enabled) hideSection("stall-mix");
  if (
    ![data.product_sales_per_10k_order_revenue, data.product_sales_per_10k_gross_sales].some(
      (panel) => panel?.enabled
    )
  )
    hideSection("product-sales-per-10k");
  if (!data.daypart_attribution?.enabled) hideSection("daypart-drivers");
  if (!availability.dayparts) hideSection("dayparts");
}
if (!weeklyDashboard) renderMeta();
renderKpis();
renderRules();
renderBucketedRevenueRanking();
renderGrowthBar();
renderBucketedScatter();
renderTrendSelector();
renderTrend();
renderTable();
renderMixBars();
renderPlatformBars();
renderStallMixSelector();
renderStallSalesMix();
renderProductSalesPer10kSelector();
renderProductSalesPer10k();
renderDriverBar();
renderActions();
renderStallAttribution();
renderDaypartAttribution();
renderHourlySelector();
renderHourlyRevenueBar();
renderGaps();

(() => {
  "use strict";
  const D = JSON.parse(document.getElementById("report-data").textContent);
  const content = JSON.parse(document.getElementById("weekly-dashboard-content").textContent);
  const X = content.details;
  const V = content.customer_voice;
  const company = D.meta.company;
  const windowDates = D.meta.target_windows;
  const fullDate = (value) => value.replaceAll("-", ".");
  const shortDate = (value) => fullDate(value).slice(5);
  const dateRange = (period, year = false) => {
    const { start, end } = windowDates[period];
    return (
      (year ? fullDate(start) : shortDate(start)) +
      " — " +
      (year && start.slice(0, 4) !== end.slice(0, 4) ? fullDate(end) : shortDate(end))
    );
  };
  const STRUCTURE = JSON.parse(document.getElementById("report-structure").textContent);
  function resolveRoute(parts) {
    return STRUCTURE.routes.find((r) => {
      const p = r.pattern.split("/");
      return (
        p.length === parts.length &&
        p.every((v, i) => (v.startsWith(":") ? Boolean(parts[i]) : v === parts[i]))
      );
    });
  }
  const rows = D.comparison.filter((row) => row.current_rows);
  const app = document.createElement("main");
  app.id = "px-app";
  document.body.prepend(app);
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
  const num = (v, d = 2) =>
    v === null || v === undefined || !Number.isFinite(Number(v))
      ? "—"
      : Number(v).toLocaleString("zh-CN", { maximumFractionDigits: d, minimumFractionDigits: d });
  const wan = (v) => (v === null || v === undefined ? "—" : num(Number(v) / 10000, 2) + " 万");
  const pct = (v) =>
    v === null || v === undefined ? "—" : (v >= 0 ? "+" : "") + num(v * 100, 1) + "%";
  const short = (s) => s.match(/[（(]([^）()]+)[）)]$/)?.[1] || s;
  const route = (...xs) => {
    if (!resolveRoute(xs.map(String))) throw Error("Unregistered report route");
    return "#/alpha/" + xs.map((x) => encodeURIComponent(x)).join("/");
  };
  const link = (path, title, desc = "", icon = "↗") =>
    `<a class="px-module" href="${path}"><span class="px-icon" aria-hidden="true">${icon}</span><h3>${esc(title)}</h3><p>${esc(desc)}</p><span class="px-link">进入查看 →</span></a>`;
  const detail = (title, html) =>
    `<details class="px-detail"><summary>${esc(title)}</summary><div class="px-detail-body">${html}</div></details>`;
  const table = (heads, rs) =>
    `<div class="px-data-cards" role="list" aria-label="${esc(heads.join("、"))}">${rs
      .map((r) => {
        let delta = "";
        if (heads.length === 3 && heads[1] === "本周" && heads[2] === "上周") {
          const raw = r.slice(1).map((x) => String(x).replace(/,/g, ""));
          if (raw.every((x) => /^-?\d+(\.\d+)?$/.test(x))) {
            const current = Number(raw[0]),
              previous = Number(raw[1]),
              change = current - previous;
            delta = `<p class="px-card-delta">较上周 ${change > 0 ? "+" : ""}${num(change, Number.isInteger(current) && Number.isInteger(previous) ? 0 : 2)}${previous !== 0 ? "（" + pct(change / Math.abs(previous)) + "）" : ""}</p>`;
          }
        }
        return `<article class="px-fact-card" role="listitem"><h3>${r[0]}</h3><dl>${r
          .slice(1)
          .map((c, i) => `<div><dt>${esc(heads[i + 1])}</dt><dd>${c}</dd></div>`)
          .join("")}</dl>${delta}</article>`;
      })
      .join("")}</div>`;

  function kpis(items, dining = null) {
    const cardText = ([label, value, note]) =>
      `<span class="px-kpi-label">${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note || "")}</small>`;
    const cards = items.map((item) => `<div class="px-kpi">${cardText(item)}</div>`);
    if (dining) {
      cards.push(
        `<button type="button" class="px-kpi px-kpi-action" data-dining-detail aria-haspopup="dialog">${cardText(dining.cards[0])}<span class="px-kpi-detail-label">逐日明细 <span aria-hidden="true">↗</span></span></button>`,
        `<div class="px-kpi">${cardText(dining.cards[1])}</div>`
      );
    }
    return `<div class="px-kpis${dining ? " px-kpis-six" : ""}">${cards.join("")}</div>`;
  }
  const summary = (text, label = "本周判断") =>
    `<div class="px-summary"><label>${esc(label)}</label><p>${esc(text)}</p></div>`;
  const heading = (title, sub = "", eyebrow = "WEEKLY REVIEW") =>
    `<div class="px-headline"><div><div class="px-kicker">${esc(eyebrow)}</div><h1 tabindex="-1">${esc(title)}</h1><p>${esc(sub)}</p></div></div>`;
  const reviews = new Map(
    [...document.querySelectorAll(".store-review-card")].map((n) => [
      n.querySelector("summary").textContent.trim(),
      n
    ])
  );
  const advice = [...document.querySelectorAll("#business-advisory>details")];
  const ptext = (node, i) =>
    node?.querySelectorAll(":scope>p")[i]?.textContent.replace(/^[^：]+：/, "") || "";
  const mealNode = (name) =>
    reviews.get(name)?.querySelector('[data-review-section="meal_periods"]');
  const crumbs = (items) =>
    `<nav class="px-breadcrumbs" aria-label="阅读路径"><a href="${route("home")}">周报总览</a>${items.map((x) => `<span aria-hidden="true">/</span>${x[1] ? `<a href="${x[1]}">${esc(x[0])}</a>` : `<span aria-current="page">${esc(x[0])}</span>`}`).join("")}</nav>`;
  const storeCrumbs = (i, ...extra) =>
    crumbs([[short(rows[i]["门店名称"]), extra.length ? route("store", i) : null], ...extra]);
  let mounted = [];
  let lastRoute = "";
  const saved = new Map();
  const listStates = new Map();
  let storeQuery = "",
    storeGroup = "全部";
  function restore() {
    if (dashboardTrendObserver) {
      dashboardTrendObserver.disconnect();
      dashboardTrendObserver = null;
    }
    document.querySelectorAll("#trend text[data-full-date]").forEach((t) => {
      t.textContent = t.dataset.fullDate;
      delete t.dataset.fullDate;
    });
    if (dashboardObserver) {
      dashboardObserver.disconnect();
      dashboardObserver = null;
    }
    if (app.dataset.page === "home") {
      dashboardTrendStore = document.getElementById("trendStoreSelect")?.value || "__all__";
    }
    for (const { node, mark } of mounted) {
      mark.before(node);
      mark.remove();
    }
    mounted = [];
  }
  function mount(node, target = "px-mount") {
    const mark = document.createComment("panel-position");
    node.before(mark);
    mounted.push({ node, mark });
    document.getElementById(target).append(node);
    if (!["stall-mix", "product-sales-per-10k", "stall-drivers"].includes(node.id))
      convertLegacyTables(node);
  }
  function convertLegacyTables(root) {
    for (const t of root.querySelectorAll("table")) {
      t.classList.add("px-source-table");
      let out = t.nextElementSibling;
      if (!out?.classList.contains("px-legacy-cards")) {
        out = document.createElement("div");
        out.className = "px-legacy-cards";
        t.after(out);
      }
      const heads = [...t.querySelectorAll("thead th")].map((x) => x.textContent.trim());
      const body = [...t.querySelectorAll("tbody tr")]
        .map((tr) => [...tr.querySelectorAll(":scope>td")].map((td) => esc(td.textContent.trim())))
        .filter((r) => r.length);
      if (heads.length && body.length) out.innerHTML = table(heads, body);
      else {
        t.classList.remove("px-source-table");
        out.remove();
      }
    }
  }
  const charts = [];
  for (const id of [
    "summary",
    "ranking",
    "stores",
    "channels",
    "drivers",
    "daypart-drivers",
    "dayparts"
  ]) {
    const sec = document.getElementById(id);
    if (!sec) continue;
    const panels = [...sec.querySelectorAll(":scope>.panel,:scope>.grid-2>.panel")];
    if (panels.length)
      for (const node of panels)
        charts.push({
          section: id,
          title: node.querySelector("h3")?.textContent || sec.querySelector("h2")?.textContent,
          node
        });
    else charts.push({ section: id, title: sec.querySelector("h2")?.textContent, node: sec });
  }
  for (const [id, title] of [
    ["stall-mix", "档口占比"],
    ["product-sales-per-10k", "产品万元销量"],
    ["stall-drivers", "档口归因"]
  ]) {
    const node = document.getElementById(id);
    if (node) charts.push({ section: id, title, node });
  }
  const trendNode = document.getElementById("trend").closest(".panel");
  const hourlyNode = document.getElementById("hourlyRevenueBar").closest(".panel");
  const mobileNavQuery = matchMedia("(max-width: 820px)");
  let sidebarCollapsed = false;
  let mobileNavOpen = false;
  let activeRouteId = "home";
  const sidebarLinks = [
    ["总览", ["home"], "▦"],
    ["门店", ["allstores"], "▤"],
    ["经营建议", ["priorities"], "✓"],
    ["顾客声音", ["reviews", "all"], "◉"],
    ["跨店专题", ["topics"], "▥"]
  ];

  function sidebarActivePage(page) {
    if (["review_topic", "review_evidence", "reviews_store", "reviews_all"].includes(page))
      return "reviews";
    if (["priorities", "advice", "advice_detail"].includes(page)) return "priorities";
    if (["topics", "chart", "benchmark", "trends"].includes(page)) return "topics";
    return page === "home" ? "home" : "allstores";
  }

  function syncSidebar() {
    const mobile = mobileNavQuery.matches;
    const collapsed = !mobile && sidebarCollapsed;
    const open = mobile && mobileNavOpen;
    document.body.classList.toggle("px-sidebar-collapsed", collapsed);
    document.body.classList.toggle("px-sidebar-open", open);
    const navigation = document.getElementById("px-sidebar-nav");
    navigation.inert = mobile && !open;
    navigation
      .querySelector("button")
      .setAttribute("aria-expanded", String(mobile ? open : !collapsed));
    document.getElementById("px-mobile-open").setAttribute("aria-expanded", String(open));
  }

  function setMobileNav(open, returnFocus = false) {
    mobileNavOpen = open;
    syncSidebar();
    if (open) document.getElementById("px-sidebar-toggle").focus();
    else if (returnFocus) document.getElementById("px-mobile-open").focus();
  }

  mobileNavQuery.addEventListener("change", () => {
    mobileNavOpen = false;
    syncSidebar();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileNavOpen) setMobileNav(false, true);
  });

  function shell(body) {
    const current = sidebarActivePage(activeRouteId);
    app.innerHTML = `
  <aside id="px-sidebar-nav" class="px-sidebar" aria-label="周报导航">
   <div class="px-sidebar-head">
    <a class="px-sidebar-brand" href="${route("home")}" aria-label="${esc(company)}经营周报"><span class="px-sidebar-logo" aria-hidden="true">${esc(company.slice(0, 1))}</span><span class="px-sidebar-text">${esc(company)}</span></a>
    <button id="px-sidebar-toggle" type="button" aria-controls="px-sidebar-links" aria-label="收起或展开侧栏" title="收起或展开侧栏"><span aria-hidden="true">☰</span></button>
   </div>
   <nav id="px-sidebar-links" aria-label="主导航">
    ${sidebarLinks.map(([label, path, icon]) => `<a href="${route(...path)}" aria-label="${label}" title="${label}" ${current === path[0] ? 'aria-current="page"' : ""}><span class="px-sidebar-icon" aria-hidden="true">${icon}</span><span class="px-sidebar-text">${label}</span></a>`).join("")}
   </nav>
  </aside>
  <button class="px-sidebar-scrim" type="button" aria-label="关闭导航" tabindex="-1"></button>
  <header class="px-mobile-header">
   <button id="px-mobile-open" type="button" aria-label="打开导航" aria-controls="px-sidebar-nav"><span aria-hidden="true">☰</span></button>
   <a href="${route("home")}">${esc(company)}经营周报</a>
  </header>
  ${body}
  <footer class="px-footer"><span>${esc(dateRange("current", true))} · 订单营业收入 · 展示样例，企业及门店信息已脱敏</span><span><a href="${route("design")}">数据说明</a></span></footer>`;
    document.body.classList.add("px-has-sidebar");
    mobileNavOpen = false;
    syncSidebar();
    document.getElementById("px-sidebar-toggle").onclick = () => {
      if (mobileNavQuery.matches) setMobileNav(false, true);
      else {
        sidebarCollapsed = !sidebarCollapsed;
        syncSidebar();
      }
    };
    document.getElementById("px-mobile-open").onclick = () =>
      setMobileNav(!mobileNavOpen, mobileNavOpen);
    app.querySelector(".px-sidebar-scrim").onclick = () => setMobileNav(false, true);
    app.querySelectorAll(".px-sidebar a").forEach((link) => {
      link.addEventListener("click", () => {
        if (!mobileNavOpen) return;
        const samePage = link.hash === location.hash;
        setMobileNav(false, samePage);
      });
    });
  }
  function priorityCards() {
    return `<div class="px-priorities">${advice
      .map((a, j) => {
        const parts = a.querySelector("summary").textContent.split(" · ");
        return `<a href="${route("advice", j)}" class="px-priority"><span class="px-muted">${esc(parts.slice(0, 2).join(" · "))}</span><span class="px-arrow">↗</span><h3>${esc(parts.slice(2).join(" · "))}</h3><small>判断 · 行动 · 证据</small></a>`;
      })
      .join("")}</div>`;
  }
  function cards() {
    return (
      rows
        .map((r, i) => ({ r, i }))
        .filter(
          ({ r }) =>
            (storeGroup === "全部" || r.store_size_bucket === storeGroup) &&
            r["门店名称"].includes(storeQuery)
        )
        .map(
          ({ r, i }) =>
            `<a class="px-store" href="${route("store", i)}"><div class="px-store-top"><h3>${esc(r["门店名称"])}</h3><span class="px-chip">${esc(r.store_size_bucket)}</span></div><div class="px-store-revenue"><strong>${wan(r.current_net_revenue)}</strong><span class="${r.wow_net_revenue_pct < 0 ? "px-down" : "px-up"}">环比 ${pct(r.wow_net_revenue_pct)}</span></div><p>${esc(ptext(mealNode(r["门店名称"]), 1).split("。")[0])}。</p><div class="px-store-foot"><span>餐段 · 菜品 · 订单 · 评价</span><span>进入门店 →</span></div></a>`
        )
        .join("") || '<p class="px-empty">未找到匹配门店</p>'
    );
  }
  function storeGrid() {
    return `<section class="px-section"><div class="px-section-head"><div><h2>从一家门店开始</h2><p>${rows.length} 家门店 · 先看概况，再选要深入的经营问题</p></div><div class="px-tools"><input aria-label="搜索门店" placeholder="搜索门店" value="${esc(storeQuery)}">${["全部", ...new Set(rows.map((row) => row.store_size_bucket))].map((g) => `<button data-group="${g}" aria-pressed="${storeGroup === g}">${g}</button>`).join("")}</div></div><div class="px-stores" id="px-stores">${cards()}</div></section>`;
  }
  function bindSearch() {
    const input = app.querySelector('input[aria-label="搜索门店"]');
    if (input)
      input.addEventListener("input", () => {
        storeQuery = input.value;
        document.getElementById("px-stores").innerHTML = cards();
      });
    app.querySelectorAll("[data-group]").forEach(
      (b) =>
        (b.onclick = () => {
          storeGroup = b.dataset.group;
          app
            .querySelectorAll("[data-group]")
            .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
          document.getElementById("px-stores").innerHTML = cards();
        })
    );
  }
  function topics() {
    return `<div class="px-modules">${link(route("benchmark"), "门店横向对比", "按大小店看规模、增长和变化贡献", "▥")}${link(route("trends"), "收入趋势", "企业与单店，保留 52 周时间探索", "⌁")}${link(route("reviews", "all"), "顾客声音", "逐店核心判断 → 值得保持与优先核查 → 引用证据", "◎")}</div>`;
  }
  let dashboardObserver = null;
  let dashboardTrendObserver = null;
  let dashboardHour = "__all__";
  let dashboardTrendStore = "__all__";
  const palette = {
    teal: "#087f86",
    blue: "#426eb1",
    gold: "#c39934",
    green: "#578867",
    orange: "#be7250",
    purple: "#8770ac",
    red: "#b85c56",
    ink: "#29423c",
    muted: "#708077",
    line: "#e8ede7"
  };
  const revenueLegend = [
    ["堂食", palette.teal],
    ["外卖", palette.blue],
    ["其他", palette.gold]
  ];
  const svgText = (x, y, text, extra = "") =>
    `<text x="${x}" y="${y}" ${extra}>${esc(text)}</text>`;
  const svgRoot = (w, h, title, body) =>
    `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${body}</svg>`;
  const chartLink = (i, title, body) =>
    `<a href="${route("store", i)}" aria-label="${esc(title)}"><title>${esc(title)}</title>${body}</a>`;
  const dashSum = (field) =>
    rows.every((r) => Number.isFinite(r[field])) ? rows.reduce((s, r) => s + r[field], 0) : null;
  const deltaRatio = (c, p) => (c !== null && p !== null && p !== 0 ? (c - p) / Math.abs(p) : null);
  function readableTrendTicks() {
    const small = innerWidth <= 720;
    document.querySelectorAll("#dash-trend-host #trend svg text").forEach((t) => {
      const full = t.dataset.fullDate || t.textContent;
      if (/^\d{4}-\d{2}-\d{2}$/.test(full)) {
        t.dataset.fullDate = full;
        t.setAttribute("aria-label", full);
        const label = small ? full.slice(5).replace("-", "/") : full;
        if (t.textContent !== label) t.textContent = label;
      }
    });
  }
  function dashboardRank(width) {
    const left = 86;
    const right = 53;
    const rowHeight = 23;
    const barHeight = 13;
    const plotWidth = width - left - right;
    const maximum = Math.max(1, ...rows.map((row) => row.current_net_revenue));
    let body = "";
    let y = 22;

    for (const group of D.segment_groups) {
      body += svgText(3, y - 7, group.label, 'class="dash-group-label"');
      body += svgText(
        width - 3,
        y - 7,
        `中位数 ${num(group.revenue_threshold / 10000, 1)}万`,
        'text-anchor="end" class="dash-small"'
      );
      const stores = rows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => row.store_size_bucket === group.key)
        .sort((a, b) => b.row.current_net_revenue - a.row.current_net_revenue);

      for (const { row, index } of stores) {
        const total = row.current_net_revenue;
        const dineIn = row.current_dine_in_revenue;
        const delivery = row.current_delivery_revenue;
        const other = total - dineIn - delivery;
        let x = left;
        let mark = svgText(left - 8, y + 12, short(row["门店名称"]), 'text-anchor="end"');
        for (const [label, value, color] of [
          ["堂食", dineIn, palette.teal],
          ["外卖", delivery, palette.blue],
          ["其他", other, palette.gold]
        ]) {
          if (!Number.isFinite(value) || value < 0.01) continue;
          const barWidth = (plotWidth * value) / maximum;
          mark += `<rect x="${x}" y="${y + 1}" width="${barWidth}" height="${barHeight}" fill="${color}"><title>${label} ${num(value)} 元</title></rect>`;
          x += barWidth;
        }
        mark += svgText(x + 5, y + 12, num(total / 10000, 1) + "万", 'class="dash-value"');
        body += chartLink(
          index,
          `${row["门店名称"]}，总收入 ${num(total)} 元，堂食 ${num(dineIn)} 元，外卖 ${num(delivery)} 元`,
          mark
        );
        y += rowHeight;
      }
      y += 24;
    }
    return svgRoot(width, y - 18, "门店收入排名及堂食／外卖结构，按大小店分组", body);
  }

  function dashboardGrowth(width) {
    const sorted = rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => b.row.wow_net_revenue_pct - a.row.wow_net_revenue_pct);
    const nameX = 76;
    const left = 124;
    const right = 48;
    const top = 7;
    const rowHeight = 26;
    const height = top + rowHeight * rows.length + 3;
    const plotWidth = width - left - right;
    const series = [
      ["wow_net_revenue_pct", 0, palette.teal],
      ["yoy_net_revenue_pct", 11, palette.blue]
    ];
    const values = rows.flatMap((row) => series.map(([key]) => row[key])).filter(Number.isFinite);
    const min = Math.min(-0.35, ...values);
    const max = Math.max(0.35, ...values);
    const scale = (number) => left + ((number - min) / (max - min)) * plotWidth;
    const zero = scale(0);
    let body = `<line x1="${zero}" x2="${zero}" y1="2" y2="${height - 4}" stroke="#bdc9c0"/>`;

    for (const [position, { row, index }] of sorted.entries()) {
      const y = top + position * rowHeight;
      let mark = svgText(nameX, y + 12, short(row["门店名称"]), 'text-anchor="end"');
      for (const [key, offset, color] of series) {
        const value = row[key];
        if (!Number.isFinite(value)) {
          mark += svgText(zero + 5, y + offset + 8, "—", 'class="dash-small"');
          continue;
        }
        const end = scale(value);
        mark += `<rect x="${Math.min(zero, end)}" y="${y + offset}" width="${Math.max(Math.abs(end - zero), 0.8)}" height="7" rx="2" fill="${color}"/>`;
        mark += svgText(
          end + (value >= 0 ? 5 : -5),
          y + offset + 7,
          pct(value),
          `text-anchor="${value >= 0 ? "start" : "end"}" class="dash-growth-value"`
        );
      }
      body += chartLink(
        index,
        `${row["门店名称"]}，环比 ${pct(row.wow_net_revenue_pct)}，同比 ${pct(row.yoy_net_revenue_pct)}`,
        mark
      );
    }
    return svgRoot(width, height, "门店收入环比与同比，百分比标注于各条末端", body);
  }

  function dashboardQuadrants(w) {
    const h = D.segment_groups.length * 130 + 3,
      left = 32,
      right = 12,
      plotW = w - left - right;
    let body = "";
    D.segment_groups.forEach((group, g) => {
      const top = 20 + g * 130,
        plotH = 94;
      const selected = rows
        .map((r, i) => ({ r, i }))
        .filter(
          (x) => x.r.store_size_bucket === group.key && Number.isFinite(x.r.wow_net_revenue_pct)
        );
      const minX = Math.min(-0.32, ...selected.map((x) => x.r.wow_net_revenue_pct - 0.04)),
        maxX = Math.max(0.36, ...selected.map((x) => x.r.wow_net_revenue_pct + 0.04));
      const yMax =
        Math.ceil(
          Math.max(1, group.revenue_threshold, ...selected.map((x) => x.r.current_net_revenue)) /
            50000
        ) * 50000;
      const sx = (v) => left + ((v - minX) / (maxX - minX)) * plotW,
        sy = (v) => top + plotH - (v / yMax) * plotH,
        midY = sy(group.revenue_threshold),
        zero = sx(0);
      body +=
        svgText(4, top - 10, group.label, `class="dash-group-label"`) +
        svgText(
          w - 7,
          top - 10,
          `收入中位数 ${num(group.revenue_threshold / 10000, 1)}万`,
          `text-anchor="end" class="dash-small"`
        );
      body += `<rect x="${zero}" y="${top}" width="${w - right - zero}" height="${midY - top}" fill="#f1f5ef"/><line x1="${left}" x2="${w - right}" y1="${midY}" y2="${midY}" stroke="#bacbbf" stroke-dasharray="3 3"/><line x1="${zero}" x2="${zero}" y1="${top}" y2="${top + plotH}" stroke="#bacbbf" stroke-dasharray="3 3"/><path d="M${left} ${top}V${top + plotH}H${w - right}" fill="none" stroke="#cbd5cc"/>`;
      body +=
        svgText(left + 4, top + 11, "高收入·回落", `class="dash-zone"`) +
        svgText(w - right - 4, top + 11, "高收入·增长", `text-anchor="end" class="dash-zone"`) +
        svgText(left + 4, top + plotH - 5, "低收入·回落", `class="dash-zone"`) +
        svgText(
          w - right - 4,
          top + plotH - 5,
          "低收入·增长",
          `text-anchor="end" class="dash-zone"`
        );
      const boxes = [];
      for (const { r, i } of selected.sort(
        (a, b) => b.r.current_net_revenue - a.r.current_net_revenue
      )) {
        const x = sx(r.wow_net_revenue_pct),
          y = sy(r.current_net_revenue),
          label = short(r["门店名称"]),
          tw = label.length * 11;
        let chosen = null;
        for (const [dx, dy] of [
          [8, -8],
          [8, 17],
          [-tw - 8, -8],
          [-tw - 8, 17],
          [8, -23],
          [-tw - 8, 32],
          [8, 32]
        ]) {
          const bx = Math.max(left + 2, Math.min(w - right - tw - 2, x + dx)),
            by = Math.max(top + 19, Math.min(top + plotH - 11, y + dy));
          const box = { x: bx, y: by - 10, w: tw, h: 14 };
          if (
            !boxes.some(
              (b) =>
                box.x < b.x + b.w + 3 &&
                box.x + box.w + 3 > b.x &&
                box.y < b.y + b.h + 3 &&
                box.y + box.h + 3 > b.y
            )
          ) {
            chosen = box;
            break;
          }
        }
        chosen ??= {
          x: Math.max(left + 2, Math.min(w - right - tw - 2, x + 8)),
          y: Math.min(top + plotH - 20, y + 17) - 10,
          w: tw,
          h: 14
        };
        boxes.push(chosen);
        const color =
          r.wow_net_revenue_pct < 0
            ? palette.red
            : r.current_net_revenue >= group.revenue_threshold
              ? palette.green
              : palette.blue;
        body += chartLink(
          i,
          `${r["门店名称"]}，收入${wan(r.current_net_revenue)}，环比${pct(r.wow_net_revenue_pct)}`,
          `<line x1="${x}" y1="${y}" x2="${chosen.x + tw / 2}" y2="${chosen.y + 7}" stroke="${color}" opacity=".35"/><circle cx="${x}" cy="${y}" r="5" fill="${color}" stroke="white" stroke-width="1.5"/>` +
            svgText(chosen.x, chosen.y + 10, label, `class="dash-scatter-label"`)
        );
      }
      for (const v of [-0.25, 0, 0.25])
        body += svgText(
          sx(v),
          top + plotH + 14,
          (v * 100).toFixed(0) + "%",
          `text-anchor="middle" class="dash-small"`
        );
    });
    return svgRoot(
      w,
      h,
      "门店经营四象限，横轴收入环比，纵轴订单营业收入，分别使用大小店组中位数",
      body
    );
  }
  function dashboardPlatforms(width) {
    const left = 86,
      right = 53,
      plotWidth = width - left - right,
      rowHeight = 23;
    const series = [
      ["美团", "current_meituan_delivery_revenue", palette.green],
      ["淘宝闪购", "current_eleme_delivery_revenue", palette.purple],
      ["京东", "current_jd_delivery_revenue", palette.orange]
    ];
    const totals = rows.map((row) => series.reduce((sum, [, key]) => sum + (row[key] ?? 0), 0));
    const maximum = Math.max(1, ...totals);
    let body = "";
    rows.forEach((row, index) => {
      const y = 6 + index * rowHeight;
      let mark = svgText(left - 8, y + 12, short(row["门店名称"]), 'text-anchor="end"');
      let x = left;
      for (const [label, key, color] of series) {
        const value = row[key];
        if (!Number.isFinite(value) || value <= 0) continue;
        const barWidth = (plotWidth * value) / maximum;
        mark += `<rect x="${x}" y="${y + 1}" width="${barWidth}" height="13" fill="${color}"><title>${label} ${num(value)} 元</title></rect>`;
        x += barWidth;
      }
      mark += svgText(x + 5, y + 12, num(totals[index] / 10000, 1) + "万", 'class="dash-value"');
      body += chartLink(
        index,
        `${row["门店名称"]}，外卖平台收入合计 ${num(totals[index])} 元`,
        mark
      );
    });
    return svgRoot(width, rows.length * rowHeight + 9, "外卖平台收入", body);
  }
  function rankedRevenueDetail() {
    const title = STRUCTURE.dashboard.panels.find((panel) => panel.id === "ranking").title;
    shell(`${crumbs([["跨店经营专题", route("benchmark")], [title]])}${heading(title)}
 <section class="dash-panel"><div class="dash-legend">${chartLegend(revenueLegend)}</div><div class="dash-plot" id="dash-ranked-detail"></div></section>`);
    const plot = document.getElementById("dash-ranked-detail");
    const draw = () => {
      plot.innerHTML = dashboardRank(Math.floor(plot.clientWidth));
    };
    draw();
    dashboardObserver = new ResizeObserver(draw);
    dashboardObserver.observe(plot);
  }

  function dashboardHours(w) {
    const entity =
      D.hourly_revenue_entities.find((e) => e.key === dashboardHour) ||
      D.hourly_revenue_entities[0];
    const rs = entity.rows,
      left = 45,
      right = 12,
      top = 18,
      bottom = 33,
      h = 220,
      plotH = h - top - bottom,
      span = w - left - right,
      max = Math.ceil(Math.max(...rs.map((r) => r.net_revenue)) / 50000) * 50000;
    let body = "";
    for (let i = 0; i <= 4; i++) {
      const val = (max * i) / 4,
        y = top + plotH - (val / max) * plotH;
      body +=
        `<line x1="${left}" x2="${w - right}" y1="${y}" y2="${y}" stroke="${palette.line}"/>` +
        svgText(left - 7, y + 4, num(val / 10000, 1), `text-anchor="end" class="dash-small"`);
    }
    rs.forEach((r, i) => {
      const x = left + (i * span) / 24 + (span / 24) * 0.14,
        width = (span / 24) * 0.72,
        height = (r.net_revenue / max) * plotH;
      body += `<rect x="${x}" y="${top + plotH - height}" width="${width}" height="${height}" rx="2" fill="${palette.teal}"><title>${esc(entity.label)} ${Number(r.hour)}点：${num(r.net_revenue)}元</title></rect>`;
      if (w > 600 || i % 2 === 0)
        body += svgText(
          x + width / 2,
          h - 12,
          Number(r.hour) + "时",
          `text-anchor="middle" class="dash-small"`
        );
    });
    return svgRoot(w, h, `${entity.label}本周24小时收入，单位万元`, body);
  }
  function chartLegend(items = []) {
    return items.map(([label, color]) => `<span>${reportSwatch(color)}${label}</span>`).join("");
  }

  function dashPanel(config) {
    const legends = {
      growth: [
        ["环比", palette.teal],
        ["同比", palette.blue]
      ],
      ranking: revenueLegend,
      platforms: [
        ["美团", palette.green],
        ["淘宝闪购", palette.purple],
        ["京东", palette.orange]
      ]
    };
    const legend = chartLegend(legends[config.id]);
    const detail = `<a class="dash-more" href="${route("chart", config.detailChart)}" aria-label="查看${esc(config.title)}详情">↗</a>`;
    const options =
      config.id === "hourly"
        ? D.hourly_revenue_entities
            .map(
              (entity) =>
                `<option value="${esc(entity.key)}" ${entity.key === dashboardHour ? "selected" : ""}>${esc(entity.label)}</option>`
            )
            .join("")
        : "";
    return `<section class="dash-panel dash-${config.id}" data-dashboard-chart="${config.id}">
  <div class="dash-panel-head">
   <h2>${esc(config.title)}${config.id === "hourly" ? "<small>万元</small>" : ""}</h2>
   ${options ? `<select id="dash-hour-select" aria-label="首页时段收入门店">${options}</select>` : detail}
  </div>
  ${legend ? `<div class="dash-legend">${legend}</div>` : ""}
  <div ${config.id === "trend" ? 'id="dash-trend-host" class="dash-trend-host"' : `id="dash-plot-${config.id}" class="dash-plot"`}></div>
 </section>`;
  }
  const panels = STRUCTURE.dashboard.panels.filter(
    (panel) =>
      ({
        trend: D.availability.trend,
        ranking: rows.length,
        growth: rows.some(
          (row) =>
            Number.isFinite(row.wow_net_revenue_pct) || Number.isFinite(row.yoy_net_revenue_pct)
        ),
        quadrants: rows.some((row) => Number.isFinite(row.wow_net_revenue_pct)),
        platforms: rows.some((row) =>
          ["meituan", "eleme", "jd"].some((key) =>
            Number.isFinite(row["current_" + key + "_delivery_revenue"])
          )
        ),
        hourly: D.availability.dayparts
      })[panel.id]
  );
  function diningMetrics(store = null) {
    const matches = (row) =>
      store ? row.scope === "store" && row["门店名称"] === store : row.scope === "all";
    const total = X.dining?.weekly.find(matches);
    if (!total) return null;
    const measures = [
      ["堂食客流", "dine_in_headcount", "traffic_days", "人次", 0],
      ["估算翻台率", "estimated_table_turnover", "turnover_days", "轮/桌/天", 2]
    ];
    const show = (row, field, digits) => (row[field] == null ? "—" : num(row[field], digits));
    const coverage = (row, key) =>
      Number(row[key]) < Number(row.expected_store_days)
        ? `有数据 ${row[key]}/${row.expected_store_days} 个店日`
        : "";
    const cards = measures.map(([label, field, key, unit, digits]) => [
      label,
      total[field] == null ? "—" : show(total, field, digits) + " " + unit,
      coverage(total, key) || "本周"
    ]);
    if (
      total.dine_in_headcount == null &&
      total.estimated_table_turnover == null &&
      !Number(total.excluded_orders)
    )
      return null;
    return { cards, total, daily: X.dining.daily.filter(matches), measures, show, coverage };
  }

  function bindDiningDetail(dining) {
    if (!dining) return;
    app.querySelector("[data-dining-detail]").onclick = () => openDiningDetail(dining);
  }

  function openDiningDetail({ total, daily, measures, show, coverage }) {
    const exceptions = Number(total.excluded_orders)
      ? `<p class="px-small-note">本周有 ${num(total.excluded_orders, 0)} 笔订单人数异常或不可用，已从客流剔除。${Number(total.excluded_registered_headcount) ? `可核对的原登记人数合计 ${num(total.excluded_registered_headcount, 0)} 人次。` : ""}</p>`
      : "";
    const days = daily
      .map(
        (row) =>
          `<tr><th scope="row">${esc(shortDate(row.business_date))}</th>${measures
            .map(([, field, key, , digits]) => {
              const note = coverage(row, key);
              return `<td>${show(row, field, digits)}${note ? `<small class="px-muted">${esc(note)}</small>` : ""}</td>`;
            })
            .join("")}</tr>`
      )
      .join("");
    const dialog = document.createElement("dialog");
    dialog.className = "px-dining-dialog";
    dialog.setAttribute("aria-labelledby", "px-dining-title");
    dialog.innerHTML = `<div class="px-dining-header"><h2 id="px-dining-title">堂食客流与翻台 · 逐日明细</h2><button type="button">关闭</button></div>
      <div class="px-table-wrap"><table class="px-table"><thead><tr><th scope="col">营业日</th><th scope="col">客流<small>人次</small></th><th scope="col">估算翻台<small>轮/桌/天</small></th></tr></thead><tbody>${days}</tbody></table></div>
      ${exceptions}<p class="px-small-note">客流取已结账堂食订单的登记人数。翻台按堂食桌台使用次数除以系统配置桌日，含第一轮接待。</p>`;
    dialog.querySelector("button").addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    document.body.append(dialog);
    dialog.showModal();
  }

  function home(onlyStores = false) {
    if (onlyStores) {
      shell(`${heading("门店概览", "点击一家门店进入第二层")}${storeGrid()}`);
      bindSearch();
      return;
    }
    const totalOrders = dashSum("current_positive_orders"),
      previousOrders = dashSum("previous_positive_orders"),
      previousRevenue = dashSum("previous_net_revenue"),
      delivery = dashSum("current_delivery_revenue"),
      previousDelivery = dashSum("previous_delivery_revenue"),
      aov = D.kpis.current_revenue / totalOrders,
      previousAov = previousRevenue / previousOrders,
      share = delivery / D.kpis.current_revenue,
      previousShare = previousDelivery / previousRevenue;
    const comparable = rows.filter(
      (r) => Number.isFinite(r.yoy_net_revenue) && r.yoy_rows > 0 && r.current_rows > 0
    );
    const sameCurrent = comparable.reduce((s, r) => s + r.current_net_revenue, 0),
      sameYoy = comparable.reduce((s, r) => s + r.yoy_net_revenue, 0);
    const cards = [
      [
        "订单营业收入",
        wan(D.kpis.current_revenue),
        `环比 ${pct(D.kpis.wow_pct)} · 可比${comparable.length}店同比 ${pct(deltaRatio(sameCurrent, sameYoy))}`
      ],
      [
        "正向订单",
        num(totalOrders, 0) + " 单",
        `环比 ${pct(deltaRatio(totalOrders, previousOrders))}`
      ],
      ["折后单均", num(aov) + " 元", `环比 ${pct(deltaRatio(aov, previousAov))}`],
      [
        "外卖收入占比",
        num(share * 100, 1) + "%",
        `较上周 ${share - previousShare >= 0 ? "+" : ""}${num((share - previousShare) * 100, 1)} 个百分点`
      ]
    ];
    const dining = diningMetrics();
    shell(
      `<div class="dash-title"><h1 tabindex="-1">周经营驾驶舱</h1><span>${esc(dateRange("current", true))} · ${rows.length} 家门店</span></div><div class="dash-verdict"><span>本周判断</span><p>${esc(content.headline)}</p><a href="${route("priorities")}">看依据 →</a></div>${D.availability.current ? kpis(cards, dining) : "<p>本周暂无可用经营数据。</p>"}<div class="dash-grid">${panels.map(dashPanel).join("")}</div><section class="dash-store-section"><div class="dash-section-heading"><h2>进入门店</h2></div><div class="dash-store-links">${rows.map((r, i) => `<a href="${route("store", i)}"><b>${esc(short(r["门店名称"]))}</b><span class="${r.wow_net_revenue_pct < 0 ? "px-down" : "px-up"}">${pct(r.wow_net_revenue_pct)} <i>环比</i></span><span aria-hidden="true">↗</span></a>`).join("")}</div></section>`
    );
    const chartGrid = app.querySelector(".dash-grid");
    chartGrid.style.setProperty("--dash-columns", STRUCTURE.dashboard.desktopColumns);
    for (const panel of panels) {
      chartGrid
        .querySelector(`[data-dashboard-chart="${panel.id}"]`)
        .style.setProperty("--dash-span", panel.span);
    }
    if (D.availability.current) bindDiningDetail(dining);
    if (document.getElementById("dash-trend-host")) {
      mount(trendNode, "dash-trend-host");
      const select = document.getElementById("trendStoreSelect");
      select.value = dashboardTrendStore;
      if (!select.value) select.value = "__all__";
      select.dispatchEvent(new Event("change"));
      readableTrendTicks();
      dashboardTrendObserver = new MutationObserver(readableTrendTicks);
      dashboardTrendObserver.observe(document.getElementById("trend"), {
        childList: true,
        subtree: true
      });
    }
    const renderers = {
      ranking: dashboardRank,
      growth: dashboardGrowth,
      quadrants: dashboardQuadrants,
      platforms: dashboardPlatforms,
      hourly: dashboardHours
    };
    function redraw(el) {
      const id = el.id.replace("dash-plot-", "");
      const w = Math.max(260, Math.floor(el.clientWidth));
      el.innerHTML = renderers[id](w);
    }
    dashboardObserver = new ResizeObserver((entries) => {
      readableTrendTicks();
      for (const e of entries) {
        const el = e.target;
        const w = Math.floor(e.contentRect.width);
        if (el.dataset.width !== String(w)) {
          el.dataset.width = w;
          redraw(el);
        }
      }
    });
    app.querySelectorAll(".dash-plot").forEach((el) => {
      redraw(el);
      dashboardObserver.observe(el);
    });
    const hourlySelect = document.getElementById("dash-hour-select");
    if (hourlySelect)
      hourlySelect.onchange = (e) => {
        dashboardHour = e.target.value;
        redraw(document.getElementById("dash-plot-hourly"));
      };
  }

  function store(i) {
    const r = rows[i],
      name = r["门店名称"];
    const dining = diningMetrics(name);
    shell(
      `${storeCrumbs(i)}${heading(name, "先选择一个经营维度。详细表格与判断留在下一层。", "STORE / 门店概览")}${kpis(
        [
          ["订单营业收入", wan(r.current_net_revenue), "本周"],
          ["收入环比", pct(r.wow_net_revenue_pct), "与上周相比"],
          ["正向订单", num(r.current_positive_orders, 0) + " 单", "营业分组表口径"],
          ["折后单均", num(r.current_post_discount_aov) + " 元", "同口径收入 / 正向订单"]
        ],
        dining
      )}${summary(ptext(mealNode(name), 1))}<div class="px-modules">${link(route("meals", i), "餐段经营", "早餐、午餐、晚餐等餐段 → 关键指标 → 时段依据", "◷")}${link(route("menu", i), "菜品结构", "品类 → 具体菜品 → 原品项销量与渠道", "≋")}${link(route("orders", i), "堂食订单结构", "用餐人数分组 → 订单与收入变化", "▤")}${link(route("takeaway", i), "外卖渠道与费用", "平台 → 收入、单量、活动支出与退款", "↗")}${link(route("reviews", i), "顾客声音", "先读一句经营判断，再看主题与建议", "◎")}${link(route("trend", i), "收入趋势", "进入后查看本店完整历史，并缩放时间范围", "⌁")}</div>`
    );
    bindDiningDetail(dining);
  }
  function evidenceGroups(name) {
    const n = mealNode(name),
      groups = {};
    for (const li of n?.querySelectorAll(".review-evidence li") ?? []) {
      const t = li.textContent;
      const g =
        ["早餐", "午餐", "下午餐", "晚餐", "夜餐", "未设置餐段"].find((x) => t.startsWith(x)) ||
        "其他依据";
      (groups[g] ??= []).push(t);
    }
    return groups;
  }
  function meals(i, meal) {
    const name = rows[i]["门店名称"],
      node = mealNode(name),
      groups = evidenceGroups(name),
      allMeals = X.meals.filter((r) => r.store === name);
    if (meal) {
      const r = allMeals.find((r) => r.meal === meal);
      const vals = r.periods;
      const items = groups[meal] || [];
      shell(
        `${storeCrumbs(i, ["餐段经营", route("meals", i)], [meal])}${heading(meal + " · 经营事实", "本店整餐段汇总；可继续进入具体时段。", "MEAL / 第三层")}${kpis(
          [
            ["本周订单营业收入", wan(vals.current.revenue), "整餐段合计"],
            ["上周订单营业收入", wan(vals.previous.revenue), "同一餐段"],
            ["本周正向订单", num(vals.current.orders, 0) + " 单", "整餐段合计"],
            ["本周折后单均", num(vals.current.aov) + " 元", "收入 / 正向订单"]
          ]
        )}<div class="px-modules">${link(route("slots", i, meal), "继续看小时分布", "这个餐段本周、上周和同期的时段数值", "◷")}${link(route("meal-advice", i), "餐段判断与行动", "查看本店跨餐段的完整判断与下一步", "↗")}</div>${detail(
          "整餐段三期数值对照",
          table(
            ["指标", "本周", "上周", "去年同期"],
            [
              [
                "订单营业收入（元）",
                num(vals.current.revenue),
                num(vals.previous.revenue),
                num(vals.yoy.revenue)
              ],
              [
                "正向订单（单）",
                num(vals.current.orders, 0),
                num(vals.previous.orders, 0),
                num(vals.yoy.orders, 0)
              ],
              ["折后单均（元）", num(vals.current.aov), num(vals.previous.aov), num(vals.yoy.aov)]
            ]
          )
        )}${
          items.length
            ? detail(
                "原报告引用的餐段依据",
                table(
                  ["指标", "数值"],
                  items.map((t) => {
                    const at = t.lastIndexOf("：");
                    return [esc(t.slice(0, at)), esc(t.slice(at + 1))];
                  })
                )
              )
            : ""
        }`
      );
      return;
    }
    shell(
      `${storeCrumbs(i, ["餐段经营"])}${heading("餐段经营", "先看整体判断，再选择要核查的餐段。", "OPERATIONS / 第二层")}${summary(ptext(node, 1))}<div class="px-modules">${allMeals.map((r) => link(route("meals", i, r.meal), r.meal, `本周收入 ${wan(r.periods.current.revenue)} · 上周 ${wan(r.periods.previous.revenue)}`, "◷")).join("")}${link(route("meal-advice", i), "经营判断与下一步", "本期表现、完整建议和全部引用依据", "↗")}${link(route("hourly", i), "全天时段图", "本店 24 小时收入分布", "⌁")}</div>`
    );
  }
  function mealAdvice(i) {
    const n = mealNode(rows[i]["门店名称"]);
    shell(
      `${storeCrumbs(i, ["餐段经营", route("meals", i)], ["判断与行动"])}${heading("餐段判断与行动", "沿用原报告的完整经营建议。")}${[...(n?.querySelectorAll(":scope>p") ?? [])].map((p) => `<div class="px-summary">${p.outerHTML}</div>`).join("")}${detail("查看全部引用依据", n?.querySelector(".review-evidence ul")?.outerHTML || "")}`
    );
  }
  function slots(i, meal) {
    const rs = D.daypart_attribution.comparison
      .filter((r) => r["门店名称"] === rows[i]["门店名称"] && r["餐段"] === meal)
      .sort((a, b) => a["时段"].localeCompare(b["时段"]));
    shell(
      `${storeCrumbs(i, ["餐段经营", route("meals", i)], [meal, route("meals", i, meal)], ["时段明细"])}${heading(meal + " · 时段明细", "金额单位：元。时段用于定位变化，整餐段判断见上一层。")}${table(
        ["时段", "本周收入", "上周收入", "去年同期收入"],
        rs.map((r) => [
          esc(r["时段"]),
          num(r.current_net_revenue),
          num(r.previous_net_revenue),
          num(r.yoy_net_revenue)
        ])
      )}`
    );
  }
  function advicePage(j, leaf) {
    const a = advice[j];
    const title = a.querySelector("summary").textContent.split(" · ").slice(2).join(" · ");
    const ps = [...a.querySelectorAll(":scope>p")];
    if (!leaf) {
      shell(
        `${crumbs([["本周关注"], [title]])}${heading(title, "先看判断，再进入行动安排或数值依据。", "PRIORITY / 企业重点")}${summary(ptext(a, 1))}<div class="px-modules">${link(route("advice", j, "why"), "为什么关注", "本期表现、经营判断和可能原因", "?")}${link(route("advice", j, "action"), "下一步怎么做", "责任角色、范围、复盘指标与调整条件", "→")}${link(route("advice", j, "evidence"), "查数值依据", "核对支持该判断的具体经营事实", "▤")}</div>`
      );
      return;
    }
    const titles = { why: "判断与可能原因", action: "行动与验证", evidence: "数值依据" };
    const html =
      leaf === "why"
        ? ps
            .slice(0, 3)
            .map((p) => p.outerHTML)
            .join("")
        : leaf === "evidence"
          ? a.querySelector("ul").outerHTML
          : ps
              .slice(3)
              .map((p, k) => p.outerHTML + (k === 0 ? a.querySelector("ol")?.outerHTML || "" : ""))
              .join("");
    shell(
      `${crumbs([[title, route("advice", j)], [titles[leaf]]])}${heading(titles[leaf], title)}<div class="px-detail-body">${html}</div>`
    );
  }
  function productValue(p, period, key) {
    const vals = Object.values(p.periods[period] || {});
    if (!vals.length || vals.some((x) => x[key] === null || x[key] === undefined)) return null;
    return vals.reduce((s, x) => s + Number(x[key]), 0);
  }
  function menu(i, category, productId) {
    const name = rows[i]["门店名称"];
    const ps = X.products.map((p, j) => ({ ...p, id: j })).filter((p) => p.store === name);
    if (productId !== undefined) {
      const p = X.products[Number(productId)];
      if (!p || p.store !== name) throw Error("Invalid product scope");
      const c = productValue(p, "current", "revenue"),
        pr = productValue(p, "previous", "revenue");
      shell(
        `${storeCrumbs(i, ["菜品结构", route("menu", i)], [p.category, route("menu", i, p.category)], [p.name])}${heading(p.name, "原品项独立保留；不同名称和规格不合并销量。", "PRODUCT / 菜品详情")}${kpis(
          [
            ["本周菜品收入", wan(c), "菜品本身收入"],
            ["上周菜品收入", wan(pr), "未见记录显示 —"],
            ["本周销量", num(productValue(p, "current", "quantity")), "原品项单位"],
            ["上周销量", num(productValue(p, "previous", "quantity")), "原品项单位"]
          ]
        )}${table(
          ["订单分类", "本周销量", "上周销量", "本周收入（元）", "上周收入（元）"],
          [
            ...new Set([
              ...Object.keys(p.periods.current || {}),
              ...Object.keys(p.periods.previous || {})
            ])
          ].map((ch) => [
            esc(ch),
            num(p.periods.current?.[ch]?.quantity),
            num(p.periods.previous?.[ch]?.quantity),
            num(p.periods.current?.[ch]?.revenue),
            num(p.periods.previous?.[ch]?.revenue)
          ])
        )}<p class="px-small-note">关联菜品名称：${esc(p.linked || "未填写")}。${p.match === "unique" ? "品类来自当前成本卡目录的唯一名称候选。" : p.match === "ambiguous" ? "当前成本卡有多个同名候选；品类一致时仅采用共同品类，具体规格仍待确认。" : "暂无已确认的品类归属。"}${p.fee ? " 本项为收费或餐具记录，不纳入实物动销判断。" : ""}</p>${summary("先核对本期和上期的在售名称、规格及可售情况，再解释销量变化；若只是名称或归类变化，修正比较对象后再决定动作。", "阅读与核查")}`
      );
      return;
    }
    if (category) {
      const list = ps
        .filter((p) => p.category === category)
        .sort(
          (a, b) =>
            (productValue(b, "current", "revenue") ?? -Infinity) -
            (productValue(a, "current", "revenue") ?? -Infinity)
        );
      shell(
        `${storeCrumbs(i, ["菜品结构", route("menu", i)], [category])}${heading(category, `${list.length} 个原品项记录 · 选择一个菜品进入销量、收入与渠道明细。`)}<div class="px-tools space-below"><input id="px-product-search" aria-label="搜索菜品" placeholder="搜索菜品名称"></div><div class="px-stores" id="px-products"></div><div class="px-tools space-above" id="px-product-paging"></div>`
      );
      const memory = listStates.get(lastRoute) || { page: 0, query: "" };
      let page = memory.page;
      const input = document.getElementById("px-product-search");
      input.value = memory.query;
      function paint() {
        listStates.set(lastRoute, { page, query: input.value });
        const filtered = list.filter(
          (p) => p.name.includes(input.value) || p.linked.includes(input.value)
        );
        const part = filtered.slice(page * 12, page * 12 + 12);
        document.getElementById("px-products").innerHTML =
          part
            .map(
              (p) =>
                `<a class="px-store" href="${route("menu", i, category, p.id)}"><h3>${esc(p.name)}</h3><div class="px-store-revenue"><strong>${wan(productValue(p, "current", "revenue"))}</strong><span>本周菜品收入</span></div><p>上周 ${wan(productValue(p, "previous", "revenue"))}</p>${p.linked && p.linked !== p.name ? `<p>关联：${esc(p.linked)}</p>` : ""}<div class="px-store-foot">查看销量与渠道 →</div></a>`
            )
            .join("") || "<p>没有匹配菜品</p>";
        document.getElementById("px-product-paging").innerHTML =
          `<button id="px-prev" ${page === 0 ? "disabled" : ""}>上一页</button><span class="px-muted">${page + 1} / ${Math.max(1, Math.ceil(filtered.length / 12))} · ${filtered.length} 项</span><button id="px-next" ${(page + 1) * 12 >= filtered.length ? "disabled" : ""}>下一页</button>`;
        document.getElementById("px-prev").onclick = () => {
          page--;
          paint();
        };
        document.getElementById("px-next").onclick = () => {
          page++;
          paint();
        };
      }
      input.oninput = () => {
        page = 0;
        paint();
      };
      paint();
      return;
    }
    const cats = [...new Set(ps.map((p) => p.category))];
    const leaders = ps
      .filter((p) => !p.fee && productValue(p, "current", "revenue") !== null)
      .sort(
        (a, b) => productValue(b, "current", "revenue") - productValue(a, "current", "revenue")
      );
    shell(
      `${storeCrumbs(i, ["菜品结构"])}${heading("菜品结构", "按可核验品类组织，其余保留待确认。", "MENU / 第二层")}${leaders.length ? summary(`${leaders[0].name}本周菜品收入为 ${wan(productValue(leaders[0], "current", "revenue"))}元。`, "本店收入最高的实物品项") : ""}${ptext(reviews.get(name)?.querySelector('[data-review-section="dishes"]'), 1) ? summary(ptext(reviews.get(name)?.querySelector('[data-review-section="dishes"]'), 1), "经营判断") : ""}<div class="px-modules">${cats.map((c) => link(route("menu", i, c), c, `${ps.filter((p) => p.category === c).length} 个原品项记录 · 本周收入 ${wan(ps.filter((p) => p.category === c).reduce((s, p) => s + (productValue(p, "current", "revenue") || 0), 0))}`, "≋")).join("")}</div><p class="px-small-note">本页为基础品类视角，不等同于厨房档口。当前目录用于导航，不回溯认定上周所属档口。金额为菜品本身收入，不与总览订单营业收入相加。</p>`
    );
  }
  function orders(i, group) {
    const row = rows[i],
      name = row["门店名称"];
    if (!X.orders.some((item) => item.store === name)) {
      shell(
        `${storeCrumbs(i, ["堂食订单结构"])}${heading("堂食订单结构", "营业汇总口径", "ORDERS / 堂食")}${table(
          ["指标", "本周", "上周"],
          [
            [
              "正向订单",
              num(row.current_dine_in_positive_orders, 0),
              num(row.previous_dine_in_positive_orders, 0)
            ],
            [
              "订单营业收入（元）",
              num(row.current_dine_in_revenue),
              num(row.previous_dine_in_revenue)
            ]
          ]
        )}<p class="px-small-note">用餐人数分组需同周已结账订单明细。</p>`
      );
      return;
    }
    const rs = X.orders.filter((r) => r.store === name);
    const gs = [...new Set(rs.map((r) => r.group))].sort((a, b) => a.localeCompare(b, "zh-CN"));
    const c = (g) => rs.find((x) => x.period === "current" && x.group === g);
    const p = (g) => rs.find((x) => x.period === "previous" && x.group === g);
    if (group) {
      shell(
        `${storeCrumbs(i, ["堂食订单结构", route("orders", i)], [group])}${heading(group + " · 堂食已结账订单", "按源表用餐人数分组，保留已结账范围。")}${table(
          ["指标", "本周", "上周"],
          [
            ["记录数", num(c(group)?.records, 0), num(p(group)?.records, 0)],
            ["订单收入（元）", num(c(group)?.income), num(p(group)?.income)],
            [
              "每条记录平均收入（元）",
              c(group) ? num(Number(c(group).income) / c(group).records) : "—",
              p(group) ? num(Number(p(group).income) / p(group).records) : "—"
            ],
            ["订单优惠（元）", num(c(group)?.discount), num(p(group)?.discount)]
          ]
        )}<p class="px-small-note">本周 ${esc(dateRange("current"))}，上周 ${esc(dateRange("previous"))}。订单明细与营业汇总分别呈现，不重复加总收入。</p>`
      );
      return;
    }
    shell(
      `${storeCrumbs(i, ["堂食订单结构"])}${heading("堂食订单结构", "从总收入变化，进一步看不同用餐人数的订单。", "ORDERS / 新增数据")}${summary("按已结账堂食订单的用餐人数分组，比较本周和上周。", "统计口径")}<div class="px-modules">${gs.map((g) => link(route("orders", i, g), g, `本周 ${num(c(g)?.records, 0)} 条 · 上周 ${num(p(g)?.records, 0)} 条；收入 ${wan(c(g)?.income)}`, "▤")).join("")}</div><p class="px-small-note">仅使用用餐方式为“堂食”的已结账记录；人数分组不等同于桌台类型，不据此推算取消率或未结账损失。</p>`
    );
  }
  function takeaway(i, platform) {
    const row = rows[i],
      name = row["门店名称"],
      rs = X.takeaway.filter((r) => r.store === name);
    if (!rs.length) {
      const channels = [
        ["美团", "meituan"],
        ["饿了么／淘宝闪购", "eleme"],
        ["京东", "jd"]
      ];
      shell(
        `${storeCrumbs(i, ["外卖渠道与费用"])}${heading("外卖渠道与费用", "营业汇总口径", "DELIVERY / 外卖")}${table(
          ["平台收入（元）", "本周", "上周"],
          channels.map(([label, key]) => [
            label,
            num(row["current_" + key + "_delivery_revenue"]),
            num(row["previous_" + key + "_delivery_revenue"])
          ])
        )}<p class="px-small-note">费用、退款与订单状态需同周平台订单明细。</p>`
      );
      return;
    }
    const gs = [...new Set(rs.map((r) => r.group))];
    const get = (p, w) => rs.find((r) => r.group === p && r.period === w);
    if (platform) {
      const c = get(platform, "current"),
        p = get(platform, "previous");
      shell(
        `${storeCrumbs(i, ["外卖渠道与费用", route("takeaway", i)], [platform])}${heading(platform + " · 收入与费用", "费用保留源表口径，可用于核查增长质量。", "CHANNEL / 平台详情")}${table(
          ["指标", "本周", "上周"],
          [
            ["订单记录数", num(c?.records, 0), num(p?.records, 0)],
            ...[
              ["income", "营业收入（元）"],
              ["platform_fee", "平台服务费（元）"],
              ["promotion", "商家活动支出（元）"],
              ["refund", "部分退款（元）"],
              ["customer_paid", "顾客实付（元）"]
            ].map(([k, l]) => [l, num(c?.[k]), num(p?.[k])])
          ]
        )}${detail(
          "查看订单状态范围",
          `<p>本周：${esc(
            Object.entries(c?.statuses || {})
              .map(([k, v]) => `${k} ${v} 条`)
              .join("；")
          )}</p><p>上周：${esc(
            Object.entries(p?.statuses || {})
              .map(([k, v]) => `${k} ${v} 条`)
              .join("；")
          )}</p>`
        )}<p class="px-small-note">费用、收入和顾客实付是不同源字段，不重复扣减，也不据此称为利润；包含源表有效订单范围内尚未完成的记录。</p>`
      );
      return;
    }
    shell(
      `${storeCrumbs(i, ["外卖渠道与费用"])}${heading("外卖渠道与费用", "先选择平台，再查看费用、退款与订单状态。", "DELIVERY / 新增数据")}<div class="px-modules">${gs.map((g) => link(route("takeaway", i, g), g, `本周营业收入 ${wan(get(g, "current")?.income)}；${num(get(g, "current")?.records, 0)} 条订单记录`, "↗")).join("")}</div>${summary("营业收入、商家活动支出和退款按平台分别汇总。", "统计口径")}`
    );
  }
  function voiceStore(i) {
    return V?.stores.find((s) => s.store_name === rows[i]["门店名称"]);
  }
  function voiceIndex(name) {
    return rows.findIndex((r) => r["门店名称"] === name);
  }
  const voiceTone = (t) => ({ keep: "值得保持", priority: "优先核实", check: "先做核查" })[t];
  function voiceCloud(items) {
    return `<div class="px-wordcloud" aria-label="本周评价主题词云">${items.map((v, j) => `<a class="px-cloud-${v.tone} px-cloud-size-${v.tone === "priority" ? 0 : v.tone === "check" ? 1 : 2}" href="${v.href}">${esc(v.label)}</a>`).join("")}</div><p class="px-small-note">绿色为值得保持，暖色为待核查；字号仅强调阅读重点，不表示提及次数或满意率。</p>`;
  }
  function customerReviews(key) {
    if (key === "all") {
      if (!V) {
        shell(`${crumbs([["顾客声音"]])}${heading("顾客声音", "本期暂无可分析的评价正文。")}`);
        return;
      }
      const themes = V.stores.flatMap((store) =>
        store.themes.map((theme) => ({ ...theme, store_name: store.store_name }))
      );
      const priorities = themes
        .filter((theme) => theme.tone === "check")
        .slice(0, 3)
        .map((theme) => ({
          title: theme.title,
          reason: theme.judgment,
          store_name: theme.store_name,
          theme_id: theme.id
        }));
      const clouds = themes.slice(0, 8).map((theme) => ({
        label: theme.cloud_label,
        tone: theme.tone,
        href: route("review-topic", voiceIndex(theme.store_name), theme.id)
      }));
      shell(
        `${crumbs([["顾客声音"]])}${heading("顾客记住了什么，哪里值得先改。", "先读经营判断，再按门店查看主题与建议。", "VOICE / 经营解读")}${summary(V.overview, "本周判断")}<section class="px-section"><div class="px-section-head"><h2>本周先看这三件事</h2></div><div class="px-priorities">${priorities.map((p) => `<a class="px-priority" href="${route("review-topic", voiceIndex(p.store_name), p.theme_id)}"><span class="px-muted">建议核查</span><h3>${esc(p.title)}</h3><p>${esc(p.reason)}</p><span class="px-link">看判断与行动 →</span></a>`).join("")}</div></section><section class="px-section"><h2>一眼看见本周的主题</h2>${voiceCloud(clouds)}</section><section class="px-section"><div class="px-section-head"><h2>逐店读一句话</h2><p>选择门店，继续看值得保持和优先核查的事</p></div><div class="px-stores">${V.stores.map((s) => `<a class="px-store px-voice-store" href="${route("reviews", voiceIndex(s.store_name))}"><span class="px-muted">${esc(short(s.store_name))}</span><h3>${esc(s.headline)}</h3><div class="px-store-foot">进入本店解读 →</div></a>`).join("")}</div></section><p class="px-small-note">只基于本周已同步评价，保留正反反馈并合并相同正文。评价是核查线索，不直接解释营业变化。</p>`
      );
      return;
    }
    const i = Number(key),
      s = voiceStore(i);
    if (!s) {
      shell(
        `${storeCrumbs(i, ["顾客声音"])}${heading("顾客声音", "本店本期暂无可分析的评价正文。")}`
      );
      return;
    }
    const priority =
      s.themes.find((t) => t.tone === "priority") ||
      s.themes.find((t) => t.tone === "check") ||
      s.themes[0];
    shell(
      `${storeCrumbs(i, ["顾客声音"])}${heading(s.headline, s.store_name, "VOICE / 本店判断")}${priority ? summary(priority.judgment, "怎么看") : ""}${voiceCloud(s.themes.map((t) => ({ label: t.cloud_label, tone: t.tone, href: route("review-topic", i, t.id) })))}<div class="px-voice-lanes">${[
        "keep",
        "check"
      ]
        .map(
          (lane) =>
            `<section><div class="px-section-head"><h2>${lane === "keep" ? "值得保持" : "优先核查"}</h2></div>${s.themes
              .filter((t) => (lane === "keep" ? t.tone === "keep" : t.tone !== "keep"))
              .map(
                (t) =>
                  `<a class="px-voice-theme ${t.tone}" href="${route("review-topic", i, t.id)}"><span class="px-muted">${voiceTone(t.tone)}</span><h3>${esc(t.title)}</h3><p>${esc(t.judgment)}</p><span class="px-link">看具体观察与建议 →</span></a>`
              )
              .join("")}</section>`
        )
        .join(
          ""
        )}</div>${priority ? summary(priority.action, "下周先做一件事") : ""}<p class="px-small-note">这里给出经营解读；需要核对时，进入相应主题查看证据。相同正文已合并，不将纯评分解释成具体菜品意见。</p>`
    );
  }
  function voiceTopic(i, id, evidence = false) {
    const s = voiceStore(i),
      t = s.themes.find((t) => t.id === id);
    if (!t) throw Error("Unknown review theme");
    const path = storeCrumbs(
      i,
      ["顾客声音", route("reviews", i)],
      [t.title, evidence ? route("review-topic", i, id) : null],
      ...(evidence ? [["引用依据"]] : [])
    );
    if (!evidence) {
      shell(
        `${path}${heading(t.title, voiceTone(t.tone), "VOICE / 主题解读")}${summary(t.judgment, "经营判断")}<div class="px-voice-analysis"><article><span class="px-kicker">OBSERVATION</span><h2>顾客实际说了什么</h2><p>${esc(t.observation)}</p></article><article><span class="px-kicker">NEXT ACTION</span><h2>建议怎么处理</h2><p>${esc(t.action)}</p></article></div><a class="px-evidence-link" href="${route("review-evidence", i, id)}">查看支持这项判断的观察摘要 →</a>`
      );
      return;
    }
    shell(`${path}${heading("这项判断的引用依据", t.title, "EVIDENCE / 最深一层")}${summary(t.observation, "要核对的观察")}
 <p class="px-small-note">公开样例保留主题观察。逐字评价及对应日期已移除。</p>`);
  }

  function chartPage(kind, i) {
    const isTrend = kind === "trend",
      node = isTrend ? trendNode : hourlyNode;
    const title = isTrend ? "收入趋势" : "全天时段收入";
    shell(
      `${i === "all" ? crumbs([[title]]) : storeCrumbs(Number(i), [title])}${heading(title, "可使用图表中的门店与时间控件继续探索。")}<div id="px-mount" class="px-mounted-panel"></div>`
    );
    mount(node);
    const select = document.getElementById(isTrend ? "trendStoreSelect" : "hourlyStoreSelect");
    const label = i === "all" ? "全体门店" : rows[Number(i)]["门店名称"];
    const opt = [...select.options].find((o) => o.textContent === label);
    if (opt) {
      select.value = opt.value;
      select.dispatchEvent(new Event("change"));
    }
  }
  function design() {
    shell(`${crumbs([["数据说明"]])}${heading("数据说明")}
 ${table(
   ["数据", "查看位置", "口径"],
   [
     ["营业汇总", "首页、门店、跨店专题", "订单营业收入、正向订单、折后单均与外卖收入占比"],
     ["菜品销售", "门店 → 菜品结构", "按品项与渠道查看销量和收入"],
     [
       "堂食与外卖订单",
       "门店 → 堂食订单结构或外卖渠道与费用",
       "有同域明细时展示用餐人数、平台费用和订单状态"
     ],
     ["顾客评价", "顾客声音 → 主题 → 引用依据", "本周已同步评价，展示去标识化后的主题与观察"]
   ]
 )}`);
  }
  function navigate() {
    document.querySelector(".px-dining-dialog[open]")?.close();
    if (lastRoute)
      saved.set(lastRoute, {
        scroll: scrollY,
        opens: [...app.querySelectorAll("details")].map((x) => x.open)
      });
    restore();
    const hash = location.hash;
    let path = hash.startsWith("#/alpha/")
      ? hash.slice(8).split("/").map(decodeURIComponent)
      : ["home"];
    const [page, arg, arg2, arg3] = path;
    const routeRule = resolveRoute(path);
    lastRoute = hash;
    activeRouteId = routeRule?.id;
    try {
      if (!routeRule) throw Error("Unregistered page structure");
      if (page === "home" || !page) home();
      else if (page === "allstores") home(true);
      else if (page === "priorities")
        shell(
          `${crumbs([["经营建议"]])}${heading("经营顾问反馈", "选择本周的经营问题，查看判断、行动与依据。")}${priorityCards()}<section class="px-section">${link(route("reviews", "all"), "顾客声音解读", "逐店看值得保持与优先核查的体验问题", "◎")}</section>`
        );
      else if (page === "store") store(Number(arg));
      else if (page === "meals") meals(Number(arg), arg2);
      else if (page === "meal-advice") mealAdvice(Number(arg));
      else if (page === "slots") slots(Number(arg), arg2);
      else if (page === "advice") advicePage(Number(arg), arg2);
      else if (page === "menu") menu(Number(arg), arg2, arg3);
      else if (page === "orders") orders(Number(arg), arg2);
      else if (page === "takeaway") takeaway(Number(arg), arg2);
      else if (page === "reviews") customerReviews(arg);
      else if (page === "review-topic") voiceTopic(Number(arg), arg2);
      else if (page === "review-evidence") voiceTopic(Number(arg), arg2, true);
      else if (page === "trend" || page === "hourly") chartPage(page, arg);
      else if (page === "design") design();
      else if (page === "topics")
        shell(
          `${crumbs([["经营专题"]])}${heading("跨店看经营", "先选问题，再进入对应图表。")}${topics()}`
        );
      else if (page === "trends")
        shell(
          `${crumbs([["收入趋势"]])}${heading("看整体，或看一家门店", "进入后可缩放时间、切换日／周／月。")}<div class="px-modules">${link(route("trend", "all"), "全体门店", "企业合计收入趋势", "⌁")}${rows.map((r, i) => link(route("trend", i), short(r["门店名称"]), "本店收入趋势", "⌁")).join("")}</div>`
        );
      else if (page === "benchmark")
        shell(
          `${crumbs([["跨店经营专题"]])}${heading("跨店经营专题", "这里只展示问题入口；选择以后再显示具体图表。")}<div class="px-modules">${charts.map((c, i) => (i === 6 || c.node.closest("section")?.hidden ? "" : link(route("chart", i), i === 1 ? STRUCTURE.dashboard.panels.find((panel) => panel.id === "ranking").title : c.title, "", "▥"))).join("")}</div>`
        );
      else if (page === "chart" && ["1", "6"].includes(arg)) rankedRevenueDetail();
      else if (page === "chart") {
        const c = charts[Number(arg)];
        shell(
          `${crumbs([["跨店经营专题", route("benchmark")], [c.title]])}${heading(c.title)}<div class="px-mounted-panel" id="px-mount"></div>`
        );
        mount(c.node);
      } else home();
      app.dataset.page = routeRule.id;
      app.dataset.depth = routeRule.depth;
      app.dataset.template = routeRule.template;
      if (
        ["overview", "store_index", "store_overview", "voice_overview", "voice_store"].includes(
          routeRule.template
        ) &&
        app.querySelector(".px-data-cards,table,.px-review-quote")
      )
        throw Error("Summary view contains deep content");
      if (
        routeRule.template === "dashboard" &&
        (app.querySelectorAll("[data-dashboard-chart]").length !== panels.length ||
          app.querySelector(".px-priorities,.px-review-quote,.px-data-cards,table"))
      )
        throw Error("Dashboard content contract violated");
      if (routeRule.template !== "voice_evidence" && app.querySelector(".px-review-quote"))
        throw Error("Review quotes escaped evidence view");
    } catch (e) {
      shell(
        `${crumbs([["页面未找到"]])}${heading("此路径不可用", "请返回总览重新选择门店或模块。")}`
      );
      console.error(e);
    }
    const state = saved.get(hash);
    if (state)
      app.querySelectorAll("details").forEach((x, i) => (x.open = Boolean(state.opens[i])));
    if (navigator.userActivation?.isActive) {
      app.querySelector("h1")?.focus({ preventScroll: true });
    }
    window.scrollTo(0, state?.scroll || 0);
  }
  window.addEventListener("hashchange", navigate);
  navigate();
})();
