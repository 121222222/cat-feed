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
const postsCol = database.collection('posts');
const helpsCol = database.collection('helps');

module.exports = {
  db: database,
  _,

  // ========== 用户相关 ==========

  /** 获取当前用户信息（根据 _openid 自动匹配） */
  async getCurrentUser() {
    try {
      const res = await usersCol.where({}).get();
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

  /** 获取我的猫咪列表（依赖数据库权限：仅创建者可读写） */
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

  // ========== 动态/帖子相关 ==========

  /** 获取动态列表 */
  async getPosts(category, limit = 20) {
    try {
      let query = postsCol.orderBy('createTime', 'desc');
      if (category && category !== 'all') {
        query = postsCol.where({ category }).orderBy('createTime', 'desc');
      }
      const res = await query.limit(limit).get();
      return res.data;
    } catch (err) {
      console.error('getPosts 失败:', err);
      return [];
    }
  },

  /** 根据ID获取动态详情 */
  async getPostById(postId) {
    try {
      const res = await postsCol.doc(postId).get();
      return res.data;
    } catch (err) {
      console.error('getPostById 失败:', err);
      return null;
    }
  },

  /** 获取我发布的动态（通过 userId 过滤） */
  async getMyPosts(userId) {
    try {
      let query = postsCol.orderBy('createTime', 'desc');
      if (userId) {
        query = postsCol.where({ userId }).orderBy('createTime', 'desc');
      }
      const res = await query.get();
      return res.data;
    } catch (err) {
      console.error('getMyPosts 失败:', err);
      return [];
    }
  },

  /** 发布动态 */
  async addPost(postData) {
    try {
      const res = await postsCol.add({
        data: {
          ...postData,
          likes: 0,
          comments: 0,
          views: 0,
          createTime: database.serverDate()
        }
      });
      return res._id;
    } catch (err) {
      console.error('addPost 失败:', err);
      return null;
    }
  },

  /** 点赞/取消点赞 */
  async togglePostLike(postId, isLiked) {
    try {
      await postsCol.doc(postId).update({
        data: {
          likes: isLiked ? _.inc(1) : _.inc(-1)
        }
      });
      return true;
    } catch (err) {
      console.error('togglePostLike 失败:', err);
      return false;
    }
  },

  /** 删除动态 */
  async deletePost(postId) {
    try {
      await postsCol.doc(postId).remove();
      return true;
    } catch (err) {
      console.error('deletePost 失败:', err);
      return false;
    }
  },

  // ========== 互助相关 ==========

  /** 获取互助列表 */
  async getHelps(filter, limit = 20) {
    try {
      let query = helpsCol.where({ status: 'open' }).orderBy('createTime', 'desc');
      if (filter && filter !== 'all') {
        query = helpsCol.where({ status: 'open', type: filter }).orderBy('createTime', 'desc');
      }
      const res = await query.limit(limit).get();
      return res.data;
    } catch (err) {
      console.error('getHelps 失败:', err);
      return [];
    }
  },

  /** 根据ID获取互助详情 */
  async getHelpById(helpId) {
    try {
      const res = await helpsCol.doc(helpId).get();
      return res.data;
    } catch (err) {
      console.error('getHelpById 失败:', err);
      return null;
    }
  },

  /** 获取我发布的互助（通过 userId 过滤） */
  async getMyHelps(userId) {
    try {
      let query = helpsCol.orderBy('createTime', 'desc');
      if (userId) {
        query = helpsCol.where({ userId }).orderBy('createTime', 'desc');
      }
      const res = await query.get();
      return res.data;
    } catch (err) {
      console.error('getMyHelps 失败:', err);
      return [];
    }
  },

  /** 发布互助 */
  async addHelp(helpData) {
    try {
      const res = await helpsCol.add({
        data: {
          ...helpData,
          status: 'open',
          createTime: database.serverDate()
        }
      });
      return res._id;
    } catch (err) {
      console.error('addHelp 失败:', err);
      return null;
    }
  },

  /** 更新互助状态 */
  async updateHelpStatus(helpId, status) {
    try {
      await helpsCol.doc(helpId).update({
        data: { status, updateTime: database.serverDate() }
      });
      return true;
    } catch (err) {
      console.error('updateHelpStatus 失败:', err);
      return false;
    }
  },

  /** 删除互助 */
  async deleteHelp(helpId) {
    try {
      await helpsCol.doc(helpId).remove();
      return true;
    } catch (err) {
      console.error('deleteHelp 失败:', err);
      return false;
    }
  },

  // ========== 需求相关（保留兼容） ==========

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
  },

  /** 将云存储 fileID 转换为临时链接 */
  async getImageUrls(fileIDs) {
    if (!fileIDs || fileIDs.length === 0) return [];
    try {
      const res = await wx.cloud.getTempFileURL({
        fileList: fileIDs
      });
      return res.fileList.map(f => f.tempFileURL || f.fileID);
    } catch (err) {
      console.error('getImageUrls 失败:', err);
      return fileIDs; // 失败时返回原始 fileID
    }
  }
};
