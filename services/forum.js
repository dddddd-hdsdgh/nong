// 论坛相关的服务接口
const BASE_URL = 'https://api.example.com'; // 模拟API地址

// 模拟网络延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 生成随机时间
const getRandomTime = () => {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * 7);
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);
  
  const time = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000 - randomHours * 60 * 60 * 1000 - randomMinutes * 60 * 1000);
  
  if (randomDays === 0) {
    if (randomHours === 0) {
      return randomMinutes + '分钟前';
    } else {
      return randomHours + '小时前';
    }
  } else if (randomDays === 1) {
    return '昨天 ' + time.getHours().toString().padStart(2, '0') + ':' + time.getMinutes().toString().padStart(2, '0');
  } else {
    return (time.getMonth() + 1) + '-' + time.getDate() + ' ' + time.getHours().toString().padStart(2, '0') + ':' + time.getMinutes().toString().padStart(2, '0');
  }
};

// 论坛相关服务
const forumService = {
  // 获取论坛帖子列表
  async getForumList(params = {}) {
    try {
      // 在实际应用中，这里应该是真实的API调用
      // const response = await wx.request({
      //   url: `${BASE_URL}/forum/list`,
      //   data: params
      // });
      // return response.data;
      
      // 模拟API调用
      await delay(800);
      
      const { page = 1, pageSize = 10, tab = 'recommend' } = params;
      const categories = ['种植技术', '病虫害防治', '农产品销售', '经验分享', '政策咨询'];
      const titles = [
        '如何有效防治水稻纹枯病？',
        '今年玉米产量提高的小技巧',
        '草莓种植的最佳时间和方法',
        '蔬菜大棚温度管理经验分享',
        '新型农药使用注意事项',
        '果树嫁接技术详解',
        '农产品电商销售渠道推荐',
        '有机肥与化肥的科学搭配'
      ];
      const contents = [
        '最近田里的水稻出现了纹枯病的症状，叶子上有褐色斑点，请问有什么有效的防治方法吗？已经尝试了几种农药，但效果不太理想...',
        '经过几年的试验，我总结了几点提高玉米产量的经验，包括合理密植、科学施肥和病虫害防治等方面，希望能帮助到大家...',
        '草莓种植需要注意温度、湿度和光照等因素，下面我来详细分享一下我的种植经验和技巧...',
        '大棚蔬菜种植中，温度管理是关键。不同的蔬菜对温度有不同的要求，如何科学调控温度呢？',
        '使用新型农药时，一定要注意使用方法和安全间隔期，避免对环境和人体造成危害...'
      ];

      const data = [];
      const startIndex = (page - 1) * pageSize;
      
      for (let i = 0; i < pageSize; i++) {
        const index = (startIndex + i) % titles.length;
        data.push({
          id: 'post_' + (startIndex + i + 1),
          title: titles[index],
          content: contents[i % contents.length],
          username: '用户' + Math.floor(Math.random() * 10000),
          avatar: '',
          time: getRandomTime(),
          category: categories[Math.floor(Math.random() * categories.length)],
          likes: Math.floor(Math.random() * 1000),
          comments: Math.floor(Math.random() * 200),
          views: Math.floor(Math.random() * 5000),
          images: i % 3 === 0 ? [
            '/static/icons/forum1.png',
            '/static/icons/forum2.png'
          ] : []
        });
      }

      // 模拟排序逻辑
      if (tab === 'latest') {
        data.sort((a, b) => {
          // 简化的时间排序逻辑
          return b.time.localeCompare(a.time);
        });
      } else if (tab === 'hot') {
        data.sort((a, b) => {
          // 综合热度排序
          const hotScoreA = a.likes * 2 + a.comments * 3 + a.views * 0.1;
          const hotScoreB = b.likes * 2 + b.comments * 3 + b.views * 0.1;
          return hotScoreB - hotScoreA;
        });
      }

      return {
        success: true,
        data: {
          list: data,
          hasMore: page < 3,
          total: 25 // 模拟总条数
        }
      };
    } catch (error) {
      console.error('获取论坛列表失败:', error);
      return {
        success: false,
        message: '获取数据失败，请稍后重试'
      };
    }
  },

  // 获取帖子详情
  async getPostDetail(postId) {
    try {
      // 在实际应用中，这里应该是真实的API调用
      // const response = await wx.request({
      //   url: `${BASE_URL}/forum/detail/${postId}`
      // });
      // return response.data;
      
      // 模拟API调用
      await delay(600);
      
      const titles = [
        '如何有效防治水稻纹枯病？',
        '今年玉米产量提高的小技巧',
        '草莓种植的最佳时间和方法',
        '蔬菜大棚温度管理经验分享',
        '新型农药使用注意事项'
      ];
      const contents = [
        '最近田里的水稻出现了纹枯病的症状，叶子上有褐色斑点，请问有什么有效的防治方法吗？已经尝试了几种农药，但效果不太理想。\n\n症状表现：\n1. 叶子上出现水渍状褐色斑点\n2. 严重时叶片枯死\n3. 茎部也出现类似症状\n\n已经使用过的农药：\n- 井冈霉素\n- 三唑酮\n\n希望有经验的朋友能分享一下防治方法，谢谢！',
        '经过几年的试验，我总结了几点提高玉米产量的经验，希望能帮助到大家：\n\n1. 选择优质种子：选择抗病性强、产量高的品种\n2. 合理密植：根据品种特性确定种植密度\n3. 科学施肥：\n   - 底肥：有机肥为主，配合适量化肥\n   - 追肥：在大喇叭口期重施氮肥\n4. 病虫害防治：\n   - 玉米螟：在心叶期撒施颗粒剂\n   - 玉米蚜：及时喷洒吡虫啉\n5. 适时收获：在籽粒乳线消失时收获\n\n去年我采用这些方法，亩产提高了15%左右。',
        '草莓种植需要注意温度、湿度和光照等因素，下面我来详细分享一下我的种植经验和技巧：\n\n一、种植时间\n- 温室种植：9月下旬至10月上旬\n- 露地种植：8月下旬至9月上旬\n\n二、土壤准备\n- 选择疏松肥沃的沙壤土\n- pH值5.5-6.5\n- 每亩施入腐熟有机肥5000公斤\n\n三、定植技术\n- 行距30-40厘米，株距20-25厘米\n- 定植深度：苗心与土面平齐\n- 定植后及时浇水\n\n四、田间管理\n- 温度：白天20-25℃，夜间8-10℃\n- 湿度：60%-70%\n- 光照：每天10-12小时\n\n五、病虫害防治\n- 灰霉病：用腐霉利防治\n- 蚜虫：用吡虫啉防治\n\n六、采收\n- 果实全红时采收\n- 每天或隔天采收一次'
      ];
      const categories = ['种植技术', '病虫害防治', '农产品销售', '经验分享', '政策咨询'];
      
      const randomIndex = Math.floor(Math.random() * titles.length);
      
      return {
        success: true,
        data: {
          id: postId,
          title: titles[randomIndex],
          content: contents[randomIndex],
          username: '农业专家' + Math.floor(Math.random() * 100),
          avatar: '',
          time: '2小时前',
          category: categories[Math.floor(Math.random() * categories.length)],
          likes: Math.floor(Math.random() * 1000),
          comments: Math.floor(Math.random() * 100),
          views: Math.floor(Math.random() * 5000),
          images: [
            '/static/icons/forum1.png',
            '/static/icons/forum2.png'
          ],
          isLiked: false,
          isCollected: false,
          isFollowed: false
        }
      };
    } catch (error) {
      console.error('获取帖子详情失败:', error);
      return {
        success: false,
        message: '获取数据失败，请稍后重试'
      };
    }
  },

  // 获取帖子评论
  async getComments(postId, params = {}) {
    try {
      // 在实际应用中，这里应该是真实的API调用
      // const response = await wx.request({
      //   url: `${BASE_URL}/forum/comments/${postId}`,
      //   data: params
      // });
      // return response.data;
      
      // 模拟API调用
      await delay(500);
      
      const { page = 1, pageSize = 10 } = params;
      const comments = [
        {
          id: 'comment_1',
          content: '非常实用的分享，我今年也要试试这些方法！',
          username: '农民小李',
          avatar: '',
          time: '1小时前',
          likes: 23,
          isLiked: false
        },
        {
          id: 'comment_2',
          content: '补充一点：在病虫害防治方面，我建议使用生物农药，更加环保安全。',
          username: '绿色农业',
          avatar: '',
          time: '3小时前',
          likes: 45,
          isLiked: false
        },
        {
          id: 'comment_3',
          content: '我按照这些方法试了，确实有效！产量提高了不少。',
          username: '实践者',
          avatar: '',
          time: '昨天',
          likes: 18,
          isLiked: false
        },
        {
          id: 'comment_4',
          content: '请问施肥的具体用量是多少？能详细说一下吗？',
          username: '新手提问',
          avatar: '',
          time: '2天前',
          likes: 5,
          isLiked: false
        },
        {
          id: 'comment_5',
          content: '感谢分享！很有帮助。',
          username: '感谢者',
          avatar: '',
          time: '3天前',
          likes: 12,
          isLiked: false
        }
      ];
      
      // 模拟分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedComments = comments.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          list: paginatedComments,
          hasMore: page < 2,
          total: comments.length
        }
      };
    } catch (error) {
      console.error('获取评论失败:', error);
      return {
        success: false,
        message: '获取数据失败，请稍后重试'
      };
    }
  },

  // 发布评论
  async postComment(postId, content, replyTo = '') {
    try {
      // 在实际应用中，这里应该是真实的API调用
      // const response = await wx.request({
      //   url: `${BASE_URL}/forum/comment`,
      //   method: 'POST',
      //   data: {
      //     postId,
      //     content,
      //     replyTo
      //   }
      // });
      // return response.data;
      
      // 模拟API调用
      await delay(500);
      
      return {
        success: true,
        data: {
          id: 'comment_' + Date.now(),
          content: content,
          username: '当前用户',
          avatar: '',
          time: '刚刚',
          likes: 0,
          isLiked: false
        }
      };
    } catch (error) {
      console.error('发布评论失败:', error);
      return {
        success: false,
        message: '发布评论失败，请稍后重试'
      };
    }
  },

  // 点赞帖子
  async likePost(postId) {
    try {
      // 在实际应用中，这里应该是真实的API调用
      // const response = await wx.request({
      //   url: `${BASE_URL}/forum/like`,
      //   method: 'POST',
      //   data: { postId }
      // });
      // return response.data;
      
      // 模拟API调用
      await delay(300);
      
      return {
        success: true,
        data: {
          liked: true
        }
      };
    } catch (error) {
      console.error('点赞失败:', error);
      return {
        success: false,
        message: '操作失败，请稍后重试'
      };
    }
  },

  // 收藏帖子
  async collectPost(postId) {
    try {
      // 在实际应用中，这里应该是真实的API调用
      // const response = await wx.request({
      //   url: `${BASE_URL}/forum/collect`,
      //   method: 'POST',
      //   data: { postId }
      // });
      // return response.data;
      
      // 模拟API调用
      await delay(300);
      
      return {
        success: true,
        data: {
          collected: true
        }
      };
    } catch (error) {
      console.error('收藏失败:', error);
      return {
        success: false,
        message: '操作失败，请稍后重试'
      };
    }
  },

  // 关注用户
  async followUser(userId) {
    try {
      // 在实际应用中，这里应该是真实的API调用
      // const response = await wx.request({
      //   url: `${BASE_URL}/user/follow`,
      //   method: 'POST',
      //   data: { userId }
      // });
      // return response.data;
      
      // 模拟API调用
      await delay(300);
      
      return {
        success: true,
        data: {
          followed: true
        }
      };
    } catch (error) {
      console.error('关注失败:', error);
      return {
        success: false,
        message: '操作失败，请稍后重试'
      };
    }
  }
};

module.exports = forumService;