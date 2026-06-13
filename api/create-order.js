// 虎皮椒V3 支付下单
import crypto from 'crypto';
import qs from 'querystring';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ code: -1, msg: "仅支持POST" });
    }

    const APPID = "201906181673";
    const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4";
    const API_URL = "https://api.xunhupay.com/payment/do.html";

    const { order_no, price, goods_name } = req.body;
    if (!order_no || !price || !goods_name) {
        return res.status(400).json({ code: -1, msg: "参数不全" });
    }

    const totalFee = Math.round(Number(price) * 100);
    const time = Math.floor(Date.now() / 1000);
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';

    const params = {
        appid: APPID,
        time: time,
        out_trade_no: order_no,
        total_fee: totalFee,
        body: goods_name,
        notify_url: `${protocol}://${host}/api/notify`,
        return_url: `${protocol}://${host}`,
        type: "WAP"
    };

    // 官方标准签名
    const hash = buildHash(params, APPSECRET);
    params.hash = hash;

    const form = qs.stringify(params);
    try {
        const resp = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: form
        });
        const rawTxt = await resp.text();
        let data;
        try {
            data = JSON.parse(rawTxt);
        } catch {
            return res.json({ code: -2, msg: `返回非JSON:${rawTxt}` });
        }

        if (data.return_code === "SUCCESS" && data.pay_url) {
            return res.json({ code: 0, pay_url: data.pay_url, order_no });
        } else {
            return res.json({ code: -2, msg: `虎皮椒报错:${JSON.stringify(data)}` });
        }
    } catch (err) {
        return res.json({ code: -3, msg: `请求异常:${err.message}` });
    }
}

// 核心修复：去掉末尾多余&
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