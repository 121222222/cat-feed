// 云函数入口文件
const cloud = require('wx-server-sdk');
const tencentcloud = require('tencentcloud-sdk-nodejs');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 腾讯云短信配置 - 请替换为您的真实配置
const SMS_CONFIG = {
  secretId: 'YOUR_SECRET_ID',      // 腾讯云 SecretId
  secretKey: 'YOUR_SECRET_KEY',    // 腾讯云 SecretKey
  appId: 'YOUR_SMS_APP_ID',        // 短信应用 AppId
  signName: '猫猫社区',             // 短信签名
  templateId: 'YOUR_TEMPLATE_ID'   // 短信模板 ID
};

// 生成6位随机验证码
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { phone } = event;
  
  // 验证手机号格式
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return { success: false, error: '手机号格式不正确' };
  }
  
  try {
    // 检查发送频率限制（1分钟内不能重复发送）
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    
    const recentRecord = await db.collection('sms_codes').where({
      phone: phone,
      createTime: db.command.gt(oneMinuteAgo)
    }).get();
    
    if (recentRecord.data.length > 0) {
      return { success: false, error: '发送太频繁，请稍后再试' };
    }
    
    // 生成验证码
    const code = generateCode();
    
    // 发送短信
    const SmsClient = tencentcloud.sms.v20210111.Client;
    const client = new SmsClient({
      credential: {
        secretId: SMS_CONFIG.secretId,
        secretKey: SMS_CONFIG.secretKey,
      },
      region: 'ap-guangzhou',
      profile: {
        httpProfile: {
          endpoint: 'sms.tencentcloudapi.com',
        },
      },
    });
    
    const params = {
      PhoneNumberSet: [`+86${phone}`],
      SmsSdkAppId: SMS_CONFIG.appId,
      SignName: SMS_CONFIG.signName,
      TemplateId: SMS_CONFIG.templateId,
      TemplateParamSet: [code, '5']  // 验证码和有效期分钟数
    };
    
    const smsResult = await client.SendSms(params);
    
    // 检查发送结果
    const sendStatus = smsResult.SendStatusSet[0];
    if (sendStatus.Code !== 'Ok') {
      console.error('短信发送失败:', sendStatus);
      return { success: false, error: '短信发送失败，请稍后重试' };
    }
    
    // 保存验证码到数据库（5分钟有效）
    await db.collection('sms_codes').add({
      data: {
        phone: phone,
        code: code,
        createTime: now,
        expireTime: now + 5 * 60 * 1000,
        used: false
      }
    });
    
    // 清理过期的验证码
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    await db.collection('sms_codes').where({
      expireTime: db.command.lt(fiveMinutesAgo)
    }).remove();
    
    return { success: true, message: '验证码已发送' };
    
  } catch (err) {
    console.error('发送短信错误:', err);
    return { success: false, error: '系统错误，请稍后重试' };
  }
};
