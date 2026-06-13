// 查询订单支付状态，前端跳转回来后调用
import crypto from 'crypto';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ code: -1, msg: "请求方式错误" });
    }

    const APPID = "201906181673"; // 替换为你的APPID
    const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4"; // 替换为你的密钥
    const QUERY_URL = "https://api.xunhupay.com/payment/query.html";

    const { order_no } = req.body;
    if (!order_no) {
        return res.status(400).json({ code: -1, msg: "订单号不能为空" });
    }

    const params = {
        appid: APPID,
        out_trade_no: order_no
    };
    params.sign = generateSign(params, APPSECRET);

    try {
        const queryRes = await fetch(QUERY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
        });
        const data = await queryRes.json();

        if (data.return_code === "SUCCESS" && data.trade_status === "SUCCESS") {
            return res.status(200).json({ code: 0, paid: true, msg: "订单已支付" });
        } else {
            return res.status(200).json({ code: 0, paid: false, msg: "订单未支付" });
        }
    } catch (err) {
        return res.status(500).json({ code: -2, msg: "订单查询失败" });
    }
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