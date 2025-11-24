// 病虫害识别相关的服务接口
// 导入Supabase服务
const { db, storage } = require('./supabase');

/**
 * 病虫害识别服务
 */
const identifyService = {
  /**
   * 上传图片并请求识别
   * @param {string} imagePath - 本地图片路径
   * @returns {Promise<Object>} 识别结果
   */
  async identifyByImage(imagePath) {
    try {
      const userId = wx.getStorageSync('userId') || 'guest';
      
      // 1. 首先将图片转换为Base64
      const base64Data = await this.getImageBase64(imagePath);
      
      // 2. 上传图片到Supabase存储
      const timestamp = Date.now();
      const fileName = `identify_${userId}_${timestamp}.jpg`;
      const bucketName = 'identify_images';
      
      await storage.upload(bucketName, fileName, base64Data);
      
      // 3. 获取图片的公共URL
      const imageUrl = await storage.getPublicUrl(bucketName, fileName);
      
      // 4. 调用识别API（这里假设Supabase Edge Functions或外部API）
      // 在实际应用中，可能需要调用外部的AI识别服务
      const identifyResult = await this.callIdentifyAPI(imageUrl);
      
      // 5. 保存识别记录到数据库
      const record = {
        user_id: userId,
        image_url: imageUrl,
        identified_at: new Date().toISOString(),
        result: identifyResult,
        confidence: identifyResult.confidence || 0,
        status: 'completed'
      };
      
      await db.insert('identify_records', record);
      
      return {
        success: true,
        data: {
          ...identifyResult,
          imageUrl: imageUrl
        }
      };
    } catch (error) {
      console.error('病虫害识别失败:', error);
      return {
        success: false,
        message: '识别失败，请稍后重试'
      };
    }
  },

  /**
   * 获取用户的识别历史记录
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 历史记录列表
   */
  async getIdentifyHistory(params = {}) {
    try {
      const userId = wx.getStorageSync('userId') || 'guest';
      const { page = 1, pageSize = 10 } = params;
      
      // 构建查询参数
      const query = {
        user_id: userId,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: 'identified_at.desc'
      };
      
      // 从Supabase获取历史记录
      const records = await db.select('identify_records', query);
      
      // 获取总记录数
      const totalResponse = await db.select('identify_records', {
        select: 'count(*)',
        user_id: userId
      });
      const total = totalResponse[0]?.count || 0;
      
      // 格式化数据
      const formattedRecords = records.map(record => ({
        id: record.id,
        imageUrl: record.image_url,
        identifiedAt: this.formatDateTime(record.identified_at),
        result: record.result,
        confidence: record.confidence,
        isSaved: record.is_saved || false
      }));
      
      return {
        success: true,
        data: {
          list: formattedRecords,
          hasMore: (page - 1) * pageSize + formattedRecords.length < total,
          total: parseInt(total)
        }
      };
    } catch (error) {
      console.error('获取识别历史失败:', error);
      return {
        success: false,
        message: '获取历史记录失败，请稍后重试'
      };
    }
  },

  /**
   * 保存/取消保存识别结果
   * @param {string} recordId - 记录ID
   * @param {boolean} save - 是否保存
   * @returns {Promise<Object>} 操作结果
   */
  async saveIdentifyResult(recordId, save = true) {
    try {
      const userId = wx.getStorageSync('userId');
      
      if (!userId) {
        throw new Error('用户未登录');
      }
      
      // 更新记录的保存状态
      await db.update('identify_records', recordId, {
        is_saved: save
      });
      
      return {
        success: true,
        data: {
          saved: save
        }
      };
    } catch (error) {
      console.error('保存识别结果失败:', error);
      return {
        success: false,
        message: '操作失败，请稍后重试'
      };
    }
  },

  /**
   * 获取病虫害详细信息
   * @param {string} diseaseId - 病虫害ID
   * @returns {Promise<Object>} 详细信息
   */
  async getDiseaseDetail(diseaseId) {
    try {
      // 从Supabase获取病虫害详情
      const disease = await db.select('diseases', { id: diseaseId });
      
      if (!disease || disease.length === 0) {
        throw new Error('未找到该病虫害信息');
      }
      
      return {
        success: true,
        data: disease[0]
      };
    } catch (error) {
      console.error('获取病虫害详情失败:', error);
      return {
        success: false,
        message: '获取信息失败，请稍后重试'
      };
    }
  },

  /**
   * 获取常见病虫害列表
   * @returns {Promise<Object>} 常见病虫害列表
   */
  async getCommonDiseases() {
    try {
      // 获取常见病虫害（例如，按识别次数排序）
      const diseases = await db.select('diseases', {
        limit: 10,
        order: 'identify_count.desc'
      });
      
      return {
        success: true,
        data: diseases
      };
    } catch (error) {
      console.error('获取常见病虫害失败:', error);
      return {
        success: false,
        message: '获取信息失败，请稍后重试'
      };
    }
  },

  /**
   * 将图片转换为Base64
   * @private
   * @param {string} imagePath - 图片路径
   * @returns {Promise<string>} Base64编码的图片数据
   */
  getImageBase64(imagePath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: imagePath,
        encoding: 'base64',
        success: res => resolve(res.data),
        fail: err => reject(err)
      });
    });
  },

  /**
   * 调用识别API
   * @private
   * @param {string} imageUrl - 图片URL
   * @returns {Promise<Object>} 识别结果
   */
  async callIdentifyAPI(imageUrl) {
    // 在实际应用中，这里可能调用外部的AI识别服务
    // 这里为了演示，返回模拟的识别结果
    
    // 可以通过Supabase Edge Functions调用外部API
    // 例如：
    // const response = await db.supabase.functions.invoke('identify-disease', {
    //   body: { imageUrl }
    // });
    
    // 暂时返回模拟数据
    const mockResults = [
      {
        diseaseName: '水稻纹枯病',
        confidence: 0.95,
        description: '水稻纹枯病是水稻的主要病害之一，主要危害叶鞘和叶片，严重时可侵入茎秆并蔓延至穗部。',
        symptoms: '病斑初期为暗绿色水渍状小斑，以后扩大成椭圆形或云纹状大斑，边缘暗褐色，中部灰绿色。',
        prevention: '1. 选用抗病品种\n2. 合理密植\n3. 加强肥水管理\n4. 及时清除病残体\n5. 药剂防治：可选用井冈霉素、戊唑醇等药剂。'
      },
      {
        diseaseName: '玉米螟',
        confidence: 0.92,
        description: '玉米螟是玉米的主要害虫，以幼虫蛀食玉米心叶、茎秆和果穗，造成减产。',
        symptoms: '心叶被害后，展开的叶片上出现不规则的半透明斑点或孔洞；茎秆被害后易折断；果穗被害后影响籽粒发育。',
        prevention: '1. 农业防治：处理越冬寄主\n2. 生物防治：释放赤眼蜂\n3. 药剂防治：在心叶期撒施颗粒剂或喷雾防治。'
      },
      {
        diseaseName: '小麦条锈病',
        confidence: 0.88,
        description: '小麦条锈病是小麦的重要病害，主要危害叶片，严重时也危害叶鞘、茎秆和穗部。',
        symptoms: '叶片上出现鲜黄色的条斑，病斑上产生大量的夏孢子堆，后期变为黑色的冬孢子堆。',
        prevention: '1. 种植抗病品种\n2. 药剂拌种\n3. 发病初期及时喷药防治，可选用三唑酮、戊唑醇等药剂。'
      }
    ];
    
    // 随机返回一个模拟结果
    const randomIndex = Math.floor(Math.random() * mockResults.length);
    return mockResults[randomIndex];
  },

  /**
   * 格式化日期时间
   * @private
   * @param {string} datetime - ISO格式的日期时间
   * @returns {string} 格式化后的日期时间字符串
   */
  formatDateTime(datetime) {
    const date = new Date(datetime);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
};

module.exports = identifyService;