// pages/knowledge/category/index.js
const knowledgeService = require('../../../services/knowledge');
const app = getApp();

Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    categoryId: '',
    categoryName: '',
    articles: [],
    loading: true,
    error: null,
    isLoggedIn: false,
    pageNum: 1,
    pageSize: 10,
    hasMore: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取分类ID和名称参数
    if (options.categoryId) {
      this.setData({
        categoryId: options.categoryId,
        categoryName: options.categoryName || '知识分类'
      });
      // 设置页面标题
      wx.setNavigationBarTitle({
        title: this.data.categoryName
      });
      // 检查登录状态
      this.checkLoginStatus();
      // 加载分类下的文章列表
      this.loadArticles();
    } else {
      this.setData({
        loading: false,
        error: '分类ID参数错误'
      });
    }
  },

  /**
   * 检查用户登录状态
   */
  checkLoginStatus() {
    // 从全局状态获取登录信息
    const isLoggedIn = app.isAuthenticated && app.isAuthenticated();
    this.setData({
      isLoggedIn
    });
  },

  /**
   * 加载文章列表
   */
  async loadArticles(refresh = false) {
    if (refresh) {
      this.setData({ pageNum: 1, articles: [], hasMore: true });
    }

    if (!this.data.hasMore) return;

    this.setData({ loading: true });
    
    try {
      const result = await knowledgeService.getArticlesByCategory({
        categoryId: this.data.categoryId,
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize
      });
      
      if (result.success) {
        // 处理服务返回的数据格式
        let newArticles = [];
        if (result.data && result.data.list) {
          // 新的数据格式，带有list字段
          newArticles = result.data.list;
          this.setData({
            hasMore: result.data.hasMore || false
          });
        } else {
          // 兼容旧的数据格式
          newArticles = result.data || [];
          this.setData({
            hasMore: newArticles.length >= this.data.pageSize
          });
        }
        
        // 格式化文章数据，确保字段名称一致
        const formattedArticles = newArticles.map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary || (article.content ? article.content.replace(/<[^>]*>/g, '').substring(0, 100) : ''),
          content: article.content,
          coverImage: article.coverImage || article.cover_image,
          author: article.author,
          categoryId: article.categoryId || article.category_id,
          categoryName: article.categoryName || article.category_name,
          viewCount: article.viewCount || article.view_count || 0,
          likeCount: article.likeCount || article.like_count || 0,
          isFavorite: article.isFavorite || article.is_favorite || false,
          createdAt: article.createdAt || article.publishDate || '2024-01-01'
        }));
        
        const updatedArticles = refresh ? formattedArticles : [...this.data.articles, ...formattedArticles];
        
        this.setData({
          articles: updatedArticles,
          pageNum: refresh ? 2 : this.data.pageNum + 1
        });
      } else {
        this.setData({
          error: result.message || '获取文章列表失败'
        });
      }
    } catch (error) {
      console.error('加载文章列表失败:', error);
      this.setData({
        error: '加载失败，请稍后重试'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 跳转到文章详情页
   */
  navigateToDetail(e) {
    const articleId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/knowledge/detail/index?articleId=${articleId}`
    });
  },

  /**
   * 切换收藏状态
   */
  async toggleFavorite(e) {
    const articleId = e.currentTarget.dataset.id;
    
    // 检查登录状态
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再进行收藏',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/index'
            });
          }
        }
      });
      return;
    }

    // 找到对应的文章
    const articleIndex = this.data.articles.findIndex(article => article.id === articleId);
    if (articleIndex === -1) return;

    // 乐观更新UI
    const updatedArticles = [...this.data.articles];
    updatedArticles[articleIndex] = {
      ...updatedArticles[articleIndex],
      isFavorite: !updatedArticles[articleIndex].isFavorite,
      likeCount: updatedArticles[articleIndex].isFavorite
        ? updatedArticles[articleIndex].likeCount - 1
        : updatedArticles[articleIndex].likeCount + 1
    };
    
    this.setData({
      articles: updatedArticles
    });
    
    try {
      const result = await knowledgeService.toggleFavorite(articleId);
      
      if (!result.success) {
        // 操作失败，恢复原状态
        updatedArticles[articleIndex] = {
          ...updatedArticles[articleIndex],
          isFavorite: !updatedArticles[articleIndex].isFavorite,
          likeCount: updatedArticles[articleIndex].isFavorite
            ? updatedArticles[articleIndex].likeCount - 1
            : updatedArticles[articleIndex].likeCount + 1
        };
        
        this.setData({
          articles: updatedArticles
        });
        
        wx.showToast({
          title: result.message || '操作失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      // 恢复原状态
      updatedArticles[articleIndex] = {
        ...updatedArticles[articleIndex],
        isFavorite: !updatedArticles[articleIndex].isFavorite,
        likeCount: updatedArticles[articleIndex].isFavorite
          ? updatedArticles[articleIndex].likeCount - 1
          : updatedArticles[articleIndex].likeCount + 1
      };
      
      this.setData({
        articles: updatedArticles
      });
      
      wx.showToast({
        title: '操作失败，请稍后重试',
        icon: 'none'
      });
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 每次页面显示时，重新检查登录状态
    this.checkLoginStatus();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.loadArticles(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    if (!this.data.loading && this.data.hasMore) {
      this.loadArticles(false);
    }
  }
});