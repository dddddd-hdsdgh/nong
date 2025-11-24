// pages/knowledge/detail/index.js
const knowledgeService = require('../../../services/knowledge');
const app = getApp();

Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    articleId: '',
    article: null,
    loading: true,
    error: null,
    isLoggedIn: false,
    // 用于渲染的富文本配置
    richTextStyle: {
      p: 'margin-bottom: 15px; line-height: 1.6;',
      h1: 'margin: 20px 0 15px 0; font-size: 24px; font-weight: bold;',
      h2: 'margin: 18px 0 12px 0; font-size: 20px; font-weight: bold;',
      h3: 'margin: 15px 0 10px 0; font-size: 18px; font-weight: bold;',
      ul: 'margin: 10px 0; padding-left: 20px;',
      li: 'margin: 5px 0; list-style-type: disc;',
      ol: 'margin: 10px 0; padding-left: 20px;',
      table: 'width: 100%; border-collapse: collapse; margin: 15px 0;',
      th: 'border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;',
      td: 'border: 1px solid #ddd; padding: 8px;',
      strong: 'font-weight: bold;'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取文章ID参数
    if (options.articleId) {
      this.setData({
        articleId: options.articleId
      });
      // 检查登录状态
      this.checkLoginStatus();
      // 加载文章详情
      this.loadArticleDetail();
    } else {
      this.setData({
        loading: false,
        error: '文章ID参数错误'
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
   * 加载文章详情
   */
  async loadArticleDetail() {
    this.setData({ loading: true, error: null });
    
    try {
      const result = await knowledgeService.getKnowledgeDetail(this.data.articleId);
      
      if (result.success) {
        this.setData({
          article: result.data
        });
        // 设置页面标题
        wx.setNavigationBarTitle({
          title: result.data.title
        });
      } else {
        this.setData({
          error: result.message || '获取文章详情失败'
        });
      }
    } catch (error) {
      console.error('加载文章详情失败:', error);
      this.setData({
        error: '加载失败，请稍后重试'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 切换收藏状态
   */
  async toggleFavorite() {
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

    if (!this.data.article) return;

    // 乐观更新UI
    const newArticle = { ...this.data.article };
    newArticle.isFavorite = !newArticle.isFavorite;
    newArticle.likeCount = newArticle.isFavorite
      ? newArticle.likeCount + 1
      : Math.max(0, newArticle.likeCount - 1);
    
    this.setData({
      article: newArticle
    });
    
    try {
      const result = await knowledgeService.toggleFavorite(this.data.articleId);
      
      if (!result.success) {
        // 操作失败，恢复原状态
        newArticle.isFavorite = !newArticle.isFavorite;
        newArticle.likeCount = newArticle.isFavorite
          ? newArticle.likeCount + 1
          : Math.max(0, newArticle.likeCount - 1);
        
        this.setData({
          article: newArticle
        });
        
        wx.showToast({
          title: result.message || '操作失败',
          icon: 'none'
        });
      } else {
        wx.showToast({
          title: newArticle.isFavorite ? '收藏成功' : '取消收藏成功',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      // 恢复原状态
      newArticle.isFavorite = !newArticle.isFavorite;
      newArticle.likeCount = newArticle.isFavorite
        ? newArticle.likeCount + 1
        : Math.max(0, newArticle.likeCount - 1);
      
      this.setData({
        article: newArticle
      });
      
      wx.showToast({
        title: '操作失败，请稍后重试',
        icon: 'none'
      });
    }
  },

  /**
   * 跳转到分类页面
   */
  goToCategory() {
    if (!this.data.article || !this.data.article.categoryId) return;
    
    wx.navigateTo({
      url: `/pages/knowledge/category?categoryId=${this.data.article.categoryId}&categoryName=${encodeURIComponent(this.data.article.categoryName)}`
    });
  },

  /**
   * 分享文章
   */
  onShareAppMessage() {
    if (!this.data.article) return {};
    
    return {
      title: this.data.article.title,
      path: `/pages/knowledge/detail/index?articleId=${this.data.articleId}`,
      imageUrl: this.data.article.coverImage || '/static/icons/knowledge.png'
    };
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
    this.loadArticleDetail().finally(() => {
      wx.stopPullDownRefresh();
    });
  }
});