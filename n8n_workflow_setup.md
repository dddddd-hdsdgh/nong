# n8n 工作流配置步骤

## 快速开始

### 1. 导入工作流

1. 打开 n8n（通常是 http://localhost:5678）
2. 点击左侧菜单的 **Workflows**
3. 点击右上角的 **Import from File** 或 **Import from URL**
4. 选择 `n8n_workflow_ai_identify.json` 文件
5. 工作流会自动导入

### 2. 配置环境变量

在 n8n 中配置以下环境变量（Settings > Environment Variables）：

```bash
SUPABASE_URL=https://wetcvycrvmzzzerqmtja.supabase.co
SUPABASE_ANON_KEY=你的匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥（重要！用于更新数据库）
AI_MODEL_API_URL=http://localhost:8000/predict  # 你的 AI 模型 API 地址
```

**如何获取 Service Role Key：**
1. 登录 Supabase Dashboard
2. 进入 **Settings** > **API**
3. 找到 **service_role** key（注意：这个 key 有完整权限，不要在前端使用）

### 3. 配置 Webhook URL

1. 在 n8n 工作流中，点击 **Webhook - 接收任务** 节点
2. 点击 **Listen for test event** 或直接保存工作流
3. 复制显示的 Webhook URL，格式类似：
   ```
   http://your-n8n-ip:5678/webhook/ai-task
   ```
   或
   ```
   https://your-n8n-domain.com/webhook/ai-task
   ```

### 4. 在 Supabase 中配置 Database Webhook

1. 登录 Supabase Dashboard
2. 进入 **Database** > **Webhooks**
3. 点击 **Create a new webhook**
4. 配置如下：
   - **Name**: `ai_task_webhook`
   - **Table**: `ai_tasks`
   - **Events**: 勾选 `INSERT`
   - **HTTP Request**:
     - **URL**: 粘贴你在步骤 3 中复制的 Webhook URL
     - **Method**: `POST`
     - **HTTP Headers**:
       ```
       Content-Type: application/json
       ```
5. 点击 **Save**

### 5. 激活工作流

1. 在 n8n 工作流编辑器中，点击右上角的 **Active** 开关
2. 工作流变为绿色表示已激活

## 工作流节点说明

### 1. Webhook - 接收任务
- 接收 Supabase 发送的 Webhook 请求
- 路径：`/webhook/ai-task`

### 2. 解析任务数据
- 解析 Supabase Webhook 数据
- 提取 `task_id`, `file_id`, `file_url` 等信息
- 验证任务状态是否为 `pending`

### 3. 下载图片
- 从 Supabase Storage 下载图片
- 使用 `file_url` 获取图片文件

### 4. AI 识别
- 调用 AI 模型进行识别
- 支持两种方案：
  - **方案 A**: 本地部署的 AI 模型（默认）
  - **方案 B**: 第三方服务（如 Replicate，需要取消注释代码）

### 5. 判断是否成功
- 根据 AI 识别结果判断是否成功
- 成功 → 更新任务为 `completed`
- 失败 → 更新任务为 `failed`

### 6. 更新任务 - 成功/失败
- 更新 Supabase 数据库中的任务状态
- 成功时写入识别结果
- 失败时写入错误信息

### 7. 返回响应
- 向 Supabase Webhook 返回响应

## AI 模型配置

### 方案 A: 本地 AI 模型

如果你的 AI 模型部署在本地（如 Flask/FastAPI），需要：

1. **确保模型 API 正常运行**
   ```bash
   # 示例：Flask API
   curl -X POST http://localhost:8000/predict \
     -H "Content-Type: application/json" \
     -d '{"image": "base64_encoded_image"}'
   ```

2. **API 返回格式示例**：
   ```json
   {
     "disease_name": "水稻稻瘟病",
     "confidence": 0.92,
     "description": "水稻稻瘟病是水稻最主要的病害之一...",
     "symptoms": "主要危害叶片、茎秆和穗部...",
     "control_methods": [
       "选择抗病品种",
       "合理密植",
       "及时喷施三环唑等药剂"
     ]
   }
   ```

3. **设置环境变量**：
   ```bash
   AI_MODEL_API_URL=http://localhost:8000/predict
   ```

### 方案 B: 使用 Replicate（第三方服务）

1. **注册 Replicate 账号**：https://replicate.com
2. **获取 API Token**：Settings > API tokens
3. **设置环境变量**：
   ```bash
   REPLICATE_API_TOKEN=your-replicate-token
   ```
4. **修改工作流**：
   - 在 **AI 识别** 节点中，取消注释 Replicate 相关代码
   - 替换 `your-model-version-id` 为实际的模型版本 ID

### 方案 C: 使用 OpenAI Vision API

如果需要使用 OpenAI Vision API，可以修改 **AI 识别** 节点：

```javascript
const imageData = $input.item.binary.data;
const base64Image = imageData.toString('base64');
const taskData = $('解析任务数据').item.json;

const openaiApiKey = $env.OPENAI_API_KEY;
if (!openaiApiKey) {
  throw new Error('未配置 OPENAI_API_KEY');
}

const response = await $http.request({
  method: 'POST',
  url: 'https://api.openai.com/v1/chat/completions',
  headers: {
    'Authorization': `Bearer ${openaiApiKey}`,
    'Content-Type': 'application/json'
  },
  body: {
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '请识别这张图片中的农作物病虫害，返回 JSON 格式：{"diseaseName": "名称", "confidence": 0.9, "description": "描述", "controlMethods": ["方法1", "方法2"]}'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 500
  }
});

// 解析 OpenAI 返回的 JSON
const resultText = response.choices[0].message.content;
const result = JSON.parse(resultText);

return {
  json: {
    task_id: taskData.task_id,
    result: {
      diseaseName: result.diseaseName,
      confidence: result.confidence,
      description: result.description,
      controlMethods: result.controlMethods
    },
    success: true
  }
};
```

## 测试工作流

### 1. 测试 Webhook

1. 在 n8n 中点击 **Webhook - 接收任务** 节点
2. 点击 **Listen for test event**
3. 使用 curl 或 Postman 发送测试请求：
   ```bash
   curl -X POST http://localhost:5678/webhook/ai-task \
     -H "Content-Type: application/json" \
     -d '{
       "type": "INSERT",
       "table": "ai_tasks",
       "record": {
         "id": "test-task-id",
         "user_id": "test-user-id",
         "file_id": "test-file-id",
         "file_url": "https://example.com/image.jpg",
         "status": "pending"
       }
     }'
   ```

### 2. 测试完整流程

1. 在小程序中上传一张图片
2. 检查 Supabase `ai_tasks` 表是否有新任务
3. 检查 n8n 工作流是否被触发
4. 查看 n8n 执行日志，确认每个节点是否正常执行
5. 检查任务状态是否更新为 `completed` 或 `failed`

## 故障排查

### Webhook 未触发

1. **检查 Supabase Webhook 配置**
   - 确认 URL 正确
   - 确认事件类型为 `INSERT`
   - 检查 Supabase Webhook 日志

2. **检查 n8n Webhook**
   - 确认工作流已激活
   - 确认 Webhook 路径正确
   - 检查 n8n 是否可以从外网访问（如果 Supabase 在云端）

3. **网络问题**
   - 如果 n8n 在本地，Supabase 无法访问，需要使用内网穿透（如 ngrok）
   - 或使用定时轮询方案替代 Webhook

### 图片下载失败

1. 检查 `file_url` 是否正确
2. 检查 Supabase Storage 权限
3. 检查网络连接

### AI 识别失败

1. **本地模型**：
   - 检查模型 API 是否运行
   - 检查 API 地址是否正确
   - 查看模型 API 日志

2. **第三方服务**：
   - 检查 API Token 是否正确
   - 检查账户余额/配额
   - 查看服务商文档

### 数据库更新失败

1. 检查 Service Role Key 是否正确
2. 检查 RLS 策略是否允许更新
3. 检查任务 ID 是否存在

## 性能优化

1. **并发处理**：如果任务量大，可以：
   - 使用 n8n 的队列功能
   - 限制并发数（避免过载）
   - 使用 Redis 队列

2. **错误重试**：添加重试逻辑，处理临时失败

3. **日志记录**：记录详细的执行日志，便于排查问题

## 下一步

配置完成后：
1. 在小程序中上传图片
2. n8n 自动处理任务
3. 小程序轮询任务状态，显示识别结果

