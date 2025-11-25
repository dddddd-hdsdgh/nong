Page({
  data: {
    forumList: [],
    currentTab: 'recommend',
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad: function() {
    // 加载论坛数据
    this.loadForumData();
  },

  onShow: function() {
    // 页面显示时刷新数据
    if (this.data.refreshOnShow) {
      this.setData({
        page: 1,
        forumList: [],
        hasMore: true
      });
      this.loadForumData();
      this.setData({
        refreshOnShow: false
      });
    }
  },

  // 切换标签
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    if (this.data.currentTab !== tab) {
      this.setData({
        currentTab: tab,
        page: 1,
        forumList: [],
        hasMore: true
      });
      this.loadForumData();
    }
  },

  // 加载论坛数据
  loadForumData: function() {
    wx.showLoading({
      title: '加载中',
    });
    
    // 返回空数据
    setTimeout(() => {
      this.setData({
        forumList: [],
        hasMore: false
      });

      wx.hideLoading();
    }, 300);
  },
  
  // 创建新帖子
  createPost: function() {
    // 跳转到发帖页面或显示发帖弹窗
    wx.showToast({
      title: '跳转到发帖页面',
      icon: 'none'
    });
    // 实际项目中这里应该是 wx.navigateTo 跳转到发帖页面
    // wx.navigateTo({ url: '/pages/forum/create/create' });
  },

  // 加载更多
  loadMore: function() {
    if (!this.data.hasMore) return;

    this.setData({
      page: this.data.page + 1
    });
    this.loadForumData();
  },

  // 跳转到详情页
  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/forum/detail/index?id=' + id
    });
  },

  // 跳转到发布页面
  goToPost: function() {
    // 这里可以跳转到发布页面，暂时先用提示代替
    wx.showToast({
      title: '发布功能开发中',
      icon: 'none'
    });
  }
});