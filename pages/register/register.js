const app = getApp();
const db = require('../../utils/db.js');

Page({
  data: {
    avatar: '',
    name: '',
    phone: '',
    buildingOptions: ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋', '8栋', '9栋', '10栋'],
    buildingIndex: -1,
    roomNumber: '',
    catExperience: '',
    wxUserInfo: null // 微信授权登录时传入的用户信息
  },

  onLoad() {
    // 检查是否有微信登录传来的用户信息
    const wxUserInfo = wx.getStorageSync('wxUserInfo');
    if (wxUserInfo) {
      this.setData({
        wxUserInfo,
        avatar: wxUserInfo.avatarUrl || '',
        name: wxUserInfo.nickName || ''
      });
    }
  },

  // 选择头像
  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ avatar: tempFilePath });
      }
    });
  },

  // 输入昵称
  onInputName(e) {
    this.setData({ name: e.detail.value });
  },

  // 输入手机号
  onInputPhone(e) {
    this.setData({ phone: e.detail.value });
  },

  // 选择楼栋
  onBuildingChange(e) {
    this.setData({ buildingIndex: parseInt(e.detail.value) });
  },

  // 输入房间号
  onInputRoom(e) {
    this.setData({ roomNumber: e.detail.value });
  },

  // 选择养猫经验
  selectExp(e) {
    const exp = e.currentTarget.dataset.exp;
    this.setData({ catExperience: exp });
  },

  // 注册
  async onRegister() {
    const { avatar, name, phone, buildingIndex, buildingOptions, roomNumber, catExperience, wxUserInfo } = this.data;

    // 校验
    if (!name.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    if (!phone.trim()) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }

    // 验证手机号格式
    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }

    // 校验公寓信息
    if (buildingIndex < 0) {
      wx.showToast({ title: '请选择楼栋', icon: 'none' });
      return;
    }

    if (!roomNumber.trim()) {
      wx.showToast({ title: '请输入房间号', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '验证房间号...', mask: true });

    try {
      const building = buildingOptions[buildingIndex];
      const room = roomNumber.trim();

      // 1. 验证房间号是否在有效列表中
      const validRoom = await db.verifyRoom(building, room);
      if (!validRoom) {
        wx.hideLoading();
        wx.showModal({
          title: '验证失败',
          content: '该房间号不在公司公寓名单中，请确认您的楼栋和房间号是否正确。如有疑问请联系管理员。',
          showCancel: false,
          confirmColor: '#FFBAA3'
        });
        return;
      }

      // 2. 检查房间号是否已被其他用户绑定
      const boundUser = await db.isRoomBound(building, room);
      if (boundUser) {
        wx.hideLoading();
        wx.showModal({
          title: '房间号已被绑定',
          content: '该房间号已被其他用户绑定，如果您是该房间的新住户，请联系管理员解绑后再试。',
          showCancel: false,
          confirmColor: '#FFBAA3'
        });
        return;
      }

      wx.showLoading({ title: '注册中...', mask: true });

      let avatarUrl = '';

      // 上传头像（如果是本地选择的新头像）
      if (avatar && !avatar.startsWith('https://') && !avatar.startsWith('cloud://')) {
        wx.showLoading({ title: '上传头像...', mask: true });
        avatarUrl = await db.uploadImage(avatar, `avatars/${Date.now()}.jpg`);
      } else {
        avatarUrl = avatar; // 使用微信头像URL
      }

      // 组合公寓地址
      const dormitory = `${building} ${room}`;

      // 创建用户
      const userInfo = {
        name: name.trim(),
        phone: phone.trim(),
        dormitory: dormitory,
        building: building,
        roomNumber: room,
        avatar: avatarUrl || '',
        catExperience: catExperience || 'none',
        certified: false,
        roomVerified: true, // 房间号已验证
        verifyTime: new Date().toISOString()
      };

      // 如果是微信登录来的，添加openid
      if (wxUserInfo && wxUserInfo.openid) {
        userInfo.wxOpenId = wxUserInfo.openid;
      }

      const newUser = await db.createUser(userInfo);

      wx.hideLoading();

      if (newUser) {
        // 清除微信用户信息缓存
        wx.removeStorageSync('wxUserInfo');
        
        // 注册成功，保存登录状态
        app.loginSuccess(newUser);
        
        wx.showToast({ title: '注册成功', icon: 'success' });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' });
        }, 1500);
      } else {
        wx.showToast({ title: '注册失败，请重试', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('注册失败:', err);
      wx.showToast({ title: '注册失败，请重试', icon: 'none' });
    }
  },

  // 返回登录页
  goLogin() {
    wx.navigateBack();
  }
});
