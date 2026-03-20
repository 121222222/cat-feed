const util = require('../../utils/util.js');

Page({
  data: {
    filterStatus: '',
    allApplies: [
      {
        id: 'a001',
        catName: '橘座',
        startDate: '2026-03-22',
        endDate: '2026-03-25',
        dormitory: 'A栋302',
        ownerName: '张三',
        reward: '50元/天',
        status: 'reviewing',
        statusText: '待审核'
      },
      {
        id: 'a002',
        catName: '咪咪',
        startDate: '2026-03-18',
        endDate: '2026-03-20',
        dormitory: 'C栋201',
        ownerName: '王五',
        reward: '80元/天',
        status: 'completed',
        statusText: '已完成'
      }
    ],
    filteredApplies: []
  },

  onLoad() {
    this.setData({ filteredApplies: this.data.allApplies });
  },

  onFilter(e) {
    const status = e.currentTarget.dataset.status;
    const filtered = status ? this.data.allApplies.filter(a => a.status === status) : this.data.allApplies;
    this.setData({ filterStatus: status, filteredApplies: filtered });
  },

  onContact(e) {
    wx.navigateTo({ url: `/pages/chat/chat?name=${e.currentTarget.dataset.name}` });
  },

  onCheckin(e) {
    wx.navigateTo({ url: `/pages/checkin/checkin?id=${e.currentTarget.dataset.id}` });
  },

  onUploadPhoto() {
    wx.chooseMedia({
      count: 3,
      mediaType: ['image'],
      success: () => {
        wx.showToast({ title: '照片已上传', icon: 'success' });
      }
    });
  },

  onFinish(e) {
    wx.showModal({
      title: '确认结束',
      content: '确定结束本次喂养服务吗？',
      confirmColor: '#FF8C42',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '服务已结束', icon: 'success' });
        }
      }
    });
  },

  goAcceptList() {
    wx.navigateTo({ url: '/pages/accept-list/accept-list' });
  }
});
