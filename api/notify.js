import crypto from 'crypto';

export default async function handler(req, res) {
    const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4";
    const body = req.method === 'POST' ? req.body : req.query;

    const { trade_order_id, total_fee, trade_status, hash } = body;
    if (!trade_order_id || !hash || trade_status !== "SUCCESS") {
        return res.send("fail");
    }

    const params = { ...body };
    delete params.hash;
    
    const keys = Object.keys(params).sort();
    let signStr = '';
    keys.forEach(key => {
        if (params[key] !== '' && params[key] !== undefined && key !== 'hash') {
            signStr += `${key}=${params[key]}&`;
        }
    });
    signStr = signStr.slice(0, -1);
    signStr += APPSECRET;
    const calcSign = crypto.createHash('md5').update(signStr).digest('hex').toLowerCase();

    if (calcSign !== hash.toLowerCase()) {
        return res.send("fail");
    }

    res.send("success");
}