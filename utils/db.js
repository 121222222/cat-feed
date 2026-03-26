/**
 * 云数据库操作工具
 * 使用方法: const db = require('../../utils/db.js');
 */

const database = wx.cloud.database();
const _ = database.command;

// 集合引用
const usersCol = database.collection('users');
const catsCol = database.collection('cats');
const needsCol = database.collection('needs');
const appliesCol = database.collection('applies');
const messagesCol = database.collection('messages');

module.exports = {
  db: database,
  _,

  // ========== 用户相关 ==========

  /** 获取当前用户信息（根据 _openid 自动匹配） */
  async getCurrentUser() {
    try {
      const res = await usersCol.where({}).get();
      // 云数据库会自动按当前用户的 _openid 过滤（权限设置为仅创建者可读写时）
      return res.data.length > 0 ? res.data[0] : null;
    } catch (err) {
      console.error('getCurrentUser 失败:', err);
      return null;
    }
  },

  /** 创建用户 */
  async createUser(userInfo) {
    try {
      const res = await usersCol.add({
        data: {
          ...userInfo,
          rating: 5.0,
          serviceCount: 0,
          certified: false,
          createTime: database.serverDate()
        }
      });
      return { _id: res._id, ...userInfo, rating: 5.0, serviceCount: 0, certified: false };
    } catch (err) {
      console.error('createUser 失败:', err);
      return null;
    }
  },

  /** 更新用户信息 */
  async updateUser(userId, data) {
    try {
      await usersCol.doc(userId).update({ data });
      return true;
    } catch (err) {
      console.error('updateUser 失败:', err);
      return false;
    }
  },

  // ========== 猫咪相关 ==========

  /** 获取我的猫咪列表 */
  async getMyCats() {
    try {
      const res = await catsCol.orderBy('createTime', 'desc').get();
      return res.data;
    } catch (err) {
      console.error('getMyCats 失败:', err);
      return [];
    }
  },

  /** 根据ID获取猫咪 */
  async getCatById(catId) {
    try {
      const res = await catsCol.doc(catId).get();
      return res.data;
    } catch (err) {
      console.error('getCatById 失败:', err);
      return null;
    }
  },

  /** 添加猫咪 */
  async addCat(catData) {
    try {
      const res = await catsCol.add({
        data: {
          ...catData,
          createTime: database.serverDate()
        }
      });
      return res._id;
    } catch (err) {
      console.error('addCat 失败:', err);
      return null;
    }
  },

  /** 更新猫咪信息 */
  async updateCat(catId, data) {
    try {
      await catsCol.doc(catId).update({ data });
      return true;
    } catch (err) {
      console.error('updateCat 失败:', err);
      return false;
    }
  },

  /** 删除猫咪 */
  async deleteCat(catId) {
    try {
      await catsCol.doc(catId).remove();
      return true;
    } catch (err) {
      console.error('deleteCat 失败:', err);
      return false;
    }
  },

  // ========== 需求相关 ==========

  /** 获取所有待接单需求（所有人可见） */
  async getPendingNeeds() {
    try {
      const res = await needsCol.where({ status: 'pending' })
        .orderBy('createTime', 'desc')
        .get();
      return res.data;
    } catch (err) {
      console.error('getPendingNeeds 失败:', err);
      return [];
    }
  },

  /** 获取最近需求（首页用，取前N条） */
  async getRecentNeeds(limit = 4) {
    try {
      const res = await needsCol.where({ status: 'pending' })
        .orderBy('createTime', 'desc')
        .limit(limit)
        .get();
      return res.data;
    } catch (err) {
      console.error('getRecentNeeds 失败:', err);
      return [];
    }
  },

  /** 获取所有需求（不限状态） */
  async getAllNeeds() {
    try {
      const res = await needsCol.orderBy('createTime', 'desc').get();
      return res.data;
    } catch (err) {
      console.error('getAllNeeds 失败:', err);
      return [];
    }
  },

  /** 获取我发布的需求 */
  async getMyNeeds() {
    try {
      const res = await needsCol.orderBy('createTime', 'desc').get();
      return res.data;
    } catch (err) {
      console.error('getMyNeeds 失败:', err);
      return [];
    }
  },

  /** 根据ID获取需求 */
  async getNeedById(needId) {
    try {
      const res = await needsCol.doc(needId).get();
      return res.data;
    } catch (err) {
      console.error('getNeedById 失败:', err);
      return null;
    }
  },

  /** 发布需求 */
  async addNeed(needData) {
    try {
      const res = await needsCol.add({
        data: {
          ...needData,
          status: 'pending',
          createTime: database.serverDate()
        }
      });
      return res._id;
    } catch (err) {
      console.error('addNeed 失败:', err);
      return null;
    }
  },

  /** 更新需求状态 */
  async updateNeedStatus(needId, status) {
    try {
      await needsCol.doc(needId).update({
        data: { status, updateTime: database.serverDate() }
      });
      return true;
    } catch (err) {
      console.error('updateNeedStatus 失败:', err);
      return false;
    }
  },

  // ========== 申请相关 ==========

  /** 提交喂养申请 */
  async addApply(applyData) {
    try {
      const res = await appliesCol.add({
        data: {
          ...applyData,
          status: 'reviewing',
          createTime: database.serverDate()
        }
      });
      return res._id;
    } catch (err) {
      console.error('addApply 失败:', err);
      return null;
    }
  },

  /** 获取我的申请 */
  async getMyApplies() {
    try {
      const res = await appliesCol.orderBy('createTime', 'desc').get();
      return res.data;
    } catch (err) {
      console.error('getMyApplies 失败:', err);
      return [];
    }
  },

  // ========== 消息相关 ==========

  /** 获取我的消息 */
  async getMyMessages() {
    try {
      const res = await messagesCol.orderBy('createTime', 'desc').get();
      return res.data;
    } catch (err) {
      console.error('getMyMessages 失败:', err);
      return [];
    }
  },

  /** 添加消息 */
  async addMessage(msgData) {
    try {
      const res = await messagesCol.add({
        data: {
          ...msgData,
          read: false,
          createTime: database.serverDate()
        }
      });
      return res._id;
    } catch (err) {
      console.error('addMessage 失败:', err);
      return null;
    }
  },

  // ========== 图片上传 ==========

  /** 上传图片到云存储 */
  async uploadImage(filePath, cloudPath) {
    try {
      const res = await wx.cloud.uploadFile({
        cloudPath: cloudPath || `images/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`,
        filePath
      });
      return res.fileID;
    } catch (err) {
      console.error('uploadImage 失败:', err);
      return null;
    }
  }
};
