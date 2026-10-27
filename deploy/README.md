# 官网发布与回滚

本仓库只管理 `smedatacenter.xyz` / `www.smedatacenter.xyz` 的静态文件及专属 nginx 配置。API、数据库、业务密钥、服务镜像和 `runtime.env` 仍由 [SME_DATA_CENTER](https://github.com/YinXiaoyu-1998/SME_DATA_CENTER) 管理。使用当前 Linux nginx 主机，不增加常驻服务或镜像仓库。

## 自动发布

每次 PR 合并或提交推送到 `main`，自动运行 `Deploy landing`：调用质量工作流 → 检查、测试和构建 → 上传本次提交的静态产物 → 通过 `landing-production` 发布 → 公网校验。无需再点手动发布。

PR 只运行 `Landing quality` 检查，不接触发布凭据。main 的质量检查由发布工作流调用一次，不额外重复运行独立检查。任何检查失败都会阻止发布；网站校验失败自动恢复原版本。

仍可在 Actions → **Deploy landing** → `main` 手动选择 `deploy` 重发当前 main，或选择 `rollback` 恢复前一官网版本。发布前会核对本次提交仍为当前 main，防止重跑旧工作流覆盖新版本；该检查失败时应发布最新 main。

工作流使用 `smedc-landing-production` 并发组，进行中的发布不会被新提交中断。GitHub 同一并发组只保留一个等待任务，连续推送时较新的等待任务可能替换旧任务；如需每个版本都上线，应等前次发布结束再合并下一版。

## 服务仓库接管边界

官网已从服务仓库拆出，使用现有 Linux 主机和 `/opt/smedc/marketing` 静态目录。服务发布和回滚不再改写官网。不要重跑拆分前的服务发布工作流，否则旧脚本仍可能覆盖官网。

重新接管主机时，应先完成服务拆分版本的受控部署并排空旧任务，再启用 `LANDING_DEPLOY_ENABLED`。现有站点通常无需更改 DNS、nginx 或 TLS；全新主机按本文末尾的首次启用步骤准备。

## GitHub Environment

创建 `landing-production`，按 GitHub 套餐支持情况限制为 `main` 并配置所需审核人。工作流自身也只允许 `main`；开关开启且凭据就绪后，后续 main 提交会自动发布。

| 类型     | 名称                      | 配置                                                            |
| -------- | ------------------------- | --------------------------------------------------------------- |
| Variable | `LANDING_DEPLOY_ENABLED`  | 完成服务仓接管后设为 `true`；未配置时失败关闭                   |
| Variable | `LANDING_HOST`            | 当前主机 `39.96.66.185`，换主机须重新核实并更新 `known_hosts`   |
| Variable | `LANDING_SSH_USER`        | 已获准的部署用户，须能写官网目录并获取 `/opt/smedc/deploy.lock` |
| Secret   | `LANDING_SSH_PRIVATE_KEY` | 从获准的密钥管理渠道配置；GitHub 旧仓库 secret 不会自动迁移     |

主机需要 Bash、GNU tar/coreutils、flock、curl 和已有 SSH/nginx/TLS。`deploy/known_hosts` 保留原仓核实过的公开主机公钥。SSH 启用严格主机校验，不在 CI 临时信任扫描结果。不需要 ACR、数据库、OSS 或业务签名密钥。工作流不创建或修改服务器用户、密钥授权和目录权限。

## 发布事务

`Deploy landing` 的自动或手动 deploy 操作先调用同一运行内的质量工作流，独立 `npm ci`，运行格式、lint、类型、测试和构建，打包 `dist/marketing` 并上传对应完整提交 SHA 的 artifact。凭据只注入后续 Environment 部署 job；PR 不接触发布凭据。部署下载同一运行的产物，SSH 上传后核对 SHA-256，不从服务仓库下载任何代码或镜像。

`deploy-remote.sh` 在主机锁内将包解压到 `/opt/smedc/marketing/releases/<full-sha>.<suffix>`，验证必需文件，记录 `release-commit.txt`，原子切换 `current` 符号链接。继续使用原官网目录，可直接接管现有页面。新回滚指针为 `/opt/smedc/marketing/previous-release`；不读写旧服务使用的 `/opt/smedc/previous-marketing-release`。两仓库并发组互不通用，所以迁移期仍共享主机锁。

存在 `/opt/smedc/marketing-enabled` 标记时，事务检查公网 `version.json` 与本地产物完全一致，首页、CSS/JS/图片、公开周报可达，HTTP/www 跳转正常，未知路由和 `/readyz` 返回 404。`version.json` 为页面代码散列，`release-commit.txt` 为完整发布提交；素材也由整包 SHA-256 验证。检查失败自动恢复原 `current`，保留原回滚指针并清理本次待发布目录。没有标记时仅交付静态文件，不能视为公网验收通过。

## 回滚与清理

获准后在同一工作流选择 `main` → `rollback`，只恢复本仓库上一次成功发布前的官网目录并重新检查；不运行构建、不重启服务、不回滚数据库。首次接管会记录旧官网目录，因此可恢复拆分前页面。若全新主机没有旧版本，手动回滚拒绝执行；首次发布校验失败则移除 `current`，恢复未上线状态。回滚检查失败会恢复操作前的页面。

历史静态版本不自动删除。单独获准清理时，至少保留 `current` 与 `previous-release` 指向的目录。旧服务回滚元数据不要作为新官网的恢复依据。只有修改 nginx/TLS 时才需要测试配置并 reload，普通静态发布无需 reload。

### 首次启用：单独授权的主机操作

以下步骤是准备说明，不是拆仓工作的执行记录。只在获得官网启用、证书与 nginx 变更授权后执行；不要把含缺失证书路径的 HTTPS 配置提前装入已启用目录。

1. 核对 `smedatacenter.xyz` 与 `www.smedatacenter.xyz` 的 DNS 指向本机，80/443 可达；核对官网页尾主体“北京殷实麦家管理咨询有限责任公司”和网站备案号“京ICP备2026043481号-1”（2026-10-25 已在阿里云备案记录核实对应域名，不能用主体号省略网站序号）。验证首次受控发布已生成 `/opt/smedc/marketing/current/index.html` 与图片。
2. 备份现有 nginx 配置。保留现有 API TLS/代理块，仅将旧 default server 的 `server_name smedatacenter.xyz www.smedatacenter.xyz;` 改为 `server_name _;`（该 API 配置仍由服务仓库管理）。不要用仓库样例覆盖 Certbot 或运维新增的有效 API 设置。
3. 创建 `/var/www/smedc-acme`，安装 `deploy/nginx-marketing-bootstrap.conf` 为独立临时 enabled 配置。它只开放 ACME challenge，其余路径返回 404。先 `nginx -t`，成功才 reload；确认 API 的 health/readiness 和既有业务页面仍可用。
4. 在主机用已有 Certbot 申请同时覆盖主域与 www 的独立证书：`sudo certbot certonly --webroot -w /var/www/smedc-acme --cert-name smedatacenter.xyz -d smedatacenter.xyz -d www.smedatacenter.xyz`。按获准运维流程提供证书联系信息，不改 API 证书。核对证书 SAN 与续期任务；为成功续期配置 `nginx -t && systemctl reload nginx` 的 deploy hook。
5. 证书可用后，用 `deploy/nginx-marketing.conf` 替换上述临时官网配置，不能同时启用两者。核对既有 `options-ssl-nginx.conf` 与 `ssl-dhparams.pem` 路径，`nginx -t` 成功后 reload。静态 root 只指向独立发布目录，绝不指向 runtime、业务文件或 OSS bucket。
6. 核对 HTTPS 主域首页、CSS/JS/图片；HTTP 主域与 HTTP/HTTPS www 均跳转 `https://smedatacenter.xyz/`；未知路径和 `/readyz` 返回 404。确认 `https://api.smedatacenter.xyz/healthz` 为 200、`/readyz` 为 404、未授权业务请求仍被拒绝，并检查既有权限页、台账页和 OAuth 入口。通过后创建空标记 `/opt/smedc/marketing-enabled`（root 所有），后续受控发布自动检查官网。

若首次启用检查失败，恢复备份的 nginx 配置并通过 `nginx -t` 后 reload，移除官网启用标记；不改业务授权、数据或 API 证书。配置通过与本地测试均不代表线上 TLS/路由已经验收。
