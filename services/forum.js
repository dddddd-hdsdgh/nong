// 论坛相关的服务接口
// 导入Supabase服务
const { db } = require('./supabase');
const app = getApp();
const USER_DB_ID_STORAGE_KEY = 'userDbId';
const USER_AUTH_COLUMN_CANDIDATES = ['auth_uid', 'auth_id'];

function getAppUserInfo() {
  try {
    if (app && typeof app.getUserInfo === 'function') {
      const info = app.getUserInfo();
      if (info) {
        return info;
      }
    }
  } catch (err) {
    console.warn('获取全局用户信息失败:', err);
  }

  const storageKey = app && app.STORAGE_KEYS ? app.STORAGE_KEYS.USER_INFO : 'userInfo';
  try {
    return wx.getStorageSync(storageKey) || wx.getStorageSync('userInfo');
  } catch (err) {
    console.warn('读取本地用户信息失败:', err);
    return null;
  }
}

function cacheUserDbId(id) {
  if (!id) return;
  try {
    if (app) {
      app.globalData.userDbId = id;
      if (app.globalData.userInfo) {
        app.globalData.userInfo = { ...app.globalData.userInfo, user_db_id: id };
      }
    }
    wx.setStorageSync(USER_DB_ID_STORAGE_KEY, id);
  } catch (err) {
    console.warn('缓存用户数据库ID失败:', err);
  }
}

function getCachedUserDbId() {
  if (app) {
    if (app.globalData.userDbId) {
      return app.globalData.userDbId;
    }
    if (app.globalData.userInfo && app.globalData.userInfo.user_db_id) {
      return app.globalData.userInfo.user_db_id;
    }
  }

  try {
    return wx.getStorageSync(USER_DB_ID_STORAGE_KEY);
  } catch (err) {
    console.warn('读取本地 userDbId 失败:', err);
    return null;
  }
}

function isMissingAuthColumnError(error, column) {
  const message = (error && error.message) || error?.toString?.() || '';
  return message.includes(`users.${column}`) && message.includes('does not exist');
}

async function resolveUserDbId(userInfo) {
  if (!userInfo || !userInfo.user_id) {
    return null;
  }

  const cachedId = getCachedUserDbId();
  if (cachedId) {
    return cachedId;
  }

  try {
    const queryMethod = typeof db.selectWithAuth === 'function' ? db.selectWithAuth : db.select;
    let lastError = null;

    for (const column of USER_AUTH_COLUMN_CANDIDATES) {
      const params = {};
      params[column] = userInfo.user_id;
      try {
        const users = await queryMethod('users', params);
        if (users && users.length > 0) {
          cacheUserDbId(users[0].id);
          return users[0].id;
        }
        // 用户不存在，继续尝试下一个候选列
        continue;
      } catch (error) {
        if (isMissingAuthColumnError(error, column)) {
          lastError = error;
          continue;
        }
        console.error('查询用户数据库ID失败:', error);
        throw error;
      }
    }

    if (lastError) {
      console.error('查询用户数据库ID失败:', lastError);
    }
  } catch (err) {
    console.error('查询用户数据库ID失败:', err);
  }

  return null;
}

// 格式化时间显示
const formatTime = (timestamp) => {
  if (!timestamp) {
    return '';
  }

  const postTime = new Date(timestamp);
  if (Number.isNaN(postTime.getTime())) {
    return '';
  }

  const now = new Date();
  const diffMs = now - postTime;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return diffMinutes + '分钟前';
  } else if (diffHours < 24) {
    return diffHours + '小时前';
  } else if (diffDays === 1) {
    return '昨天 ' + postTime.getHours().toString().padStart(2, '0') + ':' + postTime.getMinutes().toString().padStart(2, '0');
  } else {
    return (postTime.getMonth() + 1) + '-' + postTime.getDate() + ' ' + postTime.getHours().toString().padStart(2, '0') + ':' + postTime.getMinutes().toString().padStart(2, '0');
  }
};

// 论坛相关服务
const forumService = {
  // 获取论坛帖子列表
  async getForumList(params = {}) {
    try {
      const { page = 1, pageSize = 10, tab = 'recommend', category = '' } = params;
      
      // 构建查询参数
      const query = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: 'create_time.desc'
      };
      
      // 根据标签类型调整排序
      if (tab === 'hot') {
        query.order = 'hot_score.desc';
      }
      
      // 添加分类筛选
      if (category) {
        query.category = category;
      }
      
      // 从Supabase获取数据
      const posts = await db.select('forum_posts', query);

      const userIds = Array.from(new Set(posts.map(post => post.user_id).filter(Boolean)));
      let userMap = {};

      if (userIds.length > 0) {
        try {
          const users = await db.select('users', {
            id: `in.(${userIds.join(',')})`,
            select: 'id,username,avatar_url'
          });
          userMap = users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {});
        } catch (userError) {
          console.warn('获取用户信息失败，使用帖子内字段:', userError);
        }
      }
      
      // 格式化数据
      const formattedPosts = posts.map(post => {
        const preview =
          typeof post.content === 'string'
            ? post.content.length > 100
              ? post.content.substring(0, 100) + '...'
              : post.content
            : '';

        return {
        id: post.id,
        title: post.title,
        content: preview,
        username: userMap[post.user_id]?.username || post.username || '农友',
        avatar: userMap[post.user_id]?.avatar_url || post.avatar_url || '',
        time: formatTime(post.create_time || post.created_at),
        category: post.category,
        likes: Number(post.likes_count) || 0,
        comments: Number(post.comments_count) || 0,
        views: Number(post.views_count) || 0,
        images: post.images || []
      };
      });

      return {
        success: true,
        data: {
          list: formattedPosts,
          hasMore: formattedPosts.length === pageSize,
          total: (page - 1) * pageSize + formattedPosts.length
        }
      };
    } catch (error) {
      console.error('获取论坛列表失败:', error);
      return {
        success: false,
        message: '获取数据失败，请稍后重试'
      };
    }
  },

  // 创建帖子
  async createPost(postData = {}) {
    try {
      const userInfo = getAppUserInfo();
      const userAuthId = userInfo && userInfo.user_id;

      if (!userAuthId) {
        throw new Error('用户未登录');
      }

      const userDbId = await resolveUserDbId(userInfo);

      if (!userDbId) {
        throw new Error('未找到用户信息，请重新登录');
      }

      if (!postData.title || !postData.content) {
        throw new Error('标题和内容不能为空');
      }

      const payload = {
        user_id: userDbId,
        title: postData.title,
        content: postData.content,
        category: postData.category || '经验分享',
        sub_category: postData.subCategory || '',
        images: postData.images || [],
        status: 'published'
      };

      let response;
      if (typeof db.insertWithAuth === 'function') {
        response = await db.insertWithAuth('forum_posts', payload);
      } else {
        response = await db.insert('forum_posts', payload);
      }

      let inserted = null;
      if (Array.isArray(response) && response.length > 0) {
        inserted = response[0];
      } else if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        inserted = response.data[0];
      }

      return {
        success: true,
        data: inserted || { id: null, ...payload }
      };
    } catch (error) {
      console.error('创建帖子失败:', error);
      return {
        success: false,
        message: error.message || '发布失败，请稍后重试'
      };
    }
  },

  // 获取帖子详情
  async getPostDetail(postId) {
    try {
      // 从Supabase获取帖子详情
      const post = await db.select('forum_posts', { id: postId });
      
      if (!post || post.length === 0) {
        throw new Error('帖子不存在');
      }
      
      const postData = post[0];
      
      // 增加浏览次数
      await db.update('forum_posts', postId, {
        views_count: (postData.views_count || 0) + 1
      });
      
      // 获取当前用户是否点赞、收藏、关注
      const userId = wx.getStorageSync('userId') || 'guest';
      const likesResponse = await db.select('forum_likes', {
        post_id: postId,
        user_id: userId
      });
      
      const collectionsResponse = await db.select('forum_collections', {
        post_id: postId,
        user_id: userId
      });
      
      const followsResponse = await db.select('user_follows', {
        followed_id: postData.user_id,
        follower_id: userId
      });
      
      return {
        success: true,
        data: {
          id: postData.id,
          title: postData.title,
          content: postData.content,
          username: postData.username,
          avatar: postData.avatar_url || '',
          time: formatTime(postData.created_at),
          category: postData.category,
          likes: postData.likes_count || 0,
          comments: postData.comments_count || 0,
          views: (postData.views_count || 0) + 1,
          images: postData.images || [],
          isLiked: likesResponse.length > 0,
          isCollected: collectionsResponse.length > 0,
          isFollowed: followsResponse.length > 0
        }
      };
    } catch (error) {
      console.error('获取帖子详情失败:', error);
      return {
        success: false,
        message: '获取数据失败，请稍后重试'
      };
    }
  },

  // 获取帖子评论
  async getComments(postId, params = {}) {
    try {
      const { page = 1, pageSize = 10 } = params;
      
      // 构建查询参数
      const query = {
        post_id: postId,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: 'created_at.desc'
      };
      
      // 从Supabase获取评论数据
      const comments = await db.select('forum_comments', query);
      
      // 获取总评论数
      const totalResponse = await db.select('forum_comments', {
        select: 'count(*)',
        post_id: postId
      });
      const total = totalResponse[0]?.count || 0;
      
      // 获取当前用户点赞信息
      const userId = wx.getStorageSync('userId') || 'guest';
      const commentIds = comments.map(comment => comment.id);
      const likesResponse = await db.select('comment_likes', {
        comment_id: commentIds,
        user_id: userId
      });
      
      const likedCommentIds = likesResponse.map(like => like.comment_id);
      
      // 格式化评论数据
      const formattedComments = comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        username: comment.username,
        avatar: comment.avatar_url || '',
        time: formatTime(comment.created_at),
        likes: comment.likes_count || 0,
        isLiked: likedCommentIds.includes(comment.id),
        replyTo: comment.reply_to || ''
      }));
      
      return {
        success: true,
        data: {
          list: formattedComments,
          hasMore: (page - 1) * pageSize + formattedComments.length < total,
          total: parseInt(total)
        }
      };
    } catch (error) {
      console.error('获取评论失败:', error);
      return {
        success: false,
        message: '获取数据失败，请稍后重试'
      };
    }
  },

  // 发布评论
  async postComment(postId, content, replyTo = '') {
    try {
      const userId = wx.getStorageSync('userId');
      const userInfo = wx.getStorageSync('userInfo');
      
      if (!userId) {
        throw new Error('用户未登录');
      }
      
      // 创建评论数据
      const commentData = {
        post_id: postId,
        user_id: userId,
        content: content,
        reply_to: replyTo,
        username: userInfo?.nickName || '用户' + userId,
        avatar_url: userInfo?.avatarUrl || '',
        likes_count: 0,
        created_at: new Date().toISOString()
      };
      
      // 插入评论到数据库
      const result = await db.insert('forum_comments', commentData);
      
      // 更新帖子评论数
      const post = await db.select('forum_posts', { id: postId });
      if (post && post.length > 0) {
        await db.update('forum_posts', postId, {
          comments_count: (post[0].comments_count || 0) + 1
        });
      }
      
      return {
        success: true,
        data: {
          id: result.id || 'comment_' + Date.now(),
          content: content,
          username: commentData.username,
          avatar: commentData.avatar_url,
          time: '刚刚',
          likes: 0,
          isLiked: false
        }
      };
    } catch (error) {
      console.error('发布评论失败:', error);
      return {
        success: false,
        message: '发布评论失败，请稍后重试'
      };
    }
  },

  // 点赞帖子
  async likePost(postId) {
    try {
      const userId = wx.getStorageSync('userId');
      
      if (!userId) {
        throw new Error('用户未登录');
      }
      
      // 检查是否已点赞
      const existingLike = await db.select('forum_likes', {
        post_id: postId,
        user_id: userId
      });
      
      let liked = false;
      
      if (existingLike && existingLike.length > 0) {
        // 已点赞，取消点赞
        await db.delete('forum_likes', existingLike[0].id);
        
        // 更新帖子点赞数
        const post = await db.select('forum_posts', { id: postId });
        if (post && post.length > 0) {
          await db.update('forum_posts', postId, {
            likes_count: Math.max(0, (post[0].likes_count || 0) - 1)
          });
        }
      } else {
        // 未点赞，添加点赞
        await db.insert('forum_likes', {
          post_id: postId,
          user_id: userId,
          created_at: new Date().toISOString()
        });
        
        // 更新帖子点赞数
        const post = await db.select('forum_posts', { id: postId });
        if (post && post.length > 0) {
          await db.update('forum_posts', postId, {
            likes_count: (post[0].likes_count || 0) + 1
          });
        }
        
        liked = true;
      }
      
      return {
        success: true,
        data: {
          liked: liked
        }
      };
    } catch (error) {
      console.error('点赞失败:', error);
      return {
        success: false,
        message: '操作失败，请稍后重试'
      };
    }
  },

  // 收藏帖子
  async collectPost(postId) {
    try {
      const userId = wx.getStorageSync('userId');
      
      if (!userId) {
        throw new Error('用户未登录');
      }
      
      // 检查是否已收藏
      const existingCollection = await db.select('forum_collections', {
        post_id: postId,
        user_id: userId
      });
      
      let collected = false;
      
      if (existingCollection && existingCollection.length > 0) {
        // 已收藏，取消收藏
        await db.delete('forum_collections', existingCollection[0].id);
      } else {
        // 未收藏，添加收藏
        await db.insert('forum_collections', {
          post_id: postId,
          user_id: userId,
          created_at: new Date().toISOString()
        });
        collected = true;
      }
      
      return {
        success: true,
        data: {
          collected: collected
        }
      };
    } catch (error) {
      console.error('收藏失败:', error);
      return {
        success: false,
        message: '操作失败，请稍后重试'
      };
    }
  },

  // 关注用户
  async followUser(userId) {
    try {
      const currentUserId = wx.getStorageSync('userId');
      
      if (!currentUserId) {
        throw new Error('用户未登录');
      }
      
      // 不能关注自己
      if (currentUserId === userId) {
        throw new Error('不能关注自己');
      }
      
      // 检查是否已关注
      const existingFollow = await db.select('user_follows', {
        followed_id: userId,
        follower_id: currentUserId
      });
      
      let followed = false;
      
      if (existingFollow && existingFollow.length > 0) {
        // 已关注，取消关注
        await db.delete('user_follows', existingFollow[0].id);
      } else {
        // 未关注，添加关注
        await db.insert('user_follows', {
          followed_id: userId,
          follower_id: currentUserId,
          created_at: new Date().toISOString()
        });
        followed = true;
      }
      
      return {
        success: true,
        data: {
          followed: followed
        }
      };
    } catch (error) {
      console.error('关注失败:', error);
      return {
        success: false,
        message: '操作失败，请稍后重试'
      };
    }
  }
};

module.exports = forumService;