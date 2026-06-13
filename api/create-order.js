// 虎皮椒V3微信支付 创建订单接口 Vercel服务端
import crypto from 'crypto';
import qs from 'querystring';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ code: -1, msg: "请求方式仅支持POST" });
    }

    // ===== 填入你后台真实APPID、密钥 =====
    const APPID = "201906181673";
    const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4";
    const API_URL = "https://api.xunhupay.com/payment/do.html";

    const { order_no, price, goods_name } = req.body;
    console.log("【创建订单】前端入参", { order_no, price, goods_name });

    if (!order_no || !price || !goods_name) {
        return res.status(400).json({ code: -1, msg: "订单参数缺失" });
    }

    const totalFee = Math.round(Number(price) * 100);
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    // 新增必填time时间戳（10位秒级时间戳）
    const time = Math.floor(Date.now() / 1000);

    const params = {
        appid: APPID,
        time: time, // 新增必填字段
        out_trade_no: order_no,
        total_fee: totalFee,
        body: goods_name,
        notify_url: `${protocol}://${host}/api/notify`,
        return_url: `${protocol}://${host}`,
        type: "WAP"
    };
    console.log("【创建订单】组装请求参数", params);

    const sign = generateSign(params, APPSECRET);
    params.hash = sign; // V3新版字段名不再是sign，改成hash！！核心坑点
    console.log("【创建订单】计算hash签名：", sign);

    try {
        const formData = qs.stringify(params);
        const payRes = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData
        });
        const payDataText = await payRes.text();
        console.log("【创建订单】虎皮椒原始返回文本", payDataText);
        let payData;
        try {
            payData = JSON.parse(payDataText);
        } catch (e) {
            return res.status(200).json({ code: -2, msg: `接口非JSON返回：${payDataText}` });
        }

        console.log("【创建订单】虎皮椒完整返回数据", payData);

        if (payData.return_code === "SUCCESS" && payData.pay_url) {
            return res.status(200).json({
                code: 0,
                pay_url: payData.pay_url,
                order_no: order_no
            });
        } else {
            return res.status(200).json({
                code: -2,
                msg: `虎皮椒返回错误：${payData.return_msg || "无错误提示"}，完整返回：${JSON.stringify(payData)}`
            });
        }
    } catch (err) {
        console.error("【创建订单】请求异常完整报错", err);
        return res.status(500).json({ code: -3, msg: `服务端请求异常：${err.message}` });
    }
}

function generateSign(params, secret) {
    const keys = Object.keys(params).sort();
    let signStr = '';
    keys.forEach(key => {
        if (params[key] !== '' && params[key] !== undefined && key !== 'hash' && key !== 'sign') {
            signStr += `${key}=${params[key]}&`;
        }
    });
    signStr += `key=${secret}`;
    const md5Sign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
    return md5Sign;
}