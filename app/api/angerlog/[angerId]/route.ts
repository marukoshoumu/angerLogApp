import prisma from "../../../../utils/prisma";
import { NextResponse } from "next/server";
import { checkAuth } from "@/api/auth";

type PageProps = {
  params: Promise<{
    angerId: string;
  }>;
};
/**
 * アンガーログのデータを取得するAPI
 * @param request リクエスト
 * @param param1 アンガーログID
 * @returns アンガーログデータ
 */
export async function GET(request: Request, { params }: PageProps) {
  try {
    // ユーザ認証
    const user = await checkAuth();

    // アンガーログID取得
    const angerId = parseInt((await params).angerId);

    // IDが数値でない場合はエラー
    if (isNaN(angerId)) {
      return new Response("Invalid ID", { status: 400 });
    }

    // アンガーログデータ取得（所有権確認込み）
    const record = await prisma.angerRecord.findUnique({
      where: { id: angerId },
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