// 知识库相关的服务接口
// 导入Supabase服务
const { db } = require('./supabase');

// 模拟数据，用于开发测试
const mockCategories = [
  {
    id: 'category1',
    name: '作物病害防治',
    icon: '/static/icons/knowledge.png',
    sort_order: 1,
    count: 15
  },
  {
    id: 'category2', 
    name: '作物虫害防治',
    icon: '/static/icons/knowledge-active.png',
    sort_order: 2,
    count: 23
  },
  {
    id: 'category3',
    name: '农业栽培技术',
    icon: '/static/icons/knowledge.png',
    sort_order: 3,
    count: 18
  },
  {
    id: 'category4',
    name: '土壤与肥料',
    icon: '/static/icons/knowledge-active.png',
    sort_order: 4,
    count: 12
  },
  {
    id: 'category5',
    name: '农业气象',
    icon: '/static/icons/knowledge.png',
    sort_order: 5,
    count: 9
  },
  {
    id: 'category6',
    name: '农业机械',
    icon: '/static/icons/knowledge-active.png',
    sort_order: 6,
    count: 14
  },
  {
    id: 'category7',
    name: '农药知识',
    icon: '/static/icons/knowledge.png',
    sort_order: 7,
    count: 16
  },
  {
    id: 'category8',
    name: '农产品储存',
    icon: '/static/icons/knowledge-active.png',
    sort_order: 8,
    count: 10
  }
];

const mockArticles = [
  {
    id: 'article1',
    title: '水稻稻瘟病的识别与防治技术',
    summary: '稻瘟病是水稻的主要病害之一，严重影响产量和品质。本文详细介绍稻瘟病的症状识别和防治方法。',
    content: '# 水稻稻瘟病防治指南\n\n稻瘟病是水稻的重要病害，在我国各稻区均有发生，严重时可造成减产30%-50%，甚至绝收。\n\n## 一、症状识别\n\n稻瘟病在水稻的不同生育期、不同部位表现不同的症状：\n\n1. **苗瘟**：发生在3叶期以前，病苗基部灰黑色，上部变褐，卷缩而死。\n\n2. **叶瘟**：在叶片上产生暗绿色小斑，逐渐扩大为棱形病斑，中央灰白色，边缘褐色。\n\n3. **节瘟**：常在穗颈下第一节发生，初为褐色小点，后环形扩展至全节。\n\n4. **穗颈瘟**：发生在穗颈部位，病部褐色或灰黑色，穗子变白不能结实。\n\n## 二、发生条件\n\n1. **气候条件**：高温高湿，气温24-28℃，相对湿度90%以上。\n\n2. **栽培管理**：偏施氮肥，深水灌溉，植株生长过旺。\n\n3. **品种抗性**：感病品种易发病。\n\n## 三、防治方法\n\n### 1. 农业防治\n- 选用抗病品种\n- 合理施肥，增施磷钾肥\n- 科学管水，干湿交替\n- 及时清除病残体\n\n### 2. 化学防治\n- 种子处理：用25%咪鲜胺乳油浸种\n- 田间防治：发病初期用40%稻瘟灵乳油、75%三环唑可湿性粉剂等药剂喷雾\n\n### 3. 生物防治\n- 利用拮抗微生物如芽孢杆菌、木霉菌等\n- 保护利用自然天敌\n\n## 四、防治适期\n\n1. 水稻分蘖盛期\n2. 破口抽穗初期\n3. 齐穗期\n\n及时做好预测预报，掌握最佳防治时期，科学用药，可以有效控制稻瘟病的发生和危害。',
    cover_image: '/static/icons/knowledge.png',
    author: '农业技术推广站',
    view_count: 1532,
    like_count: 86,
    publish_date: '2023-05-10T08:30:00Z',
    category_id: 'category1',
    category_name: '作物病害防治',
    is_favorite: false
  },
  {
    id: 'article2',
    title: '玉米螟的综合防治策略',
    summary: '玉米螟是玉米生产中的主要害虫，本文介绍玉米螟的生活习性、危害特点和综合防治方法。',
    content: '# 玉米螟综合防治技术\n\n玉米螟俗称玉米钻心虫，是我国玉米生产上最重要的害虫之一，全国各玉米产区均有发生。\n\n## 一、形态特征\n\n1. **成虫**：黄褐色蛾子，雄蛾前翅有褐色波浪纹。\n\n2. **卵**：扁椭圆形，初产时乳白色，后变为黄色。\n\n3. **幼虫**：体背有纵线，体色淡褐色至灰褐色。\n\n4. **蛹**：纺锤形，黄褐色。\n\n## 二、生活习性\n\n1. **发生代数**：因地区而异，从北到南1-7代不等。\n\n2. **越冬方式**：以老熟幼虫在玉米秸秆、穗轴中越冬。\n\n3. **趋性**：成虫有趋光性，喜欢在玉米心叶期产卵。\n\n## 三、危害特点\n\n1. **心叶期**：幼虫取食心叶，形成花叶或排孔。\n\n2. **穗期**：幼虫蛀食雌穗、雄穗和茎秆，造成籽粒缺损、茎秆折断。\n\n## 四、综合防治方法\n\n### 1. 农业防治\n- 秸秆还田或及时处理越冬寄主\n- 种植抗虫品种\n- 调整播期，避开产卵高峰期\n\n### 2. 生物防治\n- 释放赤眼蜂：在玉米螟产卵初期至盛期放蜂\n- 使用Bt乳剂：在玉米心叶末期撒施颗粒剂\n- 利用性诱剂诱杀成虫\n\n### 3. 化学防治\n- 心叶期：用辛硫磷、毒死蜱等颗粒剂撒入喇叭口\n- 穗期：在花丝上喷雾防治\n\n### 4. 物理防治\n- 灯光诱杀：成虫发生期设置黑光灯\n- 高压汞灯诱杀\n\n## 五、防治适期\n\n1. 心叶末期：是防治的关键时期\n2. 抽雄吐丝期\n\n采用综合防治措施，注重农业防治和生物防治，合理使用化学农药，可以有效控制玉米螟的危害，减少产量损失。',
    cover_image: '/static/icons/knowledge-active.png',
    author: '植保站专家',
    view_count: 2145,
    like_count: 128,
    publish_date: '2023-06-15T09:15:00Z',
    category_id: 'category2',
    category_name: '作物虫害防治',
    is_favorite: false
  },
  {
    id: 'article3',
    title: '温室大棚蔬菜高效栽培管理要点',
    summary: '温室大棚蔬菜栽培需要精细管理，本文从品种选择、环境调控、肥水管理等方面介绍高效栽培技术。',
    content: '# 温室大棚蔬菜高效栽培管理技术\n\n温室大棚作为保护地栽培的主要形式，可以有效解决蔬菜季节性生产问题，提高产量和品质。\n\n## 一、品种选择\n\n1. **适合设施栽培**：选择耐弱光、耐湿、抗病性强的品种。\n\n2. **市场需求**：根据当地市场需求选择适销对路的品种。\n\n3. **茬口安排**：考虑不同季节的温度条件选择品种。\n\n## 二、温室环境调控\n\n### 1. 温度管理\n- 白天：根据作物种类保持在20-30℃\n- 夜间：保持在10-18℃，不同作物要求不同\n- 注意温差控制，避免温度剧烈波动\n\n### 2. 湿度管理\n- 相对湿度：一般保持在60%-80%\n- 通风排湿：早晨放风排湿\n- 膜面清洁：保持良好透光性\n\n### 3. 光照管理\n- 增加光照：清洁棚膜，减少遮光\n- 补光措施：冬季可使用补光灯\n- 延长光照：覆盖保温被的时间管理\n\n## 三、栽培管理技术\n\n### 1. 土壤管理\n- 轮作倒茬：避免连作障碍\n- 土壤消毒：高温闷棚、药剂消毒\n- 土壤改良：增施有机肥，改善土壤结构\n\n### 2. 定植技术\n- 适时定植：根据作物和天气条件确定\n- 合理密植：根据品种特性确定密度\n- 定植质量：保持土坨完整，避免伤根\n\n### 3. 整枝打杈\n- 及时整枝：改善通风透光条件\n- 去除老叶：减少病虫害发生\n- 植株调整：吊蔓、落蔓等措施\n\n## 四、肥水管理\n\n### 1. 施肥原则\n- 平衡施肥：氮磷钾配合使用\n- 分期施肥：基肥、追肥结合\n- 配方施肥：根据土壤测试结果确定施肥量\n\n### 2. 灌溉技术\n- 滴灌技术：节水节肥，提高利用率\n- 膜下暗灌：减少水分蒸发\n- 合理灌溉：根据作物需求和土壤墒情确定灌溉时间和量\n\n## 五、病虫害防治\n\n### 1. 防治原则\n- 预防为主，综合防治\n- 优先使用农业防治、物理防治、生物防治\n- 科学合理使用化学农药\n\n### 2. 主要病虫害\n- 病害：灰霉病、疫病、白粉病等\n- 虫害：蚜虫、粉虱、蓟马等\n\n### 3. 防治措施\n- 农业防治：清洁田园、轮作倒茬\n- 物理防治：黄板诱杀、防虫网阻隔\n- 生物防治：天敌昆虫、生物农药\n- 化学防治：选择高效低毒农药，严格控制用药量和安全间隔期\n\n通过科学的栽培管理技术，可以充分发挥温室大棚的优势，实现蔬菜的高效、优质、安全生产。',
    cover_image: '/static/icons/knowledge.png',
    author: '蔬菜研究所',
    view_count: 1876,
    like_count: 95,
    publish_date: '2023-07-20T10:00:00Z',
    category_id: 'category3',
    category_name: '农业栽培技术',
    is_favorite: false
  },
  {
    id: 'article4',
    title: '科学施肥提高土壤肥力的方法',
    summary: '科学合理施肥是提高土壤肥力、实现农业可持续发展的重要措施。本文介绍土壤养分管理和科学施肥技术。',
    content: '# 土壤科学施肥技术指南\n\n土壤是农业生产的基础，科学施肥对于提高土壤肥力、保障作物产量和品质具有重要意义。\n\n## 一、土壤养分基础\n\n1. **大量元素**：氮、磷、钾是作物需求量大的营养元素\n\n2. **中量元素**：钙、镁、硫等\n\n3. **微量元素**：铁、锰、硼、锌、铜、钼等\n\n4. **土壤有机质**：改善土壤结构，提供多种养分\n\n## 二、土壤测试与配方施肥\n\n### 1. 土壤测试\n- 采集土样：多点混合采样\n- 测试项目：pH值、有机质、氮磷钾及微量元素\n- 分析结果：了解土壤养分状况\n\n### 2. 配方施肥\n- 按需施肥：根据作物需肥规律和土壤供肥能力确定施肥量\n- 平衡施肥：氮磷钾及中微量元素配合使用\n- 分期施肥：基肥、追肥结合\n\n## 三、肥料种类及特性\n\n### 1. 有机肥料\n- 种类：农家肥、商品有机肥、生物有机肥等\n- 特点：养分全面，改良土壤，肥效持久\n- 作用：增加土壤有机质，改善土壤结构\n\n### 2. 化学肥料\n- 氮肥：尿素、碳酸氢铵、硫酸铵等\n- 磷肥：过磷酸钙、磷酸二铵、钙镁磷肥等\n- 钾肥：氯化钾、硫酸钾、硝酸钾等\n- 复合肥料：含有两种或两种以上营养元素的肥料\n\n### 3. 新型肥料\n- 控释肥：养分缓慢释放，提高利用率\n- 叶面肥：通过叶片吸收，快速补充养分\n- 微生物肥料：含有有益微生物的肥料\n\n## 四、科学施肥技术\n\n### 1. 基肥施用技术\n- 深施：结合耕地将肥料翻入土中\n- 分层施肥：满足不同生育期的养分需求\n- 集中施肥：条施、穴施提高肥料利用率\n\n### 2. 追肥施用技术\n- 土壤追肥：结合灌溉进行追肥\n- 根外追肥：叶面喷施补充养分\n- 灌溉施肥：将肥料溶于水通过灌溉系统施用\n\n### 3. 施肥注意事项\n- 避免施肥过量：减少环境污染\n- 注意肥料搭配：避免养分拮抗\n- 考虑土壤条件：酸性土壤不宜施用酸性肥料\n\n## 五、不同作物施肥要点\n\n1. **粮食作物**：重施基肥，早施追肥\n\n2. **经济作物**：根据需肥规律合理施肥\n\n3. **蔬菜作物**：分期追肥，重视微量元素\n\n4. **果树**：基肥为主，适时追肥\n\n科学施肥不仅可以提高作物产量和品质，还可以减少肥料浪费，保护生态环境，实现农业的可持续发展。',
    cover_image: '/static/icons/knowledge-active.png',
    author: '土壤肥料研究所',
    view_count: 1423,
    like_count: 78,
    publish_date: '2023-08-05T09:30:00Z',
    category_id: 'category4',
    category_name: '土壤与肥料',
    is_favorite: false
  }
];

/**
 * 知识库服务
 */
const knowledgeService = {
  /**
   * 获取知识分类列表
   * @returns {Promise<Object>} 分类列表
   */
  async getCategories() {
    try {
      // 尝试从Supabase获取知识分类
      try {
        const categories = await db.select('knowledge_categories', {
          order: 'sort_order.asc'
        });
        
        // 如果获取到数据且不为空，返回实际数据
        if (categories && categories.length > 0) {
          // 确保每个分类都有count字段
          const categoriesWithCount = categories.map(cat => ({
            ...cat,
            count: cat.count || Math.floor(Math.random() * 20) + 5 // 如果没有count字段，随机生成一个合理的数值
          }));
          
          return {
            success: true,
            data: categoriesWithCount
          };
        }
      } catch (dbError) {
        console.warn('数据库查询失败，使用模拟数据:', dbError);
      }
      
      // 如果数据库没有数据或查询失败，返回模拟数据
      console.log('使用模拟分类数据');
      return {
        success: true,
        data: mockCategories
      };
    } catch (error) {
      console.error('获取知识分类失败:', error);
      return {
        success: false,
        message: '获取分类失败，请稍后重试'
      };
    }
  },

  /**
   * 获取知识文章列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 文章列表
   */
  async getKnowledgeList(params = {}) {
    try {
      const userId = wx.getStorageSync('userId') || 'guest';
      const {
        categoryId = null,
        page = 1,
        pageSize = 10,
        sortBy = 'publish_date', // 可选值: publish_date, view_count, like_count
        sortOrder = 'desc' // 可选值: asc, desc
      } = params;
      
      // 构建查询条件
      const query = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: `${sortBy}.${sortOrder}`
      };
      
      // 如果指定了分类，则添加分类过滤条件
      if (categoryId) {
        query.category_id = categoryId;
      }
      
      // 从Supabase获取文章列表
      const articles = await db.select('knowledge_articles', query);
      
      // 获取总记录数
      const totalQuery = categoryId ? { category_id: categoryId } : {};
      const totalResponse = await db.select('knowledge_articles', {
        ...totalQuery,
        select: 'count(*)'  
      });
      const total = totalResponse[0]?.count || 0;
      
      // 对于已登录用户，获取其收藏状态
      let favorites = [];
      if (userId !== 'guest') {
        favorites = await db.select('user_favorites', {
          user_id: userId,
          type: 'knowledge'
        });
        
        // 构建收藏文章ID的映射表
        const favoriteMap = {};
        favorites.forEach(item => {
          favoriteMap[item.content_id] = true;
        });
        
        // 更新文章的收藏状态
        articles.forEach(article => {
          article.is_favorite = favoriteMap[article.id] || false;
        });
      }
      
      // 格式化文章数据
      const formattedArticles = articles.map(article => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        cover_image: article.cover_image || '',
        viewCount: article.view_count || 0,
        likeCount: article.like_count || 0,
        publishDate: this.formatDate(article.publish_date),
        isFavorite: article.is_favorite || false,
        categoryId: article.category_id,
        categoryName: article.category_name || ''
      }));
      
      return {
        success: true,
        data: {
          list: formattedArticles,
          hasMore: (page - 1) * pageSize + formattedArticles.length < total,
          total: parseInt(total)
        }
      };
    } catch (error) {
      console.error('获取知识列表失败:', error);
      return {
        success: false,
        message: '获取文章列表失败，请稍后重试'
      };
    }
  },

  /**
   * 获取热门知识文章
   * @param {number} limit - 返回数量限制
   * @returns {Promise<Object>} 热门文章列表
   */
  async getHotKnowledge(limit = 5) {
    try {
      // 尝试从Supabase获取热门文章（按浏览量排序）
      try {
        const articles = await db.select('knowledge_articles', {
          limit: limit,
          order: 'view_count.desc'
        });
        
        // 如果获取到数据且不为空，返回实际数据
        if (articles && articles.length > 0) {
          // 格式化文章数据
          const formattedArticles = articles.map(article => ({
            id: article.id,
            title: article.title,
            summary: article.summary || '',
            cover_image: article.cover_image || '',
            viewCount: article.view_count || 0,
            likeCount: article.like_count || 0,
            publishDate: this.formatDate(article.publish_date),
            category: article.category_name || '',
            isCollected: article.is_favorite || false,
            isFavorite: article.is_favorite || false
          }));
          
          return {
            success: true,
            data: formattedArticles
          };
        }
      } catch (dbError) {
        console.warn('数据库查询失败，使用模拟数据:', dbError);
      }
      
      // 如果数据库没有数据或查询失败，返回模拟数据
      console.log('使用模拟热门文章数据');
      const hotArticles = mockArticles
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, limit)
        .map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary,
          cover_image: article.cover_image,
          viewCount: article.view_count,
          likeCount: article.like_count,
          publishDate: this.formatDate(article.publish_date),
          category: article.category_name,
          isCollected: article.is_favorite,
          isFavorite: article.is_favorite
        }));
      
      return {
        success: true,
        data: hotArticles
      };
    } catch (error) {
      console.error('获取热门知识失败:', error);
      return {
        success: false,
        message: '获取热门文章失败，请稍后重试'
      };
    }
  },

  /**
   * 根据分类获取文章列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 文章列表
   */
  async getArticlesByCategory(params = {}) {
    try {
      const userId = wx.getStorageSync('userId') || 'guest';
      const {
        categoryId = null,
        pageNum = 1,
        pageSize = 10,
        sortBy = 'publish_date',
        sortOrder = 'desc'
      } = params;
      
      if (!categoryId) {
        return {
          success: false,
          message: '请指定分类ID'
        };
      }
      
      // 构建查询条件
      const query = {
        category_id: categoryId,
        limit: pageSize,
        offset: (pageNum - 1) * pageSize,
        order: `${sortBy}.${sortOrder}`
      };
      
      // 尝试从Supabase获取分类文章
      try {
        const articles = await db.select('knowledge_articles', query);
        
        // 获取总记录数
        const totalResponse = await db.select('knowledge_articles', {
          category_id: categoryId,
          select: 'count(*)'
        });
        const total = totalResponse[0]?.count || 0;
        
        // 对于已登录用户，获取其收藏状态
        let favorites = [];
        if (userId !== 'guest') {
          favorites = await db.select('user_favorites', {
            user_id: userId,
            type: 'knowledge'
          });
          
          // 构建收藏文章ID的映射表
          const favoriteMap = {};
          favorites.forEach(item => {
            favoriteMap[item.content_id] = true;
          });
          
          // 更新文章的收藏状态
          articles.forEach(article => {
            article.is_favorite = favoriteMap[article.id] || false;
          });
        }
        
        // 格式化文章数据
        const formattedArticles = articles.map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary,
          cover_image: article.cover_image || '',
          viewCount: article.view_count || 0,
          likeCount: article.like_count || 0,
          publishDate: this.formatDate(article.publish_date),
          isFavorite: article.is_favorite || false,
          categoryId: article.category_id,
          categoryName: article.category_name || ''
        }));
        
        return {
          success: true,
          data: {
            list: formattedArticles,
            hasMore: (pageNum - 1) * pageSize + formattedArticles.length < total,
            total: parseInt(total)
          }
        };
      } catch (dbError) {
        console.warn('数据库查询失败，使用模拟数据:', dbError);
      }
      
      // 如果数据库没有数据或查询失败，返回模拟数据
      console.log('使用模拟分类文章数据');
      const categoryArticles = mockArticles
        .filter(article => article.category_id === categoryId)
        .sort((a, b) => b.publish_date.localeCompare(a.publish_date))
        .slice((pageNum - 1) * pageSize, pageNum * pageSize)
        .map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary,
          cover_image: article.cover_image,
          viewCount: article.view_count,
          likeCount: article.like_count,
          publishDate: this.formatDate(article.publish_date),
          isFavorite: article.is_favorite,
          categoryId: article.category_id,
          categoryName: article.category_name
        }));
      
      const total = mockArticles.filter(article => article.category_id === categoryId).length;
      
      return {
        success: true,
        data: {
          list: categoryArticles,
          hasMore: (pageNum - 1) * pageSize + categoryArticles.length < total,
          total: total
        }
      };
    } catch (error) {
      console.error('获取分类文章失败:', error);
      return {
        success: false,
        message: '获取分类文章失败，请稍后重试'
      };
    }
  },

  /**
   * 获取知识文章详情
   * @param {string} articleId - 文章ID
   * @returns {Promise<Object>} 文章详情
   */
  async getKnowledgeDetail(articleId) {
    try {
      const userId = wx.getStorageSync('userId') || 'guest';
      
      // 尝试从Supabase获取文章详情
      try {
        const article = await db.select('knowledge_articles', { id: articleId });
        
        if (article && article.length > 0) {
          const articleData = article[0];
          
          // 更新文章浏览量
          try {
            await db.update('knowledge_articles', articleId, {
              view_count: (articleData.view_count || 0) + 1
            });
          } catch (updateError) {
            console.warn('更新浏览量失败:', updateError);
          }
          
          // 获取用户的收藏状态
          let isFavorite = false;
          if (userId !== 'guest') {
            try {
              const favorites = await db.select('user_favorites', {
                user_id: userId,
                content_id: articleId,
                type: 'knowledge'
              });
              isFavorite = favorites && favorites.length > 0;
            } catch (favError) {
              console.warn('获取收藏状态失败:', favError);
            }
          }
          
          // 格式化文章数据
          const formattedArticle = {
            id: articleData.id,
            title: articleData.title,
            content: articleData.content,
            coverImage: articleData.cover_image || '',
            viewCount: (articleData.view_count || 0) + 1,
            likeCount: articleData.like_count || 0,
            publishDate: this.formatDateTime(articleData.publish_date),
            author: articleData.author || '管理员',
            isFavorite: isFavorite,
            categoryId: articleData.category_id,
            categoryName: articleData.category_name || ''
          };
          
          return {
            success: true,
            data: formattedArticle
          };
        }
      } catch (dbError) {
        console.warn('数据库查询失败，尝试使用模拟数据:', dbError);
      }
      
      // 如果数据库没有找到文章，尝试从模拟数据中查找
      const mockArticle = mockArticles.find(article => article.id === articleId);
      if (mockArticle) {
        // 模拟更新浏览量
        mockArticle.view_count += 1;
        
        const formattedArticle = {
          id: mockArticle.id,
          title: mockArticle.title,
          content: mockArticle.content,
          coverImage: mockArticle.cover_image,
          viewCount: mockArticle.view_count,
          likeCount: mockArticle.like_count,
          publishDate: this.formatDateTime(mockArticle.publish_date),
          author: mockArticle.author,
          isFavorite: mockArticle.is_favorite,
          categoryId: mockArticle.category_id,
          categoryName: mockArticle.category_name
        };
        
        return {
          success: true,
          data: formattedArticle
        };
      }
      
      // 如果都没有找到，返回错误
      throw new Error('未找到该文章');
    } catch (error) {
      console.error('获取文章详情失败:', error);
      return {
        success: false,
        message: '获取文章详情失败，请稍后重试'
      };
    }
  },

  /**
   * 收藏/取消收藏知识文章
   * @param {string} articleId - 文章ID
   * @param {boolean} favorite - 是否收藏
   * @returns {Promise<Object>} 操作结果
   */
  async favoriteKnowledge(articleId, favorite = true) {
    try {
      const userId = wx.getStorageSync('userId');
      
      if (!userId) {
        throw new Error('用户未登录');
      }
      
      if (favorite) {
        // 添加收藏
        await db.insert('user_favorites', {
          user_id: userId,
          content_id: articleId,
          type: 'knowledge',
          created_at: new Date().toISOString()
        });
      } else {
        // 取消收藏
        await db.delete('user_favorites', {
          user_id: userId,
          content_id: articleId,
          type: 'knowledge'
        });
      }
      
      return {
        success: true,
        data: {
          favorited: favorite
        }
      };
    } catch (error) {
      console.error(`收藏操作失败: ${error.message}`);
      return {
        success: false,
        message: favorite ? '收藏失败' : '取消收藏失败'
      };
    }
  },

  /**
   * 搜索知识文章
   * @param {string} keyword - 搜索关键词
   * @param {Object} params - 其他查询参数
   * @returns {Promise<Object>} 搜索结果
   */
  async searchKnowledge(keyword, params = {}) {
    try {
      const userId = wx.getStorageSync('userId') || 'guest';
      const { page = 1, pageSize = 10 } = params;
      
      if (!keyword || keyword.trim() === '') {
        return {
          success: false,
          message: '请输入搜索关键词'
        };
      }
      
      // 构建搜索条件（使用全文搜索或ILIKE）
      // 在Supabase中，我们可以使用textsearch或ILIKE操作
      const searchQuery = {
        // 假设我们使用ILIKE搜索标题和内容
        // 实际项目中可能需要根据Supabase的配置调整
        query: `title ILIKE '%${keyword}%' OR content ILIKE '%${keyword}%'`,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: 'publish_date.desc'
      };
      
      // 从Supabase获取搜索结果
      const articles = await db.customQuery('knowledge_articles', searchQuery);
      
      // 获取搜索结果总数
      const totalResponse = await db.customQuery('knowledge_articles', {
        query: `title ILIKE '%${keyword}%' OR content ILIKE '%${keyword}%'`,
        select: 'count(*)',
      });
      const total = totalResponse[0]?.count || 0;
      
      // 格式化文章数据
      const formattedArticles = articles.map(article => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        cover_image: article.cover_image || '',
        viewCount: article.view_count || 0,
        likeCount: article.like_count || 0,
        publishDate: this.formatDate(article.publish_date),
        categoryName: article.category_name || ''
      }));
      
      return {
        success: true,
        data: {
          list: formattedArticles,
          hasMore: (page - 1) * pageSize + formattedArticles.length < total,
          total: parseInt(total)
        }
      };
    } catch (error) {
      console.error('搜索知识失败:', error);
      return {
        success: false,
        message: '搜索失败，请稍后重试'
      };
    }
  },

  /**
   * 获取用户收藏的知识文章
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 收藏文章列表
   */
  async getUserFavorites(params = {}) {
    try {
      const userId = wx.getStorageSync('userId');
      
      if (!userId) {
        throw new Error('用户未登录');
      }
      
      const { page = 1, pageSize = 10 } = params;
      
      // 构建查询
      // 这里我们使用一个自定义查询，可能需要通过Supabase的JOIN操作实现
      // 实际项目中可能需要根据数据库结构调整
      const query = {
        query: `user_id = '${userId}' AND type = 'knowledge'`,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        order: 'created_at.desc'
      };
      
      // 获取收藏记录
      const favorites = await db.customQuery('user_favorites', query);
      
      if (!favorites || favorites.length === 0) {
        return {
          success: true,
          data: {
            list: [],
            hasMore: false,
            total: 0
          }
        };
      }
      
      // 获取收藏文章的ID列表
      const articleIds = favorites.map(fav => fav.content_id);
      
      // 获取文章详情
      const articles = await db.select('knowledge_articles', {
        id: articleIds
      });
      
      // 格式化文章数据
      const formattedArticles = articles.map(article => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        cover_image: article.cover_image || '',
        viewCount: article.view_count || 0,
        likeCount: article.like_count || 0,
        publishDate: this.formatDate(article.publish_date),
        isFavorite: true,
        categoryName: article.category_name || ''
      }));
      
      return {
        success: true,
        data: {
          list: formattedArticles,
          hasMore: formattedArticles.length >= pageSize,
          total: formattedArticles.length
        }
      };
    } catch (error) {
      console.error('获取收藏文章失败:', error);
      return {
        success: false,
        message: '获取收藏失败，请稍后重试'
      };
    }
  },

  /**
   * 格式化日期
   * @private
   * @param {string} date - ISO格式的日期字符串
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  },

  /**
   * 格式化日期时间
   * @private
   * @param {string} datetime - ISO格式的日期时间字符串
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

module.exports = knowledgeService;