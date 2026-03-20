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
        iconPath: "/assets/icons/home.svg",
        selectedIconPath: "/assets/icons/home-active.svg"
      },
      {
        pagePath: "/pages/service/service",
        text: "喂养服务",
        iconPath: "/assets/icons/fish.svg",
        selectedIconPath: "/assets/icons/fish-active.svg"
      },
      {
        pagePath: "/pages/message/message",
        text: "消息",
        iconPath: "/assets/icons/bell.svg",
        selectedIconPath: "/assets/icons/bell-active.svg"
      },
      {
        pagePath: "/pages/community/community",
        text: "社区",
        iconPath: "/assets/icons/fire.svg",
        selectedIconPath: "/assets/icons/fire-active.svg"
      },
      {
        pagePath: "/pages/mine/mine",
        text: "我的",
        iconPath: "/assets/icons/user.svg",
        selectedIconPath: "/assets/icons/user-active.svg"
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
