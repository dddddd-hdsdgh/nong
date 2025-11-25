// 微信登录服务模块
const app = getApp();
// 引入Supabase认证服务和用户关联函数
const { auth, linkAuthUserWithUsersTable, updateUserProfile } = require('./supabase');

/**
 * 微信一键登录
 * @param {Function} successCallback - 登录成功回调
 * @param {Function} failCallback - 登录失败回调
 */
function wechatLogin(successCallback, failCallback) {
  wx.showLoading({ title: '登录中...' });

  // 1. 调用微信登录接口获取code
  wx.login({
    success: (res) => {
      if (res.code) {
        // 2. 将code发送到后端获取openId和session_key
        exchangeCodeForToken(res.code, successCallback, failCallback);
      } else {
        wx.hideLoading();
        failCallback({ message: '微信登录失败: ' + res.errMsg });
      }
    },
    fail: (err) => {
      wx.hideLoading();
      failCallback({ message: '获取登录凭证失败: ' + err.errMsg });
    }
  });
}

/**
 * 用code换取token和用户信息
 * @param {string} code - 微信登录code
 * @param {Function} successCallback - 成功回调
 * @param {Function} failCallback - 失败回调
 */
function exchangeCodeForToken(code, successCallback, failCallback) {
  // 模拟网络请求延迟
  setTimeout(() => {
    // 模拟成功响应
    const mockResponse = {
      data: {
        openId: 'mock_openid_' + Math.random().toString(36).substring(2, 15),
        token: 'mock_token_' + Math.random().toString(36).substring(2, 20),
        userInfo: {
          user_id: 'user_' + Math.floor(Math.random() * 1000000),
          name: '微信用户',
          avatar_url: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTK5F62eGpibIcMia1ibkE8lV3Bc7P9icWk9p27gYibWbY6U6XkUicNlJ1FZv/132'
        }
      }
    };

    // 更新全局登录状态
    app.updateLoginStatus(
      mockResponse.data.userInfo,
      mockResponse.data.token,
      mockResponse.data.openId
    );
    
    // 将用户信息关联到自定义users表
    linkAuthUserWithUsersTable(mockResponse.data.userInfo)
      .then(linkResult => {
        console.log('微信登录用户关联结果:', linkResult);
        wx.hideLoading();
        successCallback(mockResponse.data);
      })
      .catch(error => {
        console.error('关联用户时发生错误:', error);
        // 即使关联失败，也让登录流程继续
        wx.hideLoading();
        successCallback(mockResponse.data);
      });
  }, 1000);
}

/**
 * 获取用户授权信息
 * @param {Function} successCallback - 成功回调
 * @param {Function} failCallback - 失败回调
 */
function getUserProfile(successCallback, failCallback) {
  wx.getUserProfile({
    desc: '用于完善用户资料',
    success: (res) => {
      successCallback(res.userInfo);
    },
    fail: (err) => {
      failCallback({ message: '获取用户信息授权失败: ' + err.errMsg });
    }
  });
}

/**
 * 刷新token
 * @param {Function} successCallback - 成功回调
 * @param {Function} failCallback - 失败回调
 */
function refreshToken(successCallback, failCallback) {
  const refreshToken = wx.getStorageSync('refreshToken');
  if (!refreshToken) {
    failCallback({ message: '没有可用的refresh token' });
    return;
  }

  // 注意：实际实现时需要调用真实的刷新token API
  // 当前为模拟实现
  setTimeout(() => {
    failCallback({ message: '刷新token功能尚未实现' });
  }, 500);
}

/**
 * 邮箱加密码登录
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @param {Function} successCallback - 成功回调
 * @param {Function} failCallback - 失败回调
 */
function emailLogin(email, password, successCallback, failCallback) {
  wx.showLoading({ title: '登录中...' });

  auth.signInWithEmail(email, password)
    .then(result => {
      wx.hideLoading();
      
      if (result.success) {
        // 登录成功，更新用户信息和登录状态
        const userInfo = {
          user_id: result.data.user.id,
          name: result.data.user.user_metadata.name || '用户',
          avatar_url: result.data.user.user_metadata.avatar_url,
          email: result.data.user.email
        };
        
        app.updateLoginStatus(
          userInfo,
          result.data.access_token,
          userInfo.user_id,
          result.data.refresh_token
        );
        
        // 保存用户信息到本地存储
        app.saveUserInfo(userInfo);
        
        // 将用户信息关联到自定义users表
        linkAuthUserWithUsersTable(userInfo)
          .then(linkResult => {
            console.log('邮箱登录用户关联结果:', linkResult);
            successCallback(result.data);
          })
          .catch(error => {
            console.error('关联用户时发生错误:', error);
            // 即使关联失败，也让登录流程继续
            successCallback(result.data);
          });
      } else {
        // 登录失败
        failCallback({ message: result.error || '登录失败，请重试' });
      }
    })
    .catch(error => {
      wx.hideLoading();
      console.error('邮箱登录失败:', error);
      failCallback({ message: '网络异常，请检查网络连接后重试' });
    });
}

/**
 * 邮箱注册
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @param {string} name - 用户名（可选）
 * @param {Function} successCallback - 成功回调
 * @param {Function} failCallback - 失败回调
 */
function emailRegister(email, password, name = '', successCallback, failCallback) {
  wx.showLoading({ title: '注册中...' });

  auth.signUpWithEmail(email, password, name)
    .then(result => {
      wx.hideLoading();
      
      if (result.success) {
        // 注册成功后，尝试自动登录以获取完整用户信息
        auth.signInWithEmail(email, password)
          .then(loginResult => {
            if (loginResult.success) {
              const userInfo = {
                user_id: loginResult.data.user.id,
                name: name || '新用户',
                email: email,
                avatar_url: loginResult.data.user.user_metadata?.avatar_url
              };
              
              // 将用户信息关联到自定义users表
              linkAuthUserWithUsersTable(userInfo)
                .then(linkResult => {
                  console.log('注册用户关联结果:', linkResult);
                  successCallback(result.data);
                })
                .catch(error => {
                  console.error('关联注册用户时发生错误:', error);
                  // 即使关联失败，也让注册流程继续
                  successCallback(result.data);
                });
            } else {
              // 自动登录失败，但注册本身成功了
              successCallback(result.data);
            }
          })
          .catch(error => {
            console.error('注册后自动登录失败:', error);
            // 即使自动登录失败，也让注册流程继续
            successCallback(result.data);
          });
      } else {
        // 注册失败
        failCallback({ message: result.error || '注册失败，请重试' });
      }
    })
    .catch(error => {
      wx.hideLoading();
      console.error('邮箱注册失败:', error);
      failCallback({ message: '网络异常，请检查网络连接后重试' });
    });
}

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @returns {object} 验证结果
 */
function validatePassword(password) {
  if (password.length < 6) {
    return { valid: false, message: '密码长度至少6位' };
  }
  return { valid: true, message: '' };
}

/**
 * 更新用户信息（包括用户名）
 * @param {string} userId - 用户ID
 * @param {Object} userData - 要更新的用户数据
 * @param {Function} successCallback - 成功回调
 * @param {Function} failCallback - 失败回调
 */
function updateUserInfo(userId, userData, successCallback, failCallback) {
  updateUserProfile(userId, userData)
    .then(result => {
      if (result.success) {
        // 更新本地存储的用户信息
        const currentUserInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
        const updatedUserInfo = { ...currentUserInfo, ...userData };
        
        app.globalData.userInfo = updatedUserInfo;
        wx.setStorageSync('userInfo', updatedUserInfo);
        
        successCallback(result);
      } else {
        failCallback({ message: result.error || '更新用户信息失败' });
      }
    })
    .catch(error => {
      console.error('更新用户信息失败:', error);
      failCallback({ message: '网络异常，请检查网络连接后重试' });
    });
}

module.exports = {
  wechatLogin,
  emailLogin,
  emailRegister,
  // 注意：phoneLogin和phoneRegister已被移除，请直接使用emailLogin和emailRegister
  // isValidPhone已被移除，因其未被使用
  getUserProfile,
  refreshToken,
  validatePassword,
  updateUserInfo
};