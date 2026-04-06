// 云函数入口文件 - 聊天服务
// 用于解决跨用户聊天消息的读取权限问题
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action, data } = event

  console.log('chatService 调用:', action, data, 'openid:', openid)

  try {
    switch (action) {
      case 'getConversations':
        return await getMyConversations(data.userId || openid)
      
      case 'getChatMessages':
        return await getChatMessages(data.conversationId, data.userId || openid)
      
      case 'sendMessage':
        return await sendChatMessage(data, openid)
      
      case 'markRead':
        return await markConversationRead(data.conversationId, data.userId || openid)
      
      case 'getConversation':
        return await getConversation(data.conversationId)
      
      case 'updateParticipantInfo':
        return await updateParticipantInfo(data.conversationId, data.userId, data.userInfo)
      
      default:
        return { success: false, error: '未知操作' }
    }
  } catch (err) {
    console.error('chatService error:', err)
    return { success: false, error: err.message }
  }
}

// 获取用户最新信息（从 users 集合）
async function getUserInfo(userId) {
  try {
    const res = await db.collection('users').doc(userId).get()
    return res.data
  } catch (err) {
    console.log('getUserInfo error:', err.message)
    return null
  }
}

// 获取我的所有会话（并同步最新用户名）
async function getMyConversations(userId) {
  console.log('getMyConversations 开始:', userId)
  
  try {
    const res = await db.collection('conversations').where(_.or([
      { user1Id: userId },
      { user2Id: userId }
    ]))
    .orderBy('lastMessageTime', 'desc')
    .get()
    
    console.log('获取到会话数量:', res.data.length)
    
    // 对于每个会话，获取对方的最新用户信息
    const conversations = await Promise.all(res.data.map(async (conv) => {
      const isUser1 = conv.user1Id === userId
      const targetId = isUser1 ? conv.user2Id : conv.user1Id
      
      // 尝试从 users 集合获取最新的用户信息
      try {
        const targetUser = await getUserInfo(targetId)
        if (targetUser) {
          // 更新 participantsInfo 中对方的信息
          const updatedName = targetUser.name || targetUser.nickName || '微信用户'
          const updatedAvatar = targetUser.avatar || targetUser.avatarUrl || ''
          
          // 检查是否需要更新
          const currentInfo = conv.participantsInfo ? conv.participantsInfo[targetId] : null
          if (!currentInfo || currentInfo.name !== updatedName || currentInfo.avatar !== updatedAvatar) {
            // 异步更新会话中的用户信息（不等待）
            db.collection('conversations').doc(conv._id).update({
              data: {
                [`participantsInfo.${targetId}`]: {
                  name: updatedName,
                  avatar: updatedAvatar
                }
              }
            }).catch(e => console.log('更新会话用户信息失败:', e.message))
            
            // 返回时使用最新信息
            return {
              ...conv,
              participantsInfo: {
                ...conv.participantsInfo,
                [targetId]: { name: updatedName, avatar: updatedAvatar }
              }
            }
          }
        }
      } catch (e) {
        console.log('获取用户信息失败:', e.message)
      }
      
      return conv
    }))
    
    return { success: true, data: conversations }
  } catch (err) {
    console.error('getMyConversations error:', err)
    return { success: false, error: err.message, data: [] }
  }
}

// 获取会话的聊天消息
async function getChatMessages(conversationId, userId) {
  console.log('getChatMessages 开始:', conversationId, userId)
  
  try {
    // 先验证用户是否属于该会话
    let conv = null
    try {
      const convRes = await db.collection('conversations').doc(conversationId).get()
      conv = convRes.data
      console.log('会话信息:', conv)
    } catch (convErr) {
      console.error('获取会话失败:', convErr)
      return { success: false, error: '会话不存在', data: [] }
    }
    
    if (!conv) {
      return { success: false, error: '会话不存在', data: [] }
    }
    
    // 验证用户权限（用户必须是会话参与者之一）
    if (conv.user1Id !== userId && conv.user2Id !== userId) {
      console.log('权限验证失败 - user1Id:', conv.user1Id, 'user2Id:', conv.user2Id, 'userId:', userId)
      return { success: false, error: '无权访问该会话', data: [] }
    }
    
    // 获取消息列表（云函数有管理员权限，可以读取所有记录）
    const res = await db.collection('chat_messages').where({
      conversationId: conversationId
    })
    .orderBy('createTime', 'asc')
    .limit(100)
    .get()
    
    console.log('获取到消息数量:', res.data.length)
    
    return { success: true, data: res.data }
  } catch (err) {
    console.error('getChatMessages error:', err)
    return { success: false, error: err.message, data: [] }
  }
}

// 发送聊天消息
async function sendChatMessage(data, openid) {
  const { conversationId, fromUserId, toUserId, content, fromUserInfo } = data
  
  try {
    // 添加消息
    const msgRes = await db.collection('chat_messages').add({
      data: {
        conversationId: conversationId,
        fromUserId: fromUserId,
        toUserId: toUserId,
        content: content,
        read: false,
        createTime: db.serverDate()
      }
    })
    
    // 更新会话
    await db.collection('conversations').doc(conversationId).update({
      data: {
        lastMessage: content.length > 20 ? content.substring(0, 20) + '...' : content,
        lastMessageTime: db.serverDate(),
        [`participantsInfo.${fromUserId}`]: {
          name: fromUserInfo.name || fromUserInfo.nickName || '微信用户',
          avatar: fromUserInfo.avatarUrl || fromUserInfo.avatar || ''
        },
        [`unreadCount.${toUserId}`]: _.inc(1)
      }
    })
    
    return { success: true, msgId: msgRes._id }
  } catch (err) {
    console.error('sendChatMessage error:', err)
    return { success: false, error: err.message }
  }
}

// 标记会话已读
async function markConversationRead(conversationId, userId) {
  try {
    // 更新会话未读数
    await db.collection('conversations').doc(conversationId).update({
      data: {
        [`unreadCount.${userId}`]: 0
      }
    })
    
    // 标记聊天消息已读（使用云函数可以更新非创建者的记录）
    await db.collection('chat_messages').where({
      conversationId: conversationId,
      toUserId: userId,
      read: false
    }).update({
      data: { read: true }
    })
    
    return { success: true }
  } catch (err) {
    console.error('markConversationRead error:', err)
    return { success: false, error: err.message }
  }
}

// 获取单个会话信息
async function getConversation(conversationId) {
  try {
    const res = await db.collection('conversations').doc(conversationId).get()
    return { success: true, data: res.data }
  } catch (err) {
    console.error('getConversation error:', err)
    return { success: false, error: err.message }
  }
}

// 更新会话参与者信息（确保用户名同步）
async function updateParticipantInfo(conversationId, userId, userInfo) {
  try {
    await db.collection('conversations').doc(conversationId).update({
      data: {
        [`participantsInfo.${userId}`]: {
          name: userInfo.name || userInfo.nickName || '微信用户',
          avatar: userInfo.avatar || userInfo.avatarUrl || ''
        }
      }
    })
    return { success: true }
  } catch (err) {
    console.error('updateParticipantInfo error:', err)
    return { success: false, error: err.message }
  }
}
