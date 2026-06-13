// 查询订单支付状态接口
import crypto from 'crypto';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ code: -1, msg: "仅支持POST" });
    }

    const APPID = "201906181673";
    const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4";
    const QUERY_URL = "https://api.xunhupay.com/payment/query.html";

    const { order_no } = req.body;
    console.log("【订单查询】传入订单号", order_no);
    if (!order_no) {
        return res.status(400).json({ code: -1, msg: "订单号不能为空" });
    }

    const params = { appid: APPID, out_trade_no: order_no };
    params.sign = generateSign(params, APPSECRET);
    console.log("【订单查询】请求参数", params);

    try {
        const queryRes = await fetch(QUERY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
        });
        const data = await queryRes.json();
        console.log("【订单查询】虎皮椒返回", data);

        if (data.return_code === "SUCCESS" && data.trade_status === "SUCCESS") {
            return res.status(200).json({ code: 0, paid: true, msg: "订单已支付" });
        } else {
            return res.status(200).json({ code: 0, paid: false, msg: data.return_msg || "未付款" });
        }
    } catch (err) {
        console.error("【订单查询】异常", err);
        return res.status(500).json({ code: -2, msg: `查询异常：${err.message}` });
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