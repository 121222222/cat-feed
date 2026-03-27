const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    activeTab: 0,
    helpFilter: 'all',
    helpList: [],
    rules: [
      {
        id: 'r001',
        icon: '🐱',
        title: '社区公约',
        content: '1. 友善交流，尊重每一位猫友\n2. 发布真实内容，禁止虚假信息\n3. 互助自愿，诚信为本\n4. 保护隐私，未经同意不泄露他人信息\n5. 如有纠纷，请联系管理员处理',
        time: '2026-03-15 发布'
      },
      {
        id: 'r002',
        icon: '🤝',
        title: '互助须知',
        content: '1. 互助为邻里间自愿行为\n2. 提前沟通好喂养细节和注意事项\n3. 建议拍照打卡，让猫主放心\n4. 如遇紧急情况请立即联系猫主\n5. 平台不参与任何金钱交易',
        time: '2026-03-10 发布'
      },
      {
        id: 'r003',
        icon: '📸',
        title: '内容规范',
        content: '1. 分享原创猫咪照片和故事\n2. 禁止发布广告和营销内容\n3. 不得发布血腥、虐待动物内容\n4. 尊重他人猫咪，未经同意勿转发\n5. 违规内容将被删除并警告',
        time: '2026-03-01 发布'
      }
    ],
    posts: [
      {
        id: 'p001',
        userName: '小美',
        avatar: '/assets/images/avatar4.png',
        time: '2小时前',
        content: '今天帮邻居喂猫，这只小橘真的太可爱了！吃饭的时候呼噜呼噜的 😻',
        images: [],
        likes: 12,
        comments: 3,
        liked: false
      },
      {
        id: 'p002',
        userName: '大壮',
        avatar: '/assets/images/avatar5.png',
        time: '5小时前',
        content: '求助！我家猫最近不爱吃猫粮了，有没有推荐的牌子？',
        images: [],
        likes: 5,
        comments: 8,
        liked: true
      },
      {
        id: 'p003',
        userName: '小花',
        avatar: '/assets/images/avatar6.png',
        time: '昨天',
        content: '分享一下猫咪日常护理小知识：\n1. 定期修剪指甲\n2. 每周梳毛2-3次\n3. 注意观察精神状态\n4. 定期驱虫',
        images: [],
        likes: 28,
        comments: 6,
        liked: false
      }
    ]
  },

  onLoad() {
    this.loadHelpList();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    // 刷新互助列表
    if (this.data.activeTab === 0) {
      this.loadHelpList();
    }
  },

  async loadHelpList() {
    try {
      const filter = this.data.helpFilter === 'all' ? null : this.data.helpFilter;
      const helpsRaw = await db.getHelps(filter);
      const helpList = helpsRaw.map(h => ({
        ...h,
        id: h._id
      }));
      this.setData({ helpList });
    } catch (err) {
      console.error('加载互助列表失败:', err);
    }
  },

  switchTab(e) {
    const tab = Number(e.currentTarget.dataset.tab);
    this.setData({ activeTab: tab });
    if (tab === 0) {
      this.loadHelpList();
    }
  },

  setHelpFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ helpFilter: filter });
    this.loadHelpList();
  },

  goPublishHelp(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({ url: `/pages/publish-help/publish-help?type=${type}` });
  },

  goHelpDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/help-detail/help-detail?id=${id}` });
  },

  onLike(e) {
    const id = e.currentTarget.dataset.id;
    const posts = this.data.posts.map(p => {
      if (p.id === id) {
        return { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    });
    this.setData({ posts });
  },

  onNewPost() {
    wx.navigateTo({ url: '/pages/publish/publish' });
  },

  goPostDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/post-detail/post-detail?id=${id}` });
  }
});
