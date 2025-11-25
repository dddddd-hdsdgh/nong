// pages/profile/edit.js
const loginService = require('../../services/login');
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    username: '',
    originalUsername: '',
    isLoading: false,
    errorMessage: '',
    successMessage: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 获取当前用户信息
    this.getUserInfo();
  },

  /**
   * 获取用户信息
   */
  getUserInfo: function() {
    try {
      // 优先从app全局数据获取用户信息
      const appUserInfo = app.globalData.userInfo;
      const isLoggedIn = app.globalData.isLoggedIn;
      
      if (isLoggedIn && appUserInfo) {
        const username = appUserInfo.name || appUserInfo.user_metadata?.name || '';
        
        this.setData({
          username: username,
          originalUsername: username
        });
      } else {
        // 尝试从本地存储获取
        const storageUserInfo = wx.getStorageSync(app.STORAGE_KEYS.USER_INFO);
        if (storageUserInfo) {
          const username = storageUserInfo.name || storageUserInfo.user_metadata?.name || '';
          
          this.setData({
            username: username,
            originalUsername: username
          });
        }
      }
    } catch (e) {
      console.error('获取用户信息失败:', e);
    }
  },

  /**
   * 处理用户名输入
   */
  onUsernameInput: function(e) {
    this.setData({
      username: e.detail.value,
      errorMessage: '',
      successMessage: ''
    });
  },

  /**
   * 保存用户名
   */
  saveUsername: function() {
    const { username, originalUsername } = this.data;
    
    // 检查用户名是否有变化
    if (username === originalUsername) {
      this.setData({ errorMessage: '用户名未发生变化' });
      return;
    }
    
    // 验证用户名
    if (!username) {
      this.setData({ errorMessage: '请输入用户名' });
      return;
    }
    
    if (username.length < 2 || username.length > 20) {
      this.setData({ errorMessage: '用户名长度应在2-20个字符之间' });
      return;
    }
    
    // 验证用户名不能包含特殊字符
    const usernameRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
    if (!usernameRegex.test(username)) {
      this.setData({ errorMessage: '用户名只能包含字母、数字、下划线和中文' });
      return;
    }
    
    this.setData({ isLoading: true, errorMessage: '' });
    
    // 调用更新用户名服务
    loginService.updateUserInfo({ username: username })
      .then(result => {
        this.setData({ isLoading: false });
        
        if (result.success) {
          // 更新成功
          this.setData({
            successMessage: '用户名更新成功',
            originalUsername: username
          });
          
          // 更新全局用户信息
          if (app.globalData.userInfo) {
            app.globalData.userInfo.name = username;
            if (app.globalData.userInfo.user_metadata) {
              app.globalData.userInfo.user_metadata.name = username;
            }
          }
          
          // 更新本地存储
          try {
            const storageUserInfo = wx.getStorageSync(app.STORAGE_KEYS.USER_INFO);
            if (storageUserInfo) {
              storageUserInfo.name = username;
              if (storageUserInfo.user_metadata) {
                storageUserInfo.user_metadata.name = username;
              }
              wx.setStorageSync(app.STORAGE_KEYS.USER_INFO, storageUserInfo);
            }
          } catch (e) {
            console.error('更新本地存储失败:', e);
          }
          
          // 延迟返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          // 更新失败
          this.setData({ errorMessage: result.message || '更新失败，请重试' });
        }
      })
      .catch(error => {
        console.error('更新用户名失败:', error);
        this.setData({
          isLoading: false,
          errorMessage: '网络异常，请检查网络连接后重试'
        });
      });
  },

  /**
   * 取消编辑
   */
  cancelEdit: function() {
    wx.navigateBack();
  }
});