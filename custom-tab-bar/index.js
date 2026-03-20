Component({
  data: {
    selected: 0,
    color: "#999999",
    selectedColor: "#FF8C42",
    msgCount: 3,
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        iconPath: "/assets/icons/home.png",
        selectedIconPath: "/assets/icons/home.png"
      },
      {
        pagePath: "/pages/service/service",
        text: "喂养服务",
        iconPath: "/assets/icons/fish.png",
        selectedIconPath: "/assets/icons/fish.png"
      },
      {
        pagePath: "/pages/message/message",
        text: "消息",
        iconPath: "/assets/icons/bell.png",
        selectedIconPath: "/assets/icons/bell.png"
      },
      {
        pagePath: "/pages/community/community",
        text: "社区",
        iconPath: "/assets/icons/fire.png",
        selectedIconPath: "/assets/icons/fire.png"
      },
      {
        pagePath: "/pages/mine/mine",
        text: "我的",
        iconPath: "/assets/icons/user.png",
        selectedIconPath: "/assets/icons/user.png"
      }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({ url });
    }
  }
});
