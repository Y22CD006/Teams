"use client";

import { useState, DragEvent } from 'react';
import { 
  FileText, Upload, Folder, Shield, Trash2, Eye, Download, Info, 
  Grid, List, FileSpreadsheet, FileCode2, Archive, HardDrive, Search
} from 'lucide-react';
import { FileItem } from '@/lib/types';

interface FilesViewProps {
  files: FileItem[];
  onUploadFile: (name: string, type: FileItem['type'], size: string) => void;
  onDeleteFile: (fileId: string) => void;
}

export const FilesView = ({ files, onUploadFile, onDeleteFile }: FilesViewProps) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('list');
  const [dragOverActive, setDragOverActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const getFileDetails = (type: string) => {
    switch (type) {
      case 'pdf':
        return { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', label: 'PDF Document', icon: FileText };
      case 'xls':
        return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Excel Spreadsheet', icon: FileSpreadsheet };
      case 'doc':
        return { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Word Document', icon: FileText };
      case 'code':
        return { color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', label: 'JSON Code Spec', icon: FileCode2 };
      case 'zip':
        return { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Compressed Archive', icon: Archive };
      default:
        return { color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', label: 'Generic File', icon: FileText };
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOverActive(true);
  };

  const handleDragLeave = () => {
    setDragOverActive(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOverActive(false);

    const filesUploaded = ['apollo-component-flowchart.pdf', 'devops-config-prod.yaml', 'layout-spacings-v2.json'];
    const selectedFile = filesUploaded[Math.floor(Math.random() * filesUploaded.length)];
    const ext = selectedFile.split('.').pop();
    const typeMap: Record<string, FileItem['type']> = {
      pdf: 'pdf',
      yaml: 'code',
      json: 'code',
    };
    const randomSize = `${(Math.random() * 5 + 1).toFixed(1)} MB`;

    onUploadFile(selectedFile, typeMap[ext || 'pdf'] || 'pdf', randomSize);
  };

  const handleFormUpload = () => {
    const defaultFiles = [
      { name: 'sprint-roadmap-q3.xlsx', type: 'xls' as const, size: '2.4 MB' },
      { name: 'apollo-atoms-tokens.json', type: 'code' as const, size: '84 KB' },
      { name: 'engineering-onboarding.pdf', type: 'pdf' as const, size: '4.1 MB' },
    ];
    const picked = defaultFiles[Math.floor(Math.random() * defaultFiles.length)];
    onUploadFile(picked.name, picked.type, picked.size);
  };

  const filteredFiles = files.filter((f) => {
    if (filterType === 'all') return true;
    return f.type === filterType;
  });

  return (
    <div id="files-explorer-view" className="flex-1 bg-[#0B0F19] p-5 overflow-y-auto flex flex-col h-full space-y-4">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Teams cloud storage</h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">Securely connected via SharePoint & OneDrive</p>
        </div>

        <button
          id="btn-upload-file-selector"
          onClick={handleFormUpload}
          className="bg-[#6366F1] text-white px-3.5 py-2 rounded-xl hover:bg-[#5053e1] transition-all text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-950/30 cursor-pointer"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      <div className="bg-[#111827] border border-[#374151]/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[#6366F1] flex-shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white leading-tight">Shared Workspace Capacity</p>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">34.2 GB of 1.0 TB allocated used</p>
          </div>
        </div>

        <div className="w-full sm:w-64 flex flex-col gap-1.5 flex-shrink-0">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="w-[3.4%] h-full bg-[#6366F1]" />
          </div>
          <span className="text-[9px] text-gray-500 font-bold font-mono text-right">3.4% WORKSPACE OCCUPIED</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Files' },
            { id: 'pdf', label: 'PDFs' },
            { id: 'code', label: 'Code & Specs' },
            { id: 'xls', label: 'Spreadsheets' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                filterType === tab.id
                  ? 'bg-[#1F2937] border-[#6366F1] text-white'
                  : 'bg-transparent border-[#374151] text-gray-400 hover:text-white hover:bg-[#1F2937]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button 
            onClick={() => setViewStyle('list')}
            className={`p-1.5 rounded-lg border transition-all ${
              viewStyle === 'list' 
                ? 'bg-[#1F2937] border-[#6366F1] text-[#6366F1]' 
                : 'bg-transparent border-[#374151] text-gray-400 hover:text-white'
            }`}
            title="List Layout"
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewStyle('grid')}
            className={`p-1.5 rounded-lg border transition-all ${
              viewStyle === 'grid' 
                ? 'bg-[#1F2937] border-[#6366F1] text-[#6366F1]' 
                : 'bg-transparent border-[#374151] text-gray-400 hover:text-white'
            }`}
            title="Grid Layout"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div 
        id="drag-and-drop-files-panel"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 rounded-2xl border flex flex-col transition-all overflow-hidden ${
          dragOverActive 
            ? 'border-[#6366F1] bg-[#1F2937]/30 ring-2 ring-[#6366F1]/30 animate-pulse' 
            : 'border-[#374151] bg-[#111827]'
        }`}
      >
        {filteredFiles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
            <div className="w-16 h-16 rounded-2xl bg-[#1F2937] border border-[#374151] flex items-center justify-center text-gray-400 mb-4">
              <Folder className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-semibold text-white">No documents match filter</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-[280px]">
              Drag and drop any files onto this canvas or click "Upload Document" to populate the shared cloud.
            </p>
          </div>
        ) : viewStyle === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#374151]/60 text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => {
                  const details = getFileDetails(file.type);
                  const Icon = details.icon;
                  return (
                    <tr 
                      key={file.id} 
                      className="border-b border-[#374151]/30 hover:bg-[#1F2937]/25 transition-colors group"
                    >
                      <td className="py-3 px-4 flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${details.color} flex-shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span 
                          onClick={() => setPreviewFile(file)}
                          className="text-xs font-bold text-white hover:text-[#6366F1] cursor-pointer truncate max-w-[200px]"
                        >
                          {file.name}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[10px] text-gray-400 bg-[#1F2937] border border-[#374151] px-2 py-0.5 rounded-full font-semibold">
                          {details.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-xs text-gray-400 font-mono font-medium">{file.size}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#1F2937] text-gray-300 text-[9px] font-bold flex items-center justify-center border border-[#374151]">
                            {file.uploadedBy.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-xs text-gray-300">{file.uploadedBy}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#1F2937] rounded"
                            title="Preview File"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteFile(file.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
            {filteredFiles.map((file) => {
              const details = getFileDetails(file.type);
              const Icon = details.icon;
              return (
                <div
                  key={file.id}
                  className="p-4 rounded-xl bg-[#1F2937]/35 border border-[#374151] hover:border-gray-500 transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`p-2.5 rounded-xl border ${details.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <button
                      onClick={() => onDeleteFile(file.id)}
                      className="p-1 text-gray-400 hover:text-rose-400 hover:bg-[#1F2937] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <h4 
                      onClick={() => setPreviewFile(file)}
                      className="text-xs font-bold text-white hover:text-[#6366F1] cursor-pointer truncate"
                      title={file.name}
                    >
                      {file.name}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">Size: {file.size}</p>
                  </div>

                  <div className="h-[1px] bg-[#374151]/50 my-3" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#111827] text-indigo-300 border border-[#374151] text-[9px] font-bold flex items-center justify-center">
                        {file.uploadedBy.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[10px] text-gray-400 truncate max-w-[80px]">{file.uploadedBy}</span>
                    </div>

                    <button
                      onClick={() => setPreviewFile(file)}
                      className="bg-[#1F2937] hover:bg-[#2e3748] border border-[#374151] text-gray-300 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {dragOverActive && (
          <div className="absolute inset-0 bg-[#0B0F19]/90 flex flex-col items-center justify-center text-center p-8 z-50">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-[#6366F1]/50 text-[#6366F1] flex items-center justify-center animate-bounce mb-3">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">Drop to instantly upload</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              Release to inject these documents directly into the Apollo shared cloud repository.
            </p>
          </div>
        )}
      </div>

      {previewFile && (
        <div id="file-lightbox-backdrop" className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#374151] rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden relative">
            
            <div className="h-12 border-b border-[#374151] px-4 flex items-center justify-between bg-[#1F2937]">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4.5 h-4.5 text-indigo-400" />
                <h4 className="text-xs font-bold text-white truncate max-w-[400px]">{previewFile.name}</h4>
              </div>
              
              <button
                onClick={() => setPreviewFile(null)}
                className="text-gray-400 hover:text-white hover:bg-[#111827] p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-6 bg-[#0B0F19] min-h-[300px] flex flex-col justify-between font-sans">
              
              {previewFile.type === 'code' ? (
                <div className="space-y-4">
                  <div className="text-xs text-[#6366F1] font-bold font-mono tracking-wider uppercase">JSON Code Specification</div>
                  <div className="bg-[#111827] p-4 rounded-xl border border-[#374151] font-mono text-[10px] text-gray-300 space-y-1">
                    <p>{'{'}</p>
                    <p>&nbsp;&nbsp;<span className="text-indigo-300">"theme"</span>: <span className="text-emerald-400">"Apollo Dark Mode"</span>,</p>
                    <p>&nbsp;&nbsp;<span className="text-indigo-300">"colors"</span>: {'{'}</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-indigo-300">"background"</span>: <span className="text-emerald-400">"#0B0F19"</span>,</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-indigo-300">"primary"</span>: <span className="text-emerald-400">"#111827"</span>,</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-indigo-300">"accent"</span>: <span className="text-emerald-400">"#6366F1"</span></p>
                    <p>&nbsp;&nbsp;{'}'},</p>
                    <p>&nbsp;&nbsp;<span className="text-indigo-300">"spacing"</span>: <span className="text-amber-400">"Tailwind layout grid spacing variables"</span></p>
                    <p>{'}'}</p>
                  </div>
                </div>
              ) : previewFile.type === 'pdf' ? (
                <div className="space-y-4 text-white">
                  <div className="text-xs text-rose-400 font-bold font-mono tracking-wider uppercase">Apollo Design Specification</div>
                  <h3 className="text-sm font-bold">Standard Layout Guidelines</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    This document establishes absolute layout, responsive spacing systems, and color variables for enterprise products under Apollo foundations. All cards, lists, dialog drawers, and navigation grids conform strictly to the custom dark colors.
                  </p>
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <div className="p-3 rounded-lg bg-[#111827] border border-[#374151] text-center">
                      <span className="block text-[10px] text-gray-500 font-mono">CANVAS</span>
                      <span className="text-xs font-bold font-mono text-white mt-1 block">#0B0F19</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#111827] border border-[#374151] text-center">
                      <span className="block text-[10px] text-gray-500 font-mono">PRIMARY</span>
                      <span className="text-xs font-bold font-mono text-white mt-1 block">#111827</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#111827] border border-[#374151] text-center">
                      <span className="block text-[10px] text-gray-500 font-mono">ACCENT</span>
                      <span className="text-xs font-bold font-mono text-[#6366F1] mt-1 block">#6366F1</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[#111827] flex items-center justify-center text-gray-400 mx-auto">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-xs font-bold text-white">Standard Document Preview Ready</h3>
                  <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                    Previewing text files, spreadsheets, and compressed files is simulated. Click "Download" to trigger simulated download.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#374151]/40">
                <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" /> SHA-256 Cloud Verified
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="bg-transparent hover:bg-[#1F2937] text-gray-400 hover:text-white px-3.5 py-1.5 rounded-lg border border-[#374151] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      alert(`Mock downloading ${previewFile.name}...`);
                      setPreviewFile(null);
                    }}
                    className="bg-[#6366F1] hover:bg-[#5053e1] text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
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
