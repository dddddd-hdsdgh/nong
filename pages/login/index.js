// 登录页面逻辑
// 引入Supabase认证服务
const { auth } = require('../../services/supabase');
// 引入登录服务
const loginService = require('../../services/login');
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: false,
    errorMessage: '',
    loginType: 'email', // email 或 wechat
    email: '',
    password: '',
    showPassword: false
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
    // 重置错误信息和表单数据
    this.setData({
      errorMessage: '',
      email: '',
      password: ''
    });
  },
  
  /**
   * 切换到邮箱登录
   */
  switchToEmailLogin: function() {
    this.setData({
      loginType: 'email',
      errorMessage: ''
    });
  },
  
  /**
   * 切换到微信登录
   */
  switchToWechatLogin: function() {
    this.setData({
      loginType: 'wechat',
      errorMessage: ''
    });
  },
  
  /**
   * 处理邮箱输入
   */
  onEmailInput: function(e) {
    this.setData({
      email: e.detail.value
    });
  },
  
  /**
   * 处理密码输入
   */
  onPasswordInput: function(e) {
    this.setData({
      password: e.detail.value
    });
  },
  
  /**
   * 切换密码可见性
   */
  togglePasswordVisibility: function() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },
  
  /**
   * 处理邮箱登录
   */
  handleEmailLogin: function() {
    const { email, password } = this.data;
    
    // 表单验证
    if (!email) {
      this.setData({ errorMessage: '请输入邮箱' });
      return;
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.setData({ errorMessage: '邮箱格式不正确' });
      return;
    }
    
    if (!password) {
      this.setData({ errorMessage: '请输入密码' });
      return;
    }
    
    const passwordValidation = loginService.validatePassword(password);
    if (!passwordValidation.valid) {
      this.setData({ errorMessage: passwordValidation.message });
      return;
    }
    
    this.setData({ isLoading: true, errorMessage: '' });
    
    // 调用邮箱登录
    loginService.emailLogin(
      email,
      password,
      (data) => {
        // 登录成功
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });
        
        // 延迟跳转到首页
        setTimeout(() => {
          this.navigateToHome();
        }, 1500);
      },
      (error) => {
        // 登录失败
        this.setData({
          isLoading: false,
          errorMessage: error.message || '登录失败，请重试'
        });
      }
    );
  },
  
  /**
   * 跳转到注册页面
   */
  navigateToRegister: function() {
    wx.navigateTo({
      url: '/pages/register/index'
    });
  },
  
  /**
   * 忘记密码
   */
  forgotPassword: function() {
    wx.showModal({
      title: '提示',
      content: '忘记密码功能开发中，敬请期待！',
      showCancel: false
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