// 知识库页面逻辑
Page({
  data: {
    loading: false,
    // 知识库分类
    categories: [
      {
        id: 1,
        name: '病虫害识别',
        icon: '/static/icons/identify.png',
        count: 156,
        description: '农作物病虫害智能识别指南'
      },
      {
        id: 2,
        name: '种植技术',
        icon: '/static/icons/forum.png',
        count: 234,
        description: '科学种植方法与技巧'
      },
      {
        id: 3,
        name: '农药使用',
        icon: '/static/icons/settings.png',
        count: 89,
        description: '安全用药指导手册'
      },
      {
        id: 4,
        name: '施肥管理',
        icon: '/static/icons/collect.png',
        count: 167,
        description: '科学施肥技术要点'
      },
      {
        id: 5,
        name: '气象知识',
        icon: '/static/icons/view.png',
        count: 123,
        description: '农业气象信息解读'
      },
      {
        id: 6,
        name: '政策法规',
        icon: '/static/icons/like.png',
        count: 45,
        description: '农业相关政策法规'
      }
    ],
    // 热门知识
    hotKnowledge: [
      {
        id: 1,
        title: '水稻稻瘟病的识别与防治',
        category: '病虫害识别',
        viewCount: 2341,
        collectCount: 189,
        isCollected: false
      },
      {
        id: 2,
        title: '大棚蔬菜种植技术要点',
        category: '种植技术',
        viewCount: 1987,
        collectCount: 156,
        isCollected: false
      },
      {
        id: 3,
        title: '常用农药的正确使用方法',
        category: '农药使用',
        viewCount: 1654,
        collectCount: 143,
        isCollected: false
      },
      {
        id: 4,
        title: '春季小麦施肥指南',
        category: '施肥管理',
        viewCount: 1432,
        collectCount: 98,
        isCollected: false
      }
    ]
  },

  onLoad: function() {
    console.log('知识库页面加载完成');
    this.loadKnowledgeData();
  },

  onShow: function() {
    console.log('知识库页面显示');
  },

  // 加载知识库数据
  loadKnowledgeData: function() {
    const that = this;
    
    that.setData({
      loading: true
    });
    
    // 模拟数据加载
    setTimeout(() => {
      console.log('知识库数据加载完成');
      that.setData({
        loading: false
      });
      
      // 显示加载成功提示
      // wx.showToast({
      //   title: '加载完成',
      //   icon: 'success',
      //   duration: 1000
      // });
    }, 800);
  },

  // 分类点击事件
  onCategoryTap: function(e) {
    const categoryId = e.currentTarget.dataset.id;
    const category = this.data.categories.find(item => item.id === categoryId);
    
    if (category) {
      wx.showToast({
        title: `进入${category.name}`,
        icon: 'none',
        duration: 1500
      });
      
      // 这里可以跳转到具体的分类页面或展开内容
      console.log('点击分类:', category.name);
      
      // 模拟跳转到分类详情
      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/knowledge/detail?id=${categoryId}&name=${encodeURIComponent(category.name)}`
        });
      }, 1000);
    }
  },

  // 知识条目点击事件
  onKnowledgeTap: function(e) {
    const knowledgeId = e.currentTarget.dataset.id;
    const knowledge = this.data.hotKnowledge.find(item => item.id === knowledgeId);
    
    if (knowledge) {
      wx.showToast({
        title: '查看详情',
        icon: 'none',
        duration: 1000
      });
      
      console.log('查看知识:', knowledge.title);
      
      // 跳转到知识详情页
      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/knowledge/content?id=${knowledgeId}`
        });
      }, 800);
    }
  },

  // 收藏/取消收藏
  onCollectTap: function(e) {
    e.stopPropagation(); // 阻止冒泡，避免触发条目点击
    
    const knowledgeId = e.currentTarget.dataset.id;
    const knowledgeIndex = this.data.hotKnowledge.findIndex(item => item.id === knowledgeId);
    
    if (knowledgeIndex !== -1) {
      const knowledge = this.data.hotKnowledge[knowledgeIndex];
      const newCollected = !knowledge.isCollected;
      
      // 更新本地数据
      const hotKnowledge = this.data.hotKnowledge;
      hotKnowledge[knowledgeIndex].isCollected = newCollected;
      hotKnowledge[knowledgeIndex].collectCount += newCollected ? 1 : -1;
      
      this.setData({
        hotKnowledge: hotKnowledge
      });
      
      // 模拟API调用
      wx.showToast({
        title: newCollected ? '已收藏' : '已取消收藏',
        icon: 'success',
        duration: 1000
      });
      
      console.log(`${newCollected ? '收藏' : '取消收藏'}知识:`, knowledge.title);
    }
  },

  // 搜索知识
  onSearchTap: function() {
    wx.showModal({
      title: '搜索功能',
      content: '搜索功能开发中，敬请期待...',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    console.log('下拉刷新');
    this.loadKnowledgeData();
    
    // 停止下拉刷新
    setTimeout(() => {
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '刷新完成',
        icon: 'success',
        duration: 1000
      });
    }, 1500);
  }
});