export default async function onRequest({ request }) {
  const APPID = "201906181673";
  const APPSECRET = "685ed8bb1d5468e8771aaee1109913c4";
  const headers = { "Content-Type": "text/plain" };

  const formData = await request.formData();
  const orderid = formData.get("orderid");
  const status = formData.get("status");
  const sign = formData.get("sign");

  // 校验签名
  const signStr = `orderid=${orderid}&status=${status}${APPSECRET}`;
  const localSign = await getMd5(signStr);
  if (localSign !== sign) {
    return new Response("fail", { headers });
  }

  // 支付成功（CF内存临时标记，重启失效，个人测试够用）
  return new Response("success", { headers });
}

async function getMd5(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest("MD5", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}