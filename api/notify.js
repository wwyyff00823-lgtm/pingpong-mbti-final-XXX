// 虎皮椒V3 异步支付回调接口
import crypto from 'crypto';

export default async function handler(req, res) {
    const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4";
    const body = req.method === 'POST' ? req.body : req.query;
    console.log("【回调notify】虎皮椒推送原始数据", body);

    const { out_trade_no, total_fee, trade_status, sign } = body;
    if (!out_trade_no || !sign || trade_status !== "SUCCESS") {
        console.log("【回调notify】参数校验不通过，拒绝", { trade_status });
        return res.send("fail");
    }

    const params = { ...body };
    delete params.sign;
    const calcSign = generateSign(params, APPSECRET);
    console.log("【回调notify】本地计算签名", calcSign, "远端签名", sign.toUpperCase());

    if (calcSign !== sign.toUpperCase()) {
        console.log("【回调notify】签名校验失败");
        return res.send("fail");
    }

    console.log("【回调notify】支付校验成功，订单", out_trade_no);
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