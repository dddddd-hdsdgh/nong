// 注册页面逻辑
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
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 重置表单数据
    this.setData({
      errorMessage: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  },

  /**
   * 处理用户名输入
   */
  onUsernameInput: function(e) {
    this.setData({
      username: e.detail.value
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
   * 处理确认密码输入
   */
  onConfirmPasswordInput: function(e) {
    this.setData({
      confirmPassword: e.detail.value
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
   * 切换确认密码可见性
   */
  toggleConfirmPasswordVisibility: function() {
    this.setData({
      showConfirmPassword: !this.data.showConfirmPassword
    });
  },

  /**
   * 处理注册
   */
  handleRegister: function() {
    const { username, email, password, confirmPassword } = this.data;
    
    // 表单验证
    if (!username) {
      this.setData({ errorMessage: '请输入用户名' });
      return;
    }
    
    // 验证用户名格式
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
    
    if (!confirmPassword) {
      this.setData({ errorMessage: '请确认密码' });
      return;
    }
    
    if (password !== confirmPassword) {
      this.setData({ errorMessage: '两次输入的密码不一致' });
      return;
    }
    
    this.setData({ isLoading: true, errorMessage: '' });
    
    // 调用邮箱注册，传递用户名
    loginService.emailRegister(
      email,
      password,
      username, // 传递用户名
      (data) => {
        // 注册成功
        wx.showToast({
          title: '注册成功',
          icon: 'success',
          duration: 1500
        });
        
        // 延迟返回登录页面
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      },
      (error) => {
        // 注册失败
        this.setData({
          isLoading: false,
          errorMessage: error.message || '注册失败，请重试'
        });
      }
    );
  },

  /**
   * 返回登录页面
   */
  navigateBackToLogin: function() {
    wx.navigateBack();
  }
});