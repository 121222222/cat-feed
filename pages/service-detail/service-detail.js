Page({
  data: {
    feeder: {},
    reviews: [
      { name: '张三', stars: [1,2,3,4,5], text: '非常负责，每次都按时到，橘座很喜欢她', time: '3天前' },
      { name: '王五', stars: [1,2,3,4,5], text: '很有耐心，猫咪喂药都做得很好', time: '1周前' },
      { name: '李四', stars: [1,2,3,4], text: '服务态度很好，推荐！', time: '2周前' }
    ]
  },

  onLoad(options) {
    // 喂养人详情暂时使用静态数据，后续可从云数据库加载
    const id = options.id;
    this.setData({
      feeder: {
        id: id,
        name: '暂无数据',
        avatar: '',
        dormitory: '',
        rating: 5.0,
        serviceCount: 0,
        experience: '',
        intro: '',
        certified: false
      }
    });
  },

  onContact() {
    wx.navigateTo({ url: `/pages/chat/chat?name=${this.data.feeder.name}` });
  },

  onInvite() {
    wx.showToast({ title: '已发送邀请', icon: 'success' });
  }
});
