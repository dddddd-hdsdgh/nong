// 模拟数据文件，提供离线数据支持

// 论坛分类
const categories = [
  { id: '1', name: '种植技术', icon: '/static/icons/plant.png' },
  { id: '2', name: '病虫害防治', icon: '/static/icons/pest.png' },
  { id: '3', name: '农产品销售', icon: '/static/icons/sale.png' },
  { id: '4', name: '经验分享', icon: '/static/icons/share.png' },
  { id: '5', name: '政策咨询', icon: '/static/icons/policy.png' }
];

// 热门帖子
const hotPosts = [
  {
    id: 'hot_1',
    title: '大棚蔬菜高效种植技术详解',
    author: '农业专家老王',
    viewCount: 12345,
    commentCount: 342,
    likeCount: 1245
  },
  {
    id: 'hot_2',
    title: '2024年最值得种植的5种农作物',
    author: '农业顾问小李',
    viewCount: 9876,
    commentCount: 256,
    likeCount: 987
  },
  {
    id: 'hot_3',
    title: '有机肥料制作与使用全攻略',
    author: '绿色农业倡导者',
    viewCount: 8765,
    commentCount: 198,
    likeCount: 876
  }
];

// 推荐用户
const recommendedUsers = [
  {
    id: 'user_1',
    name: '农业专家老王',
    avatar: '',
    followers: 12345,
    posts: 342,
    isFollowed: false
  },
  {
    id: 'user_2',
    name: '蔬菜种植达人',
    avatar: '',
    followers: 8765,
    posts: 256,
    isFollowed: false
  },
  {
    id: 'user_3',
    name: '水果种植技术员',
    avatar: '',
    followers: 6543,
    posts: 189,
    isFollowed: false
  }
];

// 论坛常见问题
const faqs = [
  {
    id: 'faq_1',
    question: '如何提高帖子的曝光率？',
    answer: '1. 发布高质量、有价值的内容\n2. 选择合适的分类标签\n3. 积极回复其他用户的评论\n4. 保持活跃，定期发布内容'
  },
  {
    id: 'faq_2',
    question: '如何有效防治常见农作物病虫害？',
    answer: '1. 定期巡查，早发现早处理\n2. 采用生物防治和物理防治相结合的方法\n3. 合理使用化学农药，注意安全间隔期\n4. 加强栽培管理，提高作物抗病虫能力'
  },
  {
    id: 'faq_3',
    question: '如何选择适合本地种植的作物品种？',
    answer: '1. 考虑本地气候条件和土壤特性\n2. 选择经过本地试种成功的品种\n3. 参考当地农业推广部门的推荐\n4. 考虑市场需求和经济效益'
  }
];

module.exports = {
  categories,
  hotPosts,
  recommendedUsers,
  faqs
};