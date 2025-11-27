-- 农业病虫害识别微信小程序数据库表结构设计

-- 1. 用户表 (users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  open_id VARCHAR(100) UNIQUE NOT NULL,  -- 微信openid
  union_id VARCHAR(100),                 -- 微信unionid
  auth_uid UUID UNIQUE,                  -- 认证用户ID
  username VARCHAR(50) NOT NULL,         -- 用户名
  avatar_url VARCHAR(255),               -- 头像URL
  identity VARCHAR(50),                  -- 用户身份（如：农户、专家）
  location VARCHAR(100),                 -- 地区
  level INTEGER DEFAULT 1,               -- 用户等级
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 更新时间
  last_login_time TIMESTAMP              -- 最后登录时间
);

-- 2. 用户关注关系表 (user_follows)
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id),  -- 关注者ID
  followed_id UUID REFERENCES users(id),  -- 被关注者ID
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  UNIQUE(follower_id, followed_id)       -- 唯一约束，防止重复关注
);

-- 3. 论坛帖子表 (forum_posts)
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),      -- 作者ID
  title VARCHAR(100) NOT NULL,            -- 标题
  content TEXT NOT NULL,                  -- 内容
  category VARCHAR(50) NOT NULL,          -- 分类
  sub_category VARCHAR(50),               -- 子分类
  images JSONB DEFAULT '[]',              -- 图片URL数组
  likes_count INTEGER DEFAULT 0,          -- 点赞数
  comments_count INTEGER DEFAULT 0,       -- 评论数
  views_count INTEGER DEFAULT 0,          -- 浏览数
  hot_score FLOAT DEFAULT 0,              -- 热度分数
  is_top BOOLEAN DEFAULT FALSE,           -- 是否置顶
  status VARCHAR(20) DEFAULT 'published', -- 状态(published/draft/deleted)
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 更新时间
);

-- 4. 论坛评论表 (forum_comments)
CREATE TABLE forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id), -- 帖子ID
  user_id UUID REFERENCES users(id),       -- 评论者ID
  content TEXT NOT NULL,                   -- 评论内容
  reply_to VARCHAR(100),                   -- 回复对象（用户名或评论ID）
  likes_count INTEGER DEFAULT 0,           -- 点赞数
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 创建时间
);

-- 5. 帖子点赞表 (forum_likes)
CREATE TABLE forum_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id), -- 帖子ID
  user_id UUID REFERENCES users(id),       -- 用户ID
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  UNIQUE(post_id, user_id)                -- 唯一约束，防止重复点赞
);

-- 6. 评论点赞表 (comment_likes)
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES forum_comments(id), -- 评论ID
  user_id UUID REFERENCES users(id),            -- 用户ID
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  UNIQUE(comment_id, user_id)                 -- 唯一约束，防止重复点赞
);

-- 7. 帖子收藏表 (forum_collections)
CREATE TABLE forum_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id),  -- 帖子ID
  user_id UUID REFERENCES users(id),        -- 用户ID
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  UNIQUE(post_id, user_id)                 -- 唯一约束，防止重复收藏
);

-- 8. AI识别任务表 (ai_tasks) - 用于n8n处理流程
CREATE TABLE ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),        -- 用户ID
  file_id VARCHAR(255) NOT NULL,            -- Supabase Storage文件ID/路径
  file_url VARCHAR(500),                    -- 文件完整URL
  description TEXT,                         -- 用户描述（可选）
  status VARCHAR(20) DEFAULT 'pending',    -- 状态(pending/processing/completed/failed)
  result JSONB,                             -- 识别结果（JSON格式）
  error_message TEXT,                       -- 错误信息（如果失败）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 更新时间
  completed_at TIMESTAMP                     -- 完成时间
);

-- 8. 病虫害识别记录表 (identify_records)
CREATE TABLE identify_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),        -- 用户ID
  image_url VARCHAR(255) NOT NULL,          -- 图片URL
  result JSONB NOT NULL,                    -- 识别结果
  confidence FLOAT NOT NULL,                -- 置信度
  is_saved BOOLEAN DEFAULT FALSE,           -- 是否保存
  status VARCHAR(20) DEFAULT 'completed',   -- 状态(completed/failed)
  identified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 识别时间
);

-- 9. 病虫害信息表 (diseases)
CREATE TABLE diseases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,               -- 病虫害名称
  category VARCHAR(50) NOT NULL,            -- 分类
  description TEXT NOT NULL,                -- 描述
  symptoms TEXT NOT NULL,                   -- 症状
  control_methods TEXT NOT NULL,            -- 防治方法
  images JSONB DEFAULT '[]',                -- 图片URL数组
  identify_count INTEGER DEFAULT 0,         -- 识别次数
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 更新时间
);

-- 10. 知识分类表 (knowledge_categories)
CREATE TABLE knowledge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,                -- 分类名称
  icon VARCHAR(100),                        -- 分类图标
  sort_order INTEGER DEFAULT 0,             -- 排序顺序
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 创建时间
);

-- 11. 知识文章表 (knowledge_articles)
CREATE TABLE knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES knowledge_categories(id), -- 分类ID
  title VARCHAR(100) NOT NULL,              -- 标题
  summary VARCHAR(200),                     -- 摘要
  content TEXT NOT NULL,                    -- 内容
  cover_image VARCHAR(255),                 -- 封面图片
  author VARCHAR(50),                       -- 作者
  view_count INTEGER DEFAULT 0,             -- 浏览数
  like_count INTEGER DEFAULT 0,             -- 点赞数
  publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 发布时间
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP    -- 更新时间
);

-- 12. 用户收藏表 (user_favorites) - 用于收藏知识文章等
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),        -- 用户ID
  content_id UUID NOT NULL,                 -- 内容ID（文章ID等）
  type VARCHAR(20) NOT NULL,                -- 内容类型（knowledge等）
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  UNIQUE(user_id, content_id, type)         -- 唯一约束，防止重复收藏
);

-- 13. 通知表 (notifications)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),        -- 接收用户ID
  type VARCHAR(50) NOT NULL,                -- 通知类型
  title VARCHAR(100) NOT NULL,              -- 标题
  content TEXT NOT NULL,                    -- 内容
  related_id VARCHAR(100),                  -- 相关ID
  is_read BOOLEAN DEFAULT FALSE,            -- 是否已读
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 创建时间
);

-- 创建索引以提高查询性能
CREATE INDEX idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX idx_forum_posts_category ON forum_posts(category);
CREATE INDEX idx_forum_posts_hot_score ON forum_posts(hot_score DESC);
CREATE INDEX idx_forum_comments_post_id ON forum_comments(post_id);
CREATE INDEX idx_identify_records_user_id ON identify_records(user_id);
CREATE INDEX idx_knowledge_articles_category_id ON knowledge_articles(category_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_ai_tasks_user_id ON ai_tasks(user_id);
CREATE INDEX idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX idx_ai_tasks_created_at ON ai_tasks(created_at DESC);

-- 权限设置（Supabase特定）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE OR REPLACE POLICY "Users can update their own profile" ON users FOR UPDATE USING (id = auth.uid());

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE POLICY "Public can view published posts" ON forum_posts FOR SELECT USING (status = 'published');
CREATE OR REPLACE POLICY "Users can create posts" ON forum_posts FOR INSERT WITH CHECK (true);
CREATE OR REPLACE POLICY "Users can update their own posts" ON forum_posts FOR UPDATE USING (user_id = auth.uid());

ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE POLICY "Public can view comments" ON forum_comments FOR SELECT USING (true);
CREATE OR REPLACE POLICY "Users can create comments" ON forum_comments FOR INSERT WITH CHECK (true);
CREATE OR REPLACE POLICY "Users can update their own comments" ON forum_comments FOR UPDATE USING (user_id = auth.uid());

ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;
-- 注意：user_id 引用的是 users.id (UUID)，需要通过 users.auth_uid 关联 auth.uid()
CREATE OR REPLACE POLICY "Users can view their own tasks" 
ON ai_tasks FOR SELECT 
USING (user_id IN (SELECT id FROM users WHERE auth_uid = auth.uid()));

CREATE OR REPLACE POLICY "Users can create tasks" 
ON ai_tasks FOR INSERT 
WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_uid = auth.uid()));

CREATE OR REPLACE POLICY "Users can update their own tasks" 
ON ai_tasks FOR UPDATE 
USING (user_id IN (SELECT id FROM users WHERE auth_uid = auth.uid()));
