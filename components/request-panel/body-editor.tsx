"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSelectedRequest } from "@/hooks/use-request";
import { useAppStore } from "@/lib/store";
import { updateRequest } from "@/hooks/use-local-db";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Code2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";
import type { RequestBody } from "@/types";
import type { editor } from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface BodyEditorProps {
  readOnly?: boolean;
}

export function BodyEditor({ readOnly = false }: BodyEditorProps) {
  const selectedRequest = useSelectedRequest();
  const { updateRequest: updateRequestStore } = useAppStore();
  const [bodyType, setBodyType] = useState<
    "json" | "form-data" | "raw" | "none"
  >("none");
  // Store content separately for each type
  const [jsonContent, setJsonContent] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [formData, setFormData] = useState<
    Array<{ key: string; value: string; enabled: boolean }>
  >([]);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set content based on body type
  const setCurrentContent = (value: string) => {
    switch (bodyType) {
      case "json":
        setJsonContent(value);
        break;
      case "raw":
        setRawContent(value);
        break;
    }
  };

  // Convert JSON to Form Data
  const jsonToFormData = (
    jsonStr: string
  ): Array<{ key: string; value: string; enabled: boolean }> => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return [];
      }
      return Object.entries(parsed).map(([key, value]) => ({
        key,
        value: String(value),
        enabled: true,
      }));
    } catch {
      return [];
    }
  };

  // Convert Form Data to JSON
  const formDataToJson = (
    formData: Array<{ key: string; value: string; enabled: boolean }>
  ): string => {
    const obj: Record<string, any> = {};
    formData
      .filter((item) => item.enabled && item.key)
      .forEach((item) => {
        // Try to parse value as number or boolean, otherwise keep as string
        const trimmedValue = item.value.trim();
        if (trimmedValue === "true") {
          obj[item.key] = true;
        } else if (trimmedValue === "false") {
          obj[item.key] = false;
        } else if (trimmedValue === "null") {
          obj[item.key] = null;
        } else if (!isNaN(Number(trimmedValue)) && trimmedValue !== "") {
          obj[item.key] = Number(trimmedValue);
        } else {
          obj[item.key] = item.value;
        }
      });
    return JSON.stringify(obj, null, 2);
  };

  useEffect(() => {
    if (selectedRequest) {
      const newBodyType = selectedRequest.body.type;
      setBodyType(newBodyType);

      // Populate content based on the current type
      if (selectedRequest.body.content) {
        if (newBodyType === "json") {
          setJsonContent(selectedRequest.body.content);
        } else if (newBodyType === "raw") {
          setRawContent(selectedRequest.body.content);
        }
      } else {
        // Clear content if switching to a type with no saved content
        if (newBodyType === "json") {
          setJsonContent("");
        } else if (newBodyType === "raw") {
          setRawContent("");
        }
      }

      setFormData(selectedRequest.body.formData || []);
    }

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [selectedRequest]);

  const handleBodyTypeChange = async (
    newType: "json" | "form-data" | "raw" | "none"
  ) => {
    if (!selectedRequest) return;

    let convertedContent: string | undefined;
    let convertedFormData:
      | Array<{ key: string; value: string; enabled: boolean }>
      | undefined;

    // Convert content based on the current type to the new type
    if (bodyType === "json" && newType === "form-data") {
      // JSON -> Form Data
      convertedFormData = jsonToFormData(jsonContent);
      // If conversion resulted in empty array, add one empty row
      if (convertedFormData.length === 0) {
        convertedFormData = [{ key: "", value: "", enabled: true }];
      }
      setFormData(convertedFormData);
    } else if (bodyType === "form-data" && newType === "json") {
      // Form Data -> JSON
      convertedContent = formDataToJson(formData);
      setJsonContent(convertedContent);
    } else if (bodyType === "json" && newType === "raw") {
      // JSON -> Raw (use JSON as-is)
      convertedContent = jsonContent;
      setRawContent(convertedContent);
    } else if (bodyType === "raw" && newType === "json") {
      // Raw -> JSON (try to parse as JSON)
      try {
        const parsed = JSON.parse(rawContent);
        convertedContent = JSON.stringify(parsed, null, 2);
        setJsonContent(convertedContent);
      } catch {
        // If not valid JSON, just use raw content
        convertedContent = rawContent;
        setJsonContent(convertedContent);
      }
    } else if (bodyType === "form-data" && newType === "raw") {
      // Form Data -> Raw (convert to JSON string)
      convertedContent = formDataToJson(formData);
      setRawContent(convertedContent);
    } else if (bodyType === "raw" && newType === "form-data") {
      // Raw -> Form Data (try to parse as JSON)
      convertedFormData = jsonToFormData(rawContent);
      // If conversion resulted in empty array, add one empty row
      if (convertedFormData.length === 0) {
        convertedFormData = [{ key: "", value: "", enabled: true }];
      }
      setFormData(convertedFormData);
    } else {
      // No conversion needed, use existing content
      if (newType === "json") {
        convertedContent = jsonContent || undefined;
      } else if (newType === "raw") {
        convertedContent = rawContent || undefined;
      } else if (newType === "form-data") {
        convertedFormData = formData.length > 0 ? formData : undefined;
      }
    }

    // Switch to new type
    setBodyType(newType);

    const body: RequestBody = {
      type: newType,
      content: convertedContent,
      formData: newType === "form-data" ? convertedFormData : undefined,
    };

    await updateRequest(selectedRequest.id, { body });
    updateRequestStore(selectedRequest.id, { body });
  };

  const handleContentChange = useCallback(
    (value: string | undefined) => {
      if (!selectedRequest) return;
      const contentValue = value || "";

      // Update the appropriate content state immediately (for UI responsiveness)
      setCurrentContent(contentValue);

      // Update store immediately for UI consistency (this is synchronous and shouldn't cause cursor issues)
      const body: RequestBody = {
        type: bodyType,
        content: contentValue,
        formData: bodyType === "form-data" ? formData : undefined,
      };
      updateRequestStore(selectedRequest.id, { body });

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce database save to prevent cursor jumping
      // Only save to DB after user stops typing for 500ms
      saveTimeoutRef.current = setTimeout(async () => {
        if (selectedRequest) {
          await updateRequest(selectedRequest.id, { body });
        }
        saveTimeoutRef.current = null;
      }, 500);
    },
    [selectedRequest, bodyType, formData]
  );

  const handleFormDataChange = async (
    index: number,
    field: "key" | "value" | "enabled",
    value: string | boolean
  ) => {
    if (!selectedRequest) return;
    const newFormData = [...formData];
    newFormData[index] = { ...newFormData[index], [field]: value };
    setFormData(newFormData);

    const body: RequestBody = {
      type: "form-data",
      formData: newFormData,
    };

    await updateRequest(selectedRequest.id, { body });
    updateRequestStore(selectedRequest.id, { body });
  };

  const handleAddFormData = () => {
    setFormData([...formData, { key: "", value: "", enabled: true }]);
  };

  const handleRemoveFormData = async (index: number) => {
    const newFormData = formData.filter((_, i) => i !== index);
    setFormData(newFormData);
    if (selectedRequest) {
      const body: RequestBody = {
        type: "form-data",
        formData: newFormData,
      };
      await updateRequest(selectedRequest.id, { body });
      updateRequestStore(selectedRequest.id, { body });
    }
  };

  const handleFormatJson = async () => {
    if (!selectedRequest || bodyType !== "json" || !jsonContent) return;

    try {
      const parsed = JSON.parse(jsonContent);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonContent(formatted);

      const body: RequestBody = {
        type: "json",
        content: formatted,
      };
      await updateRequest(selectedRequest.id, { body });
      updateRequestStore(selectedRequest.id, { body });
    } catch (error) {
      // Invalid JSON, can't format
      console.error("Invalid JSON:", error);
    }
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  if (!selectedRequest) return null;

  return (
    <div className="flex flex-col h-full p-4 min-h-0">
      <div className="mb-4 shrink-0 flex items-center justify-between">
        <Select
          value={bodyType}
          onValueChange={(value) =>
            handleBodyTypeChange(value as typeof bodyType)
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="form-data">Form Data</SelectItem>
            <SelectItem value="raw">Raw</SelectItem>
          </SelectContent>
        </Select>
        {bodyType === "json" && jsonContent && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleFormatJson}
            className="gap-2"
          >
            <Code2 className="h-4 w-4" />
            Format JSON
          </Button>
        )}
      </div>

      {bodyType === "none" && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No body for this request
        </div>
      )}

      {bodyType === "json" && (
        <div className="flex-1 border rounded-md overflow-hidden min-h-0 bg-[#1e1e1e]">
          <MonacoEditor
            key={`json-${selectedRequest.id}`}
            height="100%"
            language="json"
            value={jsonContent}
            onChange={handleContentChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            keepCurrentModel={true}
            options={{
              minimap: { enabled: false },
              fontSize: 16,
              lineHeight: 24,
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
              fontWeight: "400",
              wordWrap: "on",
              lineNumbers: "on",
              lineNumbersMinChars: 3,
              renderLineHighlight: "all",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              formatOnPaste: false,
              formatOnType: false,
              suggestOnTriggerCharacters: true,
              autoIndent: "none",
              acceptSuggestionOnEnter: "on",
              quickSuggestions: true,
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              colorDecorators: true,
              matchBrackets: "always",
              renderWhitespace: "selection",
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>
      )}

      {bodyType === "raw" && (
        <div className="flex-1 border rounded-md overflow-hidden min-h-0 bg-[#1e1e1e]">
          <MonacoEditor
            key={`raw-${selectedRequest.id}`}
            height="100%"
            language="text"
            value={rawContent}
            onChange={handleContentChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            keepCurrentModel={true}
            options={{
              minimap: { enabled: false },
              fontSize: 16,
              lineHeight: 24,
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
              fontWeight: "400",
              wordWrap: "on",
              lineNumbers: "on",
              lineNumbersMinChars: 3,
              renderLineHighlight: "all",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>
      )}

      {bodyType === "form-data" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="font-medium">Form Data</h3>
            <Button variant="outline" size="sm" onClick={handleAddFormData}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-4">
              {formData.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Key"
                    value={item.key}
                    onChange={(e) =>
                      handleFormDataChange(index, "key", e.target.value)
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={item.value}
                    onChange={(e) =>
                      handleFormDataChange(index, "value", e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFormData(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
