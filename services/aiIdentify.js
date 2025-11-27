// AI识别服务 - 处理图片上传和任务创建
const { supabase, db, authDb, auth, linkAuthUserWithUsersTable } = require('./supabase');
const app = getApp();

/**
 * 上传图片到 Supabase Storage（带 token 刷新重试机制）
 * @param {string} filePath - 本地文件路径（微信小程序临时文件路径）
 * @param {string} bucket - 存储桶名称，默认为 'ai-images'
 * @param {boolean} isRetry - 是否为重试（内部使用）
 * @returns {Promise<Object>} 上传结果，包含 file_id 和 file_url
 */
async function uploadImageToStorage(filePath, bucket = 'ai-images', isRetry = false) {
  try {
    let token = app.getToken();
    if (!token) {
      throw new Error('用户未登录，无法上传图片');
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = filePath.split('.').pop() || 'jpg';
    const fileName = `${timestamp}_${randomStr}.${fileExtension}`;
    const filePathInBucket = `identify/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

    // 构建 Supabase Storage API URL
    const storageUrl = `${supabase.url}/storage/v1/object/${bucket}/${filePathInBucket}`;
    
    // 使用微信小程序的 uploadFile API 上传文件
    // 注意：必须在微信小程序后台配置 uploadFile 合法域名
    // 域名：wetcvycrvmzzzerqmtja.supabase.co
    const uploadResult = await new Promise((resolve, reject) => {
      wx.uploadFile({
        url: storageUrl,
        filePath: filePath,
        name: 'file', // Supabase Storage 期望的字段名
        header: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabase.anonKey,
          'x-upsert': 'true' // 如果文件已存在则覆盖
        },
        success: (res) => {
          console.log('上传响应:', res.statusCode, res.data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // 解析响应数据（Supabase Storage 可能返回 JSON）
            let responseData = {};
            let actualFileId = filePathInBucket;
            
            try {
              if (res.data && typeof res.data === 'string') {
                responseData = JSON.parse(res.data);
              } else if (res.data && typeof res.data === 'object') {
                responseData = res.data;
              }
              
              // 如果返回了 Key，使用它作为 file_id（包含 bucket 前缀）
              if (responseData.Key) {
                actualFileId = responseData.Key;
                console.log('使用返回的 Key 作为 file_id:', actualFileId);
              }
            } catch (e) {
              console.log('解析响应数据失败，使用默认 file_id:', e);
            }
            
            // 构建文件URL（如果 file_id 包含 bucket，需要去掉 bucket 部分）
            let fileUrl;
            if (actualFileId.startsWith(`${bucket}/`)) {
              // file_id 包含 bucket 前缀
              const pathWithoutBucket = actualFileId.substring(bucket.length + 1);
              fileUrl = `${supabase.url}/storage/v1/object/public/${bucket}/${pathWithoutBucket}`;
            } else {
              // file_id 不包含 bucket 前缀
              fileUrl = `${supabase.url}/storage/v1/object/public/${bucket}/${actualFileId}`;
            }
            
            resolve({
              file_id: actualFileId,
              file_url: fileUrl
            });
          } else {
            let errorMsg = `上传失败: ${res.statusCode}`;
            let errorData = null;
            let actualStatusCode = res.statusCode;
            
            try {
              if (res.data) {
                // 尝试解析错误数据（可能是字符串或对象）
                if (typeof res.data === 'string') {
                  errorData = JSON.parse(res.data);
                } else {
                  errorData = res.data;
                }
                
                // 如果错误数据中有 statusCode，使用它（Supabase 可能将错误包装在响应体中）
                if (errorData.statusCode) {
                  actualStatusCode = errorData.statusCode;
                }
                
                errorMsg = errorData.message || errorData.error || errorMsg;
              }
            } catch (e) {
              errorMsg = res.data || errorMsg;
            }
            
            console.error('上传失败响应:', res);
            console.log('解析后的错误数据:', errorData, '实际状态码:', actualStatusCode);
            
            // 检查是否是 token 过期错误（403 或 401，且包含 "exp" 或 "Unauthorized"）
            // 注意：Supabase 可能将错误包装在响应体中，所以需要检查 errorData.statusCode
            // 注意：statusCode 可能是字符串或数字，需要都检查
            const statusCodeNum = typeof actualStatusCode === 'string' ? parseInt(actualStatusCode) : actualStatusCode;
            const isTokenExpired = (
              (statusCodeNum === 403 || statusCodeNum === 401 || res.statusCode === 403 || res.statusCode === 401) &&
              errorData && (
                (errorData.message && (errorData.message.includes('exp') || errorData.message.includes('timestamp'))) ||
                (errorData.message && errorData.message.includes('Unauthorized')) ||
                (errorData.error === 'Unauthorized')
              )
            );
            
            if (isTokenExpired && !isRetry) {
              // token 过期，尝试刷新后重试
              console.log('检测到 token 过期，尝试刷新...', { actualStatusCode, statusCodeNum, errorData });
              reject({ type: 'token_expired', originalError: errorMsg });
            } else {
              console.log('不是 token 过期错误，直接返回错误', { isTokenExpired, isRetry, statusCodeNum, resStatusCode: res.statusCode });
              reject(new Error(errorMsg));
            }
          }
        },
        fail: (err) => {
          console.error('上传文件请求失败:', err);
          
          // 如果是域名白名单错误，提供更友好的提示
          if (err.errMsg && err.errMsg.includes('domain list')) {
            reject(new Error('请在微信小程序后台配置 uploadFile 合法域名: wetcvycrvmzzzerqmtja.supabase.co\n\n配置路径：开发 > 开发管理 > 开发设置 > 服务器域名'));
          } else {
            reject(new Error(err.errMsg || '上传文件失败'));
          }
        }
      });
    });

    return {
      success: true,
      data: uploadResult
    };
  } catch (error) {
    console.log('捕获到错误:', error, 'error.type:', error.type, 'isRetry:', isRetry);
    
    // 如果是 token 过期错误，尝试刷新 token 后重试
    if (error.type === 'token_expired' && !isRetry) {
      console.log('检测到 token 过期，检查是否可以刷新...');
      
      try {
        const refreshResult = await auth.refreshToken();
        console.log('刷新 token 结果:', refreshResult);
        
        if (refreshResult.success) {
          console.log('Token 刷新成功，重试上传...');
          // 刷新成功后重试上传
          return await uploadImageToStorage(filePath, bucket, true);
        } else {
          // 刷新失败，提示用户重新登录
          console.log('Token 刷新失败:', refreshResult.error);
          return {
            success: false,
            error: '登录已过期，请重新登录',
            needRelogin: true
          };
        }
      } catch (refreshError) {
        console.error('刷新 token 异常:', refreshError);
        return {
          success: false,
          error: '登录已过期，请重新登录',
          needRelogin: true
        };
      }
    }
    
    console.error('上传图片失败:', error);
    return {
      success: false,
      error: error.message || '上传图片失败'
    };
  }
}

/**
 * 创建 AI 识别任务
 * @param {string} fileId - 文件ID（Storage中的路径）
 * @param {string} fileUrl - 文件完整URL
 * @param {string} description - 用户描述（可选）
 * @returns {Promise<Object>} 创建结果，包含任务ID
 */
async function createAITask(fileId, fileUrl, description = '') {
  try {
    const userInfo = app.getCurrentUser();
    if (!userInfo) {
      throw new Error('用户未登录');
    }

    // 尝试从多个地方获取 user_db_id
    let userDbId = userInfo.user_db_id || 
                   app.globalData.userDbId || 
                   wx.getStorageSync('userDbId') ||
                   null;

    // 如果还是没有，尝试从 userInfo 的其他字段获取
    if (!userDbId && userInfo.user_id) {
      // 如果 userInfo.user_id 就是数据库 ID，直接使用
      userDbId = userInfo.user_id;
    }

    // 如果仍然找不到，尝试从 Supabase 查询
    if (!userDbId && userInfo.user_id) {
      console.log('尝试从 Supabase 查询用户数据库ID...');
      try {
        // 尝试通过 auth_uid 查询 users 表
        const users = await authDb.select('users', {
          auth_uid: `eq.${userInfo.user_id}`
        });
        
        if (users && users.length > 0) {
          userDbId = users[0].id;
          console.log('从 Supabase 查询到用户数据库ID:', userDbId);
          
          // 缓存查询到的 user_db_id
          if (userInfo) {
            userInfo.user_db_id = userDbId;
            app.globalData.userInfo = userInfo;
            app.globalData.userDbId = userDbId;
            wx.setStorageSync(app.STORAGE_KEYS.USER_INFO, userInfo);
            wx.setStorageSync('userDbId', userDbId);
          }
        } else {
          // 如果查询不到，尝试调用 linkAuthUserWithUsersTable 来创建或获取用户记录
          console.log('用户记录不存在，尝试关联用户...');
          const linkResult = await linkAuthUserWithUsersTable(userInfo);
          if (linkResult.success && linkResult.data && linkResult.data.id) {
            userDbId = linkResult.data.id;
            console.log('通过关联获取到用户数据库ID:', userDbId);
            
            // 缓存查询到的 user_db_id
            if (userInfo) {
              userInfo.user_db_id = userDbId;
              app.globalData.userInfo = userInfo;
              app.globalData.userDbId = userDbId;
              wx.setStorageSync(app.STORAGE_KEYS.USER_INFO, userInfo);
              wx.setStorageSync('userDbId', userDbId);
            }
          }
        }
      } catch (queryError) {
        console.error('从 Supabase 查询用户数据库ID失败:', queryError);
        // 查询失败不影响，继续使用其他方式
      }
    }

    if (!userDbId) {
      console.error('无法获取用户数据库ID:', { userInfo, globalData: app.globalData });
      throw new Error('用户信息不完整，请重新登录');
    }

    console.log('使用用户数据库ID创建任务:', userDbId);

    const taskData = {
      user_id: userDbId,
      file_id: fileId,
      file_url: fileUrl,
      description: description || null,
      status: 'pending'
    };

    // 使用带认证的数据库操作
    let result;
    try {
      result = await authDb.insert('ai_tasks', taskData);
      console.log('认证插入返回结果:', result, '类型:', typeof result, '是否为数组:', Array.isArray(result));
    } catch (authError) {
      console.warn('认证插入失败，尝试普通插入:', authError);
      // 如果认证插入失败，尝试普通插入（可能需要调整 RLS 策略）
      try {
        result = await db.insert('ai_tasks', taskData);
        console.log('普通插入返回结果:', result, '类型:', typeof result, '是否为数组:', Array.isArray(result));
      } catch (dbError) {
        console.error('普通插入也失败:', dbError);
        throw dbError;
      }
    }

    // 处理返回结果
    let taskId;
    
    // 打印详细的结果信息用于调试
    console.log('处理插入结果:', {
      result,
      isArray: Array.isArray(result),
      hasId: result && result.id,
      resultType: typeof result,
      resultKeys: result && typeof result === 'object' ? Object.keys(result) : null
    });
    
    if (Array.isArray(result)) {
      if (result.length > 0) {
        // 返回数组且不为空，取第一个元素的 id
        taskId = result[0].id;
        console.log('从数组获取 taskId:', taskId);
      } else {
        // 返回空数组，查询最新创建的任务
        console.log('返回空数组，查询最新任务...');
        // 注意：file_id 可能包含斜杠，需要使用正确的查询格式
        const tasks = await db.select('ai_tasks', {
          user_id: `eq.${userDbId}`,
          file_id: `eq.${fileId}`
        });
        
        console.log('查询到的任务:', tasks);
        
        if (tasks && tasks.length > 0) {
          // 按创建时间排序，取最新的
          const sortedTasks = tasks.sort((a, b) => {
            const timeA = new Date(a.created_at || a.create_time || 0).getTime();
            const timeB = new Date(b.created_at || b.create_time || 0).getTime();
            return timeB - timeA;
          });
          taskId = sortedTasks[0].id;
          console.log('从查询结果获取 taskId:', taskId);
        } else {
          throw new Error('无法获取创建的任务ID：查询结果为空');
        }
      }
    } else if (result && typeof result === 'object') {
      // 返回对象
      if (result.id) {
        taskId = result.id;
        console.log('从对象获取 taskId:', taskId);
      } else if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        // 可能包装在 data 字段中
        taskId = result.data[0].id;
        console.log('从 result.data 数组获取 taskId:', taskId);
      } else if (result.data && result.data.id) {
        // 可能包装在 data 对象中
        taskId = result.data.id;
        console.log('从 result.data 对象获取 taskId:', taskId);
      } else {
        // 无法从对象中获取 id，尝试查询
        console.log('无法从对象获取 id，尝试查询...');
        // 注意：file_id 可能包含斜杠，需要使用正确的查询格式
        const tasks = await db.select('ai_tasks', {
          user_id: `eq.${userDbId}`,
          file_id: `eq.${fileId}`
        });
        
        if (tasks && tasks.length > 0) {
          const sortedTasks = tasks.sort((a, b) => {
            const timeA = new Date(a.created_at || a.create_time || 0).getTime();
            const timeB = new Date(b.created_at || b.create_time || 0).getTime();
            return timeB - timeA;
          });
          taskId = sortedTasks[0].id;
          console.log('从查询结果获取 taskId:', taskId);
        } else {
          console.error('无法获取任务ID，返回结果:', result);
          throw new Error('创建任务失败：返回数据格式异常，无法获取任务ID');
        }
      }
    } else {
      // 其他情况，尝试查询
      console.log('返回结果格式异常，尝试查询...', result);
      // 注意：file_id 可能包含斜杠，需要使用正确的查询格式
      const tasks = await db.select('ai_tasks', {
        user_id: `eq.${userDbId}`,
        file_id: `eq.${fileId}`
      });
      
      if (tasks && tasks.length > 0) {
        const sortedTasks = tasks.sort((a, b) => {
          const timeA = new Date(a.created_at || a.create_time || 0).getTime();
          const timeB = new Date(b.created_at || b.create_time || 0).getTime();
          return timeB - timeA;
        });
        taskId = sortedTasks[0].id;
        console.log('从查询结果获取 taskId:', taskId);
      } else {
        console.error('无法获取任务ID，返回结果:', result);
        throw new Error('创建任务失败：返回数据格式异常，且无法查询到任务');
      }
    }
    
    if (!taskId) {
      throw new Error('创建任务失败：无法获取任务ID');
    }

    return {
      success: true,
      data: {
        task_id: taskId,
        ...taskData
      }
    };
  } catch (error) {
    console.error('创建AI任务失败:', error);
    return {
      success: false,
      error: error.message || '创建任务失败'
    };
  }
}

/**
 * 调用 n8n Webhook 进行实时识别
 * @param {string} fileUrl - 图片 URL
 * @param {string} taskId - 任务 ID
 * @param {string} userId - 用户 ID
 * @param {string} fileId - 文件 ID
 * @returns {Promise<Object>} 识别结果
 */
async function callN8nWebhook(fileUrl, taskId, userId, fileId) {
  try {
    // n8n 云端 Webhook URL（需要替换为你的实际 URL）
    const n8nWebhookUrl = 'https://your-n8n-instance.app.n8n.cloud/webhook/ai-identify';
    
    const response = await new Promise((resolve, reject) => {
      wx.request({
        url: n8nWebhookUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          file_url: fileUrl,
          task_id: taskId,
          user_id: userId,
          file_id: fileId
        },
        timeout: 60000, // 60秒超时（AI 识别可能需要一些时间）
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            reject(new Error(`请求失败: ${res.statusCode} - ${JSON.stringify(res.data)}`));
          }
        },
        fail: (err) => reject(err)
      });
    });
    
    return {
      success: response.success || false,
      data: response.result || null,
      task_id: response.task_id || taskId
    };
  } catch (error) {
    console.error('调用 n8n Webhook 失败:', error);
    return {
      success: false,
      error: error.message || '识别失败'
    };
  }
}

/**
 * 上传图片并创建AI识别任务（一步完成，实时识别）
 * @param {string} filePath - 本地文件路径
 * @param {string} description - 用户描述（可选）
 * @param {string} bucket - 存储桶名称
 * @returns {Promise<Object>} 操作结果
 */
async function uploadAndCreateTask(filePath, description = '', bucket = 'ai-images') {
  try {
    // 步骤1: 上传图片
    wx.showLoading({
      title: '上传图片中...',
      mask: true
    });

    const uploadResult = await uploadImageToStorage(filePath, bucket);
    
    if (!uploadResult.success) {
      wx.hideLoading();
      
      // 如果需要重新登录，返回特殊标记
      if (uploadResult.needRelogin) {
        return {
          success: false,
          error: uploadResult.error || '登录已过期，请重新登录',
          needRelogin: true
        };
      }
      
      return {
        success: false,
        error: uploadResult.error || '上传图片失败'
      };
    }

    // 步骤2: 创建任务
    wx.showLoading({
      title: '创建任务中...',
      mask: true
    });

    const userInfo = app.getCurrentUser();
    if (!userInfo || !userInfo.user_db_id) {
      wx.hideLoading();
      return {
        success: false,
        error: '用户信息不完整'
      };
    }

    const taskResult = await createAITask(
      uploadResult.data.file_id,
      uploadResult.data.file_url,
      description
    );

    if (!taskResult.success) {
      wx.hideLoading();
      return {
        success: false,
        error: taskResult.error || '创建任务失败'
      };
    }

    // 步骤3: 如果使用 Supabase Database Webhook，任务会自动触发 n8n
    // 如果使用小程序直接调用，可以在这里调用 n8n Webhook（可选）
    // 当前默认使用 Supabase Webhook 方案，任务创建后会自动触发
    
    return {
      success: true,
      data: {
        task_id: taskResult.data.task_id,
        file_id: uploadResult.data.file_id,
        file_url: uploadResult.data.file_url,
        status: 'pending' // 等待 n8n 处理
      }
    };
    
    /* 如果使用小程序直接调用 n8n Webhook 方案，取消注释以下代码：
    wx.showLoading({
      title: 'AI识别中...',
      mask: true
    });

    const identifyResult = await callN8nWebhook(
      uploadResult.data.file_url,
      taskResult.data.task_id,
      userInfo.user_db_id,
      uploadResult.data.file_id
    );

    wx.hideLoading();

    if (identifyResult.success) {
      return {
        success: true,
        data: {
          task_id: taskResult.data.task_id,
          file_id: uploadResult.data.file_id,
          file_url: uploadResult.data.file_url,
          result: identifyResult.data,
          status: 'completed'
        }
      };
    } else {
      return {
        success: false,
        error: identifyResult.error || '识别失败',
        data: {
          task_id: taskResult.data.task_id,
          file_id: uploadResult.data.file_id,
          file_url: uploadResult.data.file_url,
          status: 'pending'
        }
      };
    }
    */
  } catch (error) {
    wx.hideLoading();
    console.error('上传并创建任务失败:', error);
    return {
      success: false,
      error: error.message || '操作失败'
    };
  }
}

/**
 * 查询任务状态
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} 任务信息
 */
async function getTaskStatus(taskId) {
  try {
    const userInfo = app.getCurrentUser();
    if (!userInfo) {
      throw new Error('用户未登录');
    }

    const tasks = await db.select('ai_tasks', {
      id: `eq.${taskId}`
    });

    if (!tasks || tasks.length === 0) {
      return {
        success: false,
        error: '任务不存在'
      };
    }

    const task = tasks[0];
    
    // 检查任务是否属于当前用户
    if (userInfo.user_db_id && task.user_id !== userInfo.user_db_id) {
      return {
        success: false,
        error: '无权访问此任务'
      };
    }

    return {
      success: true,
      data: task
    };
  } catch (error) {
    console.error('查询任务状态失败:', error);
    return {
      success: false,
      error: error.message || '查询失败'
    };
  }
}

/**
 * 获取用户的任务列表
 * @param {number} limit - 限制数量
 * @param {number} offset - 偏移量
 * @returns {Promise<Object>} 任务列表
 */
async function getUserTasks(limit = 20, offset = 0) {
  try {
    const userInfo = app.getCurrentUser();
    if (!userInfo || !userInfo.user_db_id) {
      throw new Error('用户未登录');
    }

    const tasks = await db.select('ai_tasks', {
      user_id: userInfo.user_db_id,
      order: 'created_at.desc',
      limit: limit,
      offset: offset
    });

    return {
      success: true,
      data: tasks || []
    };
  } catch (error) {
    console.error('获取任务列表失败:', error);
    return {
      success: false,
      error: error.message || '获取任务列表失败',
      data: []
    };
  }
}

module.exports = {
  uploadImageToStorage,
  createAITask,
  uploadAndCreateTask,
  getTaskStatus,
  getUserTasks
};

