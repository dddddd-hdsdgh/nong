# Supabase Storage 到 n8n 处理流程详解

## 完整数据流

```
小程序上传图片 
  ↓
Supabase Storage (存储图片文件)
  ↓
创建任务记录 (ai_tasks 表，包含 file_id 和 file_url)
  ↓
n8n 查询待处理任务
  ↓
n8n 使用 file_url 从 Storage 下载图片
  ↓
n8n 调用 AI 模型处理图片
  ↓
n8n 更新任务结果到数据库
```

## 详细步骤解析

### 步骤 1: 小程序上传图片到 Supabase Storage

**代码位置**: `services/aiIdentify.js` → `uploadImageToStorage()`

**流程**:
1. 用户在小程序中选择图片
2. 调用 `wx.uploadFile()` 上传到 Supabase Storage
3. 上传 URL: `https://wetcvycrvmzzzerqmtja.supabase.co/storage/v1/object/ai-images/{file_path}`

**关键代码**:
```javascript
wx.uploadFile({
  url: `${supabase.url}/storage/v1/object/${bucket}/${filePathInBucket}`,
  filePath: filePath,
  name: 'file',
  header: {
    'Authorization': `Bearer ${token}`,
    'apikey': supabase.anonKey,
    'x-upsert': 'true'
  }
})
```

**上传后的返回**:
```json
{
  "Key": "ai-images/identify/2025/11/1764204318550_dt4lubizo5c.jpg",
  "Id": "86ae85fc-9618-4ae6-8b37-432227b6b491"
}
```

**存储位置**:
- **Bucket**: `ai-images`
- **文件路径**: `identify/2025/11/1764204318550_dt4lubizo5c.jpg`
- **完整 Key**: `ai-images/identify/2025/11/1764204318550_dt4lubizo5c.jpg`

### 步骤 2: 创建任务记录到数据库

**代码位置**: `services/aiIdentify.js` → `createAITask()`

**流程**:
1. 使用上传返回的 `Key` 作为 `file_id`
2. 构建公开访问的 `file_url`
3. 插入记录到 `ai_tasks` 表

**关键代码**:
```javascript
const taskData = {
  user_id: userDbId,
  file_id: "ai-images/identify/2025/11/1764204318550_dt4lubizo5c.jpg",  // 使用上传返回的 Key
  file_url: "https://wetcvycrvmzzzerqmtja.supabase.co/storage/v1/object/public/ai-images/identify/2025/11/1764204318550_dt4lubizo5c.jpg",
  status: 'pending'
};

await db.insert('ai_tasks', taskData);
```

**数据库记录**:
```sql
INSERT INTO ai_tasks (
  user_id,
  file_id,  -- "ai-images/identify/2025/11/1764204318550_dt4lubizo5c.jpg"
  file_url, -- "https://wetcvycrvmzzzerqmtja.supabase.co/storage/v1/object/public/ai-images/..."
  status    -- "pending"
) VALUES (...);
```

### 步骤 3: n8n 查询待处理任务

**工作流节点**: "查询待处理任务"

**流程**:
1. n8n 定时（每30秒）或通过 Webhook 触发
2. 查询 `ai_tasks` 表中 `status='pending'` 的任务
3. 获取任务的 `file_id` 和 `file_url`

**HTTP 请求**:
```
GET https://wetcvycrvmzzzerqmtja.supabase.co/rest/v1/ai_tasks?status=eq.pending&order=created_at.asc&limit=1

Headers:
  apikey: your-anon-key
  Authorization: Bearer your-service-role-key
```

**返回数据**:
```json
[
  {
    "id": "task-uuid",
    "user_id": "user-uuid",
    "file_id": "ai-images/identify/2025/11/1764204318550_dt4lubizo5c.jpg",
    "file_url": "https://wetcvycrvmzzzerqmtja.supabase.co/storage/v1/object/public/ai-images/identify/2025/11/1764204318550_dt4lubizo5c.jpg",
    "status": "pending"
  }
]
```

### 步骤 4: n8n 从 Storage 下载图片

**工作流节点**: "下载图片"

**关键点**: 使用 `file_url` 从 Supabase Storage 下载图片

**HTTP 请求**:
```
GET https://wetcvycrvmzzzerqmtja.supabase.co/storage/v1/object/public/ai-images/identify/2025/11/1764204318550_dt4lubizo5c.jpg

Headers:
  apikey: your-anon-key
```

**URL 结构解析**:
```
https://wetcvycrvmzzzerqmtja.supabase.co
  /storage/v1/object/public/          ← Storage API 公开访问端点
  ai-images/                          ← Bucket 名称
  identify/2025/11/1764204318550_dt4lubizo5c.jpg  ← 文件路径（去掉 bucket 前缀）
```

**注意**: 
- `file_id` 包含 bucket 前缀: `ai-images/identify/...`
- `file_url` 的路径部分需要去掉 bucket 前缀: `identify/...`
- 或者使用完整的 `file_url`（如果已正确构建）

**n8n 配置**:
```javascript
// HTTP Request 节点
Method: GET
URL: {{ $json.file_url }}  // 直接使用数据库中的 file_url
Headers:
  apikey: {{ $env.SUPABASE_ANON_KEY }}
Response Format: File (二进制文件)
```

**返回结果**:
- n8n 会以二进制格式接收图片
- 可以在下一个节点中访问 `$input.item.binary.data`

### 步骤 5: n8n 处理图片

**工作流节点**: "Coze AI 识别" 或 "AI 识别"

**流程**:
1. 获取下载的图片数据
2. 转换为 base64 或使用图片 URL
3. 调用 AI 模型（Coze/本地模型/其他服务）

**代码示例**:
```javascript
// 获取图片数据
const imageData = $input.item.binary.data;
const base64Image = imageData.toString('base64');

// 或者使用图片 URL（Coze 可能需要 URL 而不是 base64）
const imageUrl = $('解析任务数据').item.json.file_url;

// 调用 AI 模型
const response = await $http.request({
  method: 'POST',
  url: 'https://api.coze.cn/v1/chat',
  body: {
    bot_id: cozeBotId,
    messages: [{
      role: 'user',
      content: `请识别这张图片: ${imageUrl}`
    }]
  }
});
```

### 步骤 6: n8n 更新任务结果

**工作流节点**: "更新任务 - 成功/失败"

**流程**:
1. 将 AI 识别结果写入 `result` 字段（JSONB 格式）
2. 更新 `status` 为 `completed` 或 `failed`
3. 设置 `completed_at` 时间戳

**HTTP 请求**:
```
PATCH https://wetcvycrvmzzzerqmtja.supabase.co/rest/v1/ai_tasks?id=eq.{task_id}

Headers:
  apikey: your-service-role-key
  Authorization: Bearer your-service-role-key
  Prefer: return=representation
  Content-Type: application/json

Body:
{
  "status": "completed",
  "result": {
    "diseaseName": "水稻稻瘟病",
    "confidence": 0.92,
    "description": "...",
    "controlMethods": [...]
  },
  "completed_at": "2025-01-21T12:00:00Z"
}
```

## 关键连接点

### 1. file_id 和 file_url 的关系

```javascript
// 上传后返回
file_id = "ai-images/identify/2025/11/1764204318550_dt4lubizo5c.jpg"

// 构建 file_url（去掉 bucket 前缀）
file_url = `https://wetcvycrvmzzzerqmtja.supabase.co/storage/v1/object/public/ai-images/${file_id.replace('ai-images/', '')}`
// 结果: https://.../storage/v1/object/public/ai-images/identify/2025/11/1764204318550_dt4lubizo5c.jpg
```

### 2. Storage 公开访问 URL 格式

```
https://{project-ref}.supabase.co/storage/v1/object/public/{bucket}/{file_path}
```

- `public` 表示公开访问（不需要认证）
- `{bucket}` 是存储桶名称
- `{file_path}` 是文件在 bucket 内的路径（不包含 bucket 名称）

### 3. n8n 如何获取图片

**方式 A: 使用 file_url（推荐）**
- 直接使用数据库中存储的 `file_url`
- 简单直接，不需要额外处理

**方式 B: 使用 file_id 构建 URL**
```javascript
// 如果 file_id 包含 bucket 前缀
const filePath = file_id.startsWith('ai-images/') 
  ? file_id.substring('ai-images/'.length) 
  : file_id;

const fileUrl = `https://wetcvycrvmzzzerqmtja.supabase.co/storage/v1/object/public/ai-images/${filePath}`;
```

## 数据流转图

```
┌─────────────┐
│  小程序     │
│  选择图片   │
└─────┬───────┘
      │ wx.uploadFile()
      ↓
┌─────────────────────────────┐
│  Supabase Storage           │
│  Bucket: ai-images          │
│  Path: identify/2025/11/... │
│  返回: Key, Id              │
└─────┬───────────────────────┘
      │
      │ 创建任务记录
      ↓
┌─────────────────────────────┐
│  Supabase Database          │
│  Table: ai_tasks            │
│  - file_id: "ai-images/..." │
│  - file_url: "https://..."  │
│  - status: "pending"        │
└─────┬───────────────────────┘
      │
      │ n8n 查询 (GET /ai_tasks?status=eq.pending)
      ↓
┌─────────────────────────────┐
│  n8n 工作流                 │
│  1. 查询任务                │
│  2. 获取 file_url           │
│  3. 下载图片 (GET file_url) │
│  4. 调用 AI 模型            │
│  5. 更新结果                │
└─────┬───────────────────────┘
      │
      │ 更新数据库 (PATCH /ai_tasks)
      ↓
┌─────────────────────────────┐
│  Supabase Database          │
│  - status: "completed"      │
│  - result: {...}            │
│  - completed_at: timestamp  │
└─────────────────────────────┘
```

## 重要注意事项

### 1. Storage 权限配置

确保 Storage Bucket 设置为公开访问，或配置正确的访问策略：

```sql
-- 公开读取策略
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ai-images');
```

### 2. file_id 格式处理

- 上传返回的 `Key` 可能包含 bucket 前缀
- 构建 `file_url` 时需要去掉 bucket 前缀
- 或者统一使用完整路径

### 3. n8n 下载图片

- 使用 `file_url` 直接下载（最简单）
- 确保 URL 是公开可访问的
- 如果使用认证，需要添加正确的 Header

### 4. 错误处理

- 如果图片下载失败，更新任务状态为 `failed`
- 记录错误信息到 `error_message` 字段
- 小程序可以通过轮询获取错误信息

## 测试流程

1. **上传测试**:
   ```javascript
   // 在小程序中上传图片
   // 检查 Supabase Storage 中是否有文件
   // 检查 ai_tasks 表是否有新记录
   ```

2. **n8n 查询测试**:
   ```bash
   # 手动触发 n8n 工作流
   # 检查是否查询到 pending 任务
   ```

3. **下载测试**:
   ```bash
   # 在浏览器中访问 file_url
   # 确认图片可以正常显示
   ```

4. **完整流程测试**:
   ```bash
   # 上传图片 → 等待 n8n 处理 → 检查结果
   ```

## 常见问题

### Q: file_id 和 file_url 有什么区别？

A: 
- `file_id`: Storage 中的文件标识（可能包含 bucket 前缀）
- `file_url`: 公开访问的完整 URL，用于下载图片

### Q: 为什么 n8n 可以直接下载图片？

A: 因为 Storage Bucket 配置了公开访问策略，或者 `file_url` 使用了公开访问端点。

### Q: 如果图片是私有的怎么办？

A: 需要使用签名 URL 或添加认证 Header：
```javascript
// 生成签名 URL（需要 Service Role Key）
const signedUrl = await generateSignedUrl(bucket, filePath);
```

### Q: n8n 如何知道有新任务？

A: 两种方式：
1. **定时轮询**: 每30秒查询一次 `status='pending'` 的任务
2. **Webhook**: Supabase 在插入新记录时触发 n8n Webhook（需要内网穿透）


