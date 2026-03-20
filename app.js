App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    baseUrl: 'https://api.example.com',
    // 模拟用户数据
    mockUser: {
      id: 'u001',
      name: '张三',
      avatar: '/assets/images/default-avatar.png',
      dormitory: 'A栋302',
      phone: '138****8888',
      certified: true,
      catExperience: '3年养猫经验',
      rating: 4.8,
      serviceCount: 12
    },
    // 模拟猫咪数据
    mockCats: [
      {
        id: 'c001',
        name: '橘座',
        age: '2岁',
        breed: '中华田园猫',
        gender: '公',
        vaccinated: true,
        character: '温顺亲人',
        avatar: '/assets/images/cat1.png',
        notes: '每天喂两次，早晚各一次'
      },
      {
        id: 'c002',
        name: '小黑',
        age: '1岁',
        breed: '英短',
        gender: '母',
        vaccinated: true,
        character: '活泼好动',
        avatar: '/assets/images/cat2.png',
        notes: '需要陪玩，喜欢逗猫棒'
      }
    ],
    // 模拟喂养需求
    mockNeeds: [
      {
        id: 'n001',
        userId: 'u001',
        userName: '张三',
        userAvatar: '/assets/images/default-avatar.png',
        catName: '橘座',
        catAvatar: '/assets/images/cat1.png',
        catCount: 1,
        startDate: '2026-03-22',
        endDate: '2026-03-25',
        timeSlot: '早晚各一次',
        services: ['喂食', '换水', '铲屎'],
        dormitory: 'A栋302',
        reward: '50元/天',
        status: 'pending',
        description: '出差4天，需要有经验的小伙伴帮忙照顾橘座',
        createTime: '2026-03-20 10:30'
      },
      {
        id: 'n002',
        userId: 'u002',
        userName: '李四',
        userAvatar: '/assets/images/avatar2.png',
        catName: '豆豆',
        catAvatar: '/assets/images/cat3.png',
        catCount: 2,
        startDate: '2026-03-21',
        endDate: '2026-03-23',
        timeSlot: '中午一次',
        services: ['喂食', '换水', '陪玩'],
        dormitory: 'B栋105',
        reward: '自愿',
        status: 'pending',
        description: '周末回老家，两只猫需要人照顾',
        createTime: '2026-03-20 09:15'
      },
      {
        id: 'n003',
        userId: 'u003',
        userName: '王五',
        userAvatar: '/assets/images/avatar3.png',
        catName: '咪咪',
        catAvatar: '/assets/images/cat4.png',
        catCount: 1,
        startDate: '2026-03-23',
        endDate: '2026-03-28',
        timeSlot: '早中晚各一次',
        services: ['喂食', '换水', '铲屎', '喂药'],
        dormitory: 'C栋201',
        reward: '80元/天',
        status: 'accepted',
        description: '咪咪最近在吃药，需要细心的人帮忙喂药和照顾',
        createTime: '2026-03-19 16:40'
      }
    ],
    // 模拟喂养人
    mockFeeders: [
      {
        id: 'f001',
        name: '小美',
        avatar: '/assets/images/avatar4.png',
        dormitory: 'A栋201',
        rating: 4.9,
        serviceCount: 28,
        experience: '5年养猫经验',
        intro: '超级猫奴，家里也有两只猫，非常有经验',
        certified: true
      },
      {
        id: 'f002',
        name: '大壮',
        avatar: '/assets/images/avatar5.png',
        dormitory: 'B栋308',
        rating: 4.7,
        serviceCount: 15,
        experience: '2年养猫经验',
        intro: '喜欢小动物，做事认真负责',
        certified: true
      },
      {
        id: 'f003',
        name: '小花',
        avatar: '/assets/images/avatar6.png',
        dormitory: 'C栋102',
        rating: 5.0,
        serviceCount: 8,
        experience: '3年养猫经验',
        intro: '兽医专业毕业，擅长照顾生病的猫咪',
        certified: true
      }
    ]
  },

  onLaunch() {
    // 模拟自动登录
    this.globalData.isLoggedIn = true;
    this.globalData.userInfo = this.globalData.mockUser;
  }
});
