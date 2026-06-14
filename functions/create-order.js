export default async function onRequest({ request, env }) {
  // 虎皮椒密钥（和前端保持一致，禁止泄露）
  const APPID = "201906181673";
  const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4";
  const HOST = "https://api.xunhupay.com";

  // 跨域头（Cloudflare 必备，防止前端请求被拦截）
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  // 处理OPTIONS预检请求
  if (request.method === "OPTIONS") {
    return new Response(null, { headers, status: 200 });
  }

  try {
    const body = await request.json();
    const { orderNo, price } = body;
    if (!orderNo || !price) {
      return new Response(JSON.stringify({ code: -1, msg: "参数缺失" }), { headers });
    }

    // 生成虎皮椒标准签名
    const signStr = `appid=${APPID}&orderid=${orderNo}&price=${price}${APPSECRET}`;
    const sign = await getMd5(signStr);

    // 调用虎皮椒创建订单接口
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
    return new Response(JSON.stringify({ code: 0, orderNo, data: payData }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ code: -2, msg: "接口异常：" + e.message }), { headers });
  }
}

// MD5 加密（Cloudflare Functions 内置算法）
async function getMd5(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest("MD5", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}