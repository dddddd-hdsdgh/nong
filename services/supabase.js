// Supabase 配置和初始化
const SUPABASE_URL = 'https://wetcvycrvmzzzerqmtja.supabase.co'; // 请替换为实际的Supabase项目URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldGN2eWNydm16enplcnFtdGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDYzNzIsImV4cCI6MjA3OTM4MjM3Mn0.HLFooE7gTkc46HS_9yEatb-Rajc9sDh1KnHzaGPVDEQ'; // 请替换为实际的匿名密钥
const app = getApp();
const USER_AUTH_COLUMN_CANDIDATES = ['auth_uid', 'auth_id'];
let detectedUserAuthColumn = null;

/**
 * 初始化Supabase客户端
 * @returns {Object} Supabase客户端实例
 */
function createClient() {
  // 在微信小程序环境中，可以使用wx.request来实现API调用
  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    
    /**
     * 发送HTTP请求到Supabase API
     * @param {string} path - API路径
     * @param {Object} options - 请求选项
     * @param {boolean} requireAuth - 是否需要认证
     * @returns {Promise} 请求结果
     */
    async fetch(path, options = {}, requireAuth = false) {
      const requestOptions = { ...options };
      const hasRetried = !!requestOptions.__retried;
      delete requestOptions.__retried;

      // 构建请求头
      const headers = {
        'Content-Type': 'application/json',
        'apikey': this.anonKey,
        ...requestOptions.header
      };
      
      // 如果需要认证，添加Authorization头
      if (requireAuth) {
        const token = app.getToken() || this.anonKey;
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['Authorization'] = `Bearer ${this.anonKey}`;
      }
      
      return new Promise((resolve, reject) => {
        wx.request({
          url: `${this.url}${path}`,
          header: headers,
          method: requestOptions.method || 'GET',
          data: requestOptions.body,
          success: (res) => {
            // 处理401错误（token过期）
            if (res.statusCode === 401 && requireAuth) {
              if (hasRetried) {
                app.logout();
                reject(new Error('登录已过期，请重新登录'));
                return;
              }
              // 尝试刷新token
              auth.refreshToken().then(refreshResult => {
                if (refreshResult.success) {
                  // 刷新成功后重试请求
                  this.fetch(path, { ...options, __retried: true }, requireAuth).then(resolve).catch(reject);
                } else {
                  // 刷新失败，清除登录状态
                  app.logout();
                  reject(new Error('登录已过期，请重新登录'));
                }
              }).catch(() => {
                app.logout();
                reject(new Error('登录已过期，请重新登录'));
              });
            } else if (res.statusCode >= 400) {
              // 处理其他错误状态码
              console.error('API请求失败:', res.statusCode, res.data);
              reject(new Error(res.data?.message || `请求失败: ${res.statusCode}`));
            } else {
              resolve(res.data);
            }
          },
          fail: (err) => reject(err)
        });
      });
    },

    /**
     * 发送POST请求
     */
    async post(path, data) {
      return this.fetch(path, {
        method: 'POST',
        body: data
      });
    },

    /**
     * 发送GET请求
     */
    async get(path, params) {
      if (!params || Object.keys(params).length === 0) {
        return this.fetch(path);
      }
      
      // 构建查询字符串，确保正确编码
      const queryParts = Object.keys(params).map(key => {
        const value = params[key];
        // 对于 Supabase PostgREST，某些操作符（如 eq.）不应该被完全编码
        // 但值部分需要编码
        if (typeof value === 'string' && value.includes('.')) {
          // 处理操作符格式，如 "eq.value"
          const parts = value.split('.');
          if (parts.length === 2) {
            const operator = parts[0]; // eq, neq, gt, etc.
            const val = parts[1];
            return `${encodeURIComponent(key)}=${operator}.${encodeURIComponent(val)}`;
          }
        }
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      });
      
      const queryString = '?' + queryParts.join('&');
      console.log('构建的查询URL:', path + queryString);
      return this.fetch(path + queryString);
    },

    /**
     * 发送PUT请求
     */
    async put(path, data) {
      return this.fetch(path, {
        method: 'PUT',
        body: data
      });
    },

    /**
     * 发送DELETE请求
     */
    async delete(path) {
      return this.fetch(path, {
        method: 'DELETE'
      });
    }
  };
}

// 创建Supabase客户端实例
const supabase = createClient();

// 导出基础数据库服务
const db = {
  /**
   * 查询表数据
   * @param {string} table - 表名
   * @param {Object} query - 查询参数
   */
  async select(table, query = {}) {
    try {
      // 构建 Supabase PostgREST 风格的查询参数
      const params = {};
      
      // 处理过滤条件（如 category_id=xxx）
      Object.keys(query).forEach(key => {
        // 跳过特殊参数
        if (['limit', 'offset', 'order', 'select'].includes(key)) {
          return;
        }
        
        const value = query[key];
        
        // 检查值是否已经是操作符格式（如 ilike.*keyword*）
        if (typeof value === 'string' && value.includes('.')) {
          // 已经是操作符格式，直接使用
          params[`${key}`] = value;
        } else {
          // 使用 eq 操作符进行等值查询
          // Supabase PostgREST 格式: column=eq.value
          params[`${key}`] = `eq.${value}`;
        }
      });
      
      // 添加 limit 和 offset
      if (query.limit !== undefined) {
        params.limit = query.limit;
      }
      if (query.offset !== undefined) {
        params.offset = query.offset;
      }
      
      // 添加排序
      if (query.order) {
        // order 格式: "column.desc" 或 "column.asc"
        // Supabase 需要格式: order=column.desc
        params.order = query.order;
      }
      
      // 添加 select（字段选择）
      if (query.select) {
        // select 格式: "id" 或 "id,title,content"
        params.select = query.select;
      }
      
      console.log('Supabase 查询参数:', params);
      
      let response;
      try {
        response = await supabase.get(`/rest/v1/${table}`, params);
      } catch (error) {
        console.error('Supabase GET 请求失败:', error);
        return [];
      }
      
      // 确保返回的是数组 - 多重检查
      if (response === null || response === undefined) {
        console.warn('Supabase 返回 null 或 undefined');
        return [];
      }
      
      if (!Array.isArray(response)) {
        console.warn('Supabase 返回的数据不是数组:', response, typeof response);
        // 如果返回的是对象，尝试提取数据
        if (response && typeof response === 'object' && response.data) {
          if (Array.isArray(response.data)) {
            return response.data;
          }
        }
        return [];
      }
      
      return response;
    } catch (error) {
      console.error('数据库查询失败:', error);
      // 返回空数组而不是抛出错误，避免页面崩溃
      return [];
    }
  },

  /**
   * 插入数据
   * @param {string} table - 表名
   * @param {Object|Array} data - 要插入的数据
   */
  async insert(table, data) {
    try {
      const response = await supabase.post(`/rest/v1/${table}`, data);
      return response;
    } catch (error) {
      console.error('数据库插入失败:', error);
      throw error;
    }
  },

  /**
   * 更新数据
   * @param {string} table - 表名
   * @param {string} id - 记录ID
   * @param {Object} data - 要更新的数据
   */
  async update(table, id, data) {
    try {
      const response = await supabase.put(`/rest/v1/${table}/${id}`, data);
      return response;
    } catch (error) {
      console.error('数据库更新失败:', error);
      throw error;
    }
  },

  /**
   * 删除数据
   * @param {string} table - 表名
   * @param {string} id - 记录ID
   */
  async delete(table, id) {
    try {
      const response = await supabase.delete(`/rest/v1/${table}/${id}`);
      return response;
    } catch (error) {
      console.error('数据库删除失败:', error);
      throw error;
    }
  }
};

// 导出存储服务（用于图片等文件存储）
const storage = {
  /**
   * 上传文件
   * @param {string} bucket - 存储桶名称
   * @param {string} path - 文件路径
   * @param {string} base64Data - Base64编码的文件数据
   */
  async upload(bucket, path, base64Data) {
    try {
      // 这里简化实现，实际需要根据Supabase存储API进行调整
      const response = await supabase.post(`/storage/v1/object/${bucket}/${path}`, {
        file: base64Data
      });
      return response;
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error;
    }
  },

  /**
   * 获取文件URL
   * @param {string} bucket - 存储桶名称
   * @param {string} path - 文件路径
   */
  async getPublicUrl(bucket, path) {
    return `${supabase.url}/storage/v1/object/public/${bucket}/${path}`;
  }
};

// 导出认证服务
const auth = {
  /**
   * 邮箱加密码登录
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @returns {Promise} 登录结果
   */
  async signInWithEmail(email, password) {
    try {
      // 使用实际Supabase API调用
      const response = await supabase.post('/auth/v1/token?grant_type=password', {
        email: email,
        password: password
      });

      if (response.access_token) {
        // 存储token
        app.globalData.token = response.access_token;
        wx.setStorageSync('token', response.access_token);
        
        if (response.refresh_token) {
          wx.setStorageSync('refreshToken', response.refresh_token);
        }

        // 更新用户信息
        const userInfo = {
          user_id: response.user.id,
          name: response.user.user_metadata?.name || '用户',
          avatar_url: response.user.user_metadata?.avatar_url,
          email: response.user.email
        };
        
        app.updateLoginStatus(userInfo, response.access_token, userInfo.user_id);
        
        return { success: true, data: response };
      }
      
      return { success: false, error: response.error || '登录失败' };
      
      /* 模拟数据（已注释，使用实际API调用）
      return Promise.resolve({
        success: true,
        data: {
          access_token: 'mock_token_' + Math.random().toString(36).substring(2, 20),
          refresh_token: 'mock_refresh_token_' + Math.random().toString(36).substring(2, 20),
          user: {
            id: 'user_' + Math.floor(Math.random() * 1000000),
            email: email,
            user_metadata: {
              name: '用户',
              avatar_url: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTK5F62eGpibIcMia1ibkE8lV3Bc7P9icWk9p27gYibWbY6U6XkUicNlJ1FZv/132'
            }
          }
        }
      });
      */
    } catch (error) {
      console.error('邮箱登录失败:', error);
      return { success: false, error: error.message || '网络请求失败' };
    }
  },
  


  /**
   * 邮箱注册新用户
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @param {string} name - 用户名（可选）
   * @returns {Promise} 注册结果
   */
  async signUpWithEmail(email, password, name = '') {
    try {
      // 使用实际Supabase API调用
      const response = await supabase.post('/auth/v1/signup', {
        email: email,
        password: password,
        data: {
          name: name || '新用户'
        }
      });

      if (response.user) {
        return { success: true, data: response };
      }
      
      return { success: false, error: response.error || '注册失败' };
      
      /* 模拟数据（已注释，使用实际API调用）
      return Promise.resolve({
        success: true,
        data: {
          user: {
            id: 'user_' + Math.floor(Math.random() * 1000000),
            email: email,
            user_metadata: {
              name: name || '新用户',
              avatar_url: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTK5F62eGpibIcMia1ibkE8lV3Bc7P9icWk9p27gYibWbY6U6XkUicNlJ1FZv/132'
            }
          }
        }
      });
      */
    } catch (error) {
      console.error('邮箱注册失败:', error);
      return { success: false, error: error.message || '网络请求失败' };
    }
  },
  


  /**
   * 微信一键登录
   * @param {string} code - 微信登录code
   * @returns {Promise} 登录结果
   */
  async signInWithWechat(code) {
    try {
      // 使用模拟数据进行开发测试
      // 实际生产环境中应使用下面注释的代码调用Supabase API
      
      // 模拟登录响应
      return Promise.resolve({
        success: true,
        data: {
          access_token: 'mock_token_' + Math.random().toString(36).substring(2, 20),
          refresh_token: 'mock_refresh_token_' + Math.random().toString(36).substring(2, 20),
          user: {
            id: 'user_' + Math.floor(Math.random() * 1000000),
            user_metadata: {
              name: '微信用户',
              avatar_url: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTK5F62eGpibIcMia1ibkE8lV3Bc7P9icWk9p27gYibWbY6U6XkUicNlJ1FZv/132',
              openid: 'mock_openid_' + Math.random().toString(36).substring(2, 15)
            }
          }
        }
      });
      
      /* 实际生产环境使用的代码
      const response = await supabase.post('/auth/v1/token?grant_type=wechat', {
        code: code
      });

      if (response.access_token) {
        // 存储token
        app.globalData.token = response.access_token;
        wx.setStorageSync('token', response.access_token);
        
        if (response.refresh_token) {
          wx.setStorageSync('refreshToken', response.refresh_token);
        }

        // 更新用户信息
        const userInfo = {
          user_id: response.user.id,
          name: response.user.user_metadata?.name || '微信用户',
          avatar_url: response.user.user_metadata?.avatar_url,
          openId: response.user.user_metadata?.openid
        };
        
        app.updateLoginStatus(userInfo, response.access_token, userInfo.openId);
        
        return { success: true, data: response };
      }
      
      return { success: false, error: response.error || '登录失败' };
      */
    } catch (error) {
      console.error('微信登录失败:', error);
      return { success: false, error: error.message || '网络请求失败' };
    }
  },

  /**
   * 获取当前用户信息
   * @returns {Promise} 用户信息
   */
  async getCurrentUser() {
    try {
      // 模拟用户信息响应
      const userInfo = {
        id: 'user_' + Math.floor(Math.random() * 1000000),
        user_metadata: {
          name: '微信用户',
          avatar_url: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTK5F62eGpibIcMia1ibkE8lV3Bc7P9icWk9p27gYibWbY6U6XkUicNlJ1FZv/132',
          openid: 'mock_openid_' + Math.random().toString(36).substring(2, 15)
        }
      };
      
      return { 
        success: true, 
        data: {
          user_id: userInfo.id,
          name: userInfo.user_metadata.name,
          avatar_url: userInfo.user_metadata.avatar_url,
          openId: userInfo.user_metadata.openid
        } 
      };
      
      /* 实际生产环境使用的代码
      const response = await supabase.fetch('/auth/v1/user', {}, true);
      
      if (response.id) {
        const userInfo = {
          user_id: response.id,
          name: response.user_metadata?.name || '微信用户',
          avatar_url: response.user_metadata?.avatar_url,
          openId: response.user_metadata?.openid
        };
        
        app.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo);
        
        return { success: true, data: userInfo };
      }
      
      return { success: false, error: '获取用户信息失败' };
      */
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return { success: false, error: error.message || '网络请求失败' };
    }
  },

  /**
   * 刷新Token
   * @returns {Promise} 刷新结果
   */
  async refreshToken() {
    try {
      const refreshToken = wx.getStorageSync('refreshToken');
      if (!refreshToken) {
        return { success: false, error: '没有可用的refresh token' };
      }

      // 模拟刷新token响应
      const newToken = 'mock_token_' + Math.random().toString(36).substring(2, 20);
      const newRefreshToken = 'mock_refresh_token_' + Math.random().toString(36).substring(2, 20);
      
      app.globalData.token = newToken;
      wx.setStorageSync('token', newToken);
      wx.setStorageSync('refreshToken', newRefreshToken);
      
      return { 
        success: true, 
        data: {
          access_token: newToken,
          refresh_token: newRefreshToken
        } 
      };
      
      /* 实际生产环境使用的代码
      const response = await supabase.post('/auth/v1/token?grant_type=refresh_token', {
        refresh_token: refreshToken
      });

      if (response.access_token) {
        app.globalData.token = response.access_token;
        wx.setStorageSync('token', response.access_token);
        
        if (response.refresh_token) {
          wx.setStorageSync('refreshToken', response.refresh_token);
        }
        
        return { success: true, data: response };
      }
      
      return { success: false, error: '刷新token失败' };
      */
    } catch (error) {
      console.error('刷新token失败:', error);
      return { success: false, error: error.message || '网络请求失败' };
    }
  },

  /**
   * 退出登录
   * @returns {Promise} 退出结果
   */
  async signOut() {
    try {
      // 调用Supabase退出接口
      // await supabase.fetch('/auth/v1/logout', { method: 'POST' }, true);
      
      // 清除本地状态
      app.logout();
      return { success: true };
    } catch (error) {
      console.error('退出登录失败:', error);
      // 即使失败也清除本地状态
      app.logout();
      return { success: true };
    }
  }
};

// 为db服务添加带认证的方法，避免重复定义
Object.assign(db, {
  /**
   * 查询表数据（带认证）
   * @param {string} table - 表名
   * @param {Object} query - 查询参数
   */
  async selectWithAuth(table, query = {}) {
    try {
      // 复用select方法的参数处理逻辑，但使用带认证的fetch
      const params = {};
      
      // 处理过滤条件
      Object.keys(query).forEach(key => {
        if (['limit', 'offset', 'order', 'select'].includes(key)) return;
        
        const value = query[key];
        if (typeof value === 'string' && value.includes('.')) {
          params[`${key}`] = value;
        } else {
          params[`${key}`] = `eq.${value}`;
        }
      });
      
      // 添加分页和排序参数
      if (query.limit !== undefined) params.limit = query.limit;
      if (query.offset !== undefined) params.offset = query.offset;
      if (query.order) params.order = query.order;
      if (query.select) params.select = query.select;
      
      console.log('Supabase认证查询参数:', params);
      
      const queryString = Object.keys(params).length > 0 
        ? '?' + Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&')
        : '';
      
      const response = await supabase.fetch(`/rest/v1/${table}${queryString}`, { method: 'GET' }, true);
      return response;
    } catch (error) {
      console.error('数据库认证查询失败:', error);
      throw error;
    }
  },

  /**
   * 插入数据（带认证）
   * @param {string} table - 表名
   * @param {Object|Array} data - 要插入的数据
   */
  async insertWithAuth(table, data) {
    try {
      const response = await supabase.fetch(`/rest/v1/${table}`, {
        method: 'POST',
        body: data
      }, true);
      return response;
    } catch (error) {
      console.error('数据库认证插入失败:', error);
      throw error;
    }
  }
});

// 保留authDb别名以兼容旧代码
const authDb = {
  select: (...args) => db.selectWithAuth(...args),
  insert: (...args) => db.insertWithAuth(...args)
};

/**
 * 数据库操作通用错误处理包装器
 * @param {Function} operation - 要执行的数据库操作函数
 * @param {string} operationName - 操作名称（用于日志）
 * @param {Object} options - 选项配置
 * @returns {Promise} 操作结果
 */
async function dbOperationWithFallback(operation, operationName, options = {}) {
  try {
    // 优先使用带认证的数据库操作
    if (db && typeof db.insertWithAuth === 'function') {
      try {
        console.log(`✓ 尝试使用带认证的数据库操作: ${operationName}`);
        return await operation(db, 'withAuth');
      } catch (authError) {
        console.error(`✗ 带认证的数据库操作失败: ${operationName}`, authError);
        // 允许降级到普通数据库操作
      }
    }
    
    // 如果带认证的操作失败或不存在，使用普通数据库操作
    if (db) {
      try {
        console.log(`✓ 尝试使用普通数据库操作: ${operationName}`);
        return await operation(db, 'normal');
      } catch (dbError) {
        console.error(`✗ 普通数据库操作失败: ${operationName}`, dbError);
        return { success: false, error: options.errorMessage || '数据库操作失败' };
      }
    }
    
    return { success: false, error: '数据库服务不可用' };
  } catch (error) {
    console.error(`✗ 数据库操作过程中发生未捕获错误: ${operationName}`, error);
    return { success: false, error: error.message };
  }
}

function isMissingAuthColumnError(error, column) {
  const message = (error && error.message) || error?.toString?.() || '';
  return message.includes(`users.${column}`) && message.includes('does not exist');
}

async function selectUsersByAuthColumn(dbService, methodName, userId) {
  if (typeof dbService[methodName] !== 'function') {
    return { column: detectedUserAuthColumn, list: [] };
  }

  let lastError = null;
  for (const column of USER_AUTH_COLUMN_CANDIDATES) {
    const params = {};
    params[column] = userId;
    try {
      const result = await dbService[methodName]('users', params);
      detectedUserAuthColumn = column;
      return { column, list: Array.isArray(result) ? result : [] };
    } catch (error) {
      if (isMissingAuthColumnError(error, column)) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return { column: detectedUserAuthColumn, list: [] };
}

function buildUserData(userInfo, column) {
  const authColumn = column || detectedUserAuthColumn || USER_AUTH_COLUMN_CANDIDATES[0];
  return {
    [authColumn]: userInfo.user_id,
    username: userInfo.name || '新用户',
    avatar_url: userInfo.avatar_url || '',
    open_id: userInfo.openId || `email_${userInfo.user_id}`,
    identity: '农户',
    location: '',
    level: 1
  };
}

/**
 * 将认证用户与users表关联，并返回用户记录
 * @param {Object} userInfo - 用户信息对象
 * @returns {Promise} 关联结果
 */
async function linkAuthUserWithUsersTable(userInfo) {
  console.log('开始关联认证用户与users表:', userInfo);
  
  if (!userInfo || !userInfo.user_id) {
    console.error('无效的用户信息：缺少user_id');
    return { success: false, error: '无效的用户信息：缺少user_id' };
  }

  return await dbOperationWithFallback(async (dbService, mode) => {
    const selectMethod = mode === 'withAuth' ? 'selectWithAuth' : 'select';
    const insertMethod = mode === 'withAuth' ? 'insertWithAuth' : 'insert';
    const updateMethod = 'update';

    const selection = await selectUsersByAuthColumn(dbService, selectMethod, userInfo.user_id);
    const authColumn = selection.column || detectedUserAuthColumn || USER_AUTH_COLUMN_CANDIDATES[0];
    let userRecord = selection.list && selection.list.length > 0 ? selection.list[0] : null;
    const userData = buildUserData(userInfo, authColumn);

    if (userRecord) {
      console.log('用户已存在，更新用户信息');
      if (typeof dbService[updateMethod] === 'function') {
        await dbService[updateMethod]('users', userRecord.id, userData);
      } else {
        await dbService[insertMethod]('users', { ...userData, id: userRecord.id });
      }
      userRecord = { ...userRecord, ...userData };
    } else {
      console.log('用户不存在，插入新记录');
      let insertError = null;
      let insertedRecord = null;

      for (const column of USER_AUTH_COLUMN_CANDIDATES) {
        const payload = buildUserData(userInfo, column);
        try {
          await dbService[insertMethod]('users', payload);
          detectedUserAuthColumn = column;
          const verify = await selectUsersByAuthColumn(dbService, selectMethod, userInfo.user_id);
          if (verify.list && verify.list.length > 0) {
            insertedRecord = verify.list[0];
            break;
          }
        } catch (error) {
          if (isMissingAuthColumnError(error, column)) {
            insertError = error;
            continue;
          }
          throw error;
        }
      }

      if (!insertedRecord) {
        if (insertError) {
          throw insertError;
        }
        console.error('无法插入用户记录');
        return { success: false, error: '无法插入用户记录' };
      }

      userRecord = insertedRecord;
    }

    if (!userRecord) {
      console.error('无法获取或创建用户记录');
      return { success: false, error: '无法获取用户记录' };
    }

    console.log(`✓ 成功关联用户（使用${mode === 'withAuth' ? '认证' : '普通'}数据库连接）`);
    return { success: true, data: userRecord };
  }, 'linkAuthUser', { errorMessage: '无法将用户数据保存到数据库' });
}

/**
 * 更新用户信息（包括用户名）
 * @param {string} userId - 用户ID
 * @param {Object} userData - 要更新的用户数据
 * @returns {Promise} 更新结果
 */
async function updateUserProfile(userId, userData) {
  console.log('开始更新用户信息:', userId, userData);
  
  // 参数验证
  if (!userId) {
    return { success: false, error: '用户ID不能为空' };
  }
  
  // 构建更新数据
  const updateData = {};
  
  // 只更新有效的字段
  if (userData.username) updateData.username = userData.username;
  if (userData.avatar_url) updateData.avatar_url = userData.avatar_url;
  if (userData.location) updateData.location = userData.location;
  if (userData.identity) updateData.identity = userData.identity;
  
  if (Object.keys(updateData).length === 0) {
    return { success: false, error: '没有要更新的数据' };
  }
  
  // 使用通用错误处理包装器执行数据库操作
  return await dbOperationWithFallback(async (dbService, mode) => {
    // 根据操作模式选择适当的方法
    const selectMethod = mode === 'withAuth' ? 'selectWithAuth' : 'select';
    const insertMethod = mode === 'withAuth' ? 'insertWithAuth' : 'insert';
    const updateMethod = 'update'; // update方法对于两种模式是相同的
    
    // 检查用户是否存在
    const existingUser = await dbService[selectMethod]('users', { id: userId });
    
    if (existingUser && Array.isArray(existingUser) && existingUser.length > 0) {
      // 优先使用update方法，如果不存在则使用insert（假设支持upsert）
      if (typeof dbService[updateMethod] === 'function') {
        await dbService[updateMethod]('users', userId, updateData);
      } else {
        await dbService[insertMethod]('users', { ...updateData, id: userId });
      }
      
      console.log(`✓ 成功更新用户信息（使用${mode === 'withAuth' ? '认证' : '普通'}数据库连接）`);
      return { success: true };
    } else {
      return { success: false, error: '用户不存在' };
    }
  }, 'updateUserProfile', { errorMessage: '更新用户信息失败' });
}

module.exports = {
  supabase,
  db,
  authDb,
  storage,
  auth,
  linkAuthUserWithUsersTable,
  updateUserProfile
};