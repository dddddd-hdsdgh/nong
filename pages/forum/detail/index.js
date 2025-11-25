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

    // 返回空数据
    setTimeout(() => {
      this.setData({
        post: {
          id: this.data.postId,
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
        }
      });

      wx.hideLoading();
    }, 300);
  },

  // 加载评论
  loadComments: function() {
    wx.showLoading({
      title: '加载评论中',
    });

    // 返回空数据
    setTimeout(() => {
      this.setData({
        comments: [],
        hasMoreComments: false
      });

      wx.hideLoading();
    }, 300);
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

    wx.showToast({
      title: '评论功能暂未开放',
      icon: 'none'
    });
  },

  // 预览图片
  previewImage: function(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.post.images
    });
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