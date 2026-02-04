# GitHub Pages 部署说明

## 部署步骤

### 1. 确保代码已推送

代码已经推送到 GitHub 仓库。

### 2. 配置 GitHub Pages（重要！）

1. 访问：https://github.com/panskai/MicroGrid/settings/pages
2. 在 "Build and deployment" 部分：
   - **Source**: 选择 **GitHub Actions**
   - 如果看不到 "GitHub Actions" 选项，请确保：
     - 仓库是 Public（GitHub Pages 免费版需要 Public 仓库）
     - 或者升级到 GitHub Pro/Team/Enterprise
3. 点击 **Save** 保存设置

### 3. 触发部署

**方式一：自动部署（推荐）**
- 代码推送到 `main` 分支后，GitHub Actions 会自动运行
- 查看 Actions 状态：https://github.com/panskai/MicroGrid/actions
- 等待 workflow 完成（通常 2-5 分钟）
- 如果 workflow 失败，点击查看错误信息

**方式二：手动触发**
- 访问：https://github.com/panskai/MicroGrid/actions
- 点击左侧的 "Deploy to GitHub Pages" workflow
- 点击右上角的 "Run workflow" 按钮
- 选择分支：main
- 点击 "Run workflow"

### 4. 检查部署状态

1. 访问 Actions 页面：https://github.com/panskai/MicroGrid/actions
2. 查看最新的 workflow run
3. 确保所有步骤都是绿色的 ✓
4. 如果失败，点击查看错误详情

### 5. 访问网站

部署完成后，网站将在以下地址可用：
- **https://panskai.github.io/MicroGrid/**

⚠️ **注意**：首次部署可能需要 5-10 分钟才能生效。

## 常见问题

### 问题1：404 错误
- **原因**：GitHub Pages 未启用或配置错误
- **解决**：检查 Settings > Pages，确保 Source 设置为 "GitHub Actions"

### 问题2：Actions workflow 失败
- **原因**：可能是构建错误或权限问题
- **解决**：
  1. 检查 Actions 页面的错误信息
  2. 确保仓库是 Public
  3. 确保 workflow 文件 `.github/workflows/deploy.yml` 存在

### 问题3：图片不显示
- **原因**：路径问题
- **解决**：已配置 `base: '/MicroGrid/'`，应该可以正常工作

### 问题4：白屏
- **原因**：可能是 JavaScript 错误
- **解决**：
  1. 打开浏览器开发者工具（F12）
  2. 查看 Console 标签页的错误信息
  3. 检查 Network 标签页，确保所有资源都加载成功

## 本地测试

在推送之前，可以本地测试构建：

```bash
npm run build
npm run preview
```

访问 http://localhost:4173/MicroGrid/ 查看效果。

## 手动部署（备选方案）

如果 GitHub Actions 不工作，可以使用 gh-pages：

```bash
npm install -g gh-pages
npm run deploy
```

## 更新网站

每次推送代码到 `main` 分支后，GitHub Actions 会自动重新部署网站。

## 检查清单

- [ ] 代码已推送到 GitHub
- [ ] GitHub Pages 设置中 Source 选择为 "GitHub Actions"
- [ ] Actions workflow 成功运行
- [ ] 等待 5-10 分钟让 DNS 生效
- [ ] 访问 https://panskai.github.io/MicroGrid/
