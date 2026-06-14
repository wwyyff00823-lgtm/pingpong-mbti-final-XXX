export default async function onRequest({ request, env }) {
  const APPID = "201906181673";
  const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4";
  const HOST = "https://api.xunhupay.com";

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  const url = new URL(request.url);
  const orderNo = url.searchParams.get("orderNo");
  if (!orderNo) {
    return new Response(JSON.stringify({ payStatus: -1, msg: "订单号为空" }), { headers });
  }

  // 订单查询签名
  const signStr = `appid=${APPID}&orderid=${orderNo}${APPSECRET}`;
  const sign = await getMd5(signStr);

  try {
    const res = await fetch(`${HOST}/payment/query.html?appid=${APPID}&orderid=${orderNo}&sign=${sign}`);
    const data = await res.json();

    // 状态映射：0=待支付 1=已支付 2=关闭
    let payStatus = 0;
    if (data.status === 1) payStatus = 1;
    if (data.status === 2) payStatus = 2;

    return new Response(JSON.stringify({ payStatus, raw: data }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ payStatus: -1, msg: "查询失败" }), { headers });
  }
}

async function getMd5(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest("MD5", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}