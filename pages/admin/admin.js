const app = getApp();
const db = require('../../utils/db.js');

// 管理员手机号列表
const ADMIN_PHONES = ['15235682953', '15257082563'];

Page({
  data: {
    activeTab: 'notice',
    // 系统通知
    noticeTitle: '',
    noticeContent: '',
    // 社区公告
    announcementTitle: '',
    announcementContent: '',
    announcements: [],
    // 帖子管理
    posts: [],
    searchKeyword: '',
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad() {
    // 检查管理员权限
    const userInfo = app.globalData.userInfo || {};
    if (!ADMIN_PHONES.includes(userInfo.phone) && !userInfo.isAdmin) {
      wx.showToast({ title: '无权限访问', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    this.loadAnnouncements();
    this.loadPosts();
  },

  onShow() {
    // 每次显示时刷新数据
    if (this.data.activeTab === 'posts') {
      this.loadPosts();
    }
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    if (tab === 'announcement') {
      this.loadAnnouncements();
    } else if (tab === 'posts') {
      this.loadPosts();
    }
  },

  // ========== 系统通知相关 ==========
  onNoticeTitleInput(e) {
    this.setData({ noticeTitle: e.detail.value });
  },

  onNoticeContentInput(e) {
    this.setData({ noticeContent: e.detail.value });
  },

  async publishNotice() {
    const { noticeTitle, noticeContent } = this.data;
    
    if (!noticeTitle.trim()) {
      wx.showToast({ title: '请输入通知标题', icon: 'none' });
      return;
    }
    if (!noticeContent.trim()) {
      wx.showToast({ title: '请输入通知内容', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认发布',
      content: '确定发布这条系统通知吗？所有用户都会收到。',
      confirmColor: '#FF8A6B',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '发布中...', mask: true });
          
          try {
            const noticeId = await db.addSystemNotice({
              title: noticeTitle.trim(),
              content: noticeContent.trim(),
              type: 'system'
            });

            wx.hideLoading();

            if (noticeId) {
              wx.showToast({ title: '发布成功', icon: 'success' });
              this.setData({ noticeTitle: '', noticeContent: '' });
            } else {
              wx.showToast({ title: '发布失败', icon: 'none' });
            }
          } catch (err) {
            wx.hideLoading();
            console.error('发布通知失败:', err);
            wx.showToast({ title: '发布失败', icon: 'none' });
          }
        }
      }
    });
  },

  // ========== 社区公告相关 ==========
  onAnnouncementTitleInput(e) {
    this.setData({ announcementTitle: e.detail.value });
  },

  onAnnouncementContentInput(e) {
    this.setData({ announcementContent: e.detail.value });
  },

  async loadAnnouncements() {
    try {
      const announcements = await db.getAnnouncements();
      this.setData({ announcements: announcements || [] });
    } catch (err) {
      console.error('加载公告失败:', err);
    }
  },

  async publishAnnouncement() {
    const { announcementTitle, announcementContent } = this.data;
    
    if (!announcementTitle.trim()) {
      wx.showToast({ title: '请输入公告标题', icon: 'none' });
      return;
    }
    if (!announcementContent.trim()) {
      wx.showToast({ title: '请输入公告内容', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认发布',
      content: '确定发布这条社区公告吗？',
      confirmColor: '#FF8A6B',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '发布中...', mask: true });
          
          try {
            const id = await db.addAnnouncement({
              title: announcementTitle.trim(),
              content: announcementContent.trim()
            });

            wx.hideLoading();

            if (id) {
              wx.showToast({ title: '发布成功', icon: 'success' });
              this.setData({ announcementTitle: '', announcementContent: '' });
              this.loadAnnouncements();
            } else {
              wx.showToast({ title: '发布失败', icon: 'none' });
            }
          } catch (err) {
            wx.hideLoading();
            console.error('发布公告失败:', err);
            wx.showToast({ title: '发布失败', icon: 'none' });
          }
        }
      }
    });
  },

  deleteAnnouncement(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定删除这条公告吗？',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.deleteAnnouncement(id);
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.loadAnnouncements();
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // ========== 帖子管理相关 ==========
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  searchPosts() {
    this.setData({ page: 1, posts: [], hasMore: true });
    this.loadPosts();
  },

  async loadPosts() {
    try {
      wx.showLoading({ title: '加载中...' });
      const { page, pageSize, searchKeyword } = this.data;
      const posts = await db.getPosts({
        page,
        pageSize,
        keyword: searchKeyword
      });
      
      wx.hideLoading();
      
      const formattedPosts = (posts || []).map(post => ({
        ...post,
        createTime: this.formatTime(post.createTime)
      }));

      if (page === 1) {
        this.setData({ posts: formattedPosts });
      } else {
        this.setData({ posts: [...this.data.posts, ...formattedPosts] });
      }

      this.setData({ hasMore: formattedPosts.length >= pageSize });
    } catch (err) {
      wx.hideLoading();
      console.error('加载帖子失败:', err);
    }
  },

  loadMorePosts() {
    if (!this.data.hasMore) return;
    this.setData({ page: this.data.page + 1 });
    this.loadPosts();
  },

  deletePost(e) {
    const { id, index } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '确定删除这条帖子吗？此操作不可恢复。',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...', mask: true });
            await db.deletePost(id);
            wx.hideLoading();
            
            // 从列表中移除
            const posts = [...this.data.posts];
            posts.splice(index, 1);
            this.setData({ posts });
            
            wx.showToast({ title: '删除成功', icon: 'success' });
          } catch (err) {
            wx.hideLoading();
            console.error('删除帖子失败:', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出管理后台吗？',
      confirmColor: '#FF8A6B',
      success: (res) => {
        if (res.confirm) {
          app.globalData.userInfo = null;
          app.globalData.isLogin = false;
          wx.reLaunch({
            url: '/pages/login/login'
          });
        }
      }
    });
  }
});
