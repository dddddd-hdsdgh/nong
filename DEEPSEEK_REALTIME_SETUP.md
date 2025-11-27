# DeepSeek + n8n 云端实时识别配置指南

## 概述

使用 n8n 云端版本 + DeepSeek AI Agent 实现实时病虫害识别：
- ✅ **实时返回**：拍照后立即调用 n8n Webhook，等待识别结果
- ✅ **自动保存历史**：识别结果自动保存到 `identify_records` 表
- ✅ **使用 DeepSeek**：通过 n8n AI Agent 节点调用 DeepSeek API

## 完整流程

### 方案一：使用 Supabase Database Webhook（推荐）

```
小程序上传图片 → 创建任务到数据库
  ↓
Supabase Database Webhook 检测到新任务 → 自动触发 n8n Webhook
  ↓
n8n 接收请求 → 下载图片 → DeepSeek AI 识别
  ↓
解析结果 → 保存历史记录 → 更新任务状态
  ↓
小程序轮询或使用 Realtime 获取结果
```

### 方案二：小程序直接调用 n8n Webhook（实时返回）

```
小程序上传图片 → 创建任务 → 立即调用 n8n Webhook（同步等待）
  ↓
n8n 接收请求 → 下载图片 → DeepSeek AI 识别
  ↓
解析结果 → 保存历史记录 → 更新任务 → 返回结果
  ↓
小程序直接显示结果（无需轮询）
```

## 配置步骤

### 1. 获取 DeepSeek API Key

1. 访问 DeepSeek 官网：https://www.deepseek.com
2. 注册/登录账号
3. 进入 API 管理页面
4. 创建 API Key

### 2. 在 n8n 中配置 DeepSeek 凭证

1. 打开 n8n 云端版本
2. 进入 **Settings** > **Credentials**
3. 点击 **Add Credential**
4. 搜索 **DeepSeek API** 或 **OpenAI API**（DeepSeek 兼容 OpenAI 格式）
5. 填写：
   - **API Key**: 你的 DeepSeek API Key
   - **Base URL**: `https://api.deepseek.com`（如果使用 OpenAI 兼容格式）
   - **Name**: `DeepSeek API`
6. 点击 **Save**

### 3. 导入工作流

1. 在 n8n 中点击 **Workflows**
2. 点击 **Import from File**
3. 选择 `n8n_workflow_deepseek_realtime.json`
4. 工作流会自动导入

### 4. 配置环境变量

在 n8n Settings > Environment Variables 中添加：

```bash
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥
SUPABASE_ANON_KEY=你的匿名密钥
```

### 5. 配置环境变量（DeepSeek API Key）

在 n8n Settings > Environment Variables 中添加：

```bash
DEEPSEEK_API_KEY=你的 DeepSeek API Key
```

### 6. 配置 DeepSeek API 调用节点

工作流使用 **Code 节点**直接调用 DeepSeek API，无需额外配置。

**注意**：如果 DeepSeek 不支持图片输入，可能需要：
1. 使用支持图片的模型（如 GPT-4 Vision）
2. 或先将图片上传到图床，然后传递 URL

### 7. 获取 Webhook URL

1. 点击 **Webhook - 接收识别请求** 节点
2. 保存工作流
3. 复制显示的 Webhook URL，格式类似：
   ```
   https://your-instance.app.n8n.cloud/webhook/ai-identify
   ```

### 8. 配置小程序代码

修改 `services/aiIdentify.js` 中的 `callN8nWebhook` 函数，替换 Webhook URL：

```javascript
// 在 callN8nWebhook 函数中
const n8nWebhookUrl = 'https://your-instance.app.n8n.cloud/webhook/ai-identify';
```

### 9. 配置微信小程序域名

在微信小程序后台添加 n8n 域名到 **request 合法域名**：
```
https://your-instance.app.n8n.cloud
```

## 工作流节点说明

### 1. Webhook - 接收识别请求
- 接收小程序发送的识别请求
- 包含：`file_url`, `task_id`, `user_id`, `file_id`

### 2. 解析请求数据
- 解析请求参数
- 构建完整的图片 URL

### 3. 下载图片
- 从 Supabase Storage 下载图片
- 返回二进制数据

### 4. 准备图片数据
- 将图片转换为 base64
- 准备供 AI Agent 使用的数据

### 5. DeepSeek API 调用
- 使用 Code 节点直接调用 DeepSeek API
- 将图片转换为 base64 或使用图片 URL
- 调用 DeepSeek Chat Completions API

### 6. 解析AI结果
- 解析 AI 返回的 JSON
- 标准化结果格式

### 7. 保存历史记录
- 插入记录到 `identify_records` 表
- 包含完整的识别结果

### 8. 更新任务状态
- 更新 `ai_tasks` 表的状态和结果

### 9. 返回识别结果
- 向小程序返回识别结果
- 小程序可以直接显示

## DeepSeek API 配置

### API 端点

```
POST https://api.deepseek.com/v1/chat/completions
```

### 请求格式

```json
{
  "model": "deepseek-chat",
  "messages": [
    {
      "role": "system",
      "content": "你是一个专业的农业病虫害识别专家..."
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "请识别这张图片..."
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,..."  // 或图片 URL
          }
        }
      ]
    }
  ],
  "temperature": 0.3,
  "max_tokens": 1000
}
```

### 注意事项

1. **图片格式**：
   - DeepSeek 可能支持 base64 格式的图片
   - 或支持公开可访问的图片 URL
   - 需要查看 DeepSeek 文档确认支持的格式

2. **模型选择**：
   - `deepseek-chat`: 标准对话模型
   - `deepseek-v2`: 新版本模型（如果可用）
   - 需要确认模型是否支持图片输入

3. **如果不支持图片**：
   - 可以使用图片描述的方式
   - 或使用其他支持图片的 AI 服务（如 GPT-4 Vision）

## 两种方案对比

### 方案一：Supabase Database Webhook（推荐）

**优点**：
- 解耦：小程序不需要知道 n8n 的存在
- 自动触发：数据库插入后自动处理
- 更稳定：不依赖小程序网络

**流程**：
1. 小程序上传图片 → 创建任务到数据库
2. Supabase 自动触发 n8n Webhook
3. n8n 处理完成后更新数据库
4. 小程序轮询或使用 Realtime 获取结果

**小程序代码**：
```javascript
// 只需要上传和创建任务，不需要调用 n8n
const result = await uploadAndCreateTask(filePath);
// 然后轮询任务状态或使用 Realtime
```

### 方案二：小程序直接调用 n8n Webhook（实时返回）

**优点**：
- 实时返回：立即得到识别结果
- 无需轮询：同步等待结果

**缺点**：
- 需要配置域名白名单
- 依赖小程序网络稳定性
- 超时时间限制

**流程**：
1. 小程序上传图片 → 创建任务
2. 小程序立即调用 n8n Webhook（同步等待）
3. n8n 处理并返回结果
4. 小程序直接显示结果

**小程序代码**：
已修改 `services/aiIdentify.js`，包含 `callN8nWebhook` 函数

## 历史记录保存

工作流会自动保存到 `identify_records` 表：

```sql
INSERT INTO identify_records (
  user_id,
  image_url,
  result,        -- JSONB: {diseaseName, confidence, description, symptoms, controlMethods}
  confidence,
  status
) VALUES (...);
```

## 实时返回机制

### 同步等待（当前实现）

```javascript
// 小程序调用
const result = await callN8nWebhook(fileUrl, taskId, userId, fileId);

// 等待 n8n 处理完成（通常 5-15 秒）
// 直接返回结果
if (result.success) {
  // 立即显示结果
  showResult(result.data);
}
```

### 超时处理

如果识别时间较长（>60秒），可以：
1. 设置合理的超时时间
2. 超时后提示用户稍后查看结果
3. 使用轮询作为备选方案

## 测试步骤

### 1. 测试 Webhook

```bash
curl -X POST https://your-instance.app.n8n.cloud/webhook/ai-identify \
  -H "Content-Type: application/json" \
  -d '{
    "file_url": "https://wetcvycrvmzzzerqmtja.supabase.co/storage/v1/object/public/ai-images/test.jpg",
    "task_id": "test-task-id",
    "user_id": "test-user-id",
    "file_id": "test-file-id"
  }'
```

### 2. 测试完整流程

1. 在小程序中上传图片
2. 观察是否立即调用 n8n Webhook
3. 等待识别结果（通常 5-15 秒）
4. 检查是否直接显示结果
5. 检查历史记录是否保存

## 故障排查

### DeepSeek API 调用失败

1. **检查 API Key**：
   - 确认 API Key 正确
   - 检查账户余额/配额

2. **检查凭证配置**：
   - 确认在 n8n 中正确配置了 DeepSeek 凭证
   - 如果使用 OpenAI 兼容格式，确认 Base URL 正确

3. **检查模型名称**：
   - DeepSeek 模型名称可能是 `deepseek-chat` 或 `deepseek-v2`
   - 查看 DeepSeek 文档确认

### 图片无法识别

1. **检查图片 URL**：
   - 确认图片可公开访问
   - 在浏览器中测试 URL

2. **检查 AI Agent 配置**：
   - 确认 Prompt 中包含图片 URL
   - DeepSeek 可能需要特定的图片格式

### 结果格式不正确

1. **检查 Prompt**：
   - 确保 Prompt 明确要求 JSON 格式
   - 可以调整 Prompt 让输出更规范

2. **检查解析逻辑**：
   - 查看 "解析AI结果" 节点的日志
   - 可能需要调整 JSON 提取逻辑

## 性能优化

1. **超时设置**：
   - 小程序中设置 60 秒超时
   - 如果超时，提示用户稍后查看

2. **错误处理**：
   - 如果识别失败，任务状态保持为 `pending`
   - 可以后续轮询或重试

3. **缓存结果**：
   - 对于相同图片，可以缓存识别结果

## 注意事项

1. **n8n Webhook URL**：需要在代码中配置实际的 URL
2. **域名白名单**：需要在微信小程序后台添加 n8n 域名
3. **超时处理**：AI 识别可能需要 5-15 秒，需要设置合理的超时
4. **错误处理**：如果识别失败，应该提示用户并允许重试

## 下一步

配置完成后：
1. 在小程序中上传图片
2. 立即调用 n8n Webhook
3. 等待识别结果（5-15秒）
4. 直接显示结果
5. 结果自动保存到历史记录

