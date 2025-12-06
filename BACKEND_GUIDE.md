
# 财务管理员 (Finance Manager) 后端部署指南

本项目已升级为支持后端架构。目前的演示环境 (Demo) 使用的是浏览器本地存储。如果您想在生产环境中使用，请按照以下步骤启动后端服务器。

## 1. 启动后端服务器

1. 进入 `server` 目录：
   ```bash
   cd server
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 启动服务器：
   ```bash
   npm start
   ```
   
   服务器将运行在 `http://localhost:3001`。
   SQLite 数据库文件 `finance.db` 会自动生成。

   **默认管理员账号**：
   - 邮箱: `admin@company.com`
   - 密码: `admin123`

## 2. 前端对接

目前的 `services/storage.ts` 是本地存储适配器。要切换到后端模式：

1. 打开 `services/storage.ts`。
2. 找到 `useFinanceData` Hook。
3. 将内部的数据获取逻辑替换为 `services/api.ts` 中的 `apiClient` 方法。

例如：
```typescript
// useFinanceData
useEffect(() => {
  apiClient.getBootstrapData().then(serverData => {
     setData(serverData);
  });
}, []);
```

## 3. 数据库备份

由于使用 SQLite，备份非常简单。只需复制 `server/finance.db` 文件即可。
