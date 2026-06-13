import crypto from 'crypto';
import qs from 'querystring';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ code: -1, msg: "仅支持POST" });
    }

    const APPID = "201906181673";
    const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4";
    const QUERY_URL = "https://api.xunhupay.com/payment/query.html";

    const { order_no } = req.body;
    if (!order_no) {
        return res.json({ code: -1, msg: "订单号不能为空" });
    }

    const time = Math.floor(Date.now() / 1000);
    const nonce_str = crypto.randomBytes(8).toString('hex');

    const params = {
        appid: APPID,
        time: time,
        nonce_str: nonce_str,
        out_trade_no: order_no
    };

    // 签名算法和下单完全一致
    const keys = Object.keys(params).sort();
    let signStr = '';
    keys.forEach(key => {
        const value = params[key];
        if (value !== '' && value !== undefined && value !== null && key !== 'hash') {
            signStr += `${key}=${value}&`;
        }
    });
    signStr = signStr.slice(0, -1);
    signStr += APPSECRET;
    const hash = crypto.createHash('md5').update(signStr).digest('hex').toLowerCase();
    params.hash = hash;

    const postData = qs.stringify(params);

    try {
        const resp = await fetch(QUERY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: postData
        });
        const raw = await resp.text();
        const ret = JSON.parse(raw);

        if (ret.return_code === "SUCCESS" && ret.trade_status === "SUCCESS") {
            return res.json({ code: 0, paid: true });
        } else {
            return res.json({ code: 0, paid: false, msg: ret.return_msg || "未支付" });
        }
    } catch (err) {
        return res.json({ code: -2, msg: `查询异常：${err.message}` });
    }
}