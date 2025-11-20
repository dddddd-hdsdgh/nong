// 农业病虫害识别系统首页逻辑
Page({
  data: {
    title: '农业病虫害识别系统',
    loading: true,
    // 添加识别相关数据
    identifyLoading: false,
    result: null,
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
        
        // 模拟识别过程
        setTimeout(() => {
          // 模拟识别结果
          const mockResult = {
            diseaseName: '水稻稻瘟病',
            confidence: 0.92,
            description: '水稻稻瘟病是水稻最主要的病害之一，主要危害叶片、茎秆和穗部。',
            controlMethods: [
              '选择抗病品种',
              '合理密植',
              '及时喷施三环唑等药剂'
            ]
          };
          
          that.setData({
            result: mockResult,
            identifyLoading: false
          });
          
          // 跳转到结果展示页面
          wx.navigateTo({
            url: '/pages/recommend/index?diseaseName=' + encodeURIComponent(mockResult.diseaseName)
          });
        }, 2000);
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
        
        // 模拟识别过程
        setTimeout(() => {
          // 模拟识别结果
          const mockResult = {
            diseaseName: '小麦白粉病',
            confidence: 0.88,
            description: '小麦白粉病是小麦常见的真菌病害，主要危害叶片和茎秆。',
            controlMethods: [
              '选用抗病品种',
              '合理施肥，控制氮肥用量',
              '发病初期喷施粉锈宁等药剂'
            ]
          };
          
          that.setData({
            result: mockResult,
            identifyLoading: false
          });
          
          // 跳转到结果展示页面
          wx.navigateTo({
            url: '/pages/recommend/index?diseaseName=' + encodeURIComponent(mockResult.diseaseName)
          });
        }, 2000);
      },
      fail(err) {
        console.log('从相册选择图片失败:', err);
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