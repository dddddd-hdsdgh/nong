# 农业病虫害识别微信小程序

这是一个基于微信小程序原生框架开发的农业病虫害识别系统，支持图像识别、知识库查询、论坛交流等功能。后端使用Supabase提供的数据库和存储服务。

## 项目结构

```
nong/
├── pages/            # 页面文件夹
│   ├── index/        # 首页
│   ├── identify/     # 病虫害识别页面
│   ├── forum/        # 论坛页面
│   └── knowledge/    # 知识库页面
├── services/         # 服务层
│   ├── supabase.js   # Supabase基础配置和API服务
│   ├── forum.js      # 论坛相关服务
│   ├── identify.js   # 病虫害识别服务
│   └── knowledge.js  # 知识库服务
├── static/           # 静态资源
└── app.js            # 小程序入口文件
```

## Supabase配置与使用

### 1. 创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com/) 注册账号
2. 创建新项目
3. 在项目设置中获取API密钥和项目URL

### 2. 配置环境变量

在`services/supabase.js`文件中配置您的Supabase项目信息：

```javascript
// services/supabase.js 中的配置部分
const supabaseConfig = {
  url: 'YOUR_SUPABASE_URL',
  anonKey: 'YOUR_SUPABASE_ANON_KEY',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY'
  }
}
```

### 3. 数据库表结构

项目需要在Supabase中创建以下数据表：

#### posts (论坛帖子)
- id: uuid (主键)
- title: text (标题)
- content: text (内容)
- author_id: uuid (作者ID)
- author_name: text (作者名称)
- author_avatar: text (作者头像)
- created_at: timestamp (创建时间)
- like_count: integer (点赞数)
- comment_count: integer (评论数)
- collect_count: integer (收藏数)

#### comments (评论)
- id: uuid (主键)
- post_id: uuid (帖子ID)
- user_id: uuid (用户ID)
- user_name: text (用户名)
- user_avatar: text (用户头像)
- content: text (评论内容)
- created_at: timestamp (创建时间)

#### identifications (识别记录)
- id: uuid (主键)
- user_id: uuid (用户ID)
- image_url: text (图片URL)
- result: jsonb (识别结果)
- confidence: float (置信度)
- created_at: timestamp (创建时间)

#### knowledge_categories (知识分类)
- id: uuid (主键)
- name: text (分类名称)
- icon: text (分类图标)

#### knowledge_items (知识条目)
- id: uuid (主键)
- category_id: uuid (分类ID)
- title: text (标题)
- content: text (内容)
- image_url: text (图片URL)
- views: integer (浏览量)
- created_at: timestamp (创建时间)

### 4. 使用Supabase服务

#### 数据库操作

```javascript
// 导入Supabase服务
const { supabase } = require('../services/supabase');

// 查询数据
const { data, error } = await supabase.db.select('*').from('table_name').eq('column', value);

// 插入数据
const { data, error } = await supabase.db.insert('table_name').values({ column1: value1, column2: value2 });

// 更新数据
const { data, error } = await supabase.db.update('table_name').set({ column: newValue }).eq('id', id);

// 删除数据
const { data, error } = await supabase.db.delete('table_name').eq('id', id);
```

#### 存储操作

```javascript
// 上传图片
const { data, error } = await supabase.storage.uploadFile('bucket_name', 'file_path', fileContent);

// 获取图片URL
const { data, error } = await supabase.storage.getPublicUrl('bucket_name', 'file_path');
```

### 5. 服务层使用示例

#### 论坛服务

```javascript
const { forumService } = require('../services/forum');

// 获取帖子列表
const posts = await forumService.getForumList(page, pageSize);

// 获取帖子详情
const postDetail = await forumService.getPostDetail(postId);

// 发布评论
await forumService.postComment(postId, content);
```

#### 识别服务

```javascript
const { identifyService } = require('../services/identify');

// 上传图片并识别
const result = await identifyService.identifyByImage(imageData);

// 获取历史记录
const history = await identifyService.getHistory(page, pageSize);
```

#### 知识库服务

```javascript
const { knowledgeService } = require('../services/knowledge');

// 获取分类
const categories = await knowledgeService.getCategories();

// 获取分类下的知识条目
const items = await knowledgeService.getKnowledgeList(categoryId, page, pageSize);

// 搜索知识
const searchResults = await knowledgeService.searchKnowledge(keyword);
```

### 6. 注意事项

1. 请确保在Supabase项目中正确配置了表结构和权限设置
2. 开发环境使用`anonKey`，生产环境应考虑使用更安全的认证方式
3. 上传的图片会存储在Supabase Storage中，请合理设置存储空间
4. 在小程序中使用时，需要在app.json中配置网络请求域名

## 开发指南

1. 克隆项目
2. 安装微信开发者工具
3. 导入项目并配置AppID
4. 配置Supabase信息（见上文）
5. 运行项目进行开发测试

## 许可证

MIT
