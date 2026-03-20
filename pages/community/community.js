Page({
  data: {
    activeTab: 0,
    rules: [
      {
        id: 'r001',
        icon: '📋',
        title: '喂养服务须知',
        content: '1. 喂养人需提前了解猫咪习性和注意事项\n2. 服务期间需按时上门并拍照打卡\n3. 如遇紧急情况请立即联系需求方\n4. 服务完成后双方需互相评价',
        time: '2026-03-15 发布'
      },
      {
        id: 'r002',
        icon: '🔒',
        title: '安全协议',
        content: '1. 仅限本公司员工使用，需实名认证\n2. 禁止泄露他人宿舍信息\n3. 服务过程中请注意人身安全\n4. 如发生纠纷请联系平台管理员处理',
        time: '2026-03-10 发布'
      },
      {
        id: 'r003',
        icon: '🏠',
        title: '宿舍养猫规范',
        content: '1. 养猫需向宿管登记备案\n2. 保持公共区域清洁卫生\n3. 猫咪需按时接种疫苗\n4. 做好猫咪绝育工作\n5. 不得影响其他住户休息',
        time: '2026-03-01 发布'
      }
    ],
    posts: [
      {
        id: 'p001',
        userName: '小美',
        avatar: '/assets/images/avatar4.png',
        time: '2小时前',
        content: '今天帮邻居喂猫，这只小橘真的太可爱了！吃饭的时候呼噜呼噜的 😻',
        images: [],
        likes: 12,
        comments: 3,
        liked: false
      },
      {
        id: 'p002',
        userName: '大壮',
        avatar: '/assets/images/avatar5.png',
        time: '5小时前',
        content: '求助！我家猫最近不爱吃猫粮了，有没有推荐的牌子？目前吃的是XX牌',
        images: [],
        likes: 5,
        comments: 8,
        liked: true
      },
      {
        id: 'p003',
        userName: '小花',
        avatar: '/assets/images/avatar6.png',
        time: '昨天',
        content: '分享一下猫咪日常护理小知识：\n1. 定期修剪指甲\n2. 每周梳毛2-3次\n3. 注意观察精神状态\n4. 定期驱虫',
        images: [],
        likes: 28,
        comments: 6,
        liked: false
      }
    ],
    lostItems: [
      {
        id: 'l001',
        type: 'lost',
        title: '寻找猫咪逗猫棒',
        description: '红色羽毛逗猫棒，昨天在A栋楼下遛猫时不小心落下了',
        contact: '张三 (A栋302)',
        location: 'A栋楼下草坪',
        time: '今天 14:30'
      },
      {
        id: 'l002',
        type: 'found',
        title: '捡到猫咪项圈一个',
        description: '蓝色铃铛项圈，在B栋洗衣房捡到，请失主联系我',
        contact: '李四 (B栋105)',
        location: 'B栋洗衣房',
        time: '昨天 18:00'
      }
    ]
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
  },

  switchTab(e) {
    this.setData({ activeTab: Number(e.currentTarget.dataset.tab) });
  },

  onLike(e) {
    const id = e.currentTarget.dataset.id;
    const posts = this.data.posts.map(p => {
      if (p.id === id) {
        return { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    });
    this.setData({ posts });
  },

  onNewPost() {
    wx.showToast({ title: '发帖功能开发中', icon: 'none' });
  },

  onNewLost() {
    wx.showToast({ title: '发布功能开发中', icon: 'none' });
  }
});
