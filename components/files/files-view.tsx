"use client";

import React, { useState, useRef, DragEvent, ChangeEvent, useMemo } from 'react';
import { 
  FileText, Upload, Folder, Shield, Trash2, Eye, Download, Info, 
  Grid, List, FileSpreadsheet, FileCode2, Archive, HardDrive, Search,
  Edit3, Check, X, Image, Plus, Clock, Share2, File
} from 'lucide-react';
import { FileItem } from '@/lib/types';

interface FilesViewProps {
  files: FileItem[];
  activeFileView?: string;
  fileSearchQuery?: string;
  onSearchFile?: (query: string) => void;
  currentUserId?: string;
  currentUserName?: string;
  onUploadFile: (name: string, type: FileItem['type'], size: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile?: (fileId: string, newName: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function parseSizeToBytes(sizeStr: string): number {
  if (!sizeStr) return 0;
  const parts = sizeStr.trim().split(' ');
  const val = parseFloat(parts[0]) || 0;
  const unit = (parts[1] || 'KB').toUpperCase();
  const k = 1024;
  if (unit === 'B') return val;
  if (unit === 'KB') return val * k;
  if (unit === 'MB') return val * k * k;
  if (unit === 'GB') return val * k * k * k;
  if (unit === 'TB') return val * k * k * k * k;
  return val * k;
}

export const FilesView: React.FC<FilesViewProps> = ({ 
  files, 
  activeFileView = 'f-recents',
  fileSearchQuery = '',
  onSearchFile,
  currentUserId,
  currentUserName = 'You',
  onUploadFile, 
  onDeleteFile,
  onRenameFile 
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('list');
  const [dragOverActive, setDragOverActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Rename inline state
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileCategory = (fileName: string, rawType?: string): FileItem['type'] => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (rawType === 'pdf' || ext === 'pdf') return 'pdf';
    if (rawType === 'xls' || ['xlsx', 'csv', 'ods', 'xls'].includes(ext)) return 'xls';
    if (rawType === 'code' || ['js', 'ts', 'py', 'html', 'css', 'json', 'md', 'sql', 'yaml', 'yml', 'sh', 'xml', 'java', 'cpp', 'c'].includes(ext)) return 'code';
    if (rawType === 'doc' || ['doc', 'docx'].includes(ext)) return 'doc';
    if (rawType === 'image' || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
    if (rawType === 'zip' || ['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return 'zip';
    return 'other';
  };

  const getFileDetails = (type: string, fileName: string = '') => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (type === 'pdf' || ext === 'pdf') {
      return { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', label: 'PDF Document', icon: FileText };
    }
    if (type === 'xls' || ['xlsx', 'csv', 'ods', 'xls'].includes(ext)) {
      return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Spreadsheet', icon: FileSpreadsheet };
    }
    if (type === 'code' || ['js', 'ts', 'py', 'html', 'css', 'json', 'md', 'sql', 'yaml', 'yml', 'sh', 'xml', 'java', 'cpp', 'c'].includes(ext)) {
      return { color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', label: 'Code & Specs', icon: FileCode2 };
    }
    if (type === 'doc' || ['doc', 'docx'].includes(ext)) {
      return { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Word Document', icon: FileText };
    }
    if (type === 'image' || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Image File', icon: Image };
    }
    if (type === 'zip' || ['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
      return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Compressed Archive', icon: Archive };
    }
    return { color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', label: 'Other File', icon: File };
  };

  const processAndUploadFile = (file: File) => {
    const fileName = file.name || `document-${Date.now()}.pdf`;
    const formattedSize = formatBytes(file.size || 1024 * 100);
    const category = getFileCategory(fileName);
    onUploadFile(fileName, category, formattedSize);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      selectedFiles.forEach((file) => {
        processAndUploadFile(file);
      });
      e.target.value = '';
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverActive(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverActive(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      droppedFiles.forEach((file) => {
        processAndUploadFile(file);
      });
    } else {
      // Fallback demo file if dropped without real File data
      const sampleFiles = ['apollo-component-flowchart.pdf', 'devops-config-prod.yaml', 'layout-spacings-v2.json', 'sprint-budget.xlsx'];
      const selectedFile = sampleFiles[Math.floor(Math.random() * sampleFiles.length)];
      const category = getFileCategory(selectedFile);
      const randomSize = `${(Math.random() * 5 + 1).toFixed(1)} MB`;
      onUploadFile(selectedFile, category, randomSize);
    }
  };

  const handleDownloadFile = (file: FileItem) => {
    try {
      const blob = new Blob([
        `Apollo Teams Cloud Storage - Exported Document\nFile Name: ${file.name}\nFile Type: ${file.type}\nFile Size: ${file.size}\nUploaded By: ${file.uploadedBy}\nUploaded At: ${file.uploadedAt}`
      ], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  const startRename = (file: FileItem) => {
    setEditingFileId(file.id);
    setEditingName(file.name);
  };

  const saveRename = (fileId: string) => {
    if (editingName.trim() && onRenameFile) {
      onRenameFile(fileId, editingName.trim());
    }
    setEditingFileId(null);
  };

  // 1. Sidebar View Filtering
  const sidebarFilteredFiles = useMemo(() => {
    let list = [...files];
    if (activeFileView === 'f-my') {
      list = list.filter((f) => f.uploadedBy === currentUserName || f.uploadedBy === 'You' || f.uploadedBy === 'Admin User');
    } else if (activeFileView === 'f-teams') {
      list = list.filter((f) => f.uploadedBy !== 'You' && f.uploadedBy !== currentUserName && f.uploadedBy !== 'Admin User');
    }
    // Sort recent descending
    list.sort((a, b) => {
      const dateA = new Date(a.lastModified || a.uploadedAt || 0).getTime();
      const dateB = new Date(b.lastModified || b.uploadedAt || 0).getTime();
      return dateB - dateA;
    });
    return list;
  }, [files, activeFileView, currentUserName]);

  // 2. Category & Search Filtering
  const filteredFiles = useMemo(() => {
    return sidebarFilteredFiles.filter((f) => {
      const category = getFileCategory(f.name, f.type);
      if (filterType === 'pdf' && category !== 'pdf') return false;
      if (filterType === 'code' && category !== 'code') return false;
      if (filterType === 'xls' && category !== 'xls') return false;
      if (filterType === 'other' && category !== 'other' && category !== 'doc' && category !== 'image' && category !== 'zip') return false;

      if (fileSearchQuery && fileSearchQuery.trim() !== '') {
        const query = fileSearchQuery.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(query);
        const matchesExt = f.name.split('.').pop()?.toLowerCase().includes(query);
        const matchesUploader = f.uploadedBy.toLowerCase().includes(query);
        if (!matchesName && !matchesExt && !matchesUploader) return false;
      }
      return true;
    });
  }, [sidebarFilteredFiles, filterType, fileSearchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sidebarFilteredFiles.length, pdf: 0, code: 0, xls: 0, other: 0 };
    sidebarFilteredFiles.forEach((f) => {
      const cat = getFileCategory(f.name, f.type);
      if (cat === 'pdf') counts.pdf++;
      else if (cat === 'code') counts.code++;
      else if (cat === 'xls') counts.xls++;
      else counts.other++;
    });
    return counts;
  }, [sidebarFilteredFiles]);

  // Capacity calculation
  const capacityStats = useMemo(() => {
    const baseBytes = 34.2 * 1024 * 1024 * 1024; // 34.2 GB base usage
    const filesBytes = files.reduce((sum, f) => sum + parseSizeToBytes(f.size), 0);
    const totalUsedBytes = baseBytes + filesBytes;
    const totalCapacityBytes = 1024 * 1024 * 1024 * 1024; // 1.0 TB
    const percentUsed = Math.min(100, Math.max(0.1, (totalUsedBytes / totalCapacityBytes) * 100));
    return {
      usedFormatted: formatBytes(totalUsedBytes),
      percentUsed: percentUsed.toFixed(1),
    };
  }, [files]);

  return (
    <div 
      id="files-explorer-view" 
      className="flex-1 bg-[var(--bg-primary)] p-6 overflow-y-auto flex flex-col h-full space-y-5 select-none"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        className="hidden"
        onChange={handleFileInputChange}
      />
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              {activeFileView === 'f-my' ? 'My Cloud Drive' : activeFileView === 'f-teams' ? 'Shared Workspaces' : 'Recent Documents'}
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold">
              {filteredFiles.length} files
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">
            Teams Cloud Storage &bull; SharePoint &amp; OneDrive Synchronized
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              placeholder="Search files..."
              value={fileSearchQuery}
              onChange={(e) => onSearchFile && onSearchFile(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-gray-400 text-xs rounded-xl pl-8 pr-3 py-2 border border-[var(--border-color)] focus:outline-none focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1] transition-all"
            />
            <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-2.5 top-2.5" />
            {fileSearchQuery && (
              <button 
                onClick={() => onSearchFile && onSearchFile('')} 
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
              >
                &times;
              </button>
            )}
          </div>

          {/* Upload Document Button */}
          <button
            id="btn-upload-file-selector"
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#6366F1] text-white px-4 py-2 rounded-xl hover:bg-[#5053e1] transition-all text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-950/30 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        </div>
      </div>

      {/* Dynamic Shared Workspace Capacity Bar */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-[#6366F1] flex-shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">Shared Workspace Capacity</p>
            <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
              {capacityStats.usedFormatted} of 1.0 TB allocated used
            </p>
          </div>
        </div>

        <div className="w-full sm:w-72 flex flex-col gap-1.5 flex-shrink-0">
          <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden border border-[var(--border-color)]/50">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-[#6366F1] transition-all duration-500 ease-out rounded-full" 
              style={{ width: `${capacityStats.percentUsed}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[var(--text-secondary)] font-mono">ONEDRIVE ENTERPRISE</span>
            <span className="text-[9px] text-indigo-400 font-bold font-mono">
              {capacityStats.percentUsed}% WORKSPACE OCCUPIED
            </span>
          </div>
        </div>
      </div>

      {/* Category Tab Filters and View Toggles */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Files', count: categoryCounts.all },
            { id: 'pdf', label: 'PDFs', count: categoryCounts.pdf },
            { id: 'code', label: 'Code & Specs', count: categoryCounts.code },
            { id: 'xls', label: 'Spreadsheets', count: categoryCounts.xls },
            { id: 'other', label: 'Other', count: categoryCounts.other },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                filterType === tab.id
                  ? 'bg-[#6366F1]/15 border-[#6366F1] text-[var(--text-primary)] shadow-sm'
                  : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#1F2937]/50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                filterType === tab.id ? 'bg-[#6366F1] text-white' : 'bg-[var(--bg-tertiary)] text-gray-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button 
            onClick={() => setViewStyle('list')}
            className={`p-2 rounded-xl border transition-all ${
              viewStyle === 'list' 
                ? 'bg-[#6366F1]/15 border-[#6366F1] text-[#6366F1]' 
                : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#1F2937]/50'
            }`}
            title="List Layout"
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewStyle('grid')}
            className={`p-2 rounded-xl border transition-all ${
              viewStyle === 'grid' 
                ? 'bg-[#6366F1]/15 border-[#6366F1] text-[#6366F1]' 
                : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#1F2937]/50'
            }`}
            title="Grid Layout"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Drag-and-Drop Canvas */}
      <div 
        id="drag-and-drop-files-panel"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 rounded-2xl border flex flex-col transition-all duration-200 overflow-hidden relative ${
          dragOverActive 
            ? 'border-[#6366F1] bg-[#6366F1]/10 ring-2 ring-[#6366F1]/30 animate-pulse' 
            : 'border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm'
        }`}
      >
        {filteredFiles.length === 0 ? (
          /* Empty State ONLY when filtered length is 0 */
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none cursor-pointer group hover:bg-[#1F2937]/30 transition-all duration-200"
          >
            <div className="w-20 h-20 rounded-3xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] group-hover:border-[#6366F1]/50 flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[#6366F1] mb-5 transition-all duration-200 shadow-md">
              <Folder className="w-10 h-10" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">No documents match filter</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-xs leading-relaxed">
              Drag and drop files of any type onto this canvas or click here to upload and populate your cloud library.
            </p>
            <div className="mt-6 px-4 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] group-hover:border-[#6366F1] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2 transition-all">
              <Upload className="w-3.5 h-3.5 text-[#6366F1]" /> Click or Drop to Upload
            </div>
          </div>
        ) : viewStyle === 'list' ? (
          /* Structured Table List View */
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono bg-[var(--bg-tertiary)]/50">
                  <th className="py-3 px-5">Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/60">
                {filteredFiles.map((file) => {
                  const details = getFileDetails(file.type, file.name);
                  const Icon = details.icon;
                  const isEditing = editingFileId === file.id;

                  return (
                    <tr 
                      key={file.id} 
                      className="hover:bg-[#1F2937]/40 transition-colors group"
                    >
                      <td className="py-3 px-5 flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${details.color} flex-shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1">
                            <input
                              type="text"
                              autoFocus
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRename(file.id);
                                if (e.key === 'Escape') setEditingFileId(null);
                              }}
                              className="bg-[var(--bg-primary)] text-xs text-[var(--text-primary)] px-2.5 py-1 rounded-lg border border-[#6366F1] focus:outline-none w-full max-w-[220px]"
                            />
                            <button
                              onClick={() => saveRename(file.id)}
                              className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg hover:bg-emerald-500/25"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingFileId(null)}
                              className="p-1.5 bg-rose-500/15 text-rose-400 rounded-lg hover:bg-rose-500/25"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span 
                            onClick={() => setPreviewFile(file)}
                            className="text-xs font-bold text-[var(--text-primary)] hover:text-[#6366F1] cursor-pointer truncate max-w-[240px] transition-colors"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-2.5 py-1 rounded-full font-semibold">
                          {details.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-xs text-[var(--text-secondary)] font-mono font-medium">{file.size}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px] font-bold flex items-center justify-center border border-indigo-500/30">
                            {(file.uploadedBy || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-xs text-[var(--text-primary)] truncate max-w-[120px]">{file.uploadedBy}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                          {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Today'}
                        </span>
                      </td>

                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#1F2937] rounded-lg transition-colors"
                            title="Preview File"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => startRename(file)}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                            title="Rename File"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownloadFile(file)}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Download File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteFile(file.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 rounded-lg transition-colors"
                            title="Delete File"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid Card Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-5 overflow-y-auto">
            {filteredFiles.map((file) => {
              const details = getFileDetails(file.type, file.name);
              const Icon = details.icon;
              const isEditing = editingFileId === file.id;

              return (
                <div
                  key={file.id}
                  className="p-4 rounded-2xl bg-[var(--bg-primary)]/70 border border-[var(--border-color)] hover:border-[#6366F1]/60 transition-all group flex flex-col justify-between shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`p-3 rounded-xl border ${details.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startRename(file)}
                        className="p-1.5 text-[var(--text-secondary)] hover:text-indigo-400 hover:bg-[#1F2937] rounded-lg"
                        title="Rename"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="p-1.5 text-[var(--text-secondary)] hover:text-emerald-400 hover:bg-[#1F2937] rounded-lg"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteFile(file.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-[#1F2937] rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 my-1">
                        <input
                          type="text"
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename(file.id);
                            if (e.key === 'Escape') setEditingFileId(null);
                          }}
                          className="bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] px-2 py-1 rounded-lg border border-[#6366F1] focus:outline-none w-full"
                        />
                        <button
                          onClick={() => saveRename(file.id)}
                          className="p-1 text-emerald-400"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingFileId(null)}
                          className="p-1 text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <h4 
                        onClick={() => setPreviewFile(file)}
                        className="text-xs font-bold text-[var(--text-primary)] hover:text-[#6366F1] cursor-pointer truncate"
                        title={file.name}
                      >
                        {file.name}
                      </h4>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono">{file.size}</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Today'}
                      </span>
                    </div>
                  </div>

                  <div className="h-[1px] bg-[#374151]/40 my-3" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[var(--bg-secondary)] text-indigo-300 border border-[var(--border-color)] text-[9px] font-bold flex items-center justify-center">
                        {(file.uploadedBy || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] truncate max-w-[90px]">{file.uploadedBy}</span>
                    </div>

                    <button
                      onClick={() => setPreviewFile(file)}
                      className="bg-[var(--bg-tertiary)] hover:bg-[#2e3748] border border-[var(--border-color)] text-[var(--text-primary)] text-[10px] font-bold px-3 py-1 rounded-lg transition-all"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Drag over overlay */}
        {dragOverActive && (
          <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 z-50 animate-fadeIn">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/15 border border-[#6366F1] text-[#6366F1] flex items-center justify-center animate-bounce mb-4 shadow-xl">
              <Upload className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Drop files to instantly upload</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-sm">
              Release to automatically categorize and synchronize your files with Apollo Cloud Storage.
            </p>
          </div>
        )}
      </div>

      {/* Preview File Lightbox Modal */}
      {previewFile && (
        <div 
          id="file-lightbox-backdrop" 
          className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
        >
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden relative">
            
            <div className="h-14 border-b border-[var(--border-color)] px-5 flex items-center justify-between bg-[var(--bg-tertiary)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[400px]">{previewFile.name}</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] font-mono">{previewFile.size} &bull; Uploaded by {previewFile.uploadedBy}</p>
                </div>
              </div>
              
              <button
                onClick={() => setPreviewFile(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#1F2937] p-2 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 bg-[var(--bg-primary)] min-h-[320px] flex flex-col justify-between font-sans">
              
              {previewFile.type === 'code' ? (
                <div className="space-y-4">
                  <div className="text-xs text-[#6366F1] font-bold font-mono tracking-wider uppercase flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4" /> Developer Specification File
                  </div>
                  <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-color)] font-mono text-[11px] text-[var(--text-primary)] space-y-1.5 shadow-inner">
                    <p>{'{'}</p>
                    <p>&nbsp;&nbsp;<span className="text-indigo-300">&quot;name&quot;</span>: <span className="text-emerald-400">&quot;{previewFile.name}&quot;</span>,</p>
                    <p>&nbsp;&nbsp;<span className="text-indigo-300">&quot;type&quot;</span>: <span className="text-emerald-400">&quot;{previewFile.type}&quot;</span>,</p>
                    <p>&nbsp;&nbsp;<span className="text-indigo-300">&quot;status&quot;</span>: <span className="text-emerald-400">&quot;ACTIVE_VERIFIED&quot;</span>,</p>
                    <p>&nbsp;&nbsp;<span className="text-indigo-300">&quot;config&quot;</span>: {'{'}</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-indigo-300">&quot;theme&quot;</span>: <span className="text-emerald-400">&quot;Apollo Dark Mode&quot;</span>,</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-indigo-300">&quot;security&quot;</span>: <span className="text-emerald-400">&quot;SHA-256 Encrypted&quot;</span>,</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-indigo-300">&quot;sync&quot;</span>: <span className="text-emerald-400">&quot;SharePoint &amp; OneDrive&quot;</span></p>
                    <p>&nbsp;&nbsp;{'}'}</p>
                    <p>{'}'}</p>
                  </div>
                </div>
              ) : previewFile.type === 'pdf' ? (
                <div className="space-y-4 text-[var(--text-primary)]">
                  <div className="text-xs text-rose-400 font-bold font-mono tracking-wider uppercase flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> PDF Document Viewer
                  </div>
                  <h3 className="text-base font-bold">{previewFile.name} &ndash; Executive Summary</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    This document establishes high-availability layout standards, enterprise encryption tokens, and cloud synchronization protocols for Teams Cloud Storage. All files are encrypted at rest with SHA-256 and backed by continuous snapshot backups.
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
                      <span className="block text-[10px] text-gray-500 font-mono">STATUS</span>
                      <span className="text-xs font-bold font-mono text-emerald-400 mt-1 block">VERIFIED</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
                      <span className="block text-[10px] text-gray-500 font-mono">ENCRYPTION</span>
                      <span className="text-xs font-bold font-mono text-[var(--text-primary)] mt-1 block">SHA-256</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center">
                      <span className="block text-[10px] text-gray-500 font-mono">SYNC ENGINE</span>
                      <span className="text-xs font-bold font-mono text-[#6366F1] mt-1 block">OneDrive</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center py-8">
                  <div className="w-16 h-16 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] mx-auto shadow-md">
                    <FileText className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">{previewFile.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                      {previewFile.size} &bull; Uploaded {previewFile.uploadedAt ? new Date(previewFile.uploadedAt).toLocaleDateString() : 'recently'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-left max-w-md mx-auto text-xs text-[var(--text-secondary)]">
                    <p className="font-semibold text-[var(--text-primary)] mb-1">File Overview</p>
                    <p>This spreadsheet/document is synchronized across your active workspace. Click download below to save a copy locally.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 mt-6 border-t border-[var(--border-color)]/40">
                <span className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-500" /> SHA-256 Cloud Verified
                </span>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="bg-transparent hover:bg-[#1F2937] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleDownloadFile(previewFile);
                      setPreviewFile(null);
                    }}
                    className="bg-[#6366F1] hover:bg-[#5053e1] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/30 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
