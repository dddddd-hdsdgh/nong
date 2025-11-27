const app = getApp();
const aiIdentify = require('../../services/aiIdentify.js');

const STATUS_TEXT_MAP = {
  pending: '等待处理',
  processing: '识别中',
  completed: '识别完成',
  failed: '识别失败'
};

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function parseResult(payload) {
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

function buildSummary(task) {
  const parsed = parseResult(task?.result);
  const candidates = [
    parsed?.summary,
    parsed?.description,
    parsed?.result,
    parsed?.result_text,
    parsed?.message,
    parsed?.answer,
    task?.description
  ];
  const summary = candidates.find(item => typeof item === 'string' && item.trim());
  if (summary) {
    return summary.trim().replace(/\s+/g, ' ');
  }
  if (task?.status === 'failed') {
    return task?.error_message || '识别失败，请重新尝试';
  }
  return '识别结果生成后会展示在这里';
}

function normalizeTask(task) {
  const status = task?.status || 'pending';
  return {
    id: task?.id || '',
    status,
    statusText: STATUS_TEXT_MAP[status] || '处理中',
    summary: buildSummary(task),
    createdAt: formatDate(task?.created_at),
    updatedAt: formatDate(task?.updated_at),
    completedAt: formatDate(task?.completed_at),
    fileUrl: task?.file_url || ''
  };
}

Page({
  data: {
    loading: true,
    loadingMore: false,
    tasks: [],
    error: '',
    isLoggedIn: false,
    page: 0,
    pageSize: 10,
    hasMore: true,
    emptyText: '暂无识别记录',
    emptyHint: '完成一次识别后即可在此查看结果'
  },

  onLoad() {
    this.checkLogin();
    this.loadTasks(true);
  },

  onShow() {
    // 如果回到页面且已经加载过，刷新数据保证最新
    if (this.data.isLoggedIn && !this.data.loading) {
      this.loadTasks(true);
    }
  },

  onPullDownRefresh() {
    this.loadTasks(true);
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loading || this.data.loadingMore) {
      return;
    }
    this.loadTasks(false);
  },

  checkLogin() {
    const isLoggedIn = app.isAuthenticated();
    this.setData({ isLoggedIn });
    return isLoggedIn;
  },

  async loadTasks(reset = false) {
    if (!this.checkLogin()) {
      this.setData({
        loading: false,
        tasks: [],
        hasMore: false,
        error: '',
        emptyText: '请先登录后查看历史记录',
        emptyHint: '登录后即可同步云端历史任务'
      });
      if (typeof wx.stopPullDownRefresh === 'function') {
        wx.stopPullDownRefresh();
      }
      return;
    }

    const nextPage = reset ? 0 : this.data.page;
    const offset = nextPage * this.data.pageSize;

    this.setData({
      loading: reset,
      loadingMore: !reset,
      error: ''
    });

    try {
      const response = await aiIdentify.getUserTasks(this.data.pageSize, offset);
      if (!response.success) {
        throw new Error(response.error || '获取历史记录失败');
      }

      const list = Array.isArray(response.data)
        ? response.data.map(normalizeTask)
        : [];

      const tasks = reset ? list : [...this.data.tasks, ...list];
      const hasMore = list.length === this.data.pageSize;

      this.setData({
        tasks,
        page: hasMore ? nextPage + 1 : nextPage,
        hasMore,
        loading: false,
        loadingMore: false
      });
    } catch (error) {
      console.error('加载历史记录失败:', error);
      this.setData({
        loading: false,
        loadingMore: false,
        error: error.message || '加载历史记录失败'
      });
    } finally {
      if (typeof wx.stopPullDownRefresh === 'function') {
        wx.stopPullDownRefresh();
      }
    }
  },

  handleRetry() {
    this.loadTasks(true);
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loading || this.data.loadingMore) {
      return;
    }
    this.loadTasks(false);
  },

  handleLogin() {
    wx.navigateTo({
      url: '/pages/login/index'
    });
  },

  handleTaskTap(event) {
    const taskId = event.currentTarget.dataset.taskId;
    const fileUrl = event.currentTarget.dataset.fileUrl;
    if (!taskId) {
      return;
    }
    const params = [`taskId=${taskId}`];
    if (fileUrl) {
      params.push(`fileUrl=${encodeURIComponent(fileUrl)}`);
    }
    wx.navigateTo({
      url: `/pages/identify/index?${params.join('&')}`
    });
  },

  navigateToIdentify() {
    if (!this.checkLogin()) {
      return;
    }
    wx.switchTab({
      url: '/pages/home/index'
    });
  }
});

