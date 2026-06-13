// 虎皮椒支付成功异步回调接口
// 验签通过后才视为有效支付，防止伪造请求
import crypto from 'crypto';

export default async function handler(req, res) {
    const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4"; // 替换为你的密钥

    // 虎皮椒POST返回的参数
    const body = req.method === 'POST' ? req.body : req.query;
    const { out_trade_no, total_fee, trade_status, sign } = body;

    // 基础参数校验
    if (!out_trade_no || !sign || trade_status !== "SUCCESS") {
        return res.send("fail");
    }

    // 验签
    const params = { ...body };
    delete params.sign;
    const calculatedSign = generateSign(params, APPSECRET);
    
    if (calculatedSign !== sign.toUpperCase()) {
        return res.send("fail");
    }

    // 验签通过，订单支付有效
    // 此处可扩展：写入数据库、发送通知等
    // 必须返回success，否则虎皮椒会重复推送回调
    res.send("success");
}

function generateSign(params, secret) {
    const keys = Object.keys(params).sort();
    let signStr = '';
    keys.forEach(key => {
        if (params[key] !== '' && params[key] !== undefined && key !== 'sign') {
            signStr += `${key}=${params[key]}&`;
        }
    });
    signStr += `key=${secret}`;
    return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}