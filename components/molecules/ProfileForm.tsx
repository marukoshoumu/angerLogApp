"use client";
import Input from "../atoms/Input";
import Button from "../atoms/Button";
import Box from "@mui/material/Box";
import { useState, useEffect } from "react";
import { selectUser, updateUser } from "@/api/user";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";

type UserProfile = {
  name: string;
  email: string;
  password: string;
  goal: string;
};

const ProfileForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<UserProfile>({
    name: "",
    email: "",
    password: "",
    goal: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const toastId = toast.loading("処理中・・・・。");
      try {
        const data = await selectUser();

        if (data) {
          setFormData({
            name: data.name || "",
            email: data.email || "",
            password: "",
            goal: data.goal || "",
          });
          toast.update(toastId, {
            render: "プロフィール情報を取得しました。",
            type: "success",
            isLoading: false,
            autoClose: 1000,
            closeOnClick: true,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "不明なエラーが発生しました。";
        toast.update(toastId, {
          render: errorMessage,
          type: "error",
          isLoading: false,
          autoClose: 5000,
          closeOnClick: true,
        });
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const toastId = toast.loading("処理中・・・・。");

    const updates = {
      name: formData.name,
      email: formData.email,
      goal: formData.goal,
      ...(formData.password && { password: formData.password }),
    };
    try {
      await updateUser(updates);
      toast.update(toastId, {
        render: "プロフィールを更新しました",
        type: "success",
        isLoading: false,
        autoClose: 5000,
        closeOnClick: true,
      });
      router.push(`/dashboard`);
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラーが発生しました。";
      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        closeOnClick: true,
      });
    }
  };

  return (
    <>
      <ToastContainer position="top-center" />
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Input
          name="name"
          type="text"
          label="名前"
          placeholder="やまだ たろう"
          value={formData.name}
          onChange={handleChange}
        />
        <Input
          name="email"
          type="email"
          label="メールアドレス"
          placeholder="sample@gmail.com"
          value={formData.email}
          onChange={handleChange}
        />
        <Input
          name="password"
          type="password"
          label="パスワード"
          placeholder="新しいパスワードを入力"
          value={formData.password}
          onChange={handleChange}
        />
        <Input
          name="goal"
          type="text"
          label="目標"
          placeholder="自分の感情を理解し、コントロールできるようになる"
          multiline
          rows={3}
          value={formData.goal}
          onChange={handleChange}
        />
        <Button type="submit" color="primary">
          保存
        </Button>
      </Box>
    </>
  );
};

export default ProfileForm;
