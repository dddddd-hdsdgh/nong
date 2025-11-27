# Supabase Database Webhook 配置指南

## 概述

使用 Supabase Database Webhook 自动触发 n8n 工作流，实现任务创建后自动处理。

## 配置步骤

### 1. 在 n8n 中获取 Webhook URL

1. 打开 n8n 云端版本
2. 打开你的工作流（`n8n_workflow_deepseek_realtime.json`）
3. 点击 **Webhook - 接收识别请求** 节点
4. 保存工作流
5. 复制显示的 Webhook URL，格式类似：
   ```
   https://your-instance.app.n8n.cloud/webhook/ai-identify
   ```

### 2. 在 Supabase 中配置 Database Webhook

1. **登录 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 选择你的项目

2. **进入 Webhooks 页面**
   - 左侧菜单：**Database** > **Webhooks**
   - 或直接访问：**Database** > **Webhooks**

3. **创建新的 Webhook**
   - 点击 **Create a new webhook** 或 **New Webhook**

4. **配置 Webhook**
   - **Name**: `ai_task_webhook`（自定义名称）
   - **Table**: 选择 `ai_tasks`
   - **Events**: 勾选 `INSERT`（当插入新记录时触发）
   - **HTTP Request**:
     - **URL**: 粘贴你在步骤 1 中复制的 n8n Webhook URL
     - **Method**: `POST`
     - **HTTP Headers**:
       ```
       Content-Type: application/json
       ```

5. **保存配置**
   - 点击 **Save** 或 **Create Webhook**

### 3. 测试 Webhook

#### 方法一：手动插入测试数据

在 Supabase SQL Editor 中执行：

```sql
INSERT INTO ai_tasks (
  user_id,
  file_id,
  file_url,
  status
) VALUES (
  'your-user-id',
  'test-file-id',
  'https://example.com/test.jpg',
  'pending'
);
```

然后检查：
1. n8n 工作流是否被触发
2. n8n 执行日志是否正常
3. 任务状态是否更新

#### 方法二：在小程序中测试

1. 在小程序中上传一张图片
2. 检查 Supabase Webhooks 页面中的 **Recent Deliveries**（最近交付）
3. 查看是否有成功的请求
4. 检查 n8n 工作流执行日志

### 4. 查看 Webhook 日志

在 Supabase Dashboard 中：
1. 进入 **Database** > **Webhooks**
2. 点击你创建的 Webhook
3. 查看 **Recent Deliveries** 标签
4. 可以看到每次触发的状态和响应

## Webhook 数据格式

Supabase Database Webhook 会发送以下格式的数据：

```json
{
  "type": "INSERT",
  "table": "ai_tasks",
  "record": {
    "id": "86ae85fc-9618-4ae6-8b37-432227b6b491",
    "user_id": "0b0d1845-8afc-4e39-81e7-267657348c9d",
    "file_id": "ai-images/identify/2025/11/1764204318550_dt4lubizo5c.jpg",
    "file_url": "https://wetcvycrvmzzzerqmtja.supabase.co/storage/v1/object/public/ai-images/identify/2025/11/1764204318550_dt4lubizo5c.jpg",
    "description": null,
    "status": "pending",
    "result": null,
    "error_message": null,
    "created_at": "2025-01-21T12:00:00Z",
    "updated_at": "2025-01-21T12:00:00Z",
    "completed_at": null
  },
  "old_record": null
}
```

## n8n 工作流解析

工作流中的 **解析请求数据** 节点已经支持两种格式：
1. Supabase Webhook 格式（`webhookData.record`）
2. 小程序直接调用格式（`webhookData.file_url`）

会自动识别并解析。

## 故障排查

### Webhook 未触发

1. **检查 Supabase Webhook 配置**：
   - 确认 Table 选择为 `ai_tasks`
   - 确认 Events 包含 `INSERT`
   - 确认 URL 正确

2. **检查 n8n Webhook**：
   - 确认工作流已激活
   - 确认 Webhook 路径正确
   - 测试 Webhook URL 是否可访问

3. **查看 Supabase Webhook 日志**：
   - 在 Webhooks 页面查看 Recent Deliveries
   - 检查是否有错误信息

### Webhook 触发但 n8n 未处理

1. **检查 n8n 执行日志**：
   - 在 n8n 中查看工作流执行历史
   - 检查是否有错误

2. **检查数据格式**：
   - 确认 n8n 能正确解析 Supabase Webhook 数据
   - 查看 "解析请求数据" 节点的输出

3. **检查任务状态过滤**：
   - 工作流会跳过非 `pending` 状态的任务
   - 确认新创建的任务状态为 `pending`

## 优势

使用 Supabase Database Webhook 的优势：

1. **自动触发**：无需小程序主动调用
2. **解耦**：小程序不需要知道 n8n 的存在
3. **可靠**：Supabase 保证 Webhook 的可靠性
4. **无需域名配置**：小程序不需要配置 n8n 域名

## 工作流程

```
1. 小程序上传图片 → 创建任务（status='pending'）
   ↓
2. Supabase 检测到新记录 → 自动触发 Webhook
   ↓
3. n8n 接收 Webhook → 解析数据 → 处理图片
   ↓
4. n8n 更新任务状态（status='completed'）
   ↓
5. 小程序轮询或使用 Realtime 获取结果
```

## 小程序轮询（可选）

如果使用 Supabase Webhook，小程序可以轮询任务状态：

```javascript
// 在 pages/identify/index.js 中
startPolling: function(taskId) {
  const timer = setInterval(async () => {
    const result = await aiIdentify.getTaskStatus(taskId);
    if (result.success && result.data.status === 'completed') {
      clearInterval(timer);
      this.displayTaskResult(result.data);
    }
  }, 3000);
}
```

或使用 Supabase Realtime 监听任务更新（更高效）。


