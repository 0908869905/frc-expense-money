"use client";

import React, { useTransition, useRef, useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExpenseReportFormValues, expenseReportSchema, ExpenseCategoryEnum, TeamGroupEnum } from "@/lib/schemas";
import { createExpense } from "@/app/actions/expenses";
import { Button } from "@/components/ui/Button"; // Reusing existing Button
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/input"; // We need to create a simple Input wrapper
import { Label } from "@/components/ui/label"; // We need to create a simple Label wrapper
import { Trash2, Plus, Upload, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormState } from "react-dom"; // React 18 相容
// import { upload } from "@vercel/blob/client"; // Uncomment if package is available

// --- Simple UI Wrappers (since they weren't in previous context) ---
const FormItem = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
  <div className={cn("space-y-2", className)}>{children}</div>
);

// --- Upload Component ---
interface UploadButtonProps {
  onUploadComplete: (url: string) => void;
  defaultUrl?: string | null;
}

const UploadButton = ({ onUploadComplete, defaultUrl }: UploadButtonProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Mocking Vercel Blob upload for demonstration if SDK isn't fully configured
      // In production: const newBlob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create a local preview URL for now
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onUploadComplete(objectUrl); // In real app, pass the blob.url

    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed (Mock)");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {uploading ? "上傳中..." : preview ? "更換收據" : "上傳收據"}
      </Button>
      {preview && (
        <a href={preview} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline truncate max-w-[100px]">
          檢視
        </a>
      )}
    </div>
  );
};

export function ExpenseForm() {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useFormState(createExpense, {
    success: false,
    message: null,
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ExpenseReportFormValues>({
    resolver: zodResolver(expenseReportSchema),
    defaultValues: {
      title: "",
      description: "",
      department: "ELECTRICAL",
      items: [
        {
          date: new Date(),
          category: "Food",
          customCategory: "",
          description: "",
          amount: 0,
          receiptUrl: null,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = (data: ExpenseReportFormValues) => {
    // We strictly use FormData for the server action to comply with Next.js patterns
    // We serialize the complex data object to pass it cleanly.
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));

    // Trigger the server action with transition for pending state
    startTransition(() => {
      formAction(formData);
    });
  };

  // Reset form on success
  React.useEffect(() => {
    if (state.success) {
      reset();
      // Optional: Redirect or show toast
    }
  }, [state.success, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">新增報帳單</h2>
          <p className="text-muted-foreground">提交新的費用報銷申請。</p>
        </div>
      </div>

      {state.message && (
        <div className={cn("p-4 rounded-md flex items-center gap-2", state.success ? "bg-green-50 text-green-900 border border-green-200" : "bg-red-50 text-red-900 border border-red-200")}>
          <AlertCircle className="h-4 w-4" />
          {state.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>報帳單資訊</CardTitle>
          <CardDescription>此次報銷的基本資訊。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <FormItem>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">報帳單標題</label>
            <input
              {...register("title")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="例如：十月客戶拜訪"
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </FormItem>

          <FormItem>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">用途/說明</label>
            <textarea
              {...register("description")}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="詳細說明費用內容..."
            />
          </FormItem>

          <FormItem>
            <label className="text-sm font-medium leading-none">組別</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { value: 'ELECTRICAL', label: '電資組', icon: '⚡' },
                { value: 'MECHANICAL', label: '機構組', icon: '⚙️' },
                { value: 'DOCUMENTATION', label: '文書組', icon: '📝' },
                { value: 'PR', label: '公關組', icon: '📣' },
                { value: 'FINANCE', label: '財管組', icon: '💰' },
                { value: 'DESIGN', label: '意象組', icon: '🎨' },
              ].map((dept) => (
                <label
                  key={dept.value}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${watch('department') === dept.value ? 'border-primary bg-primary/10 ring-2 ring-primary/30' : 'border-input hover:border-primary/50'}`}
                >
                  <input
                    type="radio"
                    value={dept.value}
                    {...register('department')}
                    className="sr-only"
                  />
                  <span className="text-lg">{dept.icon}</span>
                  <span className="text-sm font-medium">{dept.label}</span>
                </label>
              ))}
            </div>
            {errors.department && <p className="text-sm text-destructive">{errors.department.message}</p>}
          </FormItem>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">費用明細項目</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ date: new Date(), category: "Food", customCategory: "", description: "", amount: 0, receiptUrl: null })}
          >
            <Plus className="mr-2 h-4 w-4" />新增項目
          </Button>
        </div>

        {fields.map((field, index) => (
          <Card key={field.id} className="relative overflow-hidden transition-all hover:border-primary/50">
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-12">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">日期</label>
                  <input
                    type="date"
                    {...register(`items.${index}.date` as const)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className={`${watch(`items.${index}.category`) === 'Other' ? 'md:col-span-1' : 'md:col-span-2'} space-y-2`}>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">類別</label>
                  <select
                    {...register(`items.${index}.category` as const)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {ExpenseCategoryEnum.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* 自定義類別輸入框 - 當選擇 Other 時顯示 */}
                {watch(`items.${index}.category`) === 'Other' && (
                  <div className="md:col-span-1 space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">自訂類別</label>
                    <input
                      {...register(`items.${index}.customCategory` as const)}
                      placeholder="輸入類別名稱"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                )}

                <div className="md:col-span-4 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">說明</label>
                  <input
                    {...register(`items.${index}.description` as const)}
                    placeholder="與客戶午餐"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-[10px] text-destructive">{errors.items[index]?.description?.message}</p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">金額</label>
                  <div className="relative">
                    <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">$</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.amount` as const)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent pl-5 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  {errors.items?.[index]?.amount && (
                    <p className="text-[10px] text-destructive">{errors.items[index]?.amount?.message}</p>
                  )}
                </div>

                <div className="md:col-span-2 flex items-end justify-between gap-2">
                  <Controller
                    control={control}
                    name={`items.${index}.receiptUrl`}
                    render={({ field: { onChange, value } }) => (
                      <UploadButton
                        onUploadComplete={onChange}
                        defaultUrl={value}
                      />
                    )}
                  />
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {errors.items && <p className="text-sm text-destructive">{errors.items.message}</p>}
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => reset()}>取消</Button>
        <Button type="submit" disabled={isPending} className="min-w-[150px]">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              提交中...
            </>
          ) : (
            "提交報帳單"
          )}
        </Button>
      </div>
    </form>
  );
}