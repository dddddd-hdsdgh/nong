# n8n 配置指南 - AI 识别任务处理

## 概述

配置本地 n8n 来处理 Supabase 中的 AI 识别任务：
1. 监听新任务（status='pending'）
2. 从 Supabase Storage 下载图片
3. 调用 AI 模型进行识别
4. 将结果写回数据库

## 前置条件

1. ✅ 图片已成功上传到 Supabase Storage
2. ✅ 任务已创建到 `ai_tasks` 表（status='pending'）
3. ✅ 本地已部署 n8n（Docker 或直接安装）

## 方案一：使用 Supabase Database Webhook（推荐）

### 1. 在 Supabase 中配置 Database Webhook

1. 登录 Supabase Dashboard
2. 进入 **Database** > **Webhooks**
3. 创建新的 Webhook：
   - **Name**: `ai_task_webhook`
   - **Table**: `ai_tasks`
   - **Events**: `INSERT`（当有新任务创建时触发）
   - **HTTP Request**:
     - **URL**: `http://your-n8n-ip:5678/webhook/ai-task`（你的 n8n Webhook URL）
     - **Method**: `POST`
     - **Headers**: 
       ```
       Content-Type: application/json
       ```

### 2. 在 n8n 中创建 Webhook 节点

1. 打开 n8n 工作流编辑器
2. 添加 **Webhook** 节点：
   - **HTTP Method**: `POST`
   - **Path**: `ai-task`
   - **Response Mode**: `Response Node`
3. 保存后复制 Webhook URL，更新到 Supabase Webhook 配置中

## 方案二：使用定时任务轮询（备选）

如果无法使用 Webhook，可以使用定时任务：

1. 添加 **Cron** 节点（每 30 秒执行一次）
2. 添加 **HTTP Request** 节点查询 `pending` 状态的任务：
   ```
   GET https://wetcvycrvmzzzerqmtja.supabase.co/rest/v1/ai_tasks?status=eq.pending&order=created_at.asc&limit=1
   Headers:
     apikey: your-anon-key
     Authorization: Bearer your-service-role-key
   ```

## n8n 工作流配置

### 完整工作流步骤

```
1. Webhook (接收 Supabase 事件)
   ↓
2. Function (解析事件数据，提取 task_id, file_id, file_url)
   ↓
3. HTTP Request (从 Supabase Storage 下载图片)
   ↓
4. Function (调用 AI 模型 - 可以是本地模型或第三方 API)
   ↓
5. HTTP Request (更新任务状态和结果到 Supabase)
```

### 详细配置

#### 步骤 1: Webhook 节点

```json
{
  "httpMethod": "POST",
  "path": "ai-task",
  "responseMode": "responseNode"
}
```

#### 步骤 2: Function 节点 - 解析数据

```javascript
// 解析 Supabase Webhook 数据
const webhookData = $input.item.json;

// Supabase Webhook 格式可能是：
// { type: 'INSERT', table: 'ai_tasks', record: {...}, old_record: null }
const task = webhookData.record || webhookData;

return {
  json: {
    task_id: task.id,
    user_id: task.user_id,
    file_id: task.file_id,
    file_url: task.file_url,
    description: task.description
  }
};
```

#### 步骤 3: HTTP Request - 下载图片

```javascript
// 从 Supabase Storage 下载图片
// URL: {{ $json.file_url }}
// Method: GET
// Headers:
//   apikey: your-anon-key
//   Authorization: Bearer your-service-role-key
```

#### 步骤 4: Function 节点 - AI 识别

根据你使用的 AI 模型选择：

**选项 A: 调用本地模型（如本地部署的 YOLO/ResNet）**
```javascript
// 假设本地模型 API 在 http://localhost:8000/predict
const imageData = $input.item.binary.data;
const base64Image = imageData.toString('base64');

// 调用本地 AI 模型
const response = await $http.request({
  method: 'POST',
  url: 'http://localhost:8000/predict',
  headers: {
    'Content-Type': 'application/json'
  },
  body: {
    image: base64Image
  }
});

return {
  json: {
    task_id: $('Function').item.json.task_id,
    result: {
      diseaseName: response.disease_name,
      confidence: response.confidence,
      description: response.description,
      controlMethods: response.control_methods
    }
  }
};
```

**选项 B: 调用第三方 AI 服务（如 OpenAI Vision, Replicate）**
```javascript
// 示例：使用 Replicate API
const imageData = $input.item.binary.data;
const base64Image = imageData.toString('base64');

const response = await $http.request({
  method: 'POST',
  url: 'https://api.replicate.com/v1/predictions',
  headers: {
    'Authorization': 'Token your-replicate-token',
    'Content-Type': 'application/json'
  },
  body: {
    version: 'your-model-version',
    input: {
      image: `data:image/jpeg;base64,${base64Image}`
    }
  }
});

// 等待预测完成（可能需要轮询）
// ... 处理响应

return {
  json: {
    task_id: $('Function').item.json.task_id,
    result: {
      // 解析 AI 返回的结果
      diseaseName: response.output.disease_name,
      confidence: response.output.confidence,
      // ...
    }
  }
};
```

#### 步骤 5: HTTP Request - 更新任务结果

```javascript
// 更新任务状态和结果
// Method: PATCH
// URL: https://wetcvycrvmzzzerqmtja.supabase.co/rest/v1/ai_tasks?id=eq.{{ $json.task_id }}
// Headers:
//   apikey: your-service-role-key
//   Authorization: Bearer your-service-role-key
//   Prefer: return=representation
// Body:
{
  "status": "completed",
  "result": {{ $json.result }},
  "completed_at": "{{ $now.toISO() }}"
}
```

#### 步骤 6: 错误处理

添加 **IF** 节点检查 AI 识别是否成功，如果失败：

```javascript
// 更新任务状态为 failed
// Method: PATCH
// URL: https://wetcvycrvmzzzerqmtja.supabase.co/rest/v1/ai_tasks?id=eq.{{ $json.task_id }}
// Body:
{
  "status": "failed",
  "error_message": "{{ $json.error }}"
}
```

## 环境变量配置

在 n8n 中配置以下环境变量（Settings > Environment Variables）：

```
SUPABASE_URL=https://wetcvycrvmzzzerqmtja.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
AI_MODEL_API_URL=http://localhost:8000/predict  # 如果使用本地模型
```

## 测试步骤

1. **测试 Webhook**：
   - 在 Supabase 中手动插入一条测试任务
   - 检查 n8n 是否收到 Webhook 请求

2. **测试图片下载**：
   - 检查是否能成功从 Supabase Storage 下载图片

3. **测试 AI 识别**：
   - 确保 AI 模型 API 正常工作
   - 测试识别结果格式

4. **测试结果更新**：
   - 检查任务状态是否正确更新为 `completed`
   - 检查结果是否正确写入 `result` 字段

## 注意事项

1. **Service Role Key**：更新数据库需要使用 Service Role Key，不要在前端使用
2. **错误处理**：确保所有错误都被捕获并更新任务状态
3. **并发处理**：如果任务量大，考虑使用队列（如 Redis）或限制并发数
4. **日志记录**：在 n8n 中启用执行日志，便于排查问题

## 下一步

配置完成后：
1. 在小程序中上传图片创建任务
2. n8n 自动处理任务
3. 小程序轮询任务状态，显示识别结果

## 故障排查

如果任务没有被处理：
1. 检查 n8n 工作流是否激活
2. 检查 Webhook URL 是否正确
3. 检查 Supabase Webhook 日志
4. 检查 n8n 执行日志

如果识别失败：
1. 检查 AI 模型 API 是否正常
2. 检查图片格式和大小
3. 检查错误日志

