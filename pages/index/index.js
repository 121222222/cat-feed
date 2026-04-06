const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    userInfo: {},
    currentUserId: '',
    activeCategory: 'all',
    leftPosts: [],
    rightPosts: [],
    allPosts: [],
    loading: false,
    page: 1,
    hasMore: true,
    searchKeyword: '',
    banners: []
  },

  onLoad() {
    // 不再强制跳转登录，允许用户先浏览
    this.loadData();
    this.loadBanners();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    // 刷新数据
    this.loadData();
    this.loadBanners();
  },

  // 加载轮播图
  async loadBanners() {
    try {
      const banners = await db.getBanners();
      if (banners && banners.length > 0) {
        // 转换云存储链接为临时链接
        const fileIDs = banners.map(b => b.image).filter(img => img && img.startsWith('cloud://'));
        let fileUrlMap = {};
        if (fileIDs.length > 0) {
          try {
            const tempUrls = await db.getImageUrls(fileIDs);
            fileIDs.forEach((id, index) => {
              fileUrlMap[id] = tempUrls[index] || id;
            });
          } catch (e) {
            console.error('轮播图链接转换失败:', e);
          }
        }
        
        const processedBanners = banners.map(b => ({
          ...b,
          image: fileUrlMap[b.image] || b.image
        }));
        
        this.setData({ banners: processedBanners });
      }
    } catch (err) {
      console.error('加载轮播图失败:', err);
    }
  },

  async loadData() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      const userInfo = app.globalData.userInfo || {};
      const currentUserId = userInfo._id || '';
      const postsRaw = await db.getPosts(this.data.activeCategory, currentUserId);
      
      // 收集所有图片 fileID，转换为临时链接
      const allFileIDs = [];
      postsRaw.forEach(p => {
        if (p.images && p.images.length > 0) {
          allFileIDs.push(...p.images);
        }
        if (p.userAvatar && p.userAvatar.startsWith('cloud://')) {
          allFileIDs.push(p.userAvatar);
        }
        // 添加视频封面
        if (p.videoCover && p.videoCover.startsWith('cloud://')) {
          allFileIDs.push(p.videoCover);
        }
        // 添加视频链接
        if (p.video && p.video.startsWith('cloud://')) {
          allFileIDs.push(p.video);
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
      
      // 获取用户已点赞的帖子列表
      let likedPostIds = [];
      if (currentUserId && postsRaw.length > 0) {
        try {
          const postIds = postsRaw.map(p => p._id);
          likedPostIds = await db.checkUserLikedPosts(postIds, currentUserId);
        } catch (e) {
          console.error('获取点赞状态失败:', e);
        }
      }
      
      // 替换图片链接并设置点赞状态
      let posts = postsRaw.map(p => {
        // 格式化视频时长
        let videoDurationText = '';
        if (p.videoDuration) {
          const duration = Math.round(p.videoDuration);
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          videoDurationText = minutes > 0 ? 
            `${minutes}:${seconds.toString().padStart(2, '0')}` : 
            `0:${seconds.toString().padStart(2, '0')}`;
        }
        
        // 检查用户是否已点赞（通过 likedBy 数组或批量查询结果）
        const isLiked = likedPostIds.includes(p._id) || 
                        (p.likedBy && p.likedBy.includes(currentUserId));
        
        return {
          ...p,
          id: p._id,
          imgRatio: p.imgRatio || 100,
          mediaType: p.mediaType || 'image',
          images: (p.images || []).map(img => fileUrlMap[img] || img),
          video: fileUrlMap[p.video] || p.video || '',
          videoCover: fileUrlMap[p.videoCover] || p.videoCover || '',
          videoDuration: p.videoDuration || 0,
          videoDurationText: videoDurationText,
          userAvatar: fileUrlMap[p.userAvatar] || p.userAvatar || '',
          liked: isLiked // 使用真实的点赞状态
        };
      });
      
      // 搜索过滤（支持标题、内容、用户名、猫咪名称、猫咪品种）
      const keyword = this.data.searchKeyword.trim().toLowerCase();
      if (keyword) {
        posts = posts.filter(p => {
          const title = (p.title || '').toLowerCase();
          const content = (p.content || '').toLowerCase();
          const userName = (p.userName || '').toLowerCase();
          const catName = (p.catName || '').toLowerCase();
          const catBreed = (p.catBreed || '').toLowerCase();
          return title.includes(keyword) || 
                 content.includes(keyword) || 
                 userName.includes(keyword) ||
                 catName.includes(keyword) ||
                 catBreed.includes(keyword);
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
    // 发帖需要登录
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '请先登录',
        content: '登录后即可发布动态',
        confirmText: '去登录',
        confirmColor: '#FFBAA3',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          }
        }
      });
      return;
    }
    wx.navigateTo({ url: '/pages/publish/publish' });
  },

  goPostDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/post-detail/post-detail?id=${id}` });
  },

  async onLike(e) {
    // 点赞需要登录
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '请先登录',
        content: '登录后即可点赞',
        confirmText: '去登录',
        confirmColor: '#FFBAA3',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          }
        }
      });
      return;
    }

    const id = e.currentTarget.dataset.id;
    const userInfo = app.globalData.userInfo || {};
    const currentUserId = userInfo._id || '';
    
    if (!currentUserId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    
    // 找到当前帖子
    let currentPost = this.data.leftPosts.find(p => p.id === id) || 
                      this.data.rightPosts.find(p => p.id === id);
    
    if (!currentPost) return;
    
    // 切换点赞状态
    const newLikedState = !currentPost.liked;
    
    // 在本地先更新状态
    const updatePosts = (posts) => {
      return posts.map(p => {
        if (p.id === id) {
          return {
            ...p,
            liked: newLikedState,
            likes: newLikedState ? (p.likes || 0) + 1 : Math.max((p.likes || 1) - 1, 0)
          };
        }
        return p;
      });
    };

    this.setData({
      leftPosts: updatePosts(this.data.leftPosts),
      rightPosts: updatePosts(this.data.rightPosts)
    });

    // 异步更新数据库（传递用户ID）
    try {
      await db.togglePostLike(id, newLikedState, currentUserId);
    } catch (err) {
      console.error('点赞失败:', err);
      // 失败时回滚状态
      this.setData({
        leftPosts: updatePosts(this.data.leftPosts),
        rightPosts: updatePosts(this.data.rightPosts)
      });
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
  },

  // 删除自己的帖子
  deletePost(e) {
    const id = e.currentTarget.dataset.id;
    const that = this;
    
    wx.showModal({
      title: '删除动态',
      content: '确定要删除这条动态吗？',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          const success = await db.deletePost(id);
          wx.hideLoading();
          
          if (success) {
            wx.showToast({ title: '删除成功', icon: 'success' });
            that.loadData(); // 重新加载数据
          } else {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
