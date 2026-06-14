export default async function onRequest({ request }) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  // 接收OPTIONS预检，杜绝405
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ payStatus: -2, msg: "仅允许GET调用" }), { headers: corsHeaders });
  }

  const APPID = "201906181673";
  const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4";
  const HOST = "https://api.xunhupay.com";
  const url = new URL(request.url);
  const orderNo = url.searchParams.get("orderNo");

  if (!orderNo) {
    return new Response(JSON.stringify({ payStatus: -1, msg: "订单号为空" }), { headers: corsHeaders });
  }

  try {
    const signStr = `appid=${APPID}&orderid=${orderNo}${APPSECRET}`;
    const sign = await getMd5(signStr);
    const queryUrl = `${HOST}/payment/query.html?appid=${APPID}&orderid=${orderNo}&sign=${sign}`;
    const resData = await fetch(queryUrl);
    const data = await resData.json();

    let payStatus = 0;
    if (data.status === 1) payStatus = 1;
    if (data.status === 2) payStatus = 2;

    return new Response(JSON.stringify({ payStatus, raw: data }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ payStatus: -1, msg: "查询异常：" + e.message }), { headers: corsHeaders });
  }
}

async function getMd5(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuf = await crypto.subtle.digest("MD5", data);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}