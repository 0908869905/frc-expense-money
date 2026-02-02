"use client";

import React, { useTransition, useRef, useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExpenseReportFormValues, expenseReportSchema, ExpenseCategoryEnum, TeamGroupEnum } from "@/lib/schemas";
import { createExpense } from "@/app/actions/expenses";
import { scanInvoice } from "@/app/actions/ocr";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Upload, Loader2, AlertCircle, Sparkles, Building2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormState } from "react-dom";
import type { BankAccountData } from "@/app/actions/bank-accounts";
import { maskAccountNumber } from "@/lib/utils/mask-account";
// import { upload } from "@vercel/blob/client"; // Uncomment if package is available

// --- Simple UI Wrappers (since they weren't in previous context) ---
const FormItem = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
  <div className={cn("space-y-2", className)}>{children}</div>
);

// --- Upload Component with OCR ---
interface OCRResult {
  date?: string;
  amount?: number;
  description?: string;
  vendor?: string;
  invoiceNumber?: string;
}

interface UploadButtonProps {
  onUploadComplete: (base64DataUrl: string) => void;
  onOCRComplete?: (data: OCRResult) => void;
  defaultUrl?: string | null;
}

/** 壓縮圖片：縮小到 maxWidth 並以 JPEG 品質 quality 輸出 base64 */
function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("圖片載入失敗"));
    img.src = URL.createObjectURL(file);
  });
}

const UploadButton = ({ onUploadComplete, onOCRComplete, defaultUrl }: UploadButtonProps) => {
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultUrl || null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Create preview URL (local display only)
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // 壓縮圖片後轉 base64 存入 DB
      let base64: string;
      if (file.type.startsWith("image/")) {
        base64 = await compressImage(file);
      } else {
        // PDF 等非圖片檔案直接讀取
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      }
      setImageBase64(base64);
      onUploadComplete(base64);
    } catch (error) {
      console.error("Upload failed", error);
      alert("上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  // 獨立的 OCR 掃描功能
  const handleScan = async () => {
    if (!imageBase64) {
      alert("請先上傳收據圖片");
      return;
    }
    if (!onOCRComplete) return;

    setScanning(true);
    try {
      const result = await scanInvoice(imageBase64);
      if (result.success && result.data) {
        onOCRComplete({
          date: result.data.date || undefined,
          amount: result.data.totalAmount ? result.data.totalAmount / 100 : undefined,
          description: result.data.vendorName || undefined,
          vendor: result.data.vendorName || undefined,
          invoiceNumber: result.data.invoiceNumber || undefined,
        });
      } else {
        alert(result.error || "OCR 辨識失敗");
      }
    } catch (err) {
      console.error("OCR failed:", err);
      alert("OCR 辨識失敗");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf"
      />
      {/* 上傳按鈕 */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="gap-1 px-2"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {uploading ? "上傳中" : preview ? "更換" : "上傳"}
      </Button>

      {/* 獨立的 OCR 智慧擷取按鈕 */}
      {onOCRComplete && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleScan}
          disabled={!preview || scanning}
          className="gap-1 px-2"
          title="智慧擷取收據資訊"
        >
          {scanning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-yellow-500" />
          )}
          {scanning ? "辨識中" : "擷取"}
        </Button>
      )}

      {preview && (
        <a href={preview} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline">
          檢視
        </a>
      )}
    </div>
  );
};

interface ExpenseFormProps {
  bankAccounts?: BankAccountData[];
}

export function ExpenseForm({ bankAccounts = [] }: ExpenseFormProps) {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useFormState(createExpense, {
    success: false,
    message: null,
  });

  // 收款帳戶
  const defaultAccount = bankAccounts.find((a) => a.isDefault);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>(
    defaultAccount?.id || ""
  );

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

  // 處理 OCR 結果，自動填入表單欄位
  const handleOCRResult = (index: number, data: OCRResult) => {
    if (data.date) {
      // 轉換日期格式為 input date 格式 (YYYY-MM-DD)
      try {
        const dateStr = data.date;
        // 嘗試解析常見的日期格式
        let dateObj: Date | null = null;
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            // 可能是 YYYY/MM/DD 或 MM/DD/YYYY 或 DD/MM/YYYY
            if (parts[0].length === 4) {
              dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else {
              // 假設 MM/DD/YYYY
              dateObj = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
            }
          }
        } else if (dateStr.includes('-')) {
          dateObj = new Date(dateStr);
        }
        if (dateObj && !isNaN(dateObj.getTime())) {
          const formattedDate = dateObj.toISOString().split('T')[0];
          // @ts-ignore - setValue works with string path
          control._formValues.items[index].date = formattedDate;
        }
      } catch (e) {
        console.warn('Date parsing failed:', e);
      }
    }
    if (data.amount && data.amount > 0) {
      // @ts-ignore
      control._formValues.items[index].amount = data.amount;
    }
    if (data.vendor) {
      // @ts-ignore
      control._formValues.items[index].description = data.vendor;
    }
    // 觸發重新渲染
    reset(control._formValues);
  };

  const onSubmit = (data: ExpenseReportFormValues) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (selectedBankAccountId) {
      formData.append("bankAccountId", selectedBankAccountId);
    }

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
          <p className="text-muted-foreground">填寫完成後將直接提交至上級審核。</p>
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


        </CardContent>
      </Card>

      {/* 收款帳戶選擇 */}
      {bankAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              收款帳戶
            </CardTitle>
            <CardDescription>選擇報帳款項匯入的帳戶</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bankAccounts.map((account) => (
                <label
                  key={account.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedBankAccountId === account.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  )}
                >
                  <input
                    type="radio"
                    name="bankAccountSelect"
                    value={account.id}
                    checked={selectedBankAccountId === account.id}
                    onChange={() => setSelectedBankAccountId(account.id)}
                    className="sr-only"
                  />
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    selectedBankAccountId === account.id
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )}>
                    {selectedBankAccountId === account.id && (
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{account.bankName}</span>
                      {account.branchName && (
                        <span className="text-muted-foreground text-sm">- {account.branchName}</span>
                      )}
                      {account.isDefault && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                          <Star className="h-3 w-3" />
                          預設
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {maskAccountNumber(account.accountNumber)} · {account.accountHolder}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                        onOCRComplete={(data) => handleOCRResult(index, data)}
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