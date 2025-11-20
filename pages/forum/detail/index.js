Page({
  data: {
    postId: '',
    post: {
      id: '',
      title: '',
      content: '',
      username: '',
      avatar: '',
      time: '',
      category: '',
      likes: 0,
      comments: 0,
      views: 0,
      images: [],
      isLiked: false,
      isCollected: false,
      isFollowed: false
    },
    comments: [],
    commentInput: '',
    inputFocus: false,
    replyTo: '',
    page: 1,
    pageSize: 10,
    hasMoreComments: true
  },

  onLoad: function(options) {
    // 获取帖子ID
    if (options.id) {
      this.setData({
        postId: options.id
      });
      // 加载帖子详情
      this.loadPostDetail();
      // 加载评论
      this.loadComments();
    }
  },

  // 加载帖子详情
  loadPostDetail: function() {
    wx.showLoading({
      title: '加载中',
    });

    // 模拟数据加载
    setTimeout(() => {
      const post = this.getMockPostDetail();
      // 增加浏览量
      post.views += 1;
      
      this.setData({
        post: post
      });

      wx.hideLoading();
    }, 600);
  },

  // 加载评论
  loadComments: function() {
    wx.showLoading({
      title: '加载评论中',
    });

    // 模拟数据加载
    setTimeout(() => {
      const mockComments = this.getMockComments();
      
      let newComments = [];
      if (this.data.page === 1) {
        newComments = mockComments;
      } else {
        newComments = [...this.data.comments, ...mockComments];
      }

      // 模拟没有更多数据的情况
      const hasMoreComments = this.data.page < 2;

      this.setData({
        comments: newComments,
        hasMoreComments: hasMoreComments
      });

      wx.hideLoading();
    }, 500);
  },

  // 加载更多评论
  loadMoreComments: function() {
    if (!this.data.hasMoreComments) return;

    this.setData({
      page: this.data.page + 1
    });
    this.loadComments();
  },

  // 点赞帖子
  likePost: function() {
    const post = this.data.post;
    const isLiked = post.isLiked;
    
    this.setData({
      'post.isLiked': !isLiked,
      'post.likes': isLiked ? post.likes - 1 : post.likes + 1
    });

    wx.showToast({
      title: isLiked ? '取消点赞' : '点赞成功',
      icon: 'none'
    });
  },

  // 收藏帖子
  collectPost: function() {
    const post = this.data.post;
    const isCollected = post.isCollected;
    
    this.setData({
      'post.isCollected': !isCollected
    });

    wx.showToast({
      title: isCollected ? '取消收藏' : '收藏成功',
      icon: 'none'
    });
  },

  // 分享帖子
  sharePost: function() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 关注用户
  followUser: function() {
    this.setData({
      'post.isFollowed': true
    });

    wx.showToast({
      title: '关注成功',
      icon: 'none'
    });
  },

  // 点赞评论
  likeComment: function(e) {
    const commentId = e.currentTarget.dataset.id;
    const comments = this.data.comments;
    
    for (let i = 0; i < comments.length; i++) {
      if (comments[i].id === commentId) {
        const isLiked = comments[i].isLiked;
        comments[i].isLiked = !isLiked;
        comments[i].likes = isLiked ? comments[i].likes - 1 : comments[i].likes + 1;
        break;
      }
    }
    
    this.setData({
      comments: comments
    });
  },

  // 回复评论
  replyComment: function(e) {
    const commentId = e.currentTarget.dataset.id;
    const username = e.currentTarget.dataset.username;
    
    this.setData({
      replyTo: username,
      commentInput: '@' + username + ' ',
      inputFocus: true
    });
  },

  // 评论输入
  onCommentInput: function(e) {
    this.setData({
      commentInput: e.detail.value
    });
  },

  // 发送评论
  sendComment: function() {
    const comment = this.data.commentInput.trim();
    if (!comment) return;

    wx.showLoading({
      title: '发送中',
    });

    // 模拟发送评论
    setTimeout(() => {
      const newComment = {
        id: 'comment_' + Date.now(),
        content: comment,
        username: '当前用户',
        avatar: '',
        time: '刚刚',
        likes: 0,
        isLiked: false
      };

      const comments = [newComment, ...this.data.comments];
      
      this.setData({
        comments: comments,
        commentInput: '',
        inputFocus: false,
        replyTo: '',
        'post.comments': this.data.post.comments + 1
      });

      wx.hideLoading();
      wx.showToast({
        title: '评论成功',
        icon: 'none'
      });
    }, 500);
  },

  // 预览图片
  previewImage: function(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.post.images
    });
  },

  // 生成模拟帖子详情
  getMockPostDetail: function() {
    const titles = [
      '如何有效防治水稻纹枯病？',
      '今年玉米产量提高的小技巧',
      '草莓种植的最佳时间和方法',
      '蔬菜大棚温度管理经验分享',
      '新型农药使用注意事项'
    ];
    const contents = [
      '最近田里的水稻出现了纹枯病的症状，叶子上有褐色斑点，请问有什么有效的防治方法吗？已经尝试了几种农药，但效果不太理想。\n\n症状表现：\n1. 叶子上出现水渍状褐色斑点\n2. 严重时叶片枯死\n3. 茎部也出现类似症状\n\n已经使用过的农药：\n- 井冈霉素\n- 三唑酮\n\n希望有经验的朋友能分享一下防治方法，谢谢！',
      '经过几年的试验，我总结了几点提高玉米产量的经验，希望能帮助到大家：\n\n1. 选择优质种子：选择抗病性强、产量高的品种\n2. 合理密植：根据品种特性确定种植密度\n3. 科学施肥：\n   - 底肥：有机肥为主，配合适量化肥\n   - 追肥：在大喇叭口期重施氮肥\n4. 病虫害防治：\n   - 玉米螟：在心叶期撒施颗粒剂\n   - 玉米蚜：及时喷洒吡虫啉\n5. 适时收获：在籽粒乳线消失时收获\n\n去年我采用这些方法，亩产提高了15%左右。',
      '草莓种植需要注意温度、湿度和光照等因素，下面我来详细分享一下我的种植经验和技巧：\n\n一、种植时间\n- 温室种植：9月下旬至10月上旬\n- 露地种植：8月下旬至9月上旬\n\n二、土壤准备\n- 选择疏松肥沃的沙壤土\n- pH值5.5-6.5\n- 每亩施入腐熟有机肥5000公斤\n\n三、定植技术\n- 行距30-40厘米，株距20-25厘米\n- 定植深度：苗心与土面平齐\n- 定植后及时浇水\n\n四、田间管理\n- 温度：白天20-25℃，夜间8-10℃\n- 湿度：60%-70%\n- 光照：每天10-12小时\n\n五、病虫害防治\n- 灰霉病：用腐霉利防治\n- 蚜虫：用吡虫啉防治\n\n六、采收\n- 果实全红时采收\n- 每天或隔天采收一次'
    ];
    const categories = ['种植技术', '病虫害防治', '农产品销售', '经验分享', '政策咨询'];
    
    const randomIndex = Math.floor(Math.random() * titles.length);
    
    return {
      id: this.data.postId,
      title: titles[randomIndex],
      content: contents[randomIndex],
      username: '农业专家' + Math.floor(Math.random() * 100),
      avatar: '',
      time: '2小时前',
      category: categories[Math.floor(Math.random() * categories.length)],
      likes: Math.floor(Math.random() * 1000),
      comments: Math.floor(Math.random() * 100),
      views: Math.floor(Math.random() * 5000),
      images: [
        '/static/icons/forum1.png',
        '/static/icons/forum2.png'
      ],
      isLiked: false,
      isCollected: false,
      isFollowed: false
    };
  },

  // 生成模拟评论数据
  getMockComments: function() {
    const comments = [
      {
        id: 'comment_1',
        content: '非常实用的分享，我今年也要试试这些方法！',
        username: '农民小李',
        avatar: '',
        time: '1小时前',
        likes: 23,
        isLiked: false
      },
      {
        id: 'comment_2',
        content: '补充一点：在病虫害防治方面，我建议使用生物农药，更加环保安全。',
        username: '绿色农业',
        avatar: '',
        time: '3小时前',
        likes: 45,
        isLiked: false
      },
      {
        id: 'comment_3',
        content: '我按照这些方法试了，确实有效！产量提高了不少。',
        username: '实践者',
        avatar: '',
        time: '昨天',
        likes: 18,
        isLiked: false
      },
      {
        id: 'comment_4',
        content: '请问施肥的具体用量是多少？能详细说一下吗？',
        username: '新手提问',
        avatar: '',
        time: '2天前',
        likes: 5,
        isLiked: false
      },
      {
        id: 'comment_5',
        content: '感谢分享！很有帮助。',
        username: '感谢者',
        avatar: '',
        time: '3天前',
        likes: 12,
        isLiked: false
      }
    ];
    
    return comments;
  },

  // 分享给朋友
  onShareAppMessage: function() {
    return {
      title: this.data.post.title,
      path: '/pages/forum/detail/index?id=' + this.data.postId,
      imageUrl: this.data.post.images.length > 0 ? this.data.post.images[0] : ''
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return {
      title: this.data.post.title,
      query: 'id=' + this.data.postId,
      imageUrl: this.data.post.images.length > 0 ? this.data.post.images[0] : ''
    };
  }
});