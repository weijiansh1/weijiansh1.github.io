# Weijian Shi · Fudan University

正式主页采用学术简历式布局：左侧为头像、姓名、单位与联系入口，右侧为简介、研究方向、项目与可选论文。白底、深灰文字和少量绿色，支持中英文、深色模式、手机布局与打印为 PDF。

仓库：[weijiansh1/weijianshi.github.io](https://github.com/weijiansh1/weijianshi.github.io)。站点使用 GitHub Actions 构建并发布到 GitHub Pages。

正式入口为 [个人主页](https://weijiansh1.github.io/weijianshi.github.io/)。原来的 `resume.html` 预览地址会自动跳转到正式主页，并保留页内锚点。页面模板是 `templates/index.html`，样式位于 `assets/resume.css`。

## 个人内容

姓名与复旦大学单位信息已由本人提供。头像使用 [weijiansh1 的公开 GitHub 头像](https://github.com/weijiansh1)，本地文件为 `assets/avatar.jpg`。研究方向及 NAR 项目简介介绍正在探索的问题；未填写学位、职位、学校院系、发表记录、性能结果或联系方式。未提供的论文、邮箱、简历和学术主页不会出现在页面上。

## 预览

网站不依赖 npm、外部字体或 CDN，Python 3.9 及以上即可构建。

```bash
python3 scripts/build.py
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

打开 <http://localhost:8000>。也可以直接在浏览器打开根目录 `index.html`；核心内容在禁用 JavaScript 时仍然可读。语言、主题与手机菜单由 JavaScript 增强。

## 修改个人信息

编辑 `site.json` 后重新运行 `python3 scripts/build.py`。无需修改生成的 `index.html`。

| 字段 | 用途 |
| --- | --- |
| `name`、`affiliation` | 姓名与单位 |
| `url` | 正式站点的完整 HTTPS 地址，用于标准网址与分享信息 |
| `intro`、`bio` | 首页简介，分别编辑 `en` 和 `zh` |
| `research` | 研究方向、图标与说明；`keywords` 保留在数据中，简历式布局不显示 |
| `projects` | 项目简介、可选缩略图、研究问题和链接 |
| `publications` | 论文列表，空数组时自动隐藏整个栏目及导航 |
| `email` | 填写真实邮箱后显示邮件链接 |
| `scholar` | Google Scholar 的完整 HTTPS 地址 |
| `cv` | HTTPS 地址，或先放文件后填写 `assets/cv.pdf` |
| `portrait` | HTTPS 图片地址，或先放文件后填写 `assets/portrait.jpg` |

外部链接必须使用 HTTPS。本地简历与照片放在 `assets/` 中。未填写的可选字段保持空字符串，不会显示无效按钮。放入 `assets/` 的文件都会随站点发布，请只放公开文件。

`publications` 单条数据结构如下；示例只是编辑格式，请替换为真实信息后再使用：

```json
{
  "year": "年份",
  "title": {"en": "Actual paper title", "zh": "真实论文标题"},
  "authors": "真实作者列表",
  "venue": {"en": "Actual venue and status", "zh": "真实会议或期刊及状态"},
  "links": [
    {"label": {"en": "Paper", "zh": "论文"}, "url": "https://example.org/replace-with-real-paper"}
  ]
}
```

项目 `links` 使用相同结构。添加论文后，导航与论文区块自动出现；论文按数组顺序展示。

项目缩略图通过 `image` 指定路径，`image_alt` 填写中英文说明；未填写图片时显示项目名称。当前 NAR 图为概念示意图，不表示实验结果。

## GitHub Pages

在能够访问 GitHub、已使用 `gh auth login` 登录的终端，可运行以下命令推送。脚本会读取远程默认分支，在临时目录克隆仓库，合入本站文件并提交推送；它保留其他文件及既有历史，不使用强制推送。脚本成功时会输出真实提交链接。

```bash
bash scripts/push-to-github.sh
```

脚本会将同名站点文件（如 `index.html`、`README.md` 和工作流）更新为本版本。也可以按以下步骤手动合入和部署：

1. 将本目录源码合入目标仓库。主要文件为 `site.json`、`templates/`、`scripts/`、`assets/`、`index.html`、`.nojekyll` 和 `.github/workflows/pages.yml`。不要覆盖已有仓库中的无关文件。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 提交至 `main` 或 `master`，或手动运行 **Deploy academic homepage**。工作流只发布 `dist/`，不会上传源码、预览截图等内容。
4. 等待工作流成功，访问其 deployment 输出地址。若默认分支名不同，修改工作流中的分支名。

仓库所有者是 **`weijiansh1`**（最后一位是数字 `1`），而仓库名为 **`weijianshi.github.io`**（这里是字母 `i`）。按 [GitHub Pages 的命名规则](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)，保留这个名字时，默认项目站点地址应为：

<https://weijiansh1.github.io/weijianshi.github.io/>

如果希望使用根地址 `https://weijiansh1.github.io/`，用户站点仓库需要命名为 `weijiansh1.github.io`。这里没有替你重命名仓库，也没有设置自定义域名。所有网站资源都使用相对路径，可部署到任意子目录。

部署配置参考 [GitHub 官方自定义 Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 文件说明

- `site.json`：个人内容的唯一数据源。
- `templates/index.html`：页面结构，保留构建占位符。
- `assets/resume.css`：正式主页的桌面、手机、深色与打印样式。
- `templates/resume.html`、`assets/redirect.js`：原预览地址的跳转页面。
- `assets/style.css`：早期展示式版本的样式，正式主页不加载。
- `assets/preferences.js`、`assets/main.js`：主题、语言、导航交互。
- `scripts/build.py`：使用 Python 标准库生成静态 HTML。
- `index.html`：生成后的可直接打开的页面。
- `resume.html`：生成后的原预览地址跳转页。
- `dist/`：部署目录，由构建脚本生成，不纳入版本管理。
- `output/playwright/`：本地检查与截图，不参与部署。

## 本次验证

已通过静态构建、JavaScript 语法、页内锚点、资源路径、中英文文案完整性、常用文字颜色对比度检查。另在临时目录验证了添加论文、邮箱、照片、简历和 Scholar 后的生成结果；这些示例没有写入正式主页。

已在 Chromium 中检查桌面与手机布局，以及中英文切换、主题切换及偏好保存、项目展开、手机菜单与页内导航、减少动画偏好、禁用 JavaScript 的回退内容。320、390、768 和 1440 像素宽度均未发现横向溢出，检查过程中没有 JavaScript 运行错误。本地预览截图保存在 `output/playwright/`。
