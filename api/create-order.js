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

    const time = Math.floor(Date.now() / 1000);
    const nonce_str = crypto.randomBytes(8).toString('hex');
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const domain = req.headers.host;

    // 严格按官方文档的必填参数
    const params = {
        version: "1.1",          // 必填，固定值
        appid: APPID,            // 必填
        trade_order_id: order_no,// 必填，商户订单号（之前参数名写错了）
        total_fee: price,        // 必填，单位：元！！不是分
        title: goods_name,       // 必填，订单标题（之前参数名写错了）
        time: time,              // 必填
        nonce_str: nonce_str,    // 必填
        notify_url: `${protocol}://${domain}/api/notify`,
        return_url: `${protocol}://${domain}`
    };

    // 官方标准签名算法
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
            return res.json({ code: -99, msg: `接口非JSON返回：${raw}` });
        }

        if (ret.return_code === 'SUCCESS' && ret.pay_url) {
            return res.json({ code: 0, pay_url: ret.pay_url, order_no });
        } else {
            return res.json({ code: -2, msg: `接口报错：${JSON.stringify(ret)}` });
        }
    } catch (err) {
        return res.json({ code: -3, msg: `请求异常：${err.message}` });
    }
}