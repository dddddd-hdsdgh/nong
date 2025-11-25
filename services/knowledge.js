// 知识库相关的服务接口
// 导入Supabase服务
const { db } = require('./supabase');

// 知识库相关的服务接口

/**
 * 知识库服务
 */
const knowledgeService = {
  /**
   * 获取知识分类列表
   * @returns {Promise<Object>} 分类列表
   */
  async getCategories() {
    try {
      // 从Supabase获取知识分类
      let categories = await db.select('knowledge_categories', {
        order: 'sort_order.asc'
      });
      
      // 确保 categories 是数组
      if (!Array.isArray(categories)) {
        console.warn('返回的分类数据不是数组:', categories);
        categories = [];
      }
      
      // 如果分类为空，直接返回
      if (categories.length === 0) {
        return {
          success: true,
          data: []
        };
      }
      
      // 为每个分类查询真实的文章数量
      // 使用 Promise.all 并行查询以提高性能
      const categoriesWithCount = await Promise.all(
        categories.map(async (cat) => {
          try {
            // 查询该分类下的文章（只查询 id 字段以减少数据传输）
            const articles = await db.select('knowledge_articles', {
              category_id: cat.id,
              select: 'id' // 只选择 id 字段来计数，减少数据传输量
            });
            
            // 计算文章数量
            const count = Array.isArray(articles) ? articles.length : 0;
            
            return {
              ...cat,
              count: count
            };
          } catch (error) {
            console.error(`获取分类 ${cat.name || cat.id} 的文章数量失败:`, error);
            // 如果查询失败，返回 0，不影响其他分类的显示
            return {
              ...cat,
              count: 0
            };
          }
        })
      );
      
      return {
        success: true,
        data: categoriesWithCount
      };
    } catch (error) {
      console.error('获取知识分类失败:', error);
      return {
        success: false,
        message: '获取分类失败，请稍后重试'
      };
    }
  },

  /**
   * 获取知识文章列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 文章列表
   */
  async getKnowledgeList(params = {}) {
    try {
      const userId = wx.getStorageSync('userId') || 'guest';
      const {
        categoryId = null,
        page = 1,
        pageSize = 10,
        sortBy = 'publish_date', // 可选值: publish_date, view_count, like_count
        sortOrder = 'desc' // 可选值: asc, desc
      } = params;
      
      // 构建查询条件
      const query = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: `${sortBy}.${sortOrder}`
      };
      
      // 如果指定了分类，则添加分类过滤条件
      if (categoryId) {
        query.category_id = categoryId;
      }
      
      // 从Supabase获取文章列表
      const articles = await db.select('knowledge_articles', query);
      
      // 确保 articles 是数组
      if (!Array.isArray(articles)) {
        console.warn('返回的文章数据不是数组:', articles);
        return {
          success: true,
          data: {
            list: [],
            hasMore: false,
            total: 0
          }
        };
      }
      
      // 获取总记录数（通过查询所有记录并计算长度）
      const totalQuery = categoryId ? { category_id: categoryId } : {};
      const totalResponse = await db.select('knowledge_articles', {
        ...totalQuery,
        select: 'id' // 只选择 id 字段来计数
      });
      const total = Array.isArray(totalResponse) ? totalResponse.length : 0;
      
      // 对于已登录用户，获取其收藏状态
      let favorites = [];
      if (userId !== 'guest') {
        favorites = await db.select('user_favorites', {
          user_id: userId,
          type: 'knowledge'
        });
        
        // 确保 favorites 是数组
        if (Array.isArray(favorites)) {
          // 构建收藏文章ID的映射表
          const favoriteMap = {};
          favorites.forEach(item => {
            favoriteMap[item.content_id] = true;
          });
          
          // 更新文章的收藏状态
          articles.forEach(article => {
            article.is_favorite = favoriteMap[article.id] || false;
          });
        }
      }
      
      // 格式化文章数据
      const formattedArticles = articles.map(article => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        cover_image: article.cover_image || '',
        viewCount: article.view_count || 0,
        likeCount: article.like_count || 0,
        publishDate: this.formatDate(article.publish_date),
        isFavorite: article.is_favorite || false,
        categoryId: article.category_id,
        categoryName: article.category_name || ''
      }));
      
      return {
        success: true,
        data: {
          list: formattedArticles,
          hasMore: (page - 1) * pageSize + formattedArticles.length < total,
          total: parseInt(total)
        }
      };
    } catch (error) {
      console.error('获取知识列表失败:', error);
      return {
        success: false,
        message: '获取文章列表失败，请稍后重试'
      };
    }
  },

  /**
   * 获取热门知识文章
   * @param {number} limit - 返回数量限制
   * @returns {Promise<Object>} 热门文章列表
   */
  async getHotKnowledge(limit = 5) {
    try {
      // 从Supabase获取热门文章（按浏览量排序）
      const articles = await db.select('knowledge_articles', {
        limit: limit,
        order: 'view_count.desc'
      });
      
      // 格式化文章数据
      const formattedArticles = articles.map(article => ({
        id: article.id,
        title: article.title,
        summary: article.summary || '',
        cover_image: article.cover_image || '',
        viewCount: article.view_count || 0,
        likeCount: article.like_count || 0,
        publishDate: this.formatDate(article.publish_date),
        category: article.category_name || '',
        isCollected: article.is_favorite || false,
        isFavorite: article.is_favorite || false
      }));
      
      return {
        success: true,
        data: formattedArticles
      };
    } catch (error) {
      console.error('获取热门知识失败:', error);
      return {
        success: false,
        message: '获取热门文章失败，请稍后重试'
      };
    }
  },

  /**
   * 根据分类获取文章列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 文章列表
   */
  async getArticlesByCategory(params = {}) {
    try {
      const userId = wx.getStorageSync('userId') || 'guest';
      const {
        categoryId = null,
        pageNum = 1,
        pageSize = 10,
        sortBy = 'publish_date',
        sortOrder = 'desc'
      } = params;
      
      if (!categoryId) {
        return {
          success: false,
          message: '请指定分类ID'
        };
      }
      
      // 构建查询条件
      const query = {
        category_id: categoryId,
        limit: pageSize,
        offset: (pageNum - 1) * pageSize,
        order: `${sortBy}.${sortOrder}`
      };
      
      // 从Supabase获取分类文章
      let articles = await db.select('knowledge_articles', query);
      
      // 确保 articles 是数组 - 多重检查
      if (!articles) {
        console.warn('articles 为 null 或 undefined');
        articles = [];
      } else if (!Array.isArray(articles)) {
        console.warn('返回的文章数据不是数组:', articles, typeof articles);
        articles = [];
      }
      
      // 再次确保是数组（防御性编程）
      if (!Array.isArray(articles)) {
        articles = [];
      }
      
      // 获取总记录数（使用单独的查询，只获取 id 字段）
      const countQuery = {
        category_id: categoryId,
        select: 'id' // 只选择 id 字段来计数，减少数据传输
      };
      let countArticles = await db.select('knowledge_articles', countQuery);
      const total = Array.isArray(countArticles) ? countArticles.length : articles.length;
      
      // 对于已登录用户，获取其收藏状态
      if (userId !== 'guest' && Array.isArray(articles) && articles.length > 0) {
        const favorites = await db.select('user_favorites', {
          user_id: userId,
          type: 'knowledge'
        });
        
        // 确保 favorites 是数组
        if (Array.isArray(favorites)) {
          // 构建收藏文章ID的映射表
          const favoriteMap = {};
          favorites.forEach(item => {
            favoriteMap[item.content_id] = true;
          });
          
          // 更新文章的收藏状态
          articles.forEach(article => {
            article.is_favorite = favoriteMap[article.id] || false;
          });
        }
      }
      
      // 格式化文章数据 - 再次确保 articles 是数组
      if (!Array.isArray(articles)) {
        console.error('articles 在 map 之前仍然不是数组:', articles);
        articles = [];
      }
      
      const formattedArticles = articles.map(article => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        cover_image: article.cover_image || '',
        viewCount: article.view_count || 0,
        likeCount: article.like_count || 0,
        publishDate: this.formatDate(article.publish_date),
        isFavorite: article.is_favorite || false,
        categoryId: article.category_id,
        categoryName: article.category_name || ''
      }));
      
      return {
        success: true,
        data: {
          list: formattedArticles,
          hasMore: (pageNum - 1) * pageSize + formattedArticles.length < total,
          total: parseInt(total)
        }
      };
    } catch (error) {
      console.error('获取分类文章失败:', error);
      return {
        success: false,
        message: '获取分类文章失败，请稍后重试'
      };
    }
  },

  /**
   * 获取知识文章详情
   * @param {string} articleId - 文章ID
   * @returns {Promise<Object>} 文章详情
   */
  async getKnowledgeDetail(articleId) {
    try {
      const userId = wx.getStorageSync('userId') || 'guest';
      
      if (!articleId) {
        return {
          success: false,
          message: '文章ID不能为空'
        };
      }
      
      // 从Supabase获取文章详情
      let article = await db.select('knowledge_articles', { id: articleId });
      
      // 确保 article 是数组
      if (!Array.isArray(article)) {
        console.warn('返回的文章数据不是数组:', article);
        article = [];
      }
      
      // 检查是否有数据
      if (!article || article.length === 0) {
        console.warn('文章不存在，articleId:', articleId);
        return {
          success: false,
          message: '文章不存在'
        };
      }
      
      // 获取第一篇文章数据
      const articleData = article[0];
      
      // 确保 articleData 存在
      if (!articleData) {
        console.error('文章数据为空，articleId:', articleId, 'article:', article);
        return {
          success: false,
          message: '文章数据为空'
        };
      }
      
      // 确保 articleData 有 id 字段
      if (!articleData.id) {
        console.error('文章数据缺少 id 字段:', articleData);
        return {
          success: false,
          message: '文章数据格式错误：缺少ID'
        };
      }
      
      // 更新文章浏览量（使用安全的字段访问）
      try {
        const currentViewCount = articleData.view_count || articleData.viewCount || 0;
        await db.update('knowledge_articles', articleData.id, {
          view_count: currentViewCount + 1
        });
      } catch (updateError) {
        console.warn('更新浏览量失败:', updateError);
        // 即使更新失败也继续执行，不影响文章详情返回
      }
      
      // 获取用户的收藏状态
      let isFavorite = false;
      if (userId !== 'guest') {
        try {
          const favorites = await db.select('user_favorites', {
            user_id: userId,
            content_id: articleId,
            type: 'knowledge'
          });
          // 确保 favorites 是数组
          isFavorite = Array.isArray(favorites) && favorites.length > 0;
        } catch (favError) {
          console.warn('获取收藏状态失败:', favError);
        }
      }
      
      // 格式化文章数据 - 使用安全的字段访问
      const formattedArticle = {
        id: articleData.id || articleId,
        title: articleData.title || '无标题',
        content: articleData.content || '',
        coverImage: articleData.cover_image || articleData.coverImage || '',
        viewCount: (articleData.view_count || articleData.viewCount || 0) + 1,
        likeCount: articleData.like_count || articleData.likeCount || 0,
        publishDate: articleData.publish_date ? this.formatDateTime(articleData.publish_date) : 
                     (articleData.publishDate || this.formatDateTime(new Date())),
        author: articleData.author || '管理员',
        isFavorite: isFavorite,
        categoryId: articleData.category_id || articleData.categoryId || '',
        categoryName: articleData.category_name || articleData.categoryName || ''
      };
      
      return {
        success: true,
        data: formattedArticle
      };
    } catch (error) {
      console.error('获取文章详情失败:', error);
      return {
        success: false,
        message: '获取文章详情失败，请稍后重试'
      };
    }
  },

  /**
   * 收藏/取消收藏知识文章
   * @param {string} articleId - 文章ID
   * @param {boolean} favorite - 是否收藏
   * @returns {Promise<Object>} 操作结果
   */
  async favoriteKnowledge(articleId, favorite = true) {
    try {
      const userId = wx.getStorageSync('userId');
      
      if (!userId) {
        throw new Error('用户未登录');
      }
      
      if (favorite) {
        // 添加收藏
        await db.insert('user_favorites', {
          user_id: userId,
          content_id: articleId,
          type: 'knowledge',
          created_at: new Date().toISOString()
        });
      } else {
        // 取消收藏
        await db.delete('user_favorites', {
          user_id: userId,
          content_id: articleId,
          type: 'knowledge'
        });
      }
      
      return {
        success: true,
        data: {
          favorited: favorite
        }
      };
    } catch (error) {
      console.error(`收藏操作失败: ${error.message}`);
      return {
        success: false,
        message: favorite ? '收藏失败' : '取消收藏失败'
      };
    }
  },

  /**
   * 切换收藏状态（自动检测当前状态并切换）
   * @param {string} articleId - 文章ID
   * @returns {Promise<Object>} 操作结果
   */
  async toggleFavorite(articleId) {
    try {
      const userId = wx.getStorageSync('userId');
      
      if (!userId) {
        return {
          success: false,
          message: '请先登录'
        };
      }
      
      // 检查当前收藏状态
      const favorites = await db.select('user_favorites', {
        user_id: userId,
        content_id: articleId,
        type: 'knowledge'
      });
      
      const isFavorite = favorites && favorites.length > 0;
      
      // 切换收藏状态
      if (isFavorite) {
        // 取消收藏
        await db.delete('user_favorites', {
          user_id: userId,
          content_id: articleId,
          type: 'knowledge'
        });
      } else {
        // 添加收藏
        await db.insert('user_favorites', {
          user_id: userId,
          content_id: articleId,
          type: 'knowledge',
          created_at: new Date().toISOString()
        });
      }
      
      return {
        success: true,
        data: {
          favorited: !isFavorite
        }
      };
    } catch (error) {
      console.error(`切换收藏状态失败: ${error.message}`);
      return {
        success: false,
        message: '操作失败，请稍后重试'
      };
    }
  },

  /**
   * 搜索知识文章
   * @param {string} keyword - 搜索关键词
   * @param {Object} params - 其他查询参数
   * @returns {Promise<Object>} 搜索结果
   */
  async searchKnowledge(keyword, params = {}) {
    try {
      const userId = wx.getStorageSync('userId') || 'guest';
      const { page = 1, pageSize = 10 } = params;
      
      if (!keyword || keyword.trim() === '') {
        return {
          success: false,
          message: '请输入搜索关键词'
        };
      }
      
      const trimmedKeyword = keyword.trim().toLowerCase();
      console.log('开始搜索，关键词:', trimmedKeyword, '搜索字段: title');
      
      // 获取所有文章，然后基于标题字段进行搜索过滤
      let allArticles = [];
      
      try {
        // 获取所有文章（限制数量以避免性能问题）
        allArticles = await db.select('knowledge_articles', {
          limit: 200, // 限制最多获取200条，然后客户端过滤
          order: 'publish_date.desc'
        });
        
        // 确保是数组
        if (!Array.isArray(allArticles)) {
          console.warn('返回的文章数据不是数组:', allArticles);
          allArticles = [];
        }
        
        console.log('获取到文章总数:', allArticles.length);
      } catch (error) {
        console.error('获取文章列表失败:', error);
        return {
          success: false,
          message: '获取文章列表失败，请稍后重试'
        };
      }
      
      // 只基于标题字段进行搜索过滤
      const matchedArticles = [];
      
      allArticles.forEach(article => {
        const title = (article.title || '').toLowerCase();
        
        // 只检查标题是否包含关键词
        if (title.includes(trimmedKeyword)) {
          matchedArticles.push({ ...article, matchType: 'title' });
        }
      });
      
      console.log('标题匹配结果:', matchedArticles.length, '条');
      
      // 按发布时间排序
      matchedArticles.sort((a, b) => {
        const dateA = new Date(a.publish_date || a.publishDate || 0);
        const dateB = new Date(b.publish_date || b.publishDate || 0);
        return dateB - dateA;
      });
      
      // 分页处理
      const total = matchedArticles.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedArticles = matchedArticles.slice(startIndex, endIndex);
      
      console.log('搜索结果总数:', total, '当前页:', page, '返回数量:', paginatedArticles.length);
      
      // 对于已登录用户，获取收藏状态
      if (userId !== 'guest' && paginatedArticles.length > 0) {
        try {
          const articleIds = paginatedArticles.map(a => a.id);
          const favorites = await db.select('user_favorites', {
            user_id: userId,
            type: 'knowledge'
          });
          
          if (Array.isArray(favorites)) {
            const favoriteMap = {};
            favorites.forEach(fav => {
              if (articleIds.includes(fav.content_id)) {
                favoriteMap[fav.content_id] = true;
              }
            });
            
            paginatedArticles.forEach(article => {
              article.is_favorite = favoriteMap[article.id] || false;
            });
          }
        } catch (favError) {
          console.warn('获取收藏状态失败:', favError);
        }
      }
      
      // 格式化文章数据
      const formattedArticles = paginatedArticles.map(article => ({
        id: article.id,
        title: article.title || '无标题',
        summary: article.summary || (article.content ? article.content.replace(/<[^>]*>/g, '').substring(0, 100) : ''),
        content: article.content || '',
        coverImage: article.cover_image || article.coverImage || '',
        viewCount: article.view_count || article.viewCount || 0,
        likeCount: article.like_count || article.likeCount || 0,
        publishDate: article.publish_date ? this.formatDate(article.publish_date) : 
                     (article.publishDate || this.formatDate(new Date())),
        isFavorite: article.is_favorite || article.isFavorite || false,
        categoryId: article.category_id || article.categoryId || '',
        categoryName: article.category_name || article.categoryName || '',
        matchType: article.matchType || 'both' // 匹配类型：title, content, both
      }));
      
      return {
        success: true,
        data: {
          list: formattedArticles,
          hasMore: endIndex < total,
          total: total
        }
      };
    } catch (error) {
      console.error('搜索知识失败:', error);
      return {
        success: false,
        message: '搜索失败，请稍后重试'
      };
    }
  },

  /**
   * 获取用户收藏的知识文章
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 收藏文章列表
   */
  async getUserFavorites(params = {}) {
    try {
      const userId = wx.getStorageSync('userId');
      
      if (!userId) {
        throw new Error('用户未登录');
      }
      
      const { page = 1, pageSize = 10 } = params;
      
      // 构建查询
      // 这里我们使用一个自定义查询，可能需要通过Supabase的JOIN操作实现
      // 实际项目中可能需要根据数据库结构调整
      const query = {
        query: `user_id = '${userId}' AND type = 'knowledge'`,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: 'created_at.desc'
      };
      
      // 获取收藏记录
      const favorites = await db.customQuery('user_favorites', query);
      
      if (!favorites || favorites.length === 0) {
        return {
          success: true,
          data: {
            list: [],
            hasMore: false,
            total: 0
          }
        };
      }
      
      // 获取收藏文章的ID列表
      const articleIds = favorites.map(fav => fav.content_id);
      
      // 获取文章详情
      const articles = await db.select('knowledge_articles', {
        id: articleIds
      });
      
      // 格式化文章数据
      const formattedArticles = articles.map(article => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        cover_image: article.cover_image || '',
        viewCount: article.view_count || 0,
        likeCount: article.like_count || 0,
        publishDate: this.formatDate(article.publish_date),
        isFavorite: true,
        categoryName: article.category_name || ''
      }));
      
      return {
        success: true,
        data: {
          list: formattedArticles,
          hasMore: formattedArticles.length >= pageSize,
          total: formattedArticles.length
        }
      };
    } catch (error) {
      console.error('获取收藏文章失败:', error);
      return {
        success: false,
        message: '获取收藏失败，请稍后重试'
      };
    }
  },

  /**
   * 格式化日期
   * @private
   * @param {string} date - ISO格式的日期字符串
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  },

  /**
   * 格式化日期时间
   * @private
   * @param {string} datetime - ISO格式的日期时间字符串
   * @returns {string} 格式化后的日期时间字符串
   */
  formatDateTime(datetime) {
    const date = new Date(datetime);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
};

module.exports = knowledgeService;