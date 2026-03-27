const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    userInfo: {},
    activeCategory: 'all',
    leftPosts: [],
    rightPosts: [],
    allPosts: [],
    loading: false,
    page: 1,
    hasMore: true,
    searchKeyword: ''
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    this.loadData();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    // 刷新数据
    if (app.globalData.isLoggedIn) {
      this.loadData();
    }
  },

  async loadData() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      const userInfo = app.globalData.userInfo || {};
      const postsRaw = await db.getPosts(this.data.activeCategory, 20);
      
      // 收集所有图片 fileID，转换为临时链接
      const allFileIDs = [];
      postsRaw.forEach(p => {
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
      
      // 替换图片链接
      let posts = postsRaw.map(p => ({
        ...p,
        id: p._id,
        imgRatio: p.imgRatio || 100,
        images: (p.images || []).map(img => fileUrlMap[img] || img),
        userAvatar: fileUrlMap[p.userAvatar] || p.userAvatar || ''
      }));
      
      // 搜索过滤
      const keyword = this.data.searchKeyword.trim().toLowerCase();
      if (keyword) {
        posts = posts.filter(p => {
          const title = (p.title || '').toLowerCase();
          const content = (p.content || '').toLowerCase();
          const userName = (p.userName || '').toLowerCase();
          return title.includes(keyword) || content.includes(keyword) || userName.includes(keyword);
        });
      }
      
      // 分配到左右两列（简单的交替分配，实际可用更复杂的算法）
      const leftPosts = [];
      const rightPosts = [];
      posts.forEach((post, index) => {
        if (index % 2 === 0) {
          leftPosts.push(post);
        } else {
          rightPosts.push(post);
        }
      });
      
      this.setData({
        userInfo,
        allPosts: posts,
        leftPosts,
        rightPosts,
        loading: false
      });
    } catch (err) {
      console.error('首页加载失败:', err);
      this.setData({ loading: false });
    }
  },

  switchCategory(e) {
    const cat = e.currentTarget.dataset.cat;
    if (cat === this.data.activeCategory) return;
    this.setData({ activeCategory: cat, page: 1 });
    this.loadData();
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearch() {
    this.loadData();
  },

  clearSearch() {
    this.setData({ searchKeyword: '' });
    this.loadData();
  },

  onSearchTap() {
    // 保留兼容
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' });
  },

  goPostDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/post-detail/post-detail?id=${id}` });
  },

  async onLike(e) {
    const id = e.currentTarget.dataset.id;
    
    // 在本地先更新状态
    const updatePosts = (posts) => {
      return posts.map(p => {
        if (p.id === id) {
          return {
            ...p,
            liked: !p.liked,
            likes: p.liked ? (p.likes || 1) - 1 : (p.likes || 0) + 1
          };
        }
        return p;
      });
    };

    this.setData({
      leftPosts: updatePosts(this.data.leftPosts),
      rightPosts: updatePosts(this.data.rightPosts)
    });

    // 异步更新数据库
    try {
      const post = [...this.data.leftPosts, ...this.data.rightPosts].find(p => p.id === id);
      if (post) {
        await db.togglePostLike(id, post.liked);
      }
    } catch (err) {
      console.error('点赞失败:', err);
    }
  },

  onPullDownRefresh() {
    this.setData({ page: 1 });
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      // 加载更多逻辑
      this.setData({ page: this.data.page + 1 });
      // this.loadMoreData();
    }
  }
});
