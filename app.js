// 微信小程序全局入口文件
App({
  // 全局数据对象，用于存储登录状态和用户信息
  globalData: {
    userInfo: null,       // 用户信息
    isLoggedIn: false,    // 登录状态
    token: null,          // 认证令牌
    openId: null,         // 用户唯一标识
    refreshToken: null    // 刷新令牌
  },
  
  // 本地存储键名常量，便于统一管理
  STORAGE_KEYS: {
    USER_INFO: 'userInfo',
    TOKEN: 'token',
    OPEN_ID: 'openId',
    REFRESH_TOKEN: 'refreshToken',
    LOGIN_STATUS: 'isLoggedIn'
  },

  /**
   * 应用初始化时执行
   * 检查用户登录状态
   */
  onLaunch: function() {
    console.log('应用启动');
    
    // 检查本地存储的登录状态
    this.checkLoginStatus();
    
    // 监听网络状态变化
    this.networkListener();
  },
  
  /**
   * 保存用户信息到全局和本地存储
   * @param {Object} userInfo - 用户信息对象
   */
  saveUserInfo: function(userInfo) {
    if (!userInfo) return;
    
    // 更新全局数据
    this.globalData.userInfo = userInfo;
    
    // 保存到本地存储
    try {
      wx.setStorageSync(this.STORAGE_KEYS.USER_INFO, userInfo);
    } catch (error) {
      console.error('保存用户信息到本地失败:', error);
    }
  },
  
  /**
   * 从本地存储加载用户信息
   * @returns {Object|null} 用户信息对象或null
   */
  loadUserInfoFromStorage: function() {
    try {
      const userInfo = wx.getStorageSync(this.STORAGE_KEYS.USER_INFO);
      if (userInfo) {
        this.globalData.userInfo = userInfo;
      }
      return userInfo;
    } catch (error) {
      console.error('从本地加载用户信息失败:', error);
      return null;
    }
  },

  /**
   * 检查用户登录状态
   * 从本地存储获取用户信息和token
   */
  checkLoginStatus: function() {
    try {
      const userInfo = wx.getStorageSync(this.STORAGE_KEYS.USER_INFO);
      const token = wx.getStorageSync(this.STORAGE_KEYS.TOKEN);
      const openId = wx.getStorageSync(this.STORAGE_KEYS.OPEN_ID);
      const refreshToken = wx.getStorageSync(this.STORAGE_KEYS.REFRESH_TOKEN);
      const isLoggedIn = wx.getStorageSync(this.STORAGE_KEYS.LOGIN_STATUS);
      
      if (userInfo && token && openId) {
        this.globalData.userInfo = userInfo;
        this.globalData.token = token;
        this.globalData.openId = openId;
        this.globalData.isLoggedIn = true;
        
        if (refreshToken) {
          this.globalData.refreshToken = refreshToken;
        }
        
        console.log('用户已登录');
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
    }
  },

  /**
   * 登录成功后更新全局状态
   * @param {Object} userInfo - 用户信息
   * @param {string} token - 认证令牌
   * @param {string} openId - 用户唯一标识
   * @param {string} refreshToken - 刷新令牌（可选）
   */
  updateLoginStatus: function(userInfo, token, openId, refreshToken = null) {
    this.globalData.userInfo = userInfo;
    this.globalData.token = token;
    this.globalData.openId = openId;
    this.globalData.isLoggedIn = true;
    
    if (refreshToken) {
      this.globalData.refreshToken = refreshToken;
    }
    
    // 存储到本地
    try {
      wx.setStorageSync(this.STORAGE_KEYS.USER_INFO, userInfo);
      wx.setStorageSync(this.STORAGE_KEYS.TOKEN, token);
      wx.setStorageSync(this.STORAGE_KEYS.OPEN_ID, openId);
      wx.setStorageSync(this.STORAGE_KEYS.LOGIN_STATUS, true);
      
      if (refreshToken) {
        wx.setStorageSync(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
    } catch (error) {
      console.error('保存登录状态到本地失败:', error);
    }
  },

  /**
   * 登出功能
   */
  logout: function() {
    // 清除全局数据
    this.globalData.userInfo = null;
    this.globalData.token = null;
    this.globalData.openId = null;
    this.globalData.refreshToken = null;
    this.globalData.isLoggedIn = false;
    
    // 清除本地存储
    try {
      wx.removeStorageSync(this.STORAGE_KEYS.USER_INFO);
      wx.removeStorageSync(this.STORAGE_KEYS.TOKEN);
      wx.removeStorageSync(this.STORAGE_KEYS.OPEN_ID);
      wx.removeStorageSync(this.STORAGE_KEYS.REFRESH_TOKEN);
      wx.removeStorageSync(this.STORAGE_KEYS.LOGIN_STATUS);
    } catch (error) {
      console.error('清除登录信息失败:', error);
    }
    
    console.log('用户已登出');
  },
  
  /**
   * 获取当前登录用户信息
   * @returns {Object|null} 用户信息对象或null
   */
  getCurrentUser: function() {
    return this.globalData.userInfo;
  },
  
  /**
   * 获取刷新令牌
   * @returns {string|null} 刷新令牌字符串或null
   */
  getRefreshToken: function() {
    return this.globalData.refreshToken;
  },

  /**
   * 网络状态监听
   */
  networkListener: function() {
    wx.onNetworkStatusChange((res) => {
      if (!res.isConnected) {
        wx.showToast({
          title: '网络连接已断开',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 获取当前登录用户信息
   */
  getUserInfo: function() {
    return this.globalData.userInfo;
  },

  /**
   * 检查是否已登录
   */
  isAuthenticated: function() {
    return this.globalData.isLoggedIn;
  },

  /**
   * 获取认证令牌
   */
  getToken: function() {
    return this.globalData.token;
  }
});