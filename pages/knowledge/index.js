// 知识库页面逻辑
// 导入知识服务
const knowledgeService = require('../../services/knowledge');
const app = getApp();

Page({
  data: {
    loading: true,
    error: null,
    // 知识库分类
    categories: [],
    // 热门知识
    hotKnowledge: [],
    // 当前选中的分类
    activeCategory: null,
    // 用户登录状态
    isLoggedIn: false
  },

  onLoad: function() {
    console.log('知识库页面加载完成');
    // 检查用户登录状态
    this.checkLoginStatus();
    // 加载数据
    this.loadData();
  },

  onShow: function() {
    console.log('知识库页面显示');
    // 每次页面显示时，重新检查登录状态
    this.checkLoginStatus();
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
   * 加载所有数据
   */
  async loadData() {
    this.setData({ loading: true, error: null });
    
    try {
      // 并行加载分类和热门知识
      const [categoriesResult, hotKnowledgeResult] = await Promise.all([
        knowledgeService.getCategories(),
        knowledgeService.getHotKnowledge(6) // 获取更多热门文章
      ]);

      // 更新分类数据
      if (categoriesResult.success) {
        // 如果没有图标，为每个分类设置默认图标
        const categories = categoriesResult.data.map((cat, index) => ({
          ...cat,
          icon: cat.icon || `/static/icons/category_${(index % 6) + 1}.png`
        }));
        
        this.setData({
          categories: categories,
          activeCategory: categories[0] // 默认选中第一个分类
        });
      } else {
        console.warn('加载分类失败:', categoriesResult.message);
      }

      // 更新热门知识数据
      if (hotKnowledgeResult.success) {
        this.setData({
          hotKnowledge: hotKnowledgeResult.data
        });
      } else {
        console.warn('加载热门知识失败:', hotKnowledgeResult.message);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      this.setData({
        error: '加载数据失败，请下拉刷新重试'
      });
      wx.showToast({
        title: '加载失败，请稍后重试',
        icon: 'error',
        duration: 2000
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 分类点击事件
  onCategoryTap: function(e) {
    const categoryId = e.currentTarget.dataset.id;
    const category = this.data.categories.find(item => item.id === categoryId);
    
    if (category) {
      console.log('点击分类:', category.name);
      
      this.setData({
        activeCategory: category
      });
      
      // 跳转到对应分类的文章列表页
      wx.navigateTo({
        url: `/pages/knowledge/category/index?categoryId=${categoryId}&categoryName=${encodeURIComponent(category.name)}`
      });
    }
  },

  /**
   * 跳转到分类页面
   */
  navigateToCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    const categoryName = e.currentTarget.dataset.name;
    
    wx.navigateTo({
      url: `/pages/knowledge/category/index?categoryId=${categoryId}&categoryName=${encodeURIComponent(categoryName)}`
    });
  },

  // 知识条目点击事件
  onKnowledgeTap: function(e) {
    const knowledgeId = e.currentTarget.dataset.id;
    const knowledge = this.data.hotKnowledge.find(item => item.id === knowledgeId);
    
    if (knowledge) {
      console.log('查看知识:', knowledge.title);
      
      // 跳转到知识详情页
      wx.navigateTo({
        url: `/pages/knowledge/detail/index?articleId=${knowledgeId}`
      });
    }
  },

  /**
   * 跳转到文章详情页面
   */
  navigateToDetail(e) {
    const articleId = e.currentTarget.dataset.id;
    
    wx.navigateTo({
      url: `/pages/knowledge/detail/index?articleId=${articleId}`
    });
  },

  // 收藏/取消收藏
  async onCollectTap(e) {
    e.stopPropagation(); // 阻止冒泡，避免触发条目点击
    
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
    
    const knowledgeId = e.currentTarget.dataset.id;
    const knowledgeIndex = this.data.hotKnowledge.findIndex(item => item.id === knowledgeId);
    
    if (knowledgeIndex !== -1) {
      const knowledge = this.data.hotKnowledge[knowledgeIndex];
      const newCollected = !knowledge.isFavorite;
      
      // 更新UI状态（乐观更新）
      const hotKnowledge = [...this.data.hotKnowledge];
      hotKnowledge[knowledgeIndex].isFavorite = newCollected;
      hotKnowledge[knowledgeIndex].likeCount = newCollected
        ? (hotKnowledge[knowledgeIndex].likeCount || 0) + 1
        : Math.max(0, (hotKnowledge[knowledgeIndex].likeCount || 0) - 1);
      
      this.setData({
        hotKnowledge: hotKnowledge
      });
      
      try {
        // 调用收藏API
        const result = await knowledgeService.favoriteKnowledge(knowledgeId, newCollected);
        
        if (result.success) {
          wx.showToast({
            title: newCollected ? '收藏成功' : '取消收藏成功',
            icon: 'success',
            duration: 1500
          });
          
          console.log(`${newCollected ? '收藏' : '取消收藏'}知识:`, knowledge.title);
        } else {
          // 如果操作失败，恢复原状态
          hotKnowledge[knowledgeIndex].isFavorite = !newCollected;
          hotKnowledge[knowledgeIndex].likeCount = newCollected
            ? (hotKnowledge[knowledgeIndex].likeCount || 0) - 1
            : (hotKnowledge[knowledgeIndex].likeCount || 0) + 1;
          
          this.setData({
            hotKnowledge: hotKnowledge
          });
          
          wx.showToast({
            title: result.message || '操作失败',
            icon: 'error',
            duration: 2000
          });
        }
      } catch (error) {
        console.error('收藏操作失败:', error);
        // 恢复原状态
        hotKnowledge[knowledgeIndex].isFavorite = !newCollected;
        hotKnowledge[knowledgeIndex].likeCount = newCollected
          ? (hotKnowledge[knowledgeIndex].likeCount || 0) - 1
          : (hotKnowledge[knowledgeIndex].likeCount || 0) + 1;
        
        this.setData({
          hotKnowledge: hotKnowledge
        });
        
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'error',
          duration: 2000
        });
      }
    }
  },

  // 搜索知识
  onSearchTap: function() {
    // 导航到搜索页面
    wx.navigateTo({
      url: '/pages/knowledge/search'
    });
  },

  /**
   * 跳转到搜索页面
   */
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/index'
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    console.log('下拉刷新');
    
    this.loadData().finally(() => {
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    });
  },
  
  // 跳转到我的收藏
  onMyFavoritesTap: function() {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后查看我的收藏',
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
    
    // 跳转到我的收藏页面
    wx.navigateTo({
      url: '/pages/knowledge/favorites'
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    return {
      title: '农业知识库 - 专业的农业技术知识平台',
      path: '/pages/knowledge/index'
    };
  }
});