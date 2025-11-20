// pages/settings/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {
      username: '',
      identity: ''
    },
    isLoggedIn: false,
    cacheSize: '0KB',
    currentLanguage: '简体中文',
    appVersion: '1.0.0'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 获取用户信息
    this.getUserInfo();
    // 计算缓存大小
    this.calculateCacheSize();
    // 获取应用版本
    this.getAppVersion();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 每次显示页面时更新用户信息和缓存大小
    this.getUserInfo();
    this.calculateCacheSize();
  },

  /**
   * 获取用户信息
   */
  getUserInfo: function() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.setData({
          userInfo: userInfo,
          isLoggedIn: true
        });
      }
    } catch (e) {
      console.error('获取用户信息失败:', e);
    }
  },

  /**
   * 计算缓存大小
   */
  calculateCacheSize: function() {
    try {
      // 这里只是模拟缓存大小，实际项目中可以计算真实缓存
      const cacheSize = '1.2MB'; // 模拟数据
      this.setData({
        cacheSize: cacheSize
      });
    } catch (e) {
      console.error('计算缓存大小失败:', e);
      this.setData({
        cacheSize: '0KB'
      });
    }
  },

  /**
   * 获取应用版本
   */
  getAppVersion: function() {
    try {
      const version = wx.getAccountInfoSync().miniProgram.version;
      this.setData({
        appVersion: version || '1.0.0'
      });
    } catch (e) {
      console.error('获取应用版本失败:', e);
    }
  },

  /**
   * 清除缓存
   */
  handleClearCache: function() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '清除中...',
          });
          
          // 模拟清除缓存的异步操作
          setTimeout(() => {
            try {
              // 清除本地缓存
              wx.clearStorageSync();
              
              // 更新缓存大小显示
              this.setData({
                cacheSize: '0KB'
              });
              
              wx.hideLoading();
              wx.showToast({
                title: '缓存已清除',
                icon: 'success',
                duration: 2000
              });
            } catch (e) {
              console.error('清除缓存失败:', e);
              wx.hideLoading();
              wx.showToast({
                title: '清除失败',
                icon: 'none',
                duration: 2000
              });
            }
          }, 1000);
        }
      }
    });
  },

  /**
   * 语言设置
   */
  handleLanguageSetting: function() {
    wx.showToast({
      title: '语言设置功能开发中',
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 通知设置
   */
  handleNotificationSetting: function() {
    wx.showToast({
      title: '通知设置功能开发中',
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 关于应用
   */
  handleAboutUs: function() {
    wx.showModal({
      title: '关于应用',
      content: '农业助手 v' + this.data.appVersion + '\n\n帮助农民朋友科学种植，提高产量。\n\n© 2024 农业助手团队',
      showCancel: false
    });
  },

  /**
   * 隐私政策
   */
  handlePrivacyPolicy: function() {
    try {
      wx.navigateTo({
        url: '/pages/webview/webview?url=privacy',
        fail: () => {
          wx.showToast({
            title: '页面开发中',
            icon: 'none',
            duration: 2000
          });
        }
      });
    } catch (e) {
      console.error('打开隐私政策失败:', e);
      wx.showToast({
        title: '页面开发中',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 用户协议
   */
  handleUserAgreement: function() {
    try {
      wx.navigateTo({
        url: '/pages/webview/webview?url=agreement',
        fail: () => {
          wx.showToast({
            title: '页面开发中',
            icon: 'none',
            duration: 2000
          });
        }
      });
    } catch (e) {
      console.error('打开用户协议失败:', e);
      wx.showToast({
        title: '页面开发中',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 退出登录
   */
  handleLogout: function() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            // 清除用户信息
            wx.removeStorageSync('userInfo');
            
            // 更新页面状态
            this.setData({
              userInfo: {
                username: '',
                identity: ''
              },
              isLoggedIn: false
            });
            
            wx.showToast({
              title: '已退出登录',
              icon: 'success',
              duration: 2000
            });
          } catch (e) {
            console.error('退出登录失败:', e);
            wx.showToast({
              title: '退出失败',
              icon: 'none',
              duration: 2000
            });
          }
        }
      }
    });
  },

  /**
   * 登录/注册
   */
  handleLogin: function() {
    try {
      wx.navigateTo({
        url: '/pages/login/login',
        fail: () => {
          wx.showToast({
            title: '登录功能开发中',
            icon: 'none',
            duration: 2000
          });
        }
      });
    } catch (e) {
      console.error('打开登录页面失败:', e);
      wx.showToast({
        title: '登录功能开发中',
        icon: 'none',
        duration: 2000
      });
    }
  }
});