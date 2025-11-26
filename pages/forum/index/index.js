const app = getApp();
const forumService = require('../../../services/forum');

Page({
  data: {
    forumList: [],
    currentTab: 'recommend',
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    errorMessage: ''
  },

  onLoad: function() {
    this.loadForumData();
  },

  onShow: function() {
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

  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      forumList: []
    });
    this.loadForumData(true);
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
  loadForumData: async function(trigger = false) {
    const isPullDown = trigger === true || (trigger && trigger.type === 'pullDownRefresh');
    if (this.data.loading) {
      return;
    }

    this.setData({ loading: true, errorMessage: '' });

    if (!isPullDown) {
      wx.showLoading({
        title: '加载中'
      });
    }

    try {
      const response = await forumService.getForumList({
        page: this.data.page,
        pageSize: this.data.pageSize,
        tab: this.data.currentTab
      });

      if (response.success) {
        const incoming = (response.data?.list || []).map(item => ({
          ...item,
          isLiked: item.isLiked || false,
          isCollected: item.isCollected || false
        }));

        this.setData({
          forumList: this.data.page === 1 ? incoming : this.data.forumList.concat(incoming),
          hasMore: response.data?.hasMore ?? false
        });
      } else {
        this.setData({
          errorMessage: response.message || '加载失败，请稍后重试'
        });
      }
    } catch (error) {
      console.error('加载论坛数据失败:', error);
      this.setData({
        errorMessage: '网络异常，请稍后再试'
      });
    } finally {
      this.setData({ loading: false });
      wx.hideLoading();
      wx.stopPullDownRefresh();
    }
  },
  
  // 检查登录状态
  ensureLoggedIn: function() {
    if (app.isAuthenticated()) {
      return true;
    }

    wx.showModal({
      title: '请先登录',
      content: '登录后才能发布帖子，是否前往登录？',
      confirmText: '去登录',
      cancelText: '再看看',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/login/index'
          });
        }
      }
    });

    return false;
  },

  // 创建新帖子
  createPost: function() {
    if (!this.ensureLoggedIn()) {
      return;
    }

    wx.navigateTo({
      url: '/pages/forum/create/index'
    });
  },

  // 加载更多
  loadMore: function() {
    if (!this.data.hasMore || this.data.loading) return;

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
    this.createPost();
  }
});