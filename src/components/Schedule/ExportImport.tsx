"use client";

import { useRef } from "react";
import { CalendarData } from "@/types/schedule";
import { exportData, importData } from "@/utils/scheduleStorage";
import { Button } from "@/components/ui/button";
import { FileDown, FileUp } from "lucide-react";

interface ExportImportProps {
  data: CalendarData;
  onImport: (data: CalendarData) => void;
}

export function ExportImport({ data, onImport }: ExportImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportData(data);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await importData(file);
      onImport(importedData);
      alert("数据导入成功！");
    } catch (error) {
      alert(error instanceof Error ? error.message : "导入失败");
    }

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <button
        onClick={handleExport}
        className="text-xs px-2 py-1 border rounded bg-background hover:bg-muted flex items-center gap-1"
      >
        <FileDown className="h-3 w-3" />
        导出
      </button>
      
      <button
        onClick={handleImportClick}
        className="text-xs px-2 py-1 border rounded bg-background hover:bg-muted flex items-center gap-1"
      >
        <FileUp className="h-3 w-3" />
        导入
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
