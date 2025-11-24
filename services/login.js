// 微信登录服务模块
const app = getApp();

// 模拟Supabase配置
const SUPABASE_CONFIG = {
  API_URL: 'https://your-supabase-url.supabase.co',
  API_KEY: 'your-supabase-api-key'
};

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
  // 在实际应用中，这里应该调用您的后端API
  // 由于没有实际后端，这里模拟一个响应
  
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

    wx.hideLoading();
    successCallback(mockResponse.data);
  }, 1000);

  // 实际应用中的代码（注释掉）
  /*
  wx.request({
    url: SUPABASE_CONFIG.API_URL + '/auth/v1/token?grant_type=wechat',
    method: 'POST',
    data: {
      code: code
    },
    header: {
      'apikey': SUPABASE_CONFIG.API_KEY,
      'Content-Type': 'application/json'
    },
    success: (res) => {
      if (res.data && res.data.access_token) {
        // 获取用户信息
        getUserInfo(res.data.access_token, successCallback, failCallback);
      } else {
        wx.hideLoading();
        failCallback({ message: '获取token失败: ' + (res.data?.message || '未知错误') });
      }
    },
    fail: (err) => {
      wx.hideLoading();
      failCallback({ message: '网络请求失败: ' + err.errMsg });
    }
  });
  */
}

/**
 * 获取用户信息
 * @param {string} token - 认证token
 * @param {Function} successCallback - 成功回调
 * @param {Function} failCallback - 失败回调
 */
function getUserInfo(token, successCallback, failCallback) {
  // 实际应用中的代码（注释掉）
  /*
  wx.request({
    url: SUPABASE_CONFIG.API_URL + '/auth/v1/user',
    method: 'GET',
    header: {
      'Authorization': 'Bearer ' + token,
      'apikey': SUPABASE_CONFIG.API_KEY
    },
    success: (res) => {
      if (res.data) {
        wx.hideLoading();
        // 保存用户信息到全局
        const userInfo = {
          user_id: res.data.id,
          name: res.data.user_metadata?.name || '微信用户',
          avatar_url: res.data.user_metadata?.avatar_url
        };
        
        // 更新登录状态
        app.updateLoginStatus(userInfo, token, res.data.user_metadata?.openid);
        successCallback({ userInfo, token, openId: res.data.user_metadata?.openid });
      } else {
        wx.hideLoading();
        failCallback({ message: '获取用户信息失败' });
      }
    },
    fail: (err) => {
      wx.hideLoading();
      failCallback({ message: '获取用户信息网络请求失败: ' + err.errMsg });
    }
  });
  */
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

  // 实际应用中的代码（注释掉）
  /*
  wx.request({
    url: SUPABASE_CONFIG.API_URL + '/auth/v1/token?grant_type=refresh_token',
    method: 'POST',
    data: {
      refresh_token: refreshToken
    },
    header: {
      'apikey': SUPABASE_CONFIG.API_KEY,
      'Content-Type': 'application/json'
    },
    success: (res) => {
      if (res.data && res.data.access_token) {
        // 更新token
        app.globalData.token = res.data.access_token;
        wx.setStorageSync('token', res.data.access_token);
        
        if (res.data.refresh_token) {
          wx.setStorageSync('refreshToken', res.data.refresh_token);
        }
        
        successCallback(res.data);
      } else {
        failCallback({ message: '刷新token失败' });
      }
    },
    fail: (err) => {
      failCallback({ message: '刷新token网络请求失败: ' + err.errMsg });
    }
  });
  */
}

module.exports = {
  wechatLogin,
  getUserProfile,
  refreshToken
};