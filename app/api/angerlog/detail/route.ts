import { NextResponse } from "next/server";
import prisma from "../../../../utils/prisma";
import { checkAuth } from "@/api/auth";

/**
 * アンガーログのデータを取得するAPI
 * @param request リクエスト
 * @returns アンガーログデータ
 */
export async function GET(request: Request) {
  // パラメータ取得
  const { searchParams } = new URL(request.url);
  const angerId = searchParams.get("angerId");
  if (angerId === null) {
    return new Response("Invalid ID", { status: 400 });
  }
  try {
    // ユーザ認証
    const user = await checkAuth();

    // アンガーログデータ取得（所有権確認込み）
    const record = await prisma.angerRecord.findUnique({
      where: { id: parseInt(angerId) },
    });

    if (!record || record.userId !== user.id) {
      return new Response("Not Found", { status: 404 });
    }
    return NextResponse.json(record);
  } catch (error) {
    console.error("Error during GET request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}