// 农业病虫害识别系统首页逻辑
const app = getApp();
const aiIdentify = require('../../services/aiIdentify.js');

const STATUS_TEXT_MAP = {
  pending: '等待处理',
  processing: '识别中',
  completed: '识别完成',
  failed: '识别失败'
};

function formatTaskTime(value) {
  if (!value) return '时间未知';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function parseResultPayload(payload) {
  if (!payload && payload !== 0) return null;
  if (typeof payload === 'object') return payload;
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch (error) {
      return { summary: payload };
    }
  }
  return { summary: String(payload) };
}

function buildTaskSummary(task) {
  const parsed = parseResultPayload(task?.result);
  const candidates = [
    parsed?.summary,
    parsed?.description,
    parsed?.result,
    parsed?.result_text,
    parsed?.message,
    parsed?.answer,
    task?.description
  ];
  const summary = candidates.find(text => typeof text === 'string' && text.trim());
  if (summary) {
    return summary.trim().replace(/\s+/g, ' ');
  }
  if (task?.status === 'failed') {
    return task?.error_message || '识别失败，请重新尝试';
  }
  return '识别结果生成后会展示在这里';
}

function normalizeHistoryTask(task) {
  const status = task?.status || 'pending';
  return {
    id: task?.id || '',
    status,
    statusText: STATUS_TEXT_MAP[status] || '处理中',
    summary: buildTaskSummary(task),
    timeText: formatTaskTime(task?.completed_at || task?.updated_at || task?.created_at),
    filePreview: task?.file_url || ''
  };
}

Page({
  data: {
    title: '农业病虫害识别系统',
    loading: true,
    // 添加识别相关数据
    identifyLoading: false,
    result: null,
    currentTaskId: null, // 当前任务ID
    historyLoading: false,
    historyTasks: [],
    historyError: '',
    historyEmptyText: '暂无识别记录',
    // 农业资讯数据
    agricultureNews: [
      {
        id: 1,
        title: '夏季常见病虫害防治技巧',
        date: '2024-07-15',
        content: '夏季高温多雨，是病虫害高发期，本文介绍几种常见病虫害的防治方法...'
      },
      {
        id: 2,
        title: '如何提高农作物抗病能力',
        date: '2024-07-10',
        content: '通过合理施肥、轮作和选用抗病品种，可以有效提高农作物的抗病能力...'
      },
      {
        id: 3,
        title: '智能识别技术在农业中的应用',
        date: '2024-07-05',
        content: '人工智能和计算机视觉技术的发展，为农业病虫害识别带来了革命性的变化...'
      }
    ]
  },

  onLoad: function() {
    console.log('首页加载完成');
    // 模拟数据加载
    this.loadHomeData();
    this.fetchHistoryTasks();
  },

  onShow: function() {
    console.log('首页显示');
    // 每次显示页面时可以刷新数据
    if (!this.data.loading) {
      this.refreshData();
    }
  },

  // 加载首页数据
  loadHomeData: function() {
    const that = this;
    
    // 模拟网络请求延迟
    setTimeout(() => {
      // 在实际应用中，这里应该从服务器获取数据
      console.log('首页数据加载完成');
      that.setData({
        loading: false
      });
      that.fetchHistoryTasks();
      
      // 显示加载成功提示（可选）
      // wx.showToast({
      //   title: '加载成功',
      //   icon: 'success',
      //   duration: 1000
      // });
    }, 800);
  },

  // 刷新数据
  refreshData: function() {
    // 这里可以添加下拉刷新或定时刷新的逻辑
    console.log('刷新首页数据');
    this.fetchHistoryTasks(true);
  },

  // 获取历史任务
  fetchHistoryTasks: async function(isRefresh = false) {
    if (!app.isAuthenticated()) {
      this.setData({
        historyTasks: [],
        historyLoading: false,
        historyError: '',
        historyEmptyText: '登录后可查看历史记录'
      });
      return;
    }

    this.setData({
      historyLoading: true,
      historyError: '',
      historyEmptyText: '暂无识别记录'
    });

    try {
      const response = await aiIdentify.getUserTasks(5, 0);
      if (!response.success) {
        throw new Error(response.error || '获取历史记录失败');
      }
      const historyTasks = Array.isArray(response.data)
        ? response.data.map(normalizeHistoryTask)
        : [];

      this.setData({
        historyTasks,
        historyLoading: false,
        historyError: ''
      });
    } catch (error) {
      console.error('加载历史记录失败:', error);
      this.setData({
        historyLoading: false,
        historyError: error.message || '加载历史记录失败'
      });
    } finally {
      if (isRefresh && typeof wx.stopPullDownRefresh === 'function') {
        wx.stopPullDownRefresh();
      }
    }
  },

  // 重试加载历史任务
  retryFetchHistory: function() {
    this.fetchHistoryTasks(true);
  },

  // 查看任务详情
  openTaskDetail: function(event) {
    const taskId = event.currentTarget.dataset.taskId;
    if (!taskId) {
      return;
    }
    wx.navigateTo({
      url: `/pages/identify/index?taskId=${taskId}`
    });
  },

  // 检查相机权限
  checkCameraPermission: function() {
    const that = this;
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.camera']) {
          // 如果没有相机权限，请求用户授权
          wx.authorize({
            scope: 'scope.camera',
            success() {
              console.log('相机权限授权成功');
              wx.showToast({
                title: '相机权限已授权',
                icon: 'success',
                duration: 1500
              });
            },
            fail() {
              console.log('相机权限授权失败，引导用户打开设置');
              wx.showModal({
                title: '权限提醒',
                content: '请在设置中开启相机权限，以便使用识别功能',
                showCancel: false,
                confirmText: '我知道了'
              });
            }
          });
        } else {
          console.log('相机权限已授权');
        }
      }
    });
  },

  // 执行媒体选择（相机或相册）
  performChooseMedia: function(source) {
    const that = this;
    
    // 检查登录状态
    if (!app.isAuthenticated()) {
      wx.showModal({
        title: '请先登录',
        content: '使用AI识别功能需要先登录',
        confirmText: '去登录',
        cancelText: '暂不登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/index'
            });
          }
        }
      });
      return;
    }
    
    that.setData({
      identifyLoading: true
    });
    
    const options = {
      count: 1,
      sizeType: ['compressed'],
      sourceType: [source],
      success(res) {
        const tempFilePath = res.tempFilePaths[0];
        console.log('获取图片成功:', tempFilePath);
        
        // 上传图片并创建任务
        that.uploadAndCreateTask(tempFilePath);
      },
      fail(err) {
        console.log('获取图片失败:', err);
        that.setData({
          identifyLoading: false
        });
        
        if (err.errMsg !== 'chooseImage:fail cancel') {
          wx.showToast({
            title: '获取图片失败',
            icon: 'none',
            duration: 2000
          });
        }
      }
    };
    
    wx.chooseImage(options);
  },

  // 上传图片并创建AI识别任务
  uploadAndCreateTask: async function(filePath) {
    const that = this;
    
    try {
      // 调用服务上传图片并创建任务
      const result = await aiIdentify.uploadAndCreateTask(filePath, '');
      
      if (result.success) {
        console.log('识别任务已创建:', result.data);
        
        const taskId = result.data.task_id;
        const fileUrl = result.data.file_url ? encodeURIComponent(result.data.file_url) : '';
        const initialResult = result.data.result ? encodeURIComponent(JSON.stringify(result.data.result)) : '';
        const queryParams = [`taskId=${taskId}`];
        if (fileUrl) {
          queryParams.push(`fileUrl=${fileUrl}`);
        }
        if (initialResult) {
          queryParams.push(`result=${initialResult}`);
        }
        
        that.setData({
          currentTaskId: taskId,
          identifyLoading: false,
          result: result.data.result || null
        });
        
        wx.showToast({
          title: result.data.result ? '识别完成' : '上传成功',
          icon: 'success',
          duration: 1500
        });
        
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/identify/index?${queryParams.join('&')}`
          });
        }, 1200);
      } else {
        console.error('创建任务失败:', result.error);
        that.setData({
          identifyLoading: false
        });
        
        // 如果需要重新登录，显示特殊提示
        if (result.needRelogin) {
          wx.showModal({
            title: '登录已过期',
            content: '您的登录已过期，请重新登录后重试',
            confirmText: '去登录',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                wx.navigateTo({
                  url: '/pages/login/index'
                });
              }
            }
          });
        } else {
          wx.showToast({
            title: result.error || '创建任务失败',
            icon: 'none',
            duration: 3000
          });
        }
      }
    } catch (error) {
      console.error('上传并创建任务异常:', error);
      that.setData({
        identifyLoading: false
      });
      
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 拍照识别
  takePhoto: function() {
    const that = this;
    
    // 使用相机前检查权限
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.camera']) {
          // 如果没有相机权限，请求用户授权
          wx.authorize({
            scope: 'scope.camera',
            success() {
              wx.showToast({
                title: '相机权限已授权',
                icon: 'success',
                duration: 1000
              });
              setTimeout(() => {
                that.performChooseMedia('camera');
              }, 1000);
            },
            fail() {
              console.log('用户拒绝了相机权限');
              wx.showModal({
                title: '需要相机权限',
                content: '请在设置中开启相机权限，以便使用拍照识别功能',
                confirmText: '去设置',
                cancelText: '暂不开启',
                success(res) {
                  if (res.confirm) {
                    wx.openSetting();
                  }
                }
              });
            }
          });
        } else {
          // 已经有权限，直接调用相机
          that.performChooseMedia('camera');
        }
      }
    });
  },

  // 从相册选择图片识别
  chooseImage: function() {
    const that = this;
    
    // 检查登录状态
    if (!app.isAuthenticated()) {
      wx.showModal({
        title: '请先登录',
        content: '使用AI识别功能需要先登录',
        confirmText: '去登录',
        cancelText: '暂不登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/index'
            });
          }
        }
      });
      return;
    }
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success(res) {
        const tempFilePath = res.tempFilePaths[0];
        console.log('从相册选择图片成功:', tempFilePath);
        
        that.setData({
          identifyLoading: true
        });
        
        // 上传图片并创建任务
        that.uploadAndCreateTask(tempFilePath);
      },
      fail(err) {
        console.log('从相册选择图片失败:', err);
        that.setData({
          identifyLoading: false
        });
        
        if (err.errMsg !== 'chooseImage:fail cancel') {
          wx.showToast({
            title: '选择图片失败',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  },

  // 首页立即识别按钮点击事件
  navigateToIdentify: function() {
    // 检查登录状态
    if (!this.checkLoginStatus()) {
      return;
    }
    // 显示操作选项
    wx.showActionSheet({
      itemList: ['拍照识别', '从相册选择'],
      success: (res) => {
        if (!res.cancel) {
          if (res.tapIndex === 0) {
            this.takePhoto();
          } else if (res.tapIndex === 1) {
            this.chooseImage();
          }
        }
      }
    });
  },

  // 跳转到知识库页面
  navigateToKnowledge: function() {
    // 检查登录状态
    if (!this.checkLoginStatus()) {
      return;
    }
    // 检查页面是否存在，如果不存在可以提示用户
    console.log('跳转到知识库页面');
    wx.navigateTo({
      url: '/pages/knowledge/index',
      fail: function() {
        wx.showToast({
          title: '该功能正在开发中',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 跳转到历史记录页面
  navigateToHistory: function() {
    // 检查登录状态
    if (!this.checkLoginStatus()) {
      return;
    }
    console.log('跳转到历史记录页面');
    wx.navigateTo({
      url: '/pages/history/index',
      fail: function() {
        wx.showToast({
          title: '该功能正在开发中',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 跳转到使用指南页面
  navigateToGuide: function() {
    console.log('跳转到使用指南页面');
    wx.navigateTo({
      url: '/pages/guide/index',
      fail: function() {
        wx.showToast({
          title: '该功能正在开发中',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 检查登录状态
  checkLoginStatus: function() {
    if (!app.isAuthenticated()) {
      wx.showModal({
        title: '请先登录',
        content: '使用该功能需要先登录',
        confirmText: '去登录',
        cancelText: '暂不登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/index'
            });
          }
        }
      });
      return false;
    }
    return true;
  },

  // 点击资讯条目
  onNewsItemTap: function(e) {
    const newsId = e.currentTarget.dataset.id;
    console.log('点击资讯:', newsId);
    // 这里可以跳转到资讯详情页或显示资讯内容
    wx.showToast({
      title: '查看资讯详情',
      icon: 'none',
      duration: 1500
    });
  },

  // 页面分享功能
  onShareAppMessage: function() {
    return {
      title: '农业病虫害识别系统',
      path: '/pages/home/index',
      imageUrl: ''
    };
  }
});