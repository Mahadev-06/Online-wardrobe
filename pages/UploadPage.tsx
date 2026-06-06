
import React, { useState, useRef, useEffect } from 'react';
import { Check, Loader2, X, Edit3, Tag, Layers, AlertTriangle, UploadCloud, Trash2 } from 'lucide-react';
import { useWardrobe } from '../context/WardrobeContext';
import { ClothingItem, ClothingCategory } from '../types';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '../utils/imageHelpers';
import { analyzeClothingImage } from '../services/ai';
import CustomSelect from '../components/CustomSelect';

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
      for (const item of itemsToProcess) {
          try {
              const aiData = await analyzeClothingImage(item.image);
              
              if (!aiData.is_clothing || aiData.confidence < 0.6) {
                  const rejectReason = aiData.message || 'Not recognized as clothing.';
                  
                  // Mark as rejected in state
                  setUploads(prev => prev.map(u => u.id === item.id ? { 
                      ...u, 
                      status: 'rejected',
                      rejectReason
                  } : u));
                  
                  // Wait 1.5 seconds for user to see the rejection feedback
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  
                  // Trigger exit animation
                  setUploads(prev => prev.map(u => u.id === item.id ? { 
                      ...u, 
                      isExiting: true 
                  } : u));
                  
                  // Wait 300ms for exit animation to complete
                  await new Promise(resolve => setTimeout(resolve, 300));
                  
                  // Remove from uploads
                  setUploads(prev => prev.filter(u => u.id !== item.id));
                  setSelectedId(prev => prev === item.id ? null : prev);
                  continue;
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
                    description: `${aiData.metadata?.color_primary} ${aiData.metadata?.pattern} ${aiData.metadata?.category}`
                  } 
              } : u));

          } catch (err) {
              setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'ready' } : u));
          }
      }
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
    <div className="px-4 py-6 md:px-12 md:py-14 pb-8 md:pb-14 max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">UPLOAD ITEMS</h1>
            <p className="text-gray-400 mt-2 font-medium">Add photos in bulk or one by one</p>
        </div>
        {inlineMessage && (
            <div className={`px-4 py-2 rounded-xl text-sm font-bold animate-fade-in ${inlineMessage.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-p_teal/20 text-p_teal border border-p_teal/30'}`}>
                {inlineMessage.text}
            </div>
        )}
        <div className="flex gap-3">
            {uploads.length > 0 && (
                <>
                    <button 
                        onClick={() => setUploads([])}
                        className="px-4 py-2 btn-glass-secondary border border-white/10 text-gray-400 font-bold hover:text-white rounded-xl transition-all shadow-sm flex items-center gap-2"
                    >
                        <Trash2 size={18} /> Clear All
                    </button>
                    <button 
                        onClick={saveAllValid}
                        className="px-6 py-3 btn-glass-primary text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 flex items-center gap-2"
                    >
                        <Check size={20} /> Save All Valid
                    </button>
                </>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Upload Grid */}
        <div className="lg:col-span-5 space-y-6">
            {/* Dropzone */}
            <div 
                onDragOver={!queueFull ? handleDragOver : undefined}
                onDragEnter={!queueFull ? handleDragEnter : undefined}
                onDragLeave={!queueFull ? handleDragLeave : undefined}
                onDrop={!queueFull ? handleDrop : undefined}
                className={`border border-dashed rounded-[2.5rem] transition-all duration-500 cursor-pointer group relative overflow-hidden backdrop-blur-md shadow-sm
                    ${isDragging ? 'animate-drag-pulse border-p_teal bg-p_teal/5 scale-[1.015]' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'} 
                    ${queueFull ? 'bg-white/5 border-white/5 opacity-70 cursor-not-allowed' : ''}
                    ${!queueFull && uploads.length === 0 
                        ? 'h-64 flex flex-col items-center justify-center' 
                        : 'h-32 flex items-center justify-center'
                    }`}
                onClick={handleDropzoneClick}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-p_teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                
                <div className="flex flex-col items-center text-center p-6 pointer-events-none relative z-10">
                    {queueFull ? (
                        <>
                            <AlertTriangle className="text-gray-400 w-10 h-10 mb-3 group-hover:scale-110 transition-transform duration-300" />
                            <p className="text-white font-black text-xl tracking-tight">Queue Full (8/8)</p>
                            <p className="text-gray-400 text-sm mt-1 font-medium">Save these items to add more</p>
                        </>
                    ) : isDragging ? (
                        <>
                            <UploadCloud className="text-p_teal w-12 h-12 mb-3 animate-bounce" />
                            <p className="text-p_teal font-black text-xl">Drop Photos Here!</p>
                            <p className="text-gray-400 text-sm mt-1">Release to add to wardrobe</p>
                        </>
                    ) : (
                        <>
                            <UploadCloud className={`text-p_teal w-10 h-10 mb-3 group-hover:scale-110 transition-transform duration-300 ${uploads.length > 0 ? 'scale-75' : ''}`} />
                            {uploads.length === 0 ? (
                                <>
                                    <p className="text-white font-black text-xl tracking-tight">Add or Drag Photos</p>
                                    <p className="text-gray-400 text-sm mt-1 font-medium">Support bulk upload (max 8)</p>
                                </>
                            ) : (
                                <p className="text-white font-bold tracking-wide">Add More Photos ({uploads.length}/8)</p>
                            )}
                        </>
                    )}
                </div>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {uploads.map((item) => (
                    <div 
                        key={item.id}
                        onClick={() => {
                            if (item.status !== 'rejected') {
                                setSelectedId(item.id);
                            }
                        }}
                        className={`group relative aspect-square rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-300 shadow-sm
                            ${selectedId === item.id ? 'ring-2 ring-p_teal ring-offset-2 ring-offset-[#0a0f12]' : 'hover:ring-2 hover:ring-white/20 hover:ring-offset-2 hover:ring-offset-[#0a0f12]'} 
                            ${item.status === 'error' ? 'opacity-70 grayscale' : ''}
                            ${item.status === 'pending' ? 'animate-laser-scan border-p_teal/40' : ''}
                            ${item.status === 'rejected' ? 'animate-reject-shake ring-2 ring-p_red ring-offset-2 ring-offset-[#0a0f12] bg-p_red/5' : ''}
                            ${item.isExiting ? 'upload-card-exit' : ''}
                        `}
                    >
                        <img src={item.image} alt="Upload" className={`w-full h-full object-cover transition-all duration-300 ${item.status === 'rejected' ? 'brightness-50 grayscale' : ''}`} />
                        
                        {/* Status Overlay */}
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                            {item.status === 'pending' && (
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-xs">
                                    <Loader2 className="w-8 h-8 text-white animate-spin mb-1" />
                                    <span className="text-[10px] text-white font-bold tracking-wider uppercase bg-p_dark/80 px-2 py-0.5 rounded-full">Analyzing...</span>
                                </div>
                            )}
                            {item.status === 'ready' && (
                                <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-sm">
                                    <Check size={12} strokeWidth={3} />
                                </div>
                            )}
                            {item.status === 'rejected' && (
                                <div className="absolute inset-0 bg-p_red/85 flex flex-col items-center justify-center p-2 text-center backdrop-blur-xs">
                                    <AlertTriangle className="w-8 h-8 text-white animate-bounce mb-1" />
                                    <span className="text-[10px] text-white font-black tracking-wide uppercase">Not Clothing</span>
                                    <span className="text-[9px] text-white/95 mt-1 line-clamp-2 leading-tight px-1 font-medium">{item.rejectReason}</span>
                                </div>
                            )}
                        </div>

                        {/* Remove Button */}
                        {item.status !== 'rejected' && (
                            <button 
                                onClick={(e) => removeUpload(item.id, e)}
                                className="absolute top-2 left-2 bg-gray-800/80 p-1.5 rounded-full text-white border border-white/10 hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                            >
                                X
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Right Column: Editor */}
        <div className="lg:col-span-7">
            {selectedItem ? (
                <div className="glass-panel p-6 md:p-8 relative animate-fade-in shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/10 group/form">
                    <div className="absolute inset-0 bg-gradient-to-br from-p_teal/5 to-transparent opacity-0 group-hover/form:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[2rem]"></div>
                    
                    <div className="flex flex-col md:flex-row gap-6 mb-8 relative z-10">
                        <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] overflow-hidden shrink-0 border border-white/10 shadow-sm bg-white/5 p-2">
                            <img src={selectedItem.image} className="w-full h-full object-cover rounded-2xl" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">
                                        {selectedItem.status === 'pending' 
                                            ? 'ANALYZING...' 
                                            : selectedItem.status === 'rejected' 
                                                ? 'REJECTED' 
                                                : 'EDIT DETAILS'}
                                    </h2>
                                    <p className="text-sm text-gray-400 font-medium mt-1">
                                        {selectedItem.status === 'pending' 
                                            ? 'AI Processing' 
                                            : selectedItem.status === 'rejected' 
                                                ? 'Invalid Clothing Item' 
                                                : 'Manual Entry'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {selectedItem.status === 'pending' ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center bg-white/5 border border-dashed border-p_teal/30 rounded-3xl p-6 relative z-10 shadow-inner">
                            <Loader2 className="w-12 h-12 text-p_teal animate-spin mb-4" />
                            <h3 className="text-xl font-black text-white tracking-wide uppercase">AI ANALYZING ITEM...</h3>
                            <p className="text-gray-400 text-sm mt-2 max-w-sm font-medium">
                                Please wait while our fashion AI determines the category, color, material, and suitability.
                            </p>
                        </div>
                    ) : selectedItem.status === 'rejected' ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center bg-red-500/10 border border-dashed border-red-500/30 rounded-3xl p-6 animate-pulse relative z-10 shadow-inner">
                            <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
                            <h3 className="text-xl font-black text-red-400 tracking-wide uppercase">REJECTED: NOT CLOTHING</h3>
                            <p className="text-gray-400 text-sm mt-2 max-w-sm font-medium">
                                {selectedItem.rejectReason || "This image doesn't appear to be a clothing item and will be removed."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6 relative z-10">
                            {/* Form Fields */}
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
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Color</label>
                                    <input 
                                        type="text"
                                        value={selectedItem.data.color}
                                        onChange={(e) => updateItemData(selectedItem.id, { color: e.target.value })}
                                        className="w-full p-4 rounded-2xl glass-input border border-white/10 font-bold text-white focus:border-p_teal outline-none transition-colors hover:bg-white/5"
                                        placeholder="e.g. Navy Blue"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Style</label>
                                <input 
                                    type="text"
                                    value={selectedItem.data.style}
                                    onChange={(e) => updateItemData(selectedItem.id, { style: e.target.value })}
                                    className="w-full p-4 rounded-2xl glass-input border border-white/10 font-bold text-white focus:border-p_teal outline-none mb-3 transition-colors hover:bg-white/5"
                                    placeholder="e.g. Casual, Streetwear"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {COMMON_STYLES.map(style => (
                                        <button
                                            key={style}
                                            onClick={() => addTag(selectedItem.id, 'style', style)}
                                            className="px-3 py-1.5 text-xs font-bold btn-glass-secondary rounded-xl transition-all shadow-sm hover:text-white"
                                        >
                                            + {style}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Material</label>
                                <input 
                                    type="text"
                                    value={selectedItem.data.material}
                                    onChange={(e) => updateItemData(selectedItem.id, { material: e.target.value })}
                                    className="w-full p-4 rounded-2xl glass-input border border-white/10 font-bold text-white focus:border-p_teal outline-none mb-3 transition-colors hover:bg-white/5"
                                    placeholder="e.g. Cotton, Denim"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {COMMON_MATERIALS.map(mat => (
                                        <button
                                            key={mat}
                                            onClick={() => addTag(selectedItem.id, 'material', mat)}
                                            className="px-3 py-1.5 text-xs font-bold btn-glass-secondary rounded-xl transition-all shadow-sm hover:text-white"
                                        >
                                            + {mat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                                <textarea 
                                    value={selectedItem.data.description}
                                    onChange={(e) => updateItemData(selectedItem.id, { description: e.target.value })}
                                    className="w-full p-4 rounded-2xl glass-input border border-white/10 font-medium text-white focus:border-p_teal outline-none h-28 resize-none transition-colors hover:bg-white/5"
                                />
                            </div>
                        </div>
                    )}

                </div>
            ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border border-white/10 shadow-2xl rounded-[2.5rem] bg-white/5 backdrop-blur-2xl group cursor-default">
                    <Edit3 className="w-12 h-12 text-gray-400 mb-6 group-hover:scale-110 group-hover:text-p_teal transition-all duration-300" />
                    <h3 className="text-2xl font-bold text-white tracking-tight">No Item Selected</h3>
                    <p className="text-gray-400 mt-3 max-w-sm font-medium leading-relaxed">Select an image from the grid to edit its details or view analysis results.</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default UploadPage;
