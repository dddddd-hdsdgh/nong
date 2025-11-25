// 知识库页面逻辑
// 导入知识服务
const knowledgeService = require('../../services/knowledge.js');
const app = getApp();

Page({
  data: {
    loading: true,
    error: null,
    // 知识库分类
    categories: [],
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
      // 只加载分类数据
      const categoriesResult = await knowledgeService.getCategories();

      // 更新分类数据
      if (categoriesResult.success) {
        // 处理分类图标，确保阿里云OSS图片URL正确并优化
          const categories = categoriesResult.data.map((cat, index) => {
            let icon = cat.icon;
            
            // 如果有icon值
            if (icon) {
              console.log('原始图片URL:', icon);
              
              // 检查是否已经包含http或https协议前缀
              if (typeof icon === 'string' && !icon.startsWith('http://') && !icon.startsWith('https://')) {
                // 如果是阿里云OSS地址但没有协议前缀，添加https://
                if (icon.includes('aliyuncs.com')) {
                  icon = 'https://' + icon;
                  console.log('已添加https前缀:', icon);
                }
              }
              
              // 优化处理：移除可能导致403错误的查询参数（Expires、OSSAccessKeyId、Signature等）
              if (typeof icon === 'string' && icon.includes('aliyuncs.com') && icon.includes('?')) {
                // 只保留URL的基础部分，移除查询参数
                const baseUrl = icon.split('?')[0];
                console.log('已移除查询参数，使用基础URL:', baseUrl);
                icon = baseUrl;
              }
            } else {
              // 如果没有图标，使用本地默认图标
              icon = `/static/icons/category_${(index % 6) + 1}.png`;
            }
            
            return {
              ...cat,
              icon: icon,
              // 添加图片加载状态标记
              iconLoaded: false
            };
          });
        
        this.setData({
          categories: categories,
          activeCategory: categories[0] // 默认选中第一个分类
        });
        
        // 预加载所有图片，提前检测加载失败的情况
        this.preloadImages(categories);
      } else {
        console.warn('加载分类失败:', categoriesResult.message);
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
  
  // 预加载图片并监控错误
  preloadImages(categories) {
    console.log('开始预加载图片，总数:', categories.length);
    let failedCount = 0;
    
    // 为每个分类的图片创建预加载任务
    const preloadPromises = categories.map((category, index) => {
      return new Promise((resolve) => {
        // 只预加载远程图片
        if (category.icon && category.icon.startsWith('http')) {
          wx.getImageInfo({
            src: category.icon,
            success: (res) => {
              console.log(`图片预加载成功: ${category.icon}`);
              resolve({ success: true, index });
            },
            fail: (err) => {
              console.error(`图片预加载失败: ${category.icon}`, err);
              failedCount++;
              resolve({ success: false, index });
            }
          });
        } else {
          resolve({ success: true, index });
        }
      });
    });
    
    // 等待所有预加载任务完成
    Promise.all(preloadPromises).then((results) => {
      console.log(`图片预加载完成，失败数量: ${failedCount}`);
      
      // 检查是否有失败的图片需要替换
      const hasFailures = results.some(result => !result.success);
      if (hasFailures) {
        // 创建新的分类数组副本
        const updatedCategories = [...this.data.categories];
        
        // 替换所有失败的图片
        results.forEach((result, i) => {
          if (!result.success) {
            const index = result.index;
            const defaultIcon = `/static/icons/category_${(index % 6) + 1}.png`;
            console.log(`替换预加载失败图片为默认图标: ${defaultIcon}`);
            updatedCategories[index].icon = defaultIcon;
            updatedCategories[index].iconLoaded = false;
          }
        });
        
        // 更新数据
        this.setData({
          categories: updatedCategories
        });
      }
    });
  },
  
  // 处理图片加载错误，替换为本地默认图标
  onImageLoadError(e) {
    const { index } = e.currentTarget.dataset;
    console.log('图片加载失败，索引:', index);
    
    // 获取当前分类数据
    const categories = this.data.categories;
    if (categories && categories[index]) {
      // 保存原始URL用于调试
      const originalUrl = categories[index].icon;
      
      // 替换为本地默认图标
      const defaultIcon = `/static/icons/category_${(index % 6) + 1}.png`;
      console.log(`替换失败图片 ${originalUrl} 为默认图标 ${defaultIcon}`);
      
      // 更新分类数据
      categories[index].icon = defaultIcon;
      categories[index].iconLoaded = false;
      
      // 设置更新后的数据
      this.setData({
        categories: categories
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



  // 搜索知识
  onSearchTap: function() {
    // 导航到搜索页面
    this.goToSearch();
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
    
    // 显示提示信息
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 2000
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