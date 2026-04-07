const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const app = getApp();

Page({
  data: {
    filterStatus: '',
    allHelps: [],
    filteredHelps: [],
    showNeeds: false  // 是否显示旧的喂养需求
  },

  async onShow() {
    this.loadMyHelps();
  },

  async loadMyHelps() {
    wx.showLoading({ title: '加载中...' });
    try {
      const userInfo = app.globalData.userInfo || {};
      const userId = userInfo._id || '';
      
      // 加载我的互助
      const helps = await db.getMyHelps(userId);
      
      const mapped = helps.map(h => ({
        ...h,
        id: h._id,
        // 使用当前最新的用户昵称和头像
        userName: userInfo.name || h.userName || '微信用户',
        userAvatar: userInfo.avatar || h.userAvatar || '',
        statusText: h.status === 'open' ? '进行中' : (h.status === 'closed' ? '已结束' : '进行中'),
        typeText: h.type === 'need' ? '求助' : '帮忙'
      }));
      
      this.setData({ 
        allHelps: mapped, 
        filteredHelps: mapped 
      });
    } catch (err) {
      console.error('加载我的互助失败:', err);
    }
    wx.hideLoading();
  },

  onFilter(e) {
    const status = e.currentTarget.dataset.status;
    let filtered = this.data.allHelps;
    if (status === 'open') {
      filtered = this.data.allHelps.filter(h => h.status === 'open');
    } else if (status === 'closed') {
      filtered = this.data.allHelps.filter(h => h.status === 'closed');
    }
    this.setData({ filterStatus: status, filteredHelps: filtered });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/help-detail/help-detail?id=${id}` });
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/publish-help/publish-help?type=need' });
  },

  // 删除互助
  deleteHelp(e) {
    const id = e.currentTarget.dataset.id;
    const that = this;
    
    wx.showModal({
      title: '删除互助',
      content: '确定要删除这条互助信息吗？',
      confirmColor: '#FF4D4F',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          const success = await db.deleteHelp(id);
          wx.hideLoading();
          
          if (success) {
            wx.showToast({ title: '删除成功', icon: 'success' });
            that.loadMyHelps();
          } else {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 关闭互助
  closeHelp(e) {
    const id = e.currentTarget.dataset.id;
    const that = this;
    
    wx.showModal({
      title: '结束互助',
      content: '确定要结束这条互助吗？',
      confirmColor: '#FFBAA3',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          const success = await db.updateHelpStatus(id, 'closed');
          wx.hideLoading();
          
          if (success) {
            wx.showToast({ title: '已结束', icon: 'success' });
            that.loadMyHelps();
          } else {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  }
});
