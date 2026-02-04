# GitHub Pages 部署说明

## 部署步骤

### 1. 推送代码到 GitHub

```bash
git push -u origin main
```

### 2. 配置 GitHub Pages

1. 访问 https://github.com/panskai/MicroGrid/settings/pages
2. 在 "Source" 部分，选择：
   - Source: **GitHub Actions**
3. 保存设置

### 3. 触发部署

- 代码推送到 `main` 分支后，GitHub Actions 会自动构建和部署
- 或者手动触发：在 Actions 标签页点击 "Deploy to GitHub Pages" workflow，然后点击 "Run workflow"

### 4. 访问网站

部署完成后，网站将在以下地址可用：
- https://panskai.github.io/MicroGrid/

## 本地测试

在推送之前，可以本地测试构建：

```bash
npm run build
npm run preview
```

## 手动部署（使用 gh-pages）

如果不想使用 GitHub Actions，也可以使用 gh-pages：

```bash
npm run deploy
```

## 注意事项

- 确保 `vite.config.ts` 中的 `base: '/MicroGrid/'` 与仓库名称一致
- 首次部署可能需要几分钟时间
- 如果遇到 404 错误，检查 GitHub Pages 设置是否正确
