// 识别页面逻辑
// 导入识别服务
const identifyService = require('../../services/identify');
const aiIdentify = require('../../services/aiIdentify.js');

const STATUS_TEXT_MAP = {
  pending: '已排队，等待识别',
  processing: 'AI 正在识别中',
  completed: '识别完成',
  failed: '识别失败'
};

const RESERVED_RESULT_KEYS = [
  'summary',
  'description',
  'result',
  'result_text',
  'message',
  'answer',
  'output',
  'symptoms',
  'prevention',
  'suggestions',
  'recommendations',
  'tips',
  'labels',
  'categories',
  'predictions',
  'tags',
  'types',
  'confidence',
  'score',
  'probability',
  'confidenceScore',
  'accuracy'
];

function normalizeToArray(value) {
  if (!value && value !== 0) return [];
  if (Array.isArray(value)) {
    return value.filter(item => item !== undefined && item !== null && item !== '');
  }
  return [value].filter(item => item !== undefined && item !== null && item !== '');
}

function safeStringify(value) {
  if (!value && value !== 0) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}

function parseResultPayload(payload) {
  if (!payload && payload !== 0) return null;
  if (typeof payload === 'object') return payload;
  try {
    return JSON.parse(payload);
  } catch (error) {
    return { raw: payload };
  }
}

function formatTimestamp(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) {
    return ts;
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function formatResultData(rawInput) {
  if (!rawInput && rawInput !== 0) {
    return {
      summary: '',
      labels: [],
      suggestions: [],
      confidenceValue: null,
      confidenceText: '',
      extraPairs: []
    };
  }

  const raw = typeof rawInput === 'object' ? rawInput : { result: rawInput };

  const summary =
    raw.summary ||
    raw.description ||
    raw.result_text ||
    raw.result ||
    raw.answer ||
    raw.message ||
    raw.output ||
    '';

  const confidenceSource =
    raw.confidence ??
    raw.score ??
    raw.probability ??
    raw.confidenceScore ??
    raw.accuracy ??
    null;

  let confidenceValue = null;
  let confidenceText = '';
  if (confidenceSource !== null && confidenceSource !== undefined) {
    const numeric =
      typeof confidenceSource === 'number'
        ? confidenceSource
        : parseFloat(confidenceSource);

    if (!Number.isNaN(numeric)) {
      confidenceValue = numeric > 1 ? numeric / 100 : numeric;
      confidenceText = `${(confidenceValue * 100).toFixed(1)}%`;
    } else {
      confidenceText = String(confidenceSource);
    }
  }

  const labels =
    normalizeToArray(raw.labels || raw.categories || raw.predictions || raw.tags || raw.types);

  const suggestions = normalizeToArray(
    raw.suggestions ||
      raw.recommendations ||
      raw.tips ||
      raw.actions ||
      raw.solutions ||
      raw.plan
  );

  const extraPairs = Object.entries(raw)
    .filter(([key]) => !RESERVED_RESULT_KEYS.includes(key))
    .map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? safeStringify(value) : value
    }));

  return {
    summary,
    labels,
    suggestions,
    confidenceValue,
    confidenceText,
    extraPairs
  };
}

Page({
  data: {
    loading: false,
    result: null,
    resultObject: null,
    imageTempPath: '',
    showResult: false,
    taskId: null, // 任务ID
    taskStatus: null, // 任务状态
    taskStatusText: '',
    taskData: null, // 任务数据
    pollingTimer: null, // 轮询定时器
    formattedResultJson: '',
    resultSummary: '',
    resultConfidence: null,
    resultConfidenceText: '',
    resultLabels: [],
    resultSuggestions: [],
    resultExtraPairs: [],
    lastUpdatedAt: ''
  },

  onLoad: function(options = {}) {
    console.log('识别页面加载完成', options);
    
    const taskId = options.taskId || null;
    const decodedFileUrl = options.fileUrl ? decodeURIComponent(options.fileUrl) : '';
    let initialResult = null;
    
    if (options.result) {
      try {
        initialResult = parseResultPayload(decodeURIComponent(options.result));
      } catch (error) {
        console.warn('解析初始结果失败:', error);
      }
    }
    
    this.setData({
      taskId,
      imageTempPath: decodedFileUrl || this.data.imageTempPath,
      showResult: !!initialResult,
      loading: !!taskId && !initialResult
    });
    
    if (initialResult) {
      this.applyFormattedResult(initialResult, {
        fileUrl: decodedFileUrl,
        status: options.status || 'completed',
        updatedAt: options.completedAt
      });
    }
    
    if (taskId && !initialResult) {
      this.loadTaskStatus(taskId);
    } else if (!taskId && !initialResult) {
      // 页面加载时检查相机权限
      this.checkCameraPermission();
    }
  },

  onUnload: function() {
    // 清除轮询定时器
    this.clearPollingTimer();
  },
  
  onShow: function() {
    console.log('识别页面显示');
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
              // 显示友好提示
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

  // 拍照识别
  takePhoto: function() {
    const that = this;
    
    // 使用相机前再次检查权限
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.camera']) {
          // 如果没有相机权限，请求用户授权
          wx.authorize({
            scope: 'scope.camera',
            success() {
              // 权限获取成功，显示提示
              wx.showToast({
                title: '相机权限已授权',
                icon: 'success',
                duration: 1000
              });
              // 延迟调用，让用户看到提示
              setTimeout(() => {
                // 调用通用的选择媒体方法，指定来源为相机
                that.performChooseMedia('camera');
              }, 1000);
            },
            fail() {
              console.log('用户拒绝了相机权限，引导用户到设置页面开启');
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

  // 从相册选择
  chooseImage: function() {
    const that = this;
    
    // 选择相册前检查相册权限（使用scope.album而不是scope.writePhotosAlbum）
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.album']) {
          // 对于相册读取权限，微信会在首次调用wx.chooseMedia时自动请求
          // 这里我们直接调用，让微信自动处理权限请求
          that.performChooseMedia('album');
        } else {
          // 已有权限，执行选择图片
          that.performChooseMedia('album');
        }
      }
    });
  },
  
  // 执行选择图片操作，支持相机和相册
  performChooseMedia: function(sourceType) {
    const that = this;
    that.setData({ loading: true, showResult: false });
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: [sourceType],
      sizeType: ['compressed'], // 选择压缩图片以减少上传时间
      success(res) {
        console.log(sourceType === 'camera' ? '拍照成功' : '选择图片成功', res);
        
        // 保存图片临时路径
        const tempFilePath = res.tempFiles[0].tempFilePath;
        that.setData({ imageTempPath: tempFilePath });
        
        // 显示加载提示
        wx.showLoading({
          title: '正在识别...',
        });
        
        // 调用识别服务进行识别
        identifyService.identifyByImage(tempFilePath)
          .then(result => {
            wx.hideLoading();
            that.setData({ loading: false });
            
            if (result.success) {
              // 识别成功，显示结果
              that.setData({
                result: result.data,
                showResult: true
              });
              
              // 显示成功提示
              wx.showToast({
                title: '识别成功',
                icon: 'success',
                duration: 2000
              });
            } else {
              // 识别失败
              wx.showToast({
                title: result.message || '识别失败',
                icon: 'error',
                duration: 2000
              });
            }
          })
          .catch(error => {
            wx.hideLoading();
            that.setData({ loading: false });
            console.error('识别过程中发生错误:', error);
            wx.showToast({
              title: '识别失败，请稍后重试',
              icon: 'error',
              duration: 2000
            });
          });
      },
      fail(err) {
        console.error(sourceType === 'camera' ? '拍照失败' : '选择图片失败', err);
        that.setData({ loading: false });
        // 显示错误提示
        wx.showToast({
          title: sourceType === 'camera' ? '拍照失败' : '选择图片失败',
          icon: 'error',
          duration: 2000
        });
      }
    });
  },
  
  // 保存识别结果
  saveResult: function() {
    const that = this;
    const recordId = that.data.resultObject?.recordId || that.data.resultObject?.id || that.data.result?.recordId;
    
    if (!recordId) {
      wx.showToast({
        title: '无法保存结果',
        icon: 'error',
        duration: 2000
      });
      return;
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '保存中...',
    });
    
    // 调用保存接口
    identifyService.saveIdentifyResult(recordId, true)
      .then(result => {
        wx.hideLoading();
        
        if (result.success) {
          wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 2000
          });
        } else {
          wx.showToast({
            title: result.message || '保存失败',
            icon: 'error',
            duration: 2000
          });
        }
      })
      .catch(error => {
        wx.hideLoading();
        console.error('保存结果失败:', error);
        wx.showToast({
          title: '保存失败，请稍后重试',
          icon: 'error',
          duration: 2000
        });
      });
  },
  
  // 查看详情
  viewDiseaseDetail: function() {
    const that = this;
    const diseaseId = that.data.resultObject?.id;
    
    if (!diseaseId) {
      wx.showToast({
        title: '无法获取详情',
        icon: 'error',
        duration: 2000
      });
      return;
    }
    
    // 导航到详情页
    wx.navigateTo({
      url: `/pages/disease/detail?id=${diseaseId}`
    });
  },
  
  // 重新识别
  reIdentify: function() {
    this.clearPollingTimer();
    this.setData({
      result: null,
      resultObject: null,
      showResult: false,
      imageTempPath: '',
      taskId: null,
      taskStatus: null,
      taskData: null,
      formattedResultJson: '',
      resultSummary: '',
      resultConfidence: null,
      resultConfidenceText: '',
      resultLabels: [],
      resultSuggestions: [],
      lastUpdatedAt: ''
    });
  },

  clearPollingTimer: function() {
    if (this.data.pollingTimer) {
      clearInterval(this.data.pollingTimer);
      this.setData({ pollingTimer: null });
    }
  },

  updateTaskState: function(task = {}) {
    const status = task.status || 'pending';
    this.setData({
      taskStatus: status,
      taskStatusText: STATUS_TEXT_MAP[status] || status,
      taskData: task,
      imageTempPath: this.data.imageTempPath || task.file_url || '',
      lastUpdatedAt: formatTimestamp(task.completed_at || task.updated_at || task.created_at || this.data.lastUpdatedAt)
    });
  },

  applyFormattedResult: function(resultData = {}, meta = {}) {
    const formatted = formatResultData(resultData || {});
    this.setData({
      result: resultData,
      resultObject: resultData,
      showResult: true,
      formattedResultJson: safeStringify(resultData),
      resultSummary: formatted.summary,
      resultConfidence: formatted.confidenceValue,
      resultConfidenceText: formatted.confidenceText,
      resultLabels: formatted.labels,
      resultSuggestions: formatted.suggestions,
      resultExtraPairs: formatted.extraPairs,
      imageTempPath: meta.fileUrl || this.data.imageTempPath,
      lastUpdatedAt: meta.updatedAt ? formatTimestamp(meta.updatedAt) : this.data.lastUpdatedAt
    });
  },

  // 加载任务状态
  loadTaskStatus: async function(taskId) {
    const that = this;
    
    try {
      const result = await aiIdentify.getTaskStatus(taskId);
      
      if (result.success) {
        const task = result.data;
        that.setData({ loading: false });
        that.updateTaskState(task);
        
        // 如果任务已完成，显示结果
        if (task.status === 'completed' && task.result) {
          that.displayTaskResult(task);
        } else if (task.status === 'failed') {
          wx.showToast({
            title: task.error_message || '识别失败',
            icon: 'none',
            duration: 3000
          });
        } else if (task.status === 'pending' || task.status === 'processing') {
          // 任务还在处理中，开始轮询
          that.startPolling(taskId);
        }
      } else {
        that.setData({ loading: false });
        wx.showToast({
          title: result.error || '获取任务状态失败',
          icon: 'none',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('加载任务状态失败:', error);
      that.setData({ loading: false });
      wx.showToast({
        title: '获取任务状态失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 开始轮询任务状态
  startPolling: function(taskId) {
    const that = this;
    
    that.clearPollingTimer();
    
    // 每3秒轮询一次
    const timer = setInterval(async () => {
      try {
        const result = await aiIdentify.getTaskStatus(taskId);
        
        if (result.success) {
          const task = result.data;
          that.updateTaskState(task);
          
          // 如果任务已完成或失败，停止轮询
          if (task.status === 'completed') {
            that.clearPollingTimer();
            that.displayTaskResult(task);
          } else if (task.status === 'failed') {
            that.clearPollingTimer();
            wx.showToast({
              title: task.error_message || '识别失败',
              icon: 'none',
              duration: 3000
            });
          }
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error);
      }
    }, 3000);
    
    that.setData({ pollingTimer: timer });
  },

  // 显示任务结果
  displayTaskResult: function(task) {
    const that = this;
    
    const resultData = parseResultPayload(task.result);
    that.applyFormattedResult(resultData || {}, {
      fileUrl: task.file_url,
      status: task.status,
      updatedAt: task.completed_at || task.updated_at
    });
    that.updateTaskState(task);
    
    wx.showToast({
      title: '识别完成',
      icon: 'success',
      duration: 2000
    });
  }
});