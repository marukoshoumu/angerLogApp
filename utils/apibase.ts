import { headers } from "next/headers";

/**
 * 絶対パス取得
 * @returns ホストとプロトコル取得し絶対パス用のURL文字列を返却
 */
const getApiBase = async () => {
  // ホストとプロトコル取得
  const headersData = headers();
  const protocol = (await headersData).get("x-forwarded-proto") || "http";
  const host = (await headersData).get("host") || "localhost:3000";
  // 絶対パス
  const apiBase = `${protocol}://${host}`;
  return apiBase;
};

export default getApiBase;
