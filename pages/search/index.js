// pages/search/index.js
const knowledgeService = require('../../services/knowledge.js');
const app = getApp();

Page({
  data: {
    keyword: '', // 搜索关键词
    articles: [], // 搜索结果
    loading: false, // 加载状态
    error: null, // 错误信息
    hasMore: true, // 是否还有更多
    pageNum: 1, // 当前页码
    pageSize: 10, // 每页数量
    isLoggedIn: false, // 登录状态
    searchHistory: [] // 搜索历史
  },

  onLoad: function(options) {
    // 检查登录状态
    this.checkLoginStatus();
    
    // 加载搜索历史
    this.loadSearchHistory();
    
    // 如果从其他页面传入关键词，直接搜索
    if (options.keyword) {
      this.setData({
        keyword: decodeURIComponent(options.keyword)
      });
      this.performSearch();
    }
  },

  onShow: function() {
    // 每次页面显示时，重新检查登录状态
    this.checkLoginStatus();
  },

  /**
   * 检查用户登录状态
   */
  checkLoginStatus() {
    const isLoggedIn = app.isAuthenticated && app.isAuthenticated();
    this.setData({
      isLoggedIn
    });
  },

  /**
   * 加载搜索历史
   */
  loadSearchHistory() {
    try {
      const history = wx.getStorageSync('searchHistory') || [];
      this.setData({
        searchHistory: history.slice(0, 10) // 只保留最近10条
      });
    } catch (error) {
      console.error('加载搜索历史失败:', error);
    }
  },

  /**
   * 保存搜索历史
   */
  saveSearchHistory(keyword) {
    if (!keyword || keyword.trim() === '') return;
    
    try {
      let history = wx.getStorageSync('searchHistory') || [];
      const trimmedKeyword = keyword.trim();
      
      // 移除重复项
      history = history.filter(item => item !== trimmedKeyword);
      
      // 添加到开头
      history.unshift(trimmedKeyword);
      
      // 限制数量
      history = history.slice(0, 10);
      
      wx.setStorageSync('searchHistory', history);
      this.setData({
        searchHistory: history
      });
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  },

  /**
   * 输入框内容变化
   */
  onInputChange: function(e) {
    this.setData({
      keyword: e.detail.value
    });
  },

  /**
   * 执行搜索
   */
  async performSearch(refresh = false) {
    const keyword = this.data.keyword.trim();
    
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }

    if (refresh) {
      this.setData({
        pageNum: 1,
        articles: [],
        hasMore: true,
        error: null
      });
    }

    if (!this.data.hasMore && !refresh) {
      return;
    }

    this.setData({ loading: true, error: null });

    try {
      const result = await knowledgeService.searchKnowledge(keyword, {
        page: this.data.pageNum,
        pageSize: this.data.pageSize
      });

      if (result.success) {
        // 保存搜索历史
        this.saveSearchHistory(keyword);

        // 处理搜索结果
        let newArticles = [];
        if (result.data && result.data.list) {
          newArticles = result.data.list;
          this.setData({
            hasMore: result.data.hasMore || false
          });
        } else {
          newArticles = result.data || [];
          this.setData({
            hasMore: newArticles.length >= this.data.pageSize
          });
        }

        // 格式化文章数据
        const formattedArticles = newArticles.map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary || '',
          content: article.content,
          coverImage: article.coverImage || article.cover_image,
          author: article.author,
          categoryId: article.categoryId || article.category_id,
          categoryName: article.categoryName || article.category_name,
          viewCount: article.viewCount || article.view_count || 0,
          likeCount: article.likeCount || article.like_count || 0,
          isFavorite: article.isFavorite || article.is_favorite || false,
          publishDate: article.publishDate || article.publish_date || '2024-01-01',
          matchType: article.matchType || 'both'
        }));

        const updatedArticles = refresh ? formattedArticles : [...this.data.articles, ...formattedArticles];

        this.setData({
          articles: updatedArticles,
          pageNum: refresh ? 2 : this.data.pageNum + 1
        });
      } else {
        this.setData({
          error: result.message || '搜索失败，请稍后重试'
        });
      }
    } catch (error) {
      console.error('搜索失败:', error);
      this.setData({
        error: '搜索失败，请稍后重试'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 搜索按钮点击
   */
  onSearchTap: function() {
    this.performSearch(true);
  },

  /**
   * 点击搜索历史
   */
  onHistoryTap: function(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      keyword: keyword
    });
    this.performSearch(true);
  },

  /**
   * 清除搜索历史
   */
  clearSearchHistory: function() {
    wx.showModal({
      title: '提示',
      content: '确定要清除搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('searchHistory');
            this.setData({
              searchHistory: []
            });
            wx.showToast({
              title: '已清除',
              icon: 'success'
            });
          } catch (error) {
            console.error('清除搜索历史失败:', error);
          }
        }
      }
    });
  },

  /**
   * 跳转到文章详情
   */
  navigateToDetail: function(e) {
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
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    this.performSearch(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 上拉加载更多
   */
  onReachBottom: function() {
    if (!this.data.loading && this.data.hasMore) {
      this.performSearch(false);
    }
  }
});

