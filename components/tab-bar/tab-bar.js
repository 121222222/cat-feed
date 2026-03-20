Component({
  properties: {
    currentTab: {
      type: Number,
      value: 0
    },
    msgCount: {
      type: Number,
      value: 0
    }
  },
  methods: {
    switchTab(e) {
      const { index, url } = e.currentTarget.dataset;
      if (this.data.currentTab === index) return;
      wx.switchTab({ url });
    }
  }
});
