"use client";

import React, { useState, useEffect } from "react";
import InputField from "../atoms/Input";
import SelectField from "../atoms/SelectField";
import { Box, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkAuth } from "@/api/auth";
import Loading from "@/app/loading";

export type AngerLog = {
  id?: number;
  level: number;
  workTypeId: number;
  date: string;
  time: string;
  situation: string;
  feeling: string;
};

type WorkContent = {
  id: number;
  userId: string;
  content: string;
  category: string;
};

type AngerLogFormProps = {
  mode: "new" | "edit";
  angerId?: number;
  initTasksData?:
    | {
        id: number;
        userId: string;
        content: string;
        category: string;
      }[]
    | null;
  initAngerLogsData?: {
    level: number;
    workTypeId: number;
    date: string;
    time: string;
    situation: string;
    feeling: string;
  } | null;
};

/**
 * アンガーログフォーム
 * @param param モード：new edit　アンガーログID　作業内容データ　アンガーログデータ
 * @returns アンガーログフォーム
 */
const AngerLogForm = ({
  mode,
  angerId,
  initTasksData,
  initAngerLogsData,
}: AngerLogFormProps) => {
  const isEdit = mode === "edit";
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const [contents, setContents] = useState<{ value: string; label: string }[]>(
    []
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [formData, setFormData] = useState<AngerLog>({
    level: 5,
    workTypeId: 0,
    date: "",
    time: "",
    situation: "",
    feeling: "",
  });

  useEffect(() => {
    const fetchTasks = async () => {
      // 作業内容データのカテゴリを一意にする
      const uniqueCategories = Array.from(
        new Set(initTasksData!.map((task: WorkContent) => task.category))
      ).map((category: string) => ({ value: category, label: category }));

      setCategories(uniqueCategories);

      const initialCategory = uniqueCategories[0]?.value || "";
      setSelectedCategory(initialCategory);

      // カテゴリに紐づくコンテンツを取得
      const initialContents = initTasksData!
        .filter((task: WorkContent) => task.category === initialCategory)
        .map((task: WorkContent) => ({
          value: task.id.toString(),
          label: task.content,
        }));

      setContents(initialContents);
      // 編集モードの場合
      if (mode === "edit" && angerId) {
        setFormData(initAngerLogsData!);
        // カテゴリを選択
        const task = initTasksData!.find(
          (task) => task.id === initAngerLogsData!.workTypeId
        );
        if (task) {
          // コンテンツ変更
          setSelectedCategory(task.category);
          handleCategoryChange(task.category);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [initTasksData, initAngerLogsData]);
  // カテゴリ変更時の処理
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);

    const filteredContents = initTasksData!
      .filter((task) => task.category === value)
      .map((task) => ({ value: task.id.toString(), label: task.content }));
    setContents(filteredContents);
  };
  // フォームの変更時の処理
  const handleChange =
    (key: keyof AngerLog) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData({ ...formData, [key]: e.target.value });
    };
  //  フォームのバリデーション
  const validateForm = () => {
    if (!formData.level) return "怒りレベルを選択してください。";
    if (!selectedCategory) return "カテゴリを選択してください。";
    if (!formData.workTypeId) return "コンテンツを選択してください。";
    if (!formData.date) return "日付を入力してください。";
    if (!formData.time) return "時間を入力してください。";
    if (!formData.situation) return "状況を入力してください。";
    if (!formData.feeling) return "気持ちを入力してください。";
    return null;
  };
  // 登録処理
  const handleInsert = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }
    const toastId = toast.loading("処理中・・・・。");

    try {
      // ユーザー認証
      const user = await checkAuth();
      const occurredDateTimeZone = new Date(
        `${formData.date}T${formData.time}`
      ).toISOString();
      // アンガーログ登録
      const response = await fetch(`/api/angerlog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          level: formData.level,
          workTypeId: formData.workTypeId,
          occurredDate: occurredDateTimeZone,
          situation: formData.situation,
          feeling: formData.feeling,
        }),
      });

      if (!response.ok) {
        console.log(response);
        throw new Error("登録に失敗しました");
      }
      toast.update(toastId, {
        render: "アンガーログを登録しました",
        type: "success",
        isLoading: false,
        autoClose: 5000,
        closeOnClick: true,
      });
      // ダッシュボードに遷移
      router.push(`/dashboard`);
      router.refresh();
    } catch (error) {
      toast.update(toastId, {
        render: "登録中にエラーが発生しました",
        type: "error",
        isLoading: false,
        autoClose: 5000,
        closeOnClick: true,
      });
      console.log(error);
    }
  };
  // 登録／更新処理
  const handleSubmit = async () => {
    if (mode === "edit" && angerId) {
      // 更新処理
      handleUpdate();
    } else {
      // 登録処理
      handleInsert();
    }
  };
  // 更新処理
  const handleUpdate = async () => {
    // フォームのバリデーション
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }
    const toastId = toast.loading("処理中・・・・。");

    try {
      if (!angerId) throw new Error("IDが存在しません。");
      const occurredDateTimeZone = new Date(
        `${formData.date}T${formData.time}`
      ).toISOString();
      // アンガーログ更新
      const response = await fetch(`/api/angerlog`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: angerId,
          level: formData.level,
          workTypeId: formData.workTypeId,
          occurredDate: occurredDateTimeZone,
          situation: formData.situation,
          feeling: formData.feeling,
        }),
      });

      if (!response.ok) {
        throw new Error("更新に失敗しました");
      }

      toast.update(toastId, {
        render: "アンガーログを更新しました",
        type: "success",
        isLoading: false,
        autoClose: 5000,
        closeOnClick: true,
      });
      // ダッシュボードに遷移
      router.push(`/dashboard`);
      router.refresh();
    } catch (error) {
      toast.update(toastId, {
        render: "更新中にエラーが発生しました",
        type: "error",
        isLoading: false,
        autoClose: 5000,
        closeOnClick: true,
      });
      console.log(error);
    }
  };
  // ローディング中
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", m: 2 }}>
        <Loading />
      </Box>
    );
  }
  return (
    <Box
      component="form"
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <SelectField
        label="怒りレベル（レベル10人生最大）"
        name="angerLevel"
        value={formData.level.toString()}
        onChange={(e) =>
          setFormData({ ...formData, level: parseInt(e.target.value) })
        }
        options={[
          { value: "1", label: "😞 レベル1" },
          { value: "2", label: "😖 レベル2" },
          { value: "3", label: "😩 レベル3" },
          { value: "4", label: "😭 レベル4" },
          { value: "5", label: "😤 レベル5" },
          { value: "6", label: "😡 レベル6" },
          { value: "7", label: "🤬 レベル7" },
          { value: "8", label: "👿 レベル8" },
          { value: "9", label: "😱 レベル9" },
          { value: "10", label: "💀 レベル10" },
        ]}
      />
      <SelectField
        label="カテゴリ"
        name="category"
        value={selectedCategory}
        onChange={(e) => handleCategoryChange(e.target.value)}
        options={categories}
      />
      <SelectField
        label="コンテンツ"
        name="content"
        value={formData.workTypeId.toString()}
        onChange={(e) =>
          setFormData({ ...formData, workTypeId: parseInt(e.target.value) })
        }
        options={contents}
      />

      <InputField
        type="date"
        label="いつ？"
        name="date"
        value={formData.date}
        onChange={handleChange("date")}
      />
      <InputField
        type="time"
        label="何時くらい？"
        name="time"
        value={formData.time}
        onChange={handleChange("time")}
      />
      <InputField
        type="text"
        label="どんな状況？"
        name="situation"
        value={formData.situation}
        onChange={handleChange("situation")}
      />
      <InputField
        type="text"
        label="どんな気持ちになった？"
        name="feeling"
        value={formData.feeling}
        onChange={handleChange("feeling")}
      />
      {!isEdit ? (
        <Button variant="contained" color="success" onClick={handleSubmit}>
          登録
        </Button>
      ) : (
        <Button variant="contained" color="success" onClick={handleUpdate}>
          更新
        </Button>
      )}
    </Box>
  );
};

export default AngerLogForm;
