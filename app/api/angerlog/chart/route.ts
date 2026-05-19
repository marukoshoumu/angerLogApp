import prisma from "../../../../utils/prisma";
import { NextResponse } from "next/server";
import { checkAuth } from "@/api/auth";
import { getDateRange } from "../../utils/dateUtils";

/**
 * アンガーログのチャートデータを取得するAPI
 * @param request リクエスト
 * @returns アンガーログのチャートデータ　最大値、平均値、カテゴリトップ5
 */
export async function GET(request: Request) {
  // パラメータ取得
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const day = searchParams.get("day");
  const type = searchParams.get("type") as "daily" | "monthly";

  try {
    // ユーザ認証
    const user = await checkAuth();
    const userId = user.id;

    if (type !== "daily" && type !== "monthly") {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }
    // 日付範囲取得
    const dateRange = getDateRange(type, year, month, day);

    if ("error" in dateRange) {
      return NextResponse.json({ error: dateRange.error }, { status: 400 });
    }
    const { startDate, endDate } = dateRange;

    // 最大値を取得
    const aggregatedData = await prisma.angerRecord.groupBy({
      by: ["occurredDate"],
      _max: {
        level: true,
      },
      where: {
        userId,
        occurredDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        occurredDate: "asc",
      },
    });
    // 平均値を計算
    const averageLevelData = await prisma.angerRecord.aggregate({
      _avg: {
        level: true,
      },
      where: {
        userId,
        occurredDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });
    const averageLevel = averageLevelData._avg.level || 0;
    // カテゴリごとのトップ5を取得
    const topCategories = await prisma.angerRecord.groupBy({
      by: ['workTypeId'],
      _max: {
        level: true,
      },
      where: {
        userId,
        occurredDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        _max: {
          level: 'desc',
        },
      },
      take: 5,
    });

    // 作業内容データ取得
    const categoryData = await Promise.all(
      topCategories.map(async (item) => {
        const workContent = await prisma.workContent.findUnique({
          where: { id: item.workTypeId },
        });
        return {
          content: workContent?.content || "不明",
          level: item._max.level,
        };
      })
    );

    return NextResponse.json({
      aggregatedData,
      averageLevel,
      categoryData,
    });
  } catch (error) {
    console.error("Error fetching anger logs:", error);
    return NextResponse.json({ error: "Failed to fetch anger logs" }, { status: 500 });
  }
}