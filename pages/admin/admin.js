const app = getApp();
const db = require('../../utils/db.js');

// 管理员手机号列表
const ADMIN_PHONES = ['15820430351'];

Page({
  data: {
    activeTab: 'dashboard',
    
    // 数据概览
    statistics: {
      totalUsers: 0,
      todayUsers: 0,
      totalPosts: 0,
      todayPosts: 0,
      totalHelps: 0,
      openHelps: 0,
      closedHelps: 0,
      totalCats: 0
    },

    // 用户管理
    users: [],
    userSearchKeyword: '',
    usersPage: 1,
    usersHasMore: true,

    // 内容管理
    contentSubTab: 'posts',
    
    // 帖子管理
    posts: [],
    postSearchKeyword: '',
    postsPage: 1,
    postsHasMore: true,

    // 互助管理
    helps: [],
    helpFilter: 'all',
    helpsPage: 1,

    // 评论管理
    comments: [],
    commentsPage: 1,

    // 话题管理
    topics: [],
    newTopicName: '',

    // 审核中心
    noticeTitle: '',
    noticeContent: '',
    reports: [],
    reportFilter: 'pending',

    // 猫咪管理
    cats: [],
    catSearchKeyword: '',
    catsPage: 1,
    catsHasMore: true,

    // 房间号管理
    roomStatistics: {
      totalRooms: 0,
      activeRooms: 0,
      boundRooms: 0
    },
    validRooms: [],
    roomsPage: 1,
    roomsHasMore: true,
    roomFilterIndex: 0,
    batchBuildingIndex: -1,
    batchRoomNumbers: '',
    unbindPhone: '',
    buildingOptions: ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋', '8栋', '9栋', '10栋', '11栋'],
    roomFilterOptions: ['全部', '1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋', '8栋', '9栋', '10栋', '11栋'],
    initRoomsLoading: false,

    // 系统设置
    banners: [],
    announcementTitle: '',
    announcementContent: '',
    announcements: [],
    logs: []
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
    this.loadStatistics();
  },

  onShow() {
    // 根据当前Tab刷新数据
    this.refreshCurrentTab();
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.refreshCurrentTab();
  },

  // 刷新当前Tab数据
  refreshCurrentTab() {
    const { activeTab } = this.data;
    switch (activeTab) {
      case 'dashboard':
        this.loadStatistics();
        break;
      case 'users':
        this.loadUsers(true);
        break;
      case 'content':
        this.refreshContentTab();
        break;
      case 'audit':
        this.loadReports();
        break;
      case 'cats':
        this.loadCats(true);
        break;
      case 'rooms':
        this.loadRoomStatistics();
        this.loadValidRooms(true);
        break;
      case 'settings':
        this.loadSettings();
        break;
    }
  },

  // ========== 数据概览 ==========
  async loadStatistics() {
    try {
      wx.showLoading({ title: '加载中...' });
      const statistics = await db.getStatistics();
      this.setData({ statistics });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('加载统计数据失败:', err);
    }
  },

  // ========== 用户管理 ==========
  onUserSearchInput(e) {
    this.setData({ userSearchKeyword: e.detail.value });
  },

  searchUsers() {
    this.loadUsers(true);
  },

  async loadUsers(reset = false) {
    if (reset) {
      this.setData({ usersPage: 1, users: [], usersHasMore: true });
    }

    try {
      wx.showLoading({ title: '加载中...' });
      const { usersPage, userSearchKeyword } = this.data;
      const users = await db.getAllUsers({
        page: usersPage,
        pageSize: 20,
        keyword: userSearchKeyword
      });

      const formattedUsers = users.map(u => ({
        ...u,
        createTimeStr: this.formatTime(u.createTime)
      }));

      wx.hideLoading();

      if (reset) {
        this.setData({ users: formattedUsers });
      } else {
        this.setData({ users: [...this.data.users, ...formattedUsers] });
      }

      this.setData({ usersHasMore: users.length >= 20 });
    } catch (err) {
      wx.hideLoading();
      console.error('加载用户失败:', err);
    }
  },

  loadMoreUsers() {
    if (!this.data.usersHasMore) return;
    this.setData({ usersPage: this.data.usersPage + 1 });
    this.loadUsers();
  },

  toggleUserStatus(e) {
    const { id, disabled } = e.currentTarget.dataset;
    const action = disabled ? '启用' : '禁用';
    
    wx.showModal({
      title: `确认${action}`,
      content: `确定要${action}该用户吗？`,
      confirmColor: disabled ? '#52C41A' : '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.toggleUserStatus(id, !disabled);
            wx.showToast({ title: `${action}成功`, icon: 'success' });
            this.loadUsers(true);
            this.addLog(`${action}用户`);
          } catch (err) {
            wx.showToast({ title: `${action}失败`, icon: 'none' });
          }
        }
      }
    });
  },

  // ========== 内容管理 ==========
  switchContentTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ contentSubTab: tab });
    this.refreshContentTab();
  },

  refreshContentTab() {
    const { contentSubTab } = this.data;
    switch (contentSubTab) {
      case 'posts':
        this.loadPosts(true);
        break;
      case 'helps':
        this.loadHelps();
        break;
      case 'comments':
        this.loadComments();
        break;
      case 'topics':
        this.loadTopics();
        break;
    }
  },

  // 帖子管理
  onPostSearchInput(e) {
    this.setData({ postSearchKeyword: e.detail.value });
  },

  searchPosts() {
    this.loadPosts(true);
  },

  async loadPosts(reset = false) {
    if (reset) {
      this.setData({ postsPage: 1, posts: [], postsHasMore: true });
    }

    try {
      wx.showLoading({ title: '加载中...' });
      const { postsPage, postSearchKeyword } = this.data;
      const posts = await db.getAllPosts({
        page: postsPage,
        pageSize: 20,
        keyword: postSearchKeyword
      });

      const formattedPosts = posts.map(p => ({
        ...p,
        createTimeStr: this.formatTime(p.createTime)
      }));

      wx.hideLoading();

      if (reset) {
        this.setData({ posts: formattedPosts });
      } else {
        this.setData({ posts: [...this.data.posts, ...formattedPosts] });
      }

      this.setData({ postsHasMore: posts.length >= 20 });
    } catch (err) {
      wx.hideLoading();
      console.error('加载帖子失败:', err);
    }
  },

  loadMorePosts() {
    if (!this.data.postsHasMore) return;
    this.setData({ postsPage: this.data.postsPage + 1 });
    this.loadPosts();
  },

  togglePostTop(e) {
    const { id, top } = e.currentTarget.dataset;
    const action = top ? '取消置顶' : '置顶';
    
    wx.showModal({
      title: `确认${action}`,
      content: `确定要${action}该帖子吗？`,
      confirmColor: '#FF8A6B',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.togglePostTop(id, !top);
            wx.showToast({ title: `${action}成功`, icon: 'success' });
            this.loadPosts(true);
            this.addLog(`${action}帖子`);
          } catch (err) {
            wx.showToast({ title: `${action}失败`, icon: 'none' });
          }
        }
      }
    });
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
            
            const posts = [...this.data.posts];
            posts.splice(index, 1);
            this.setData({ posts });
            
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.addLog('删除帖子');
          } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 互助管理
  setHelpFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ helpFilter: filter });
    this.loadHelps();
  },

  async loadHelps() {
    try {
      wx.showLoading({ title: '加载中...' });
      const { helpFilter } = this.data;
      const helps = await db.getAllHelps({
        status: helpFilter === 'all' ? null : helpFilter,
        pageSize: 50
      });

      const formattedHelps = helps.map(h => ({
        ...h,
        createTimeStr: this.formatTime(h.createTime)
      }));

      wx.hideLoading();
      this.setData({ helps: formattedHelps });
    } catch (err) {
      wx.hideLoading();
      console.error('加载互助失败:', err);
    }
  },

  closeHelp(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认关闭',
      content: '确定关闭这条互助请求吗？',
      confirmColor: '#FAAD14',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.updateHelpStatus(id, 'closed');
            wx.showToast({ title: '已关闭', icon: 'success' });
            this.loadHelps();
            this.addLog('关闭互助请求');
          } catch (err) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  deleteHelp(e) {
    const { id, index } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '确定删除这条互助请求吗？',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.deleteHelp(id);
            const helps = [...this.data.helps];
            helps.splice(index, 1);
            this.setData({ helps });
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.addLog('删除互助请求');
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 评论管理
  async loadComments() {
    try {
      wx.showLoading({ title: '加载中...' });
      const comments = await db.getAllComments({ pageSize: 50 });

      const formattedComments = comments.map(c => ({
        ...c,
        createTimeStr: this.formatTime(c.createTime)
      }));

      wx.hideLoading();
      this.setData({ comments: formattedComments });
    } catch (err) {
      wx.hideLoading();
      console.error('加载评论失败:', err);
    }
  },

  deleteComment(e) {
    const { id, postid, index } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '确定删除这条评论吗？',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.deleteComment(id, postid);
            const comments = [...this.data.comments];
            comments.splice(index, 1);
            this.setData({ comments });
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.addLog('删除评论');
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 话题管理
  async loadTopics() {
    try {
      const topics = await db.getTopics();
      this.setData({ topics });
    } catch (err) {
      console.error('加载话题失败:', err);
    }
  },

  onTopicInput(e) {
    this.setData({ newTopicName: e.detail.value });
  },

  async addTopic() {
    const { newTopicName } = this.data;
    if (!newTopicName.trim()) {
      wx.showToast({ title: '请输入话题名称', icon: 'none' });
      return;
    }

    try {
      await db.addTopic({ name: newTopicName.trim() });
      wx.showToast({ title: '添加成功', icon: 'success' });
      this.setData({ newTopicName: '' });
      this.loadTopics();
      this.addLog('添加话题: ' + newTopicName.trim());
    } catch (err) {
      wx.showToast({ title: '添加失败', icon: 'none' });
    }
  },

  deleteTopic(e) {
    const { id, index } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '确定删除这个话题吗？',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.deleteTopic(id);
            const topics = [...this.data.topics];
            topics.splice(index, 1);
            this.setData({ topics });
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.addLog('删除话题');
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // ========== 审核中心 ==========
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
              this.addLog('发布系统通知: ' + noticeTitle.trim());
            } else {
              wx.showToast({ title: '发布失败', icon: 'none' });
            }
          } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: '发布失败', icon: 'none' });
          }
        }
      }
    });
  },

  setReportFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ reportFilter: filter });
    this.loadReports();
  },

  async loadReports() {
    try {
      const { reportFilter } = this.data;
      const reports = await db.getReports({
        status: reportFilter,
        pageSize: 50
      });

      const formattedReports = reports.map(r => ({
        ...r,
        createTimeStr: this.formatTime(r.createTime)
      }));

      this.setData({ reports: formattedReports });
    } catch (err) {
      console.error('加载举报失败:', err);
    }
  },

  handleReport(e) {
    const { id, result } = e.currentTarget.dataset;
    const actionText = result === 'ignore' ? '忽略' : '删除内容';
    
    wx.showModal({
      title: '处理举报',
      content: `确定${actionText}吗？`,
      confirmColor: result === 'ignore' ? '#52C41A' : '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.handleReport(id, result, '');
            wx.showToast({ title: '处理成功', icon: 'success' });
            this.loadReports();
            this.addLog('处理举报: ' + actionText);
          } catch (err) {
            wx.showToast({ title: '处理失败', icon: 'none' });
          }
        }
      }
    });
  },

  // ========== 猫咪管理 ==========
  onCatSearchInput(e) {
    this.setData({ catSearchKeyword: e.detail.value });
  },

  searchCats() {
    this.loadCats(true);
  },

  async loadCats(reset = false) {
    if (reset) {
      this.setData({ catsPage: 1, cats: [], catsHasMore: true });
    }

    try {
      wx.showLoading({ title: '加载中...' });
      const { catsPage, catSearchKeyword } = this.data;
      const cats = await db.getAllCats({
        page: catsPage,
        pageSize: 20,
        keyword: catSearchKeyword
      });

      const formattedCats = cats.map(c => ({
        ...c,
        createTimeStr: this.formatTime(c.createTime)
      }));

      wx.hideLoading();

      if (reset) {
        this.setData({ cats: formattedCats });
      } else {
        this.setData({ cats: [...this.data.cats, ...formattedCats] });
      }

      this.setData({ catsHasMore: cats.length >= 20 });
    } catch (err) {
      wx.hideLoading();
      console.error('加载猫咪失败:', err);
    }
  },

  loadMoreCats() {
    if (!this.data.catsHasMore) return;
    this.setData({ catsPage: this.data.catsPage + 1 });
    this.loadCats();
  },

  deleteCat(e) {
    const { id, index } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '确定删除这个猫咪档案吗？此操作不可恢复。',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.deleteCat(id);
            const cats = [...this.data.cats];
            cats.splice(index, 1);
            this.setData({ cats });
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.addLog('删除猫咪档案');
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // ========== 房间号管理 ==========
  
  // 一键初始化所有房间号（调用云函数）
  async initAllRooms() {
    wx.showModal({
      title: '初始化房间号',
      content: '将批量添加所有楼栋的房间号（1栋-11栋），已存在的房间号会跳过。确定继续吗？',
      confirmText: '开始初始化',
      confirmColor: '#FF8A6B',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ initRoomsLoading: true });
          wx.showLoading({ title: '初始化中...', mask: true });
          
          try {
            const result = await wx.cloud.callFunction({
              name: 'initRooms',
              data: { action: 'init' }
            });
            
            wx.hideLoading();
            this.setData({ initRoomsLoading: false });
            
            if (result.result && result.result.success) {
              wx.showModal({
                title: '初始化完成',
                content: `成功添加 ${result.result.totalAdded} 个房间号`,
                showCancel: false,
                confirmColor: '#52C41A'
              });
              this.loadRoomStatistics();
              this.loadValidRooms(true);
              this.addLog('批量初始化房间号');
            } else {
              wx.showToast({ 
                title: (result.result && result.result.error) || '初始化失败', 
                icon: 'none' 
              });
            }
          } catch (err) {
            wx.hideLoading();
            this.setData({ initRoomsLoading: false });
            console.error('初始化房间号失败:', err);
            wx.showToast({ title: '初始化失败，请检查云函数', icon: 'none' });
          }
        }
      }
    });
  },

  async loadRoomStatistics() {
    try {
      const roomStatistics = await db.getRoomStatistics();
      this.setData({ roomStatistics });
    } catch (err) {
      console.error('加载房间号统计失败:', err);
    }
  },

  async loadValidRooms(reset = false) {
    if (reset) {
      this.setData({ roomsPage: 1, validRooms: [], roomsHasMore: true });
    }

    try {
      wx.showLoading({ title: '加载中...' });
      const { roomsPage, roomFilterIndex, buildingOptions } = this.data;
      const building = roomFilterIndex > 0 ? buildingOptions[roomFilterIndex - 1] : null;
      
      const rooms = await db.getValidRooms({
        page: roomsPage,
        pageSize: 50,
        building
      });

      wx.hideLoading();

      if (reset) {
        this.setData({ validRooms: rooms });
      } else {
        this.setData({ validRooms: [...this.data.validRooms, ...rooms] });
      }

      this.setData({ roomsHasMore: rooms.length >= 50 });
    } catch (err) {
      wx.hideLoading();
      console.error('加载房间号失败:', err);
    }
  },

  loadMoreRooms() {
    if (!this.data.roomsHasMore) return;
    this.setData({ roomsPage: this.data.roomsPage + 1 });
    this.loadValidRooms();
  },

  onRoomFilterChange(e) {
    this.setData({ roomFilterIndex: parseInt(e.detail.value) });
    this.loadValidRooms(true);
  },

  onBatchBuildingChange(e) {
    this.setData({ batchBuildingIndex: parseInt(e.detail.value) });
  },

  onBatchRoomInput(e) {
    this.setData({ batchRoomNumbers: e.detail.value });
  },

  async batchAddRooms() {
    const { batchBuildingIndex, buildingOptions, batchRoomNumbers } = this.data;

    if (batchBuildingIndex < 0) {
      wx.showToast({ title: '请选择楼栋', icon: 'none' });
      return;
    }

    if (!batchRoomNumbers.trim()) {
      wx.showToast({ title: '请输入房间号', icon: 'none' });
      return;
    }

    const building = buildingOptions[batchBuildingIndex];
    // 解析房间号，支持逗号、中文逗号、空格、换行分隔
    const roomNumbers = batchRoomNumbers
      .split(/[,，\s\n]+/)
      .map(r => r.trim())
      .filter(r => r);

    if (roomNumbers.length === 0) {
      wx.showToast({ title: '请输入有效的房间号', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '添加中...', mask: true });

    try {
      const results = await db.batchAddValidRooms(building, roomNumbers);
      wx.hideLoading();

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      let message = `成功添加 ${successCount} 个房间号`;
      if (failCount > 0) {
        message += `，${failCount} 个已存在`;
      }

      wx.showToast({ title: message, icon: 'success', duration: 2000 });
      
      this.setData({ batchRoomNumbers: '' });
      this.loadRoomStatistics();
      this.loadValidRooms(true);
      this.addLog(`批量添加房间号: ${building} ${roomNumbers.join(',')}`);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '添加失败', icon: 'none' });
    }
  },

  toggleRoomStatus(e) {
    const { id, status } = e.currentTarget.dataset;
    const newStatus = status === 'active' ? 'inactive' : 'active';
    const actionText = status === 'active' ? '禁用' : '启用';

    wx.showModal({
      title: `确认${actionText}`,
      content: `确定要${actionText}这个房间号吗？`,
      confirmColor: status === 'active' ? '#FAAD14' : '#52C41A',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.updateRoomStatus(id, newStatus);
            wx.showToast({ title: `${actionText}成功`, icon: 'success' });
            this.loadValidRooms(true);
            this.loadRoomStatistics();
            this.addLog(`${actionText}房间号`);
          } catch (err) {
            wx.showToast({ title: `${actionText}失败`, icon: 'none' });
          }
        }
      }
    });
  },

  deleteRoom(e) {
    const { id, index } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '确定删除这个房间号吗？删除后该房间号将无法用于注册。',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.deleteValidRoom(id);
            const validRooms = [...this.data.validRooms];
            validRooms.splice(index, 1);
            this.setData({ validRooms });
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.loadRoomStatistics();
            this.addLog('删除房间号');
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  onUnbindPhoneInput(e) {
    this.setData({ unbindPhone: e.detail.value });
  },

  async unbindUserRoom() {
    const { unbindPhone } = this.data;

    if (!unbindPhone || unbindPhone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '查找用户...', mask: true });

    try {
      const user = await db.getUserByPhone(unbindPhone);
      wx.hideLoading();

      if (!user) {
        wx.showToast({ title: '未找到该用户', icon: 'none' });
        return;
      }

      if (!user.roomVerified) {
        wx.showToast({ title: '该用户未绑定房间号', icon: 'none' });
        return;
      }

      wx.showModal({
        title: '确认解绑',
        content: `确定要解绑用户 ${user.name || unbindPhone} 的房间号（${user.dormitory}）吗？`,
        confirmColor: '#FAAD14',
        success: async (res) => {
          if (res.confirm) {
            try {
              await db.updateUser(user._id, {
                roomVerified: false,
                unbindTime: new Date().toISOString()
              });
              wx.showToast({ title: '解绑成功', icon: 'success' });
              this.setData({ unbindPhone: '' });
              this.loadRoomStatistics();
              this.addLog(`解绑用户房间号: ${unbindPhone}`);
            } catch (err) {
              wx.showToast({ title: '解绑失败', icon: 'none' });
            }
          }
        }
      });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '查找失败', icon: 'none' });
    }
  },

  // ========== 系统设置 ==========
  async loadSettings() {
    try {
      const [banners, announcements, logs] = await Promise.all([
        db.getBanners(),
        db.getAnnouncements(),
        db.getOperationLogs({ pageSize: 20 })
      ]);

      const formattedLogs = logs.map(l => ({
        ...l,
        createTimeStr: this.formatTime(l.createTime)
      }));

      this.setData({
        banners: banners || [],
        announcements: announcements || [],
        logs: formattedLogs
      });
    } catch (err) {
      console.error('加载设置失败:', err);
    }
  },

  addBanner() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: async (res) => {
        wx.showLoading({ title: '上传中...', mask: true });
        try {
          const fileID = await db.uploadImage(res.tempFilePaths[0], `banners/${Date.now()}.jpg`);
          if (fileID) {
            const banners = [...this.data.banners, { image: fileID }];
            await db.updateBanners(banners);
            this.setData({ banners });
            wx.showToast({ title: '添加成功', icon: 'success' });
            this.addLog('添加轮播图');
          }
          wx.hideLoading();
        } catch (err) {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      }
    });
  },

  deleteBanner(e) {
    const { index } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '确定删除这张轮播图吗？',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          try {
            const banners = [...this.data.banners];
            banners.splice(index, 1);
            await db.updateBanners(banners);
            this.setData({ banners });
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.addLog('删除轮播图');
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  onAnnouncementTitleInput(e) {
    this.setData({ announcementTitle: e.detail.value });
  },

  onAnnouncementContentInput(e) {
    this.setData({ announcementContent: e.detail.value });
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
              this.loadSettings();
              this.addLog('发布社区公告: ' + announcementTitle.trim());
            } else {
              wx.showToast({ title: '发布失败', icon: 'none' });
            }
          } catch (err) {
            wx.hideLoading();
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
            this.loadSettings();
            this.addLog('删除社区公告');
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // ========== 通用方法 ==========
  async addLog(action) {
    try {
      const userInfo = app.globalData.userInfo || {};
      await db.addOperationLog({
        action,
        adminPhone: userInfo.phone,
        adminName: userInfo.name || '管理员'
      });
    } catch (err) {
      console.error('记录日志失败:', err);
    }
  },

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
