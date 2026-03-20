const util = require('../../utils/util.js');

Page({
  data: {
    isCheckedIn: false,
    checkinTime: '',
    note: '',
    photos: [],
    tasks: [
      { name: '喂食', icon: '🍲', done: false },
      { name: '换水', icon: '💧', done: false },
      { name: '铲屎', icon: '🧹', done: false },
      { name: '陪玩', icon: '🎾', done: false }
    ]
  },

  onCheckin() {
    if (this.data.isCheckedIn) return;
    const now = util.formatTime(new Date());
    this.setData({
      isCheckedIn: true,
      checkinTime: now
    });
    wx.showToast({ title: '打卡成功！', icon: 'success' });
  },

  toggleTask(e) {
    const index = e.currentTarget.dataset.index;
    const key = `tasks[${index}].done`;
    this.setData({ [key]: !this.data.tasks[index].done });
  },

  onAddPhoto() {
    wx.chooseMedia({
      count: 6 - this.data.photos.length,
      mediaType: ['image'],
      success: (res) => {
        const newPhotos = res.tempFiles.map(f => f.tempFilePath);
        this.setData({ photos: [...this.data.photos, ...newPhotos] });
      }
    });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  onSubmit() {
    if (!this.data.isCheckedIn) {
      wx.showToast({ title: '请先打卡', icon: 'none' }); return;
    }
    const doneTasks = this.data.tasks.filter(t => t.done);
    if (doneTasks.length === 0) {
      wx.showToast({ title: '请勾选已完成的任务', icon: 'none' }); return;
    }
    wx.showModal({
      title: '提交服务记录',
      content: `已完成 ${doneTasks.length} 项服务，确认提交？`,
      confirmColor: '#FF8C42',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '提交成功！', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        }
      }
    });
  }
});
