import crypto from 'crypto';
import qs from 'querystring';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ code: -1, msg: "仅支持POST请求" });
    }

    const APPID = "201906181673";
    const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4";
    const API_URL = "https://api.xunhupay.com/payment/do.html";

    const { order_no, price, goods_name } = req.body;
    if (!order_no || !price || !goods_name) {
        return res.json({ code: -1, msg: "订单参数缺失" });
    }

    const total_fee = Math.round(Number(price) * 100);
    const time = Math.floor(Date.now() / 1000);
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const domain = req.headers.host;

    // 固定参数顺序，官方要求按ASCII升序
    const params = {
        appid: APPID,
        body: goods_name,
        notify_url: `${protocol}://${domain}/api/notify`,
        out_trade_no: order_no,
        return_url: `${protocol}://${domain}`,
        time: time,
        total_fee: total_fee,
        type: "WAP"
    };

    // 官方签名算法
    let signStr = '';
    const keys = Object.keys(params).sort();
    for (const k of keys) {
        signStr += `${k}=${params[k]}&`;
    }
    signStr += `key=${APPSECRET}`;
    const hash = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
    params.hash = hash;

    const postData = qs.stringify(params);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: postData
        });
        const raw = await response.text();
        let ret;
        try {
            ret = JSON.parse(raw);
        } catch (e) {
            return res.json({ code: -99, msg: `接口返回非JSON：${raw}` });
        }

        if (ret.return_code === 'SUCCESS' && ret.pay_url) {
            return res.json({ code: 0, pay_url: ret.pay_url });
        } else {
            return res.json({ code: -2, msg: JSON.stringify(ret) });
        }
    } catch (err) {
        return res.json({ code: -3, msg: `请求异常：${err.message}` });
    }
}