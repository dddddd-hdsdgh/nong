const app = getApp();
const forumService = require('../../../services/forum');

function getStoredUserInfo() {
  try {
    if (app && typeof app.getUserInfo === 'function') {
      const info = app.getUserInfo();
      if (info) {
        return info;
      }
    }
  } catch (err) {
    console.warn('获取全局用户信息失败:', err);
  }

  const storageKey = app && app.STORAGE_KEYS ? app.STORAGE_KEYS.USER_INFO : 'userInfo';
  try {
    return wx.getStorageSync(storageKey) || wx.getStorageSync('userInfo');
  } catch (err) {
    console.warn('读取本地用户信息失败:', err);
    return null;
  }
}

Page({
  data: {
    title: '',
    content: '',
    subCategory: '',
    categoryOptions: [
      { label: '经验分享', value: 'experience' },
      { label: '问题求助', value: 'question' },
      { label: '病虫害防治', value: 'disease' },
      { label: '种植技术', value: 'technique' },
      { label: '市场行情', value: 'market' }
    ],
    categoryIndex: 0,
    maxTitleLength: 50,
    maxContentLength: 1000,
    contentLength: 0,
    isSubmitting: false
  },

  onLoad() {
    this.ensureLogin();
  },

  onShow() {
    this.ensureLogin();
  },

  ensureLogin() {
    const isAuthed = app && typeof app.isAuthenticated === 'function' ? app.isAuthenticated() : false;
    if (isAuthed) {
      return true;
    }

    wx.showModal({
      title: '请先登录',
      content: '登录后才能发布帖子，是否前往登录？',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/login/index'
          });
        } else {
          wx.navigateBack({
            delta: 1
          });
        }
      }
    });

    return false;
  },

  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    });
  },

  onContentInput(e) {
    const value = e.detail.value || '';
    this.setData({
      content: value,
      contentLength: value.length
    });
  },

  onSubCategoryInput(e) {
    this.setData({
      subCategory: e.detail.value
    });
  },

  onCategoryChange(e) {
    const index = Number(e.detail.value) || 0;
    this.setData({
      categoryIndex: index
    });
  },

  validateForm() {
    if (!this.data.title.trim()) {
      return '请输入帖子标题';
    }

    if (this.data.title.trim().length > this.data.maxTitleLength) {
      return `标题长度不能超过${this.data.maxTitleLength}个字符`;
    }

    if (!this.data.content.trim()) {
      return '请输入帖子内容';
    }

    if (this.data.content.trim().length < 10) {
      return '帖子内容至少需要10个字符';
    }

    return '';
  },

  async submitPost() {
    if (this.data.isSubmitting) {
      return;
    }

    if (!this.ensureLogin()) {
      return;
    }

    const validationMessage = this.validateForm();
    if (validationMessage) {
      wx.showToast({
        title: validationMessage,
        icon: 'none'
      });
      return;
    }

    if (!forumService || typeof forumService.createPost !== 'function') {
      wx.showToast({
        title: '发布服务暂不可用',
        icon: 'none'
      });
      return;
    }

    const userInfo = getStoredUserInfo();

    if (!userInfo || !userInfo.user_id) {
      wx.showToast({
        title: '请先登录后再发布',
        icon: 'none'
      });
      return;
    }

    let category = '经验分享';
    if (this.data.categoryOptions && this.data.categoryOptions.length > 0) {
      const currentOption = this.data.categoryOptions[this.data.categoryIndex] || this.data.categoryOptions[0];
      category = currentOption && currentOption.label ? currentOption.label : '经验分享';
    }

    const payload = {
      title: this.data.title.trim(),
      content: this.data.content.trim(),
      category: category,
      subCategory: this.data.subCategory.trim(),
      images: []
    };

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '发布中...' });

    try {
      const result = await forumService.createPost(payload);
      wx.hideLoading();
      this.setData({ isSubmitting: false });

      if (result.success) {
        wx.showToast({
          title: '发布成功',
          icon: 'success'
        });

        const pages = getCurrentPages();
        if (pages.length > 1) {
          const prevPage = pages[pages.length - 2];
          if (prevPage && typeof prevPage.setData === 'function') {
            prevPage.setData({
              refreshOnShow: true
            });
          }
        }

        setTimeout(() => {
          wx.navigateBack({
            delta: 1
          });
        }, 800);
      } else {
        wx.showToast({
          title: result.message || '发布失败，请稍后重试',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('发布帖子失败:', error);
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      wx.showToast({
        title: '网络异常，请稍后再试',
        icon: 'none'
      });
    }
  },

  resetForm() {
    this.setData({
      title: '',
      content: '',
      subCategory: '',
      categoryIndex: 0,
      contentLength: 0
    });
  }
});

