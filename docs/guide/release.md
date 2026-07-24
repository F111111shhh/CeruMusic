# 发版指南

本仓库使用 `CHANGELOG.md` 维护发布说明，并通过 Git 标签触发 GitHub Actions。
应用内不包含自动更新功能，发布产物只上传到 GitHub Releases，由用户自行下载安装。

## 发布前检查

```bash
git status
yarn typecheck
yarn test
yarn build
yarn docs:build
```

确认工作树只包含本次发布内容，且没有日志、缓存、下载文件、私人插件或账号凭据。

## 选择版本号

版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)：

| 改动类型 | 版本位 |
| --- | --- |
| 向后兼容的新功能 | minor |
| 修复和小幅优化 | patch |
| 不兼容的接口或数据格式变化 | major |

## 更新版本与发布说明

1. 修改 `package.json` 中的 `version`。
2. 在 `CHANGELOG.md` 顶部加入对应的 `## [vX.Y.Z]` 版本块。
3. 在 `CHANGELOG.md` 底部加入该标签的链接引用。

发布说明应面向用户描述可观察的行为变化，避免只写提交术语或内部实现细节。

可在本地预览 GitHub Release 正文：

```bash
yarn release:preview vX.Y.Z
```

## 提交并发布

```bash
git add -A
git commit -m "release: vX.Y.Z"
git push origin main

git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

推送标签后，`.github/workflows/main.yml` 会：

1. 在 Windows、macOS Intel、macOS Apple Silicon 和 Linux 上分别构建。
2. 从 `CHANGELOG.md` 抽取当前标签对应的内容。
3. 创建或更新 GitHub Release，并上传各平台安装包与压缩包。

本仓库没有 Apple Developer 或 Windows 商业签名证书，因此自动构建的安装包是未签名版本。

## 验证发布

打开本仓库的 [Actions](https://github.com/F111111shhh/CeruMusic/actions) 和
[Releases](https://github.com/F111111shhh/CeruMusic/releases)，确认：

- 各平台构建任务完成，失败任务有明确日志。
- Release 正文与 `CHANGELOG.md` 对应版本一致。
- Windows 包含 `.exe` 和 `.zip`，macOS 包含 `.dmg` 和 `.zip`，Linux 包含配置的发行格式。
- Release 不包含 `latest*.yml`、`.blockmap` 或其他已移除自动更新功能的元数据。

## 补传失败平台

如果某个平台构建失败，修复后可运行 `Manual Build & Upload To Release` 工作流，指定已有标签和需要重建的平台。该工作流会覆盖同名产物，无需删除整个 Release。

如果标签尚未公开且发布内容本身有误，可以删除远端标签、修正提交后重新打标签；已经公开使用的标签不应移动，应改用新的补丁版本。
