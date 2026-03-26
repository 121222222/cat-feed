const db = require('../../utils/db.js');

Page({
  data: {
    need: {},
    intro: '',
    availableTime: '',
    remark: ''
  },

  async onLoad(options) {
    const id = options.id;
    if (!id) return;
    const need = await db.getNeedById(id);
    if (need) {
      this.setData({ need: { ...need, id: need._id } });
    }
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
      confirmColor: '#FFBAA3',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '提交中...' });
          const applyId = await db.addApply({
            needId: this.data.need._id,
            needTitle: this.data.need.catName,
            intro: this.data.intro,
            availableTime: this.data.availableTime,
            remark: this.data.remark
          });
          wx.hideLoading();
          if (applyId) {
            wx.showToast({ title: '申请已提交！', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1500);
          } else {
            wx.showToast({ title: '提交失败', icon: 'none' });
          }
        }
      }
    });
  }
});
