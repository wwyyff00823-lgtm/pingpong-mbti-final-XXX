// 虎皮椒V3微信支付 - 创建订单接口
// 运行于Vercel服务端，密钥绝不暴露给前端
import crypto from 'crypto';

export default async function handler(req, res) {
    // 仅允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ code: -1, msg: "请求方式错误" });
    }

    // ========== 替换为你自己的虎皮椒商户信息 ==========
    const APPID = "201906181673";
    const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4";
    const API_URL = "https://api.xunhupay.com/payment/do.html";
    // =====================================================

    const { order_no, price, goods_name } = req.body;
    if (!order_no || !price || !goods_name) {
        return res.status(400).json({ code: -1, msg: "订单参数不完整" });
    }

    // 金额转分（虎皮椒接口单位为分，整数）
    const totalFee = Math.round(Number(price) * 100);
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';

    // 构造V3版本请求参数
    const params = {
        appid: APPID,
        out_trade_no: order_no,
        total_fee: totalFee,
        body: goods_name,
        notify_url: `${protocol}://${host}/api/notify`,
        return_url: `${protocol}://${host}`,
        type: "WAP"
    };

    // 生成虎皮椒标准签名
    const sign = generateSign(params, APPSECRET);
    params.sign = sign;

    try {
        const payRes = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
        });
        const payData = await payRes.json();

        // V3版本成功返回 pay_url 字段
        if (payData.return_code === "SUCCESS" && payData.pay_url) {
            return res.status(200).json({
                code: 0,
                pay_url: payData.pay_url,
                order_no: order_no
            });
        } else {
            return res.status(200).json({
                code: -2,
                msg: payData.return_msg || "支付订单创建失败"
            });
        }
    } catch (err) {
        return res.status(500).json({ code: -3, msg: "支付接口请求异常" });
    }
}

// 虎皮椒签名算法：按ASCII排序 + 拼接密钥 + MD5大写
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