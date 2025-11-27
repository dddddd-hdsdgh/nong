# AI识别功能配置说明

## 功能概述

已实现的功能：
1. ✅ 用户上传图片到 Supabase Storage
2. ✅ 创建 AI 识别任务记录到数据库
3. ✅ 任务状态查询和轮询
4. ✅ 识别结果展示

## 数据库设置

### 1. 创建 ai_tasks 表

在 Supabase SQL Editor 中执行 `database_schema.sql` 中的以下 SQL：

```sql
-- AI识别任务表
CREATE TABLE ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  file_id VARCHAR(255) NOT NULL,
  file_url VARCHAR(500),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_ai_tasks_user_id ON ai_tasks(user_id);
CREATE INDEX idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX idx_ai_tasks_created_at ON ai_tasks(created_at DESC);

-- 启用行级安全策略
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;

-- 方案1: 如果使用 Supabase Auth，需要通过 users 表关联 auth_uid
CREATE OR REPLACE POLICY "Users can view their own tasks" 
ON ai_tasks FOR SELECT 
USING (user_id IN (SELECT id FROM users WHERE auth_uid = auth.uid()));

CREATE OR REPLACE POLICY "Users can create tasks" 
ON ai_tasks FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_uid = auth.uid()));

CREATE OR REPLACE POLICY "Users can update their own tasks" 
ON ai_tasks FOR UPDATE 
USING (user_id IN (SELECT id FROM users WHERE auth_uid = auth.uid()));

-- 方案2: 如果未使用 Supabase Auth 或需要更宽松的权限，可以使用以下策略（不推荐用于生产环境）
-- CREATE OR REPLACE POLICY "Authenticated users can view tasks" ON ai_tasks FOR SELECT USING (true);
-- CREATE OR REPLACE POLICY "Authenticated users can create tasks" ON ai_tasks FOR INSERT WITH CHECK (true);
-- CREATE OR REPLACE POLICY "Users can update their own tasks" ON ai_tasks FOR UPDATE USING (true);
```

### 2. 创建 Storage Bucket

1. 登录 Supabase Dashboard
2. 进入 **Storage** 页面
3. 点击 **New bucket**
4. 创建名为 `ai-images` 的 bucket
5. 设置权限：
   - **Public bucket**: 可以设为 true（如果希望图片公开访问）
   - **File size limit**: 建议设置为 10MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/jpg`

### 3. 配置 Storage 权限

在 Supabase Dashboard 的 **Storage** > **Policies** 中，为 `ai-images` bucket 添加策略：

**上传策略（INSERT）**:
```sql
CREATE POLICY "Users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ai-images');
```

**读取策略（SELECT）**:
```sql
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ai-images');
```

## 使用流程

### 用户操作流程

1. 用户在首页点击"立即识别"
2. 选择"拍照识别"或"从相册选择"
3. 系统自动上传图片到 Supabase Storage
4. 创建任务记录（状态为 `pending`）
5. 跳转到识别页面，显示任务状态
6. 页面自动轮询任务状态（每3秒一次）
7. 当 n8n 处理完成后，更新任务状态为 `completed` 并写入结果
8. 页面显示识别结果

### n8n 集成流程（下一步）

1. 在 n8n 中创建 Webhook 节点，监听 Supabase 的 Database Webhook
2. 当 `ai_tasks` 表有新记录（status='pending'）时触发
3. n8n 从 Supabase Storage 下载图片
4. 调用 AI 模型进行识别
5. 将结果写回 `ai_tasks` 表，更新 `status='completed'` 和 `result` 字段

## 代码文件说明

- `services/aiIdentify.js`: AI识别服务，包含上传和任务创建功能
- `pages/home/index.js`: 首页，已集成上传和任务创建
- `pages/identify/index.js`: 识别结果页面，支持任务状态查询和轮询
- `database_schema.sql`: 数据库表结构定义

## 微信小程序域名配置（重要！）

### 问题
微信小程序要求所有网络请求的域名必须在后台配置的合法域名列表中。如果遇到 "url not in domain list" 错误，需要配置域名。

### 配置步骤

1. **登录微信公众平台**
   - 访问：https://mp.weixin.qq.com
   - 使用小程序账号登录

2. **进入开发管理**
   - 左侧菜单：**开发** > **开发管理** > **开发设置**

3. **配置服务器域名**
   - 找到 **服务器域名** 部分
   - 点击 **修改** 按钮

4. **添加 uploadFile 合法域名**
   - 在 **uploadFile 合法域名** 中添加：
     ```
     https://wetcvycrvmzzzerqmtja.supabase.co
     ```
   - 注意：只需要域名部分，不需要路径

5. **添加 request 合法域名**（如果还没有）
   - 在 **request 合法域名** 中添加：
     ```
     https://wetcvycrvmzzzerqmtja.supabase.co
     ```

6. **保存配置**
   - 点击 **保存** 按钮
   - 注意：每月最多可修改 5 次

### 开发环境临时方案

如果是在开发环境测试，可以在微信开发者工具中：
1. 点击右上角 **详情**
2. 勾选 **不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书**
3. 注意：此设置仅用于开发测试，正式版本必须配置合法域名

## 注意事项

1. **Storage Bucket 必须存在**: 确保在 Supabase 中创建了 `ai-images` bucket
2. **用户必须登录**: 上传功能需要用户登录状态
3. **文件大小限制**: 建议压缩图片后再上传
4. **域名白名单**: 必须在微信小程序后台配置 Supabase 域名
5. **任务状态**: 任务状态包括：
   - `pending`: 等待处理
   - `processing`: 处理中
   - `completed`: 已完成
   - `failed`: 失败

## 测试步骤

1. 确保用户已登录
2. 在首页点击"立即识别"
3. 选择一张图片
4. 观察上传进度和任务创建
5. 检查 Supabase Dashboard 中的 `ai_tasks` 表是否有新记录
6. 检查 Storage 中是否有上传的图片

## 下一步：n8n 集成

需要配置 n8n 来处理任务：
1. 设置 Supabase Database Webhook 或使用定时任务查询 `pending` 状态的任务
2. 下载图片并调用 AI 模型
3. 更新任务状态和结果

