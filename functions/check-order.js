export default async function onRequest({ request }) {
  // 统一跨域响应头
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  // 处理浏览器跨域OPTIONS预检请求
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  // 只允许GET访问，其它方法拒绝
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ payStatus: -2, msg: "仅支持GET请求" }), {
      headers: corsHeaders
    });
  }

  // 下方原有业务代码完全不动
  const APPID = "201906181673";
  const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4";
  const HOST = "https://api.xunhupay.com";
  const url = new URL(request.url);
  const orderNo = url.searchParams.get("orderNo");

  if (!orderNo) {
    return new Response(JSON.stringify({ payStatus: -1, msg: "订单号为空" }), { headers: corsHeaders });
  }

  try {
    // 生成查询签名
    const signStr = `appid=${APPID}&orderid=${orderNo}${APPSECRET}`;
    const sign = await getMd5(signStr);

    // 调用虎皮订单查询接口
    const queryUrl = `${HOST}/payment/query.html?appid=${APPID}&orderid=${orderNo}&sign=${sign}`;
    const resData = await fetch(queryUrl);
    const data = await resData.json();

    // 状态映射：0=待支付 1=已支付 2=关闭
    let payStatus = 0;
    if (data.status === 1) payStatus = 1;
    if (data.status === 2) payStatus = 2;

    return new Response(JSON.stringify({ payStatus, raw: data }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ payStatus: -1, msg: "查询异常：" + e.message }), { headers: corsHeaders });
  }
}

// MD5 加密
async function getMd5(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}