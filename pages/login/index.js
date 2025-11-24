// 登录页面逻辑
// 引入Supabase认证服务
const { auth } = require('../../services/supabase');
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: false,
    errorMessage: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 检查是否已登录
    if (app.isAuthenticated()) {
      this.navigateToHome();
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 重置错误信息
    this.setData({
      errorMessage: ''
    });
  },

  /**
   * 微信一键登录
   */
  handleWechatLogin: function() {
    this.setData({ isLoading: true, errorMessage: '' });
    
    // 首先获取微信登录code
    wx.login({
      success: (res) => {
        if (res.code) {
          // 使用code调用Supabase微信登录
          auth.signInWithWechat(res.code)
            .then(result => {
              this.setData({ isLoading: false });
              
              if (result.success) {
                // 登录成功，更新用户信息和登录状态
                app.updateLoginStatus(
                  result.data.user,
                  result.data.access_token,
                  result.data.user.user_metadata.openid,
                  result.data.refresh_token
                );
                
                // 保存用户信息到本地存储
                app.saveUserInfo(result.data.user);
                
                wx.showToast({
                  title: '登录成功',
                  icon: 'success',
                  duration: 1500
                });
                
                // 延迟跳转到首页
                setTimeout(() => {
                  this.navigateToHome();
                }, 1500);
              } else {
                // 登录失败
                this.setData({ 
                  errorMessage: result.error || '登录失败，请重试' 
                });
              }
            })
            .catch(error => {
              console.error('登录过程中发生错误:', error);
              this.setData({ 
                isLoading: false,
                errorMessage: '网络异常，请检查网络连接后重试' 
              });
            });
        } else {
          this.setData({ 
            isLoading: false,
            errorMessage: '获取登录凭证失败，请重试' 
          });
        }
      },
      fail: (error) => {
        console.error('微信登录失败:', error);
        this.setData({ 
          isLoading: false,
          errorMessage: '微信登录失败，请重试' 
        });
      }
    });
  },



  /**
   * 跳转到首页
   */
  navigateToHome: function() {
    this.setData({
      isLoading: false
    });
    
    wx.switchTab({
      url: '/pages/home/index'
    });
  },

  /**
   * 显示隐私政策
   */
  showPrivacyPolicy: function() {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私保护，将严格保护您的个人信息安全...',
      showCancel: false
    });
  },

  /**
   * 显示用户协议
   */
  showUserAgreement: function() {
    wx.showModal({
      title: '用户协议',
      content: '欢迎使用农科助手小程序，请您仔细阅读用户协议...',
      showCancel: false
    });
  }
});