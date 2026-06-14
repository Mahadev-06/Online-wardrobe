
import React, { useState, useRef, useEffect } from 'react';
import { Check, Loader2, X, Edit3, Tag, Layers, AlertTriangle, UploadCloud, Trash2 } from 'lucide-react';
import { useWardrobe } from '../context/WardrobeContext';
import { ClothingItem, ClothingCategory } from '../types';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '../utils/imageHelpers';
import { analyzeClothingImage } from '../services/ai';
import CustomSelect from '../components/CustomSelect';
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

const COMMON_STYLES = [
    "Casual", "Formal", "Streetwear", "Vintage", "Minimalist",
    "Boho", "Chic", "Sporty", "Business", "Grunge", "Preppy", "Y2K"
];

const COMMON_MATERIALS = [
    "Cotton", "Polyester", "Denim", "Silk", "Wool", "Linen",
    "Leather", "Velvet", "Satin", "Knitted", "Nylon", "Rayon"
];

interface UploadItem {
    id: string;
    image: string; // Base64
    status: 'pending' | 'ready' | 'error' | 'rejected';
    data: Partial<ClothingItem>;
    rejectReason?: string;
    isExiting?: boolean;
    aiFailed?: boolean;
}

const UploadPage: React.FC = () => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addClothingItem } = useWardrobe();
  const navigate = useNavigate();
  const [inlineMessage, setInlineMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);

  const queueFull = uploads.length >= 8;

  // Auto-clear message after 3 seconds
  useEffect(() => {
    if (inlineMessage) {
        const timer = setTimeout(() => setInlineMessage(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [inlineMessage]);

  // Auto-select the first item if none selected
  useEffect(() => {
      if (uploads.length > 0 && !selectedId) {
          const firstValid = uploads.find(u => u.status !== 'rejected');
          if (firstValid) setSelectedId(firstValid.id);
      } else if (uploads.length === 0) {
          setSelectedId(null);
      }
  }, [uploads.length, selectedId]);

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    const MAX_LIMIT = 8;
    const currentCount = uploads.length;

    if (currentCount >= MAX_LIMIT) {
      setInlineMessage({text: `Upload queue is full! Save these items to add more.`, type: 'error'});
      return;
    }

    let filesToProcess = Array.from(files);
    const remainingSlots = MAX_LIMIT - currentCount;

    if (filesToProcess.length > remainingSlots) {
      setInlineMessage({text: `Bulk upload limit of 8 images reached. Only processing the first ${remainingSlots} photo(s).`, type: 'error'});
      filesToProcess = filesToProcess.slice(0, remainingSlots);
    }

    const newUploads: UploadItem[] = [];

    for (const file of filesToProcess) {
        if (file.size > 10 * 1024 * 1024) {
            setInlineMessage({text: `Skipped ${file.name}: Too large (Max 10MB)`, type: 'error'});
            continue;
        }
        try {
            const compressed = await compressImage(file, 800, 800, 0.7);
            newUploads.push({
                id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
                image: compressed,
                status: 'pending',
                data: {
                    category: ClothingCategory.TOP,
                    color: '',
                    style: '',
                    material: '',
                    description: ''
                }
            });
        } catch (err) {
            console.error(err);
            setInlineMessage({text: `Failed to process ${file.name}`, type: 'error'});
        }
    }

    if (newUploads.length === 0) return;

    setUploads(prev => [...prev, ...newUploads]);

    // Process them asynchronously
    processUploadsWithAI(newUploads);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setInlineMessage({text: "Please drop image files only!", type: 'error'});
      return;
    }
    await processFiles(imageFiles);
  };

  const handleDropzoneClick = () => {
    if (queueFull) {
      setInlineMessage({text: "Upload queue is full! Please save these items or remove some first.", type: 'error'});
      return;
    }
    fileInputRef.current?.click();
  };

  const processUploadsWithAI = async (itemsToProcess: UploadItem[]) => {
      await Promise.all(itemsToProcess.map(async (item) => {
          try {
              const aiData = await analyzeClothingImage(item.image);

              if (!aiData.is_clothing || aiData.confidence < 0.6) {
                  const rejectReason = aiData.message || 'Not recognized as clothing.';

                  // Mark as rejected in state and keep it there
                  setUploads(prev => prev.map(u => u.id === item.id ? {
                      ...u,
                      status: 'rejected',
                      rejectReason
                  } : u));
                  return;
              }

              // Update item with AI data
              const mappedCategory = Object.values(ClothingCategory).find(c => c === aiData.metadata?.category) as ClothingCategory || ClothingCategory.TOP;

              setUploads(prev => prev.map(u => u.id === item.id ? {
                  ...u,
                  status: 'ready',
                  data: {
                    ...u.data,
                    category: mappedCategory,
                    color: aiData.metadata?.color_primary || '',
                    style: (aiData.metadata?.occasion || []).join(', '),
                    material: aiData.metadata?.material || '',
                    seasonSuitability: aiData.metadata?.season || [],
                    description: `${aiData.metadata?.color_primary} ${aiData.metadata?.pattern} ${aiData.metadata?.category}`
                  }
              } : u));

          } catch (err) {
              console.error("AI Analysis Error during upload:", err);
              setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'ready', aiFailed: true } : u));
          }
      }));
  };

  const removeUpload = (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setUploads(prev => prev.filter(u => u.id !== id));
      if (selectedId === id) setSelectedId(null);
  };

  const updateItemData = (id: string, updates: Partial<ClothingItem>) => {
      setUploads(prev => prev.map(item =>
          item.id === id ? { ...item, data: { ...item.data, ...updates } } : item
      ));
  };



  const saveAllValid = () => {
      const validItems = uploads; // Relax validation since defaults are handled below

      if (validItems.length === 0) {
          setInlineMessage({text: "No items to save. Please add some photos.", type: 'error'});
          return;
      }

       validItems.forEach(item => {
          const newItem: ClothingItem = {
              id: item.id,
              image: item.image,
              category: item.data.category || ClothingCategory.TOP,
              color: item.data.color || 'Unknown',
              style: item.data.style || 'Unknown',
              material: item.data.material || 'Unknown',
              description: item.data.description || 'Uploaded item',
              seasonSuitability: item.data.seasonSuitability || [],
              dateAdded: Date.now()
          };
          addClothingItem(newItem);
      });

      setInlineMessage({text: `Saved ${validItems.length} items to closet!`, type: 'success'});
      navigate('/closet');
  };

  const selectedItem = uploads.find(u => u.id === selectedId);

  const addTag = (id: string, field: 'style' | 'material', value: string) => {
      const item = uploads.find(u => u.id === id);
      if (!item) return;

      const current = item.data[field] || '';
      if (current.toLowerCase().includes(value.toLowerCase())) return;
      const newValue = current ? `${current}, ${value}` : value;

      updateItemData(id, { [field]: newValue });
  };

  return (
    <div className="px-6 md:px-10 py-10 max-w-[1600px] mx-auto page-enter pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Upload Items</h1>
            <p className="text-gray-400 mt-1 text-sm">Add photos in bulk or one by one</p>
        </div>
        {inlineMessage && (
            <div className={`px-4 py-2 rounded-none border-2 border-[#0a0f1a] shadow-[2px_2px_0_#0a0f1a] text-sm font-medium animate-fade-in ${inlineMessage.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-p_teal/10 text-p_teal'}`}>
                {inlineMessage.text}
            </div>
        )}
        <div className="flex gap-3">
            {uploads.length > 0 && (
                <>
                    <Button
                        onClick={() => setUploads([])}
                        variant="neutral"
                    >
                        <Trash2 size={16} /> Clear All
                    </Button>
                    <Button
                        onClick={saveAllValid}
                        variant="default"
                    >
                        <Check size={16} /> Save All Valid
                    </Button>
                </>
            )}
        </div>
      </div>

      {uploads.length === 0 ? (
        <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleDropzoneClick}
            className={`w-full max-w-3xl mx-auto mt-10 border-3 border-dashed flex flex-col items-center justify-center p-20 cursor-pointer transition-all duration-300 rounded-none bg-white border-[#0a0f1a] shadow-[6px_6px_0_#FF5A50] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#FF5A50]
                ${isDragging ? 'bg-red-50/50' : ''}`}
        >
            <UploadCloud className={`w-16 h-16 text-[#FF5A50] mb-4 ${isDragging ? 'animate-bounce' : ''}`} />
            <h2 className="text-2xl font-black text-[#0a0f1a] mb-2">Drag & Drop Photos Here</h2>
            <p className="text-gray-650 text-sm font-medium">Or click to browse from your device (Max 8 photos)</p>
            <Button variant="neutral" className="mt-8 border-2 border-[#0a0f1a] text-[#0a0f1a] bg-gray-100 shadow-[3px_3px_0_#0a0f1a]">Select Files</Button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
            />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Upload Grid */}
            <div className="lg:col-span-5 space-y-6">
                {/* Mini Dropzone */}
                <div
                    onDragOver={!queueFull ? handleDragOver : undefined}
                    onDragEnter={!queueFull ? handleDragEnter : undefined}
                    onDragLeave={!queueFull ? handleDragLeave : undefined}
                    onDrop={!queueFull ? handleDrop : undefined}
                    onClick={handleDropzoneClick}
                    className={`border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 rounded-none bg-white border-[#0a0f1a] shadow-[4px_4px_0_#FF5A50] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_#FF5A50]
                        ${isDragging ? 'bg-red-50/50' : ''}
                        ${queueFull ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <UploadCloud className="text-[#FF5A50] w-8 h-8 mb-2" />
                    <p className="text-[#0a0f1a] text-sm font-bold">{queueFull ? 'Queue Full (8/8)' : 'Add More Photos'}</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        multiple
                        disabled={queueFull}
                        onChange={handleFileChange}
                    />
                </div>

                {/* Grid of Items */}
                <div className="grid grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {uploads.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => {
                                if (item.status !== 'rejected') setSelectedId(item.id);
                            }}
                            className={`group relative aspect-square rounded-none border-2 border-[#0a0f1a] overflow-hidden cursor-pointer transition-all duration-300
                                ${selectedId === item.id ? 'border-[#FF5A50] ring-2 ring-[#FF5A50] translate-x-[-1px] translate-y-[-1px] shadow-[3px_3px_0_#0a0f1a]' : 'shadow-[2px_2px_0_#0a0f1a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#0a0f1a]'}
                                ${item.status === 'rejected' ? 'opacity-50 grayscale' : ''}
                            `}
                        >
                            <img src={item.image} alt="Upload" className="w-full h-full object-cover" />

                            {/* Status Overlay */}
                            <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center pointer-events-none transition-opacity">
                                {item.status === 'pending' && (
                                    <Loader2 className="w-6 h-6 text-white animate-spin drop-shadow-md" />
                                )}
                                {item.status === 'ready' && !item.aiFailed && (
                                    <div className="absolute top-2 right-2 bg-p_teal text-white p-1 rounded-none border border-[#0a0f1a] shadow-[1.5px_1.5px_0_#0a0f1a]">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                )}
                                {item.status === 'ready' && item.aiFailed && (
                                    <div className="absolute top-2 right-2 bg-yellow-500 text-white p-1 rounded-none border border-[#0a0f1a] shadow-[1.5px_1.5px_0_#0a0f1a]">
                                        <AlertTriangle size={12} strokeWidth={3} />
                                    </div>
                                )}
                            </div>

                            {/* Rejected Overlay */}
                            {item.status === 'rejected' && (
                                <div className="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center p-2 text-center z-30">
                                    <button
                                        onClick={(e) => removeUpload(item.id, e)}
                                        className="absolute top-2 right-2 bg-white p-1 rounded-none border border-[#0a0f1a] text-[#0a0f1a] hover:bg-red-500 hover:text-white pointer-events-auto shadow-[1px_1px_0_#0a0f1a]"
                                    >
                                        <X size={12} />
                                    </button>
                                    <AlertTriangle className="w-5 h-5 text-white mb-1" />
                                    <span className="text-[9px] text-white font-bold leading-tight line-clamp-2">{item.rejectReason}</span>
                                </div>
                            )}

                            {/* Remove Button */}
                            {item.status !== 'rejected' && (
                                <button
                                    onClick={(e) => removeUpload(item.id, e)}
                                    className="absolute top-2 left-2 bg-white p-1 rounded-none border border-[#0a0f1a] text-[#0a0f1a] hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-[1.5px_1.5px_0_#0a0f1a]"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Editor */}
            <div className="lg:col-span-7">
                {selectedItem ? (
                    <div className="glass-panel p-6 md:p-8 shadow-xl">
                        <div className="flex flex-col md:flex-row gap-6 mb-8 items-center md:items-start">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-none overflow-hidden shrink-0 border-2 border-[#0a0f1a] shadow-[2px_2px_0_#0a0f1a]">
                                <img src={selectedItem.image} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 text-center md:text-left mt-4 md:mt-0">
                                <h2 className="text-xl font-black text-[#0a0f1a]">
                                    {selectedItem.status === 'pending' ? 'Analyzing...' : 'Edit Details'}
                                </h2>
                                <p className="text-sm text-gray-600 mt-1 font-medium">
                                    {selectedItem.status === 'pending' ? 'AI Processing in progress' : 'Update the AI generated tags if needed'}
                                </p>
                            </div>
                        </div>

                        {selectedItem.status === 'pending' ? (
                            <div className="py-16 flex flex-col items-center justify-center">
                                <div className="flex items-center space-x-4 mb-6">
                                    <Skeleton className="h-12 w-12 rounded-none border border-[#0a0f1a] shadow-[1px_1px_0_#0a0f1a]" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 sm:w-[250px] w-[100px] rounded-none border border-[#0a0f1a]" />
                                        <Skeleton className="h-4 sm:w-[200px] w-[100px] rounded-none border border-[#0a0f1a]" />
                                    </div>
                                </div>
                                <p className="text-gray-400 text-sm animate-pulse">Extracting fashion attributes...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {selectedItem.aiFailed && (
                                    <div className="bg-amber-50 text-[#78350f] p-4 rounded-none text-sm border-2 border-[#0a0f1a] shadow-[3px_3px_0_#0a0f1a] font-mono font-bold">
                                        AI analysis is currently unavailable. Please fill in the details manually.
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <CustomSelect
                                            label="Category"
                                            value={selectedItem.data.category || ''}
                                            onChange={(val) => updateItemData(selectedItem.id, { category: val as ClothingCategory })}
                                            options={Object.values(ClothingCategory)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-2 font-mono uppercase tracking-wider">Color</label>
                                        <input
                                            type="text"
                                            value={selectedItem.data.color}
                                            onChange={(e) => updateItemData(selectedItem.id, { color: e.target.value })}
                                            className="w-full px-4 py-3 rounded-none bg-gray-50 border-2 border-[#0a0f1a] text-sm text-[#0a0f1a] focus:bg-white focus:border-[#FF5A50] focus:shadow-[2px_2px_0_#0a0f1a] outline-none transition placeholder:text-gray-400 font-mono font-bold"
                                            placeholder="e.g. Navy Blue"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-2 font-mono uppercase tracking-wider">Style</label>
                                    <input
                                        type="text"
                                        value={selectedItem.data.style}
                                        onChange={(e) => updateItemData(selectedItem.id, { style: e.target.value })}
                                        className="w-full px-4 py-3 rounded-none bg-gray-50 border-2 border-[#0a0f1a] text-sm text-[#0a0f1a] focus:bg-white focus:border-[#FF5A50] focus:shadow-[2px_2px_0_#0a0f1a] outline-none transition placeholder:text-gray-400 font-mono font-bold mb-3"
                                        placeholder="e.g. Casual, Streetwear"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {COMMON_STYLES.map(style => (
                                            <button
                                                key={style}
                                                onClick={() => addTag(selectedItem.id, 'style', style)}
                                                className="px-3 py-1.5 text-[11px] btn-glass-secondary text-[#0a0f1a]"
                                            >
                                                + {style}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-2 font-mono uppercase tracking-wider">Material</label>
                                    <input
                                        type="text"
                                        value={selectedItem.data.material}
                                        onChange={(e) => updateItemData(selectedItem.id, { material: e.target.value })}
                                        className="w-full px-4 py-3 rounded-none bg-gray-50 border-2 border-[#0a0f1a] text-sm text-[#0a0f1a] focus:bg-white focus:border-[#FF5A50] focus:shadow-[2px_2px_0_#0a0f1a] outline-none transition placeholder:text-gray-400 font-mono font-bold mb-3"
                                        placeholder="e.g. Cotton, Denim"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {COMMON_MATERIALS.map(mat => (
                                            <button
                                                key={mat}
                                                onClick={() => addTag(selectedItem.id, 'material', mat)}
                                                className="px-3 py-1.5 text-[11px] btn-glass-secondary text-[#0a0f1a]"
                                            >
                                                + {mat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-2 font-mono uppercase tracking-wider">Description</label>
                                    <textarea
                                        value={selectedItem.data.description}
                                        onChange={(e) => updateItemData(selectedItem.id, { description: e.target.value })}
                                        className="w-full px-4 py-3 rounded-none bg-gray-50 border-2 border-[#0a0f1a] text-sm text-[#0a0f1a] focus:bg-white focus:border-[#FF5A50] focus:shadow-[2px_2px_0_#0a0f1a] outline-none transition h-24 resize-none font-mono font-bold"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed border-[#0a0f1a] rounded-none bg-white text-center shadow-[4px_4px_0_#FF5A50] p-6">
                        <Layers className="w-10 h-10 text-[#0a0f1a]/55 mb-4" />
                        <h3 className="text-lg font-black text-[#0a0f1a] mb-1">No Item Selected</h3>
                        <p className="text-gray-650 text-sm font-medium">Select an uploaded photo from the grid to edit</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
