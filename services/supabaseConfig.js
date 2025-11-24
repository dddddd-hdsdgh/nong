// Supabase配置文件
const SUPABASE_CONFIG = {
  // 实际使用时请替换为您的Supabase项目信息
  URL: 'https://your-supabase-url.supabase.co',
  API_KEY: 'your-supabase-api-key',
  ANON_KEY: 'your-supabase-anon-key',
  SERVICE_ROLE_KEY: 'your-supabase-service-role-key' // 仅用于服务器端
};

/**
 * 获取Supabase配置信息
 * @returns {Object} Supabase配置对象
 */
function getSupabaseConfig() {
  return SUPABASE_CONFIG;
}

/**
 * 获取Supabase请求头
 * @param {boolean} requireAuth - 是否需要认证token
 * @returns {Object} 请求头对象
 */
function getSupabaseHeaders(requireAuth = false) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_CONFIG.API_KEY
  };

  if (requireAuth) {
    const token = wx.getStorageSync('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

module.exports = {
  getSupabaseConfig,
  getSupabaseHeaders
};