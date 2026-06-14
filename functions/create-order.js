export default async function onRequest({ request }) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  // 专门接收OPTIONS预检，彻底解决405报错
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ code: -3, msg: "仅允许POST调用" }), { headers: corsHeaders });
  }

  const APPID = "201906181673";
  const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4";
  const HOST = "https://api.xunhupay.com";

  try {
    const body = await request.json();
    const { orderNo, price } = body;
    if (!orderNo || !price) {
      return new Response(JSON.stringify({ code: -1, msg: "参数缺失" }), { headers: corsHeaders });
    }
    const signStr = `appid=${APPID}&orderid=${orderNo}&price=${price}${APPSECRET}`;
    const sign = await getMd5(signStr);

    const payRes = await fetch(`${HOST}/payment/create.html`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        appid: APPID,
        orderid: orderNo,
        price: price,
        sign: sign,
        paytype: "wxh5"
      })
    });
    const payData = await payRes.json();
    return new Response(JSON.stringify({ code: 0, orderNo, data: payData }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ code: -2, msg: "接口异常：" + e.message }), { headers: corsHeaders });
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