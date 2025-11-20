// 识别页面逻辑
Page({
  data: {
    loading: false,
    result: null
  },

  onLoad: function() {
    console.log('识别页面加载完成');
    // 页面加载时检查相机权限
    this.checkCameraPermission();
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
    that.setData({ loading: true });
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: [sourceType],
      success(res) {
        console.log(sourceType === 'camera' ? '拍照成功' : '选择图片成功', res);
        // 模拟识别过程
        setTimeout(() => {
          that.setData({
            loading: false,
            result: '识别中...'
          });
        }, 1000);
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
  }
});