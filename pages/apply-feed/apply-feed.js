const app = getApp();

Page({
  data: {
    need: {},
    intro: '',
    availableTime: '',
    remark: ''
  },

  onLoad(options) {
    const id = options.id;
    const need = app.globalData.mockNeeds.find(n => n.id === id) || app.globalData.mockNeeds[0];
    this.setData({ need });
  },

  onIntroInput(e) { this.setData({ intro: e.detail.value }); },
  onTimeInput(e) { this.setData({ availableTime: e.detail.value }); },
  onRemarkInput(e) { this.setData({ remark: e.detail.value }); },

  onSubmit() {
    if (!this.data.intro) {
      wx.showToast({ title: '请填写自我介绍', icon: 'none' }); return;
    }
    if (!this.data.availableTime) {
      wx.showToast({ title: '请填写可服务时间', icon: 'none' }); return;
    }
    wx.showModal({
      title: '确认提交',
      content: '确定提交喂养申请吗？需求方确认后您将收到通知。',
      confirmColor: '#FF8C42',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '申请已提交！', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        }
      }
    });
  }
});
