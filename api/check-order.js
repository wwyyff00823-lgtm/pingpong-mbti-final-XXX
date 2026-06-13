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
    const params = {
        appid: APPID,
        time: time,
        out_trade_no: order_no
    };
    const hash = buildHash(params, APPSECRET);
    params.hash = hash;

    const form = qs.stringify(params);
    try {
        const resp = await fetch(QUERY_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: form
        });
        const rawTxt = await resp.text();
        const data = JSON.parse(rawTxt);

        if (data.return_code === "SUCCESS" && data.trade_status === "SUCCESS") {
            return res.json({ code: 0, paid: true, msg: "已支付" });
        } else {
            return res.json({ code: 0, paid: false, msg: data.return_msg || "未支付" });
        }
    } catch (err) {
        return res.json({ code: -2, msg: `查询异常:${err.message}` });
    }
}

function buildHash(params, secretKey) {
    const keys = Object.keys(params).sort();
    const parts = [];
    for (const k of keys) {
        const v = params[k];
        if (v === undefined || v === "" || k === "hash") continue;
        parts.push(`${k}=${v}`);
    }
    const signSrc = parts.join("&") + `&key=${secretKey}`;
    return crypto.createHash("md5").update(signSrc).digest("hex").toUpperCase();
}