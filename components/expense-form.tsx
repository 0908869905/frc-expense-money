"use client";

import React, { useTransition, useRef, useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExpenseReportFormValues, expenseReportSchema, ExpenseCategoryEnum } from "@/lib/schemas";
import { createExpense } from "@/app/actions/expenses";
import { scanInvoice } from "@/app/actions/ocr";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus, Upload, Loader2, AlertCircle, ScanLine, Building2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormState } from "react-dom";
import type { BankAccountData } from "@/app/actions/bank-accounts";
import { maskAccountNumber } from "@/lib/utils/mask-account";

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
      const MAX_PIXELS = 16_000_000;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (width * height > MAX_PIXELS) {
        const scale = Math.sqrt(MAX_PIXELS / (width * height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
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

function getUploadLabel(uploading: boolean, hasPreview: boolean): string {
  if (uploading) return "上傳中";
  if (hasPreview) return "更換";
  return "上傳";
}

function UploadButton({ onUploadComplete, onOCRComplete, defaultUrl }: UploadButtonProps): React.JSX.Element {
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultUrl || null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      alert("檔案過大，上限為 10MB");
      return;
    }

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
        {getUploadLabel(uploading, !!preview)}
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
            <ScanLine className="h-4 w-4 text-primary" />
          )}
          {scanning ? "辨識中" : "擷取"}
        </Button>
      )}

      {preview && (
        <a href={preview} target="_blank" rel="noreferrer" className="text-xs text-info underline">
          檢視
        </a>
      )}
    </div>
  );
};

const FIELD_INPUT_CLASS = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

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
    setValue,
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

  // 即時摘要（右欄）：監看明細變動
  const watchedItems = watch("items");
  const liveTotal = (watchedItems || []).reduce(
    (acc, item) => acc + (Number(item?.amount) || 0),
    0
  );
  const liveCount = (watchedItems || []).length;

  // 處理 OCR 結果，自動填入表單欄位
  const handleOCRResult = (index: number, data: OCRResult) => {
    if (data.date) {
      try {
        const dateStr = data.date;
        let dateObj: Date | null = null;
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            } else {
              dateObj = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
            }
          }
        } else if (dateStr.includes('-')) {
          dateObj = new Date(dateStr);
        }
        if (dateObj && !isNaN(dateObj.getTime())) {
          const formattedDate = dateObj.toISOString().split('T')[0];
          setValue(`items.${index}.date`, formattedDate as unknown as Date);
        }
      } catch (e) {
        console.warn('Date parsing failed:', e);
      }
    }
    if (data.amount && data.amount > 0) {
      setValue(`items.${index}.amount`, data.amount);
    }
    if (data.vendor) {
      setValue(`items.${index}.description`, data.vendor);
    }
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

  useEffect(() => {
    if (state.success) {
      reset();
    }
  }, [state.success, reset]);

  // 章節動態編號（無收款帳戶區時不跳號）
  const hasBankSection = bankAccounts.length > 0;
  const itemsIndex = hasBankSection ? "03" : "02";
  const summaryIndex = hasBankSection ? "04" : "03";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* ── 期別標頭 ─────────────────────────────── */}
      <div className="space-y-1.5 border-b border-border pb-5">
        <p className="ledger-label text-primary">New Entry</p>
        <h2 className="text-2xl font-semibold tracking-tight">新增報帳單</h2>
        <p className="text-sm text-muted-foreground">填寫完成後將直接提交至上級審核。</p>
      </div>

      {state.message && (
        <div className={cn("p-3 rounded-md flex items-center gap-2 border text-sm", state.success ? "bg-ok/10 text-ok border-ok/30" : "bg-danger/10 text-danger border-danger/30")}>
          <AlertCircle className="h-4 w-4" />
          {state.message}
        </div>
      )}

      {/* ── 雙欄：左表單 / 右摘要 ─────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* 01 · 報帳單資訊 */}
          <section className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="flex items-baseline gap-2 px-4 py-3 border-b border-border bg-muted/40">
              <span className="ledger-label text-primary/70">01</span>
              <h3 className="text-sm font-semibold">報帳單資訊</h3>
              <span className="ledger-label ml-auto">Info</span>
            </header>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">報帳單標題</label>
                <input
                  {...register("title")}
                  className={cn(FIELD_INPUT_CLASS, "h-10")}
                  placeholder="例如：十月客戶拜訪"
                />
                {errors.title && <p className="text-sm text-danger">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">用途/說明</label>
                <textarea
                  {...register("description")}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="詳細說明費用內容..."
                />
              </div>
            </div>
          </section>

          {/* 02 · 收款帳戶 */}
          {bankAccounts.length > 0 && (
            <section className="rounded-lg border border-border bg-card overflow-hidden">
              <header className="flex items-baseline gap-2 px-4 py-3 border-b border-border bg-muted/40">
                <span className="ledger-label text-primary/70">02</span>
                <h3 className="text-sm font-semibold inline-flex items-center gap-2">
                  收款帳戶
                </h3>
                <span className="ledger-label ml-auto">Payout</span>
              </header>
              <div className="divide-y divide-border">
                {bankAccounts.map((account) => (
                  <label
                    key={account.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                      selectedBankAccountId === account.id
                        ? "bg-primary/5"
                        : "hover:bg-accent/60"
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
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      selectedBankAccountId === account.id
                        ? "border-primary"
                        : "border-muted-foreground/50"
                    )}>
                      {selectedBankAccountId === account.id && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{account.bankName}</span>
                        {account.branchName && (
                          <span className="text-muted-foreground text-xs truncate">– {account.branchName}</span>
                        )}
                        {account.isDefault && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-px rounded border border-primary/40 bg-primary/10 font-mono text-[10px] font-medium text-primary shrink-0">
                            <Star className="h-2.5 w-2.5" />
                            預設
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {maskAccountNumber(account.accountNumber)} · {account.accountHolder}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* 03 · 費用明細 */}
          <section className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
              <span className="ledger-label text-primary/70">{itemsIndex}</span>
              <h3 className="text-sm font-semibold">費用明細項目</h3>
              <span className="ledger-label ml-auto mr-3 hidden sm:inline">Items</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ date: new Date(), category: "Food", customCategory: "", description: "", amount: 0, receiptUrl: null })}
              >
                <Plus className="mr-1.5 h-4 w-4" />新增項目
              </Button>
            </header>

            <div className="divide-y divide-border">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-primary/70 font-medium">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-danger"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-12">
                    <div className="md:col-span-3 space-y-1.5">
                      <label className="ledger-label">日期</label>
                      <input
                        type="date"
                        {...register(`items.${index}.date` as const)}
                        className={FIELD_INPUT_CLASS}
                      />
                    </div>

                    <div className={`${watch(`items.${index}.category`) === 'Other' ? 'md:col-span-2' : 'md:col-span-3'} space-y-1.5`}>
                      <label className="ledger-label">類別</label>
                      <select
                        {...register(`items.${index}.category` as const)}
                        className={FIELD_INPUT_CLASS}
                      >
                        {ExpenseCategoryEnum.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* 自定義類別輸入框 - 當選擇 Other 時顯示 */}
                    {watch(`items.${index}.category`) === 'Other' && (
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="ledger-label">自訂類別</label>
                        <input
                          {...register(`items.${index}.customCategory` as const)}
                          placeholder="輸入類別名稱"
                          className={FIELD_INPUT_CLASS}
                        />
                      </div>
                    )}

                    <div className={`${watch(`items.${index}.category`) === 'Other' ? 'md:col-span-5' : 'md:col-span-6'} space-y-1.5`}>
                      <label className="ledger-label">說明</label>
                      <input
                        {...register(`items.${index}.description` as const)}
                        placeholder="與客戶午餐"
                        className={FIELD_INPUT_CLASS}
                      />
                      {errors.items?.[index]?.description && (
                        <p className="text-xs text-danger">{errors.items[index]?.description?.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-3 space-y-1.5">
                      <label className="ledger-label">金額</label>
                      <div className="relative">
                        <span className="absolute left-2 top-2.5 font-mono text-xs text-muted-foreground">$</span>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.amount` as const)}
                          className={cn(FIELD_INPUT_CLASS, "pl-5 font-mono tabular-nums")}
                        />
                      </div>
                      {errors.items?.[index]?.amount && (
                        <p className="text-xs text-danger">{errors.items[index]?.amount?.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-9 flex items-center">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.items && <p className="px-4 py-2 text-sm text-danger border-t border-border">{errors.items.message}</p>}
          </section>
        </div>

        {/* ── 右欄：sticky 摘要面板 ─────────────────── */}
        <aside className="lg:sticky lg:top-16 flex flex-col gap-4">
          <section className="rounded-lg border border-border bg-card overflow-hidden">
            <header className="flex items-baseline gap-2 px-4 py-3 border-b border-border bg-muted/40">
              <span className="ledger-label text-primary/70">{summaryIndex}</span>
              <h3 className="text-sm font-semibold">摘要</h3>
              <span className="ledger-label ml-auto">Summary</span>
            </header>
            <div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">項目數</span>
                <span className="font-mono text-lg font-semibold tabular-nums">{liveCount}</span>
            </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">總金額</span>
                <span className="font-mono text-xl font-semibold tabular-nums">
                  ${liveTotal.toFixed(2)}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    "提交報帳單"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => reset()} className="w-full">
                  取消
                </Button>
                <p className="pt-1 font-mono text-[11px] text-muted-foreground text-center">
                  {"// 送出後進入審核流程，無法編輯"}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
