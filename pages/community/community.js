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
    posts: [],
    postsLoading: true
  },

  onLoad() {
    this.loadHelpList();
    this.loadPosts();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    // 刷新互助列表
    if (this.data.activeTab === 0) {
      this.loadHelpList();
    } else if (this.data.activeTab === 1) {
      this.loadPosts();
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

  // 从数据库加载交流帖子
  async loadPosts() {
    this.setData({ postsLoading: true });
    
    try {
      const userInfo = app.globalData.userInfo || {};
      const currentUserId = userInfo._id || '';
      
      // 从数据库获取帖子
      const postsRaw = await db.getPosts('all', currentUserId);
      
      // 过滤掉当前用户自己发布的帖子（自己的动态在"我的动态"中查看）
      const filteredPosts = postsRaw.filter(p => p.userId !== currentUserId);
      
      // 收集所有图片 fileID，转换为临时链接
      const allFileIDs = [];
      filteredPosts.forEach(p => {
        if (p.images && p.images.length > 0) {
          allFileIDs.push(...p.images);
        }
        if (p.userAvatar && p.userAvatar.startsWith('cloud://')) {
          allFileIDs.push(p.userAvatar);
        }
      });
      
      // 批量获取临时链接
      let fileUrlMap = {};
      if (allFileIDs.length > 0) {
        try {
          const tempUrls = await db.getImageUrls(allFileIDs);
          allFileIDs.forEach((id, index) => {
            fileUrlMap[id] = tempUrls[index] || id;
          });
        } catch (e) {
          console.error('获取临时链接失败:', e);
        }
      }
      
      // 格式化帖子数据
      const posts = filteredPosts.map(p => ({
        id: p._id,
        userName: p.userName || '匿名用户',
        avatar: fileUrlMap[p.userAvatar] || p.userAvatar || '/assets/images/default-avatar.png',
        time: this.formatTime(p.createTime),
        content: p.content || p.title || '',
        images: (p.images || []).map(img => fileUrlMap[img] || img),
        likes: p.likes || 0,
        comments: p.commentCount || 0,
        liked: p.liked || false
      }));
      
      this.setData({ 
        posts,
        postsLoading: false
      });
    } catch (err) {
      console.error('加载交流帖子失败:', err);
      this.setData({ 
        posts: [],
        postsLoading: false
      });
    }
  },

  // 格式化时间
  formatTime(createTime) {
    if (!createTime) return '';
    
    const date = new Date(createTime);
    const now = new Date();
    const diff = now - date;
    
    // 1分钟内
    if (diff < 60 * 1000) {
      return '刚刚';
    }
    // 1小时内
    if (diff < 60 * 60 * 1000) {
      return Math.floor(diff / (60 * 1000)) + '分钟前';
    }
    // 24小时内
    if (diff < 24 * 60 * 60 * 1000) {
      return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
    }
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.getDate() === yesterday.getDate() && 
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()) {
      return '昨天';
    }
    // 更早
    const month = (date.getMonth() + 1).toString();
    const day = date.getDate().toString();
    return `${month}月${day}日`;
  },

  switchTab(e) {
    const tab = Number(e.currentTarget.dataset.tab);
    this.setData({ activeTab: tab });
    if (tab === 0) {
      this.loadHelpList();
    } else if (tab === 1) {
      this.loadPosts();
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

  async onLike(e) {
    const id = e.currentTarget.dataset.id;
    
    // 本地先更新状态
    const posts = this.data.posts.map(p => {
      if (p.id === id) {
        return { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    });
    this.setData({ posts });
    
    // 异步更新数据库
    try {
      const post = posts.find(p => p.id === id);
      if (post) {
        await db.togglePostLike(id, post.liked);
      }
    } catch (err) {
      console.error('点赞失败:', err);
    }
  },

  onNewPost() {
    wx.navigateTo({ url: '/pages/publish-talk/publish-talk' });
  },

  goPostDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/post-detail/post-detail?id=${id}` });
  }
});
