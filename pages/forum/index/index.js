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

    // 模拟数据加载
    setTimeout(() => {
      const mockData = this.getMockForumData();
      
      let newList = [];
      if (this.data.page === 1) {
        newList = mockData;
      } else {
        newList = [...this.data.forumList, ...mockData];
      }

      // 模拟没有更多数据的情况
      const hasMore = this.data.page < 3;

      this.setData({
        forumList: newList,
        hasMore: hasMore
      });

      wx.hideLoading();
    }, 800);
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
  },

  // 生成模拟数据
  getMockForumData: function() {
    const categories = ['种植技术', '病虫害防治', '农产品销售', '经验分享', '政策咨询'];
    const titles = [
      '如何有效防治水稻纹枯病？',
      '今年玉米产量提高的小技巧',
      '草莓种植的最佳时间和方法',
      '蔬菜大棚温度管理经验分享',
      '新型农药使用注意事项',
      '果树嫁接技术详解',
      '农产品电商销售渠道推荐',
      '有机肥与化肥的科学搭配'
    ];
    const contents = [
      '最近田里的水稻出现了纹枯病的症状，叶子上有褐色斑点，请问有什么有效的防治方法吗？已经尝试了几种农药，但效果不太理想...',
      '经过几年的试验，我总结了几点提高玉米产量的经验，包括合理密植、科学施肥和病虫害防治等方面，希望能帮助到大家...',
      '草莓种植需要注意温度、湿度和光照等因素，下面我来详细分享一下我的种植经验和技巧...',
      '大棚蔬菜种植中，温度管理是关键。不同的蔬菜对温度有不同的要求，如何科学调控温度呢？',
      '使用新型农药时，一定要注意使用方法和安全间隔期，避免对环境和人体造成危害...'
    ];

    const data = [];
    const startIndex = (this.data.page - 1) * this.data.pageSize;
    
    for (let i = 0; i < this.data.pageSize; i++) {
      const index = (startIndex + i) % titles.length;
      data.push({
        id: 'post_' + (startIndex + i + 1),
        title: titles[index],
        content: contents[i % contents.length],
        username: '用户' + Math.floor(Math.random() * 10000),
        avatar: '',
        time: this.getRandomTime(),
        category: categories[Math.floor(Math.random() * categories.length)],
        likes: Math.floor(Math.random() * 1000),
        comments: Math.floor(Math.random() * 200),
        views: Math.floor(Math.random() * 5000),
        images: i % 3 === 0 ? [
          '/static/icons/forum1.png',
          '/static/icons/forum2.png'
        ] : []
      });
    }

    return data;
  },

  // 获取随机时间
  getRandomTime: function() {
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 7);
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);
    
    const time = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000 - randomHours * 60 * 60 * 1000 - randomMinutes * 60 * 1000);
    
    if (randomDays === 0) {
      if (randomHours === 0) {
        return randomMinutes + '分钟前';
      } else {
        return randomHours + '小时前';
      }
    } else if (randomDays === 1) {
      return '昨天 ' + time.getHours().toString().padStart(2, '0') + ':' + time.getMinutes().toString().padStart(2, '0');
    } else {
      return (time.getMonth() + 1) + '-' + time.getDate() + ' ' + time.getHours().toString().padStart(2, '0') + ':' + time.getMinutes().toString().padStart(2, '0');
    }
  }
});