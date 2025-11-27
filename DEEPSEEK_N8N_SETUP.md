# DeepSeek + n8n 云端配置指南

## 概述

使用 n8n 云端版本 + DeepSeek AI Agent 实现实时病虫害识别，拍照后直接返回结果并保存历史记录。

## 功能特点

- ✅ **实时处理**：使用 Webhook，拍照后立即处理
- ✅ **直接返回结果**：识别完成后立即返回，无需轮询
- ✅ **自动保存历史**：识别结果自动保存到 `identify_records` 表
- ✅ **使用 DeepSeek**：通过 n8n AI Agent 节点调用 DeepSeek API

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
4. 搜索并选择 **DeepSeek API**
5. 填写：
   - **API Key**: 你的 DeepSeek API Key
   - **Name**: `DeepSeek API`（自定义）
6. 点击 **Save**

### 3. 导入工作流

1. 在 n8n 中点击 **Workflows**
2. 点击 **Import from File**
3. 选择 `n8n_workflow_deepseek_ai.json`
4. 工作流会自动导入

### 4. 配置环境变量

在 n8n Settings > Environment Variables 中添加：

```bash
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥
SUPABASE_ANON_KEY=你的匿名密钥
```

### 5. 配置 AI Agent 节点

1. 在工作流中点击 **DeepSeek AI 识别** 节点
2. 在 **Credential** 下拉框中选择刚才创建的 DeepSeek 凭证
3. 确认 **Agent** 选择为 `deepseek-chat`
4. 可以自定义 **Prompt**（工作流中已包含默认提示词）

### 6. 获取 Webhook URL

1. 点击 **Webhook - 接收识别请求** 节点
2. 保存工作流
3. 复制显示的 Webhook URL，格式类似：
   ```
   https://your-n8n-instance.app.n8n.cloud/webhook/ai-identify
   ```

### 7. 修改小程序代码

修改 `services/aiIdentify.js`，在创建任务后立即调用 n8n Webhook：

```javascript
// 在 uploadAndCreateTask 函数中，创建任务后添加
const taskResult = await createAITask(...);

if (taskResult.success) {
  // 立即调用 n8n Webhook 进行识别
  const identifyResult = await callN8nWebhook(
    taskResult.data.file_url,
    taskResult.data.task_id,
    userInfo.user_db_id
  );
  
  // 如果识别成功，直接返回结果
  if (identifyResult.success) {
    return {
      success: true,
      data: {
        ...identifyResult,
        task_id: taskResult.data.task_id
      }
    };
  }
}
```

## 工作流流程

```
小程序上传图片 → 创建任务 → 调用 n8n Webhook
  ↓
n8n 接收请求 → 解析数据 → DeepSeek AI 识别
  ↓
解析结果 → 保存历史记录 → 更新任务状态 → 返回结果
  ↓
小程序直接显示结果
```

## 小程序代码修改

需要在 `services/aiIdentify.js` 中添加调用 n8n Webhook 的函数：

```javascript
/**
 * 调用 n8n Webhook 进行实时识别
 * @param {string} fileUrl - 图片 URL
 * @param {string} taskId - 任务 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 识别结果
 */
async function callN8nWebhook(fileUrl, taskId, userId) {
  try {
    const n8nWebhookUrl = 'https://your-n8n-instance.app.n8n.cloud/webhook/ai-identify';
    
    const response = await new Promise((resolve, reject) => {
      wx.request({
        url: n8nWebhookUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          file_url: fileUrl,
          task_id: taskId,
          user_id: userId
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`));
          }
        },
        fail: (err) => reject(err)
      });
    });
    
    return {
      success: response.success || false,
      data: response.result || null,
      task_id: response.task_id
    };
  } catch (error) {
    console.error('调用 n8n Webhook 失败:', error);
    return {
      success: false,
      error: error.message || '识别失败'
    };
  }
}
```

## DeepSeek AI Agent 配置说明

### Prompt 配置

工作流中已配置的 Prompt：

```
你是一个专业的农业病虫害识别专家。请仔细分析用户提供的图片，识别其中的农作物病虫害。

识别要求：
1. 识别病虫害的名称（中文）
2. 评估识别置信度（0-1之间的数值）
3. 提供详细的病虫害描述
4. 说明症状表现
5. 提供防治方法（数组格式，至少3条）

请严格按照以下 JSON 格式返回结果，不要添加任何其他文字：
{
  "diseaseName": "病虫害名称",
  "confidence": 0.9,
  "description": "详细描述",
  "symptoms": "症状表现",
  "controlMethods": ["防治方法1", "防治方法2", "防治方法3"]
}
```

### 系统消息

```
你是一个专业的农业病虫害识别专家，擅长识别各种农作物病虫害并提供专业的防治建议。
```

### 参数设置

- **Temperature**: 0.3（较低温度，确保输出更稳定）
- **Max Tokens**: 1000（足够返回完整结果）

## 历史记录保存

工作流会自动将识别结果保存到 `identify_records` 表：

```sql
INSERT INTO identify_records (
  user_id,
  image_url,
  result,        -- JSONB 格式的完整结果
  confidence,
  status
) VALUES (...);
```

## 实时返回结果

### 方式一：同步等待（推荐）

小程序调用 Webhook 后等待响应：

```javascript
// 在 uploadAndCreateTask 中
const identifyResult = await callN8nWebhook(fileUrl, taskId, userId);

if (identifyResult.success) {
  // 直接显示结果
  wx.showToast({
    title: '识别成功',
    icon: 'success'
  });
  
  // 跳转到结果页面
  wx.navigateTo({
    url: `/pages/identify/index?result=${encodeURIComponent(JSON.stringify(identifyResult.data))}`
  });
}
```

### 方式二：异步处理（备选）

如果识别时间较长，可以：
1. 调用 Webhook 后立即返回
2. 使用轮询查询任务状态
3. 或使用 Supabase Realtime 监听任务更新

## 测试步骤

### 1. 测试 Webhook

```bash
curl -X POST https://your-n8n-instance.app.n8n.cloud/webhook/ai-identify \
  -H "Content-Type: application/json" \
  -d '{
    "file_url": "https://wetcvycrvmzzzerqmtja.supabase.co/storage/v1/object/public/ai-images/test.jpg",
    "task_id": "test-task-id",
    "user_id": "test-user-id"
  }'
```

### 2. 测试完整流程

1. 在小程序中上传图片
2. 检查是否立即调用 n8n Webhook
3. 查看 n8n 执行日志
4. 检查识别结果是否正确返回
5. 检查历史记录是否保存

## 故障排查

### DeepSeek API 调用失败

1. **检查 API Key**：
   - 确认 API Key 正确
   - 确认 API Key 未过期
   - 检查账户余额

2. **检查凭证配置**：
   - 在 n8n 中确认 DeepSeek 凭证已正确配置
   - 测试凭证是否有效

3. **查看错误日志**：
   - 在 n8n 执行日志中查看详细错误
   - 检查 DeepSeek API 返回的错误信息

### 图片无法识别

1. **检查图片 URL**：
   - 确认图片 URL 可公开访问
   - 在浏览器中测试 URL

2. **检查 DeepSeek 支持**：
   - 确认 DeepSeek 模型支持图片输入
   - 可能需要使用特定的模型版本

### 结果格式不正确

1. **检查 Prompt**：
   - 确保 Prompt 明确要求 JSON 格式
   - 可以调整 Prompt 让输出更规范

2. **检查解析逻辑**：
   - 查看 "解析AI结果" 节点的代码
   - 可能需要调整 JSON 提取逻辑

## 性能优化

1. **超时设置**：
   - 如果识别时间较长，设置合理的超时时间
   - 考虑使用异步处理

2. **错误重试**：
   - 可以添加重试逻辑
   - 处理临时失败的情况

3. **缓存结果**：
   - 对于相同图片，可以缓存识别结果

## 下一步

配置完成后：
1. 在小程序中上传图片
2. 立即调用 n8n Webhook
3. 等待识别结果返回
4. 直接显示结果
5. 结果自动保存到历史记录


