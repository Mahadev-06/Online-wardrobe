
import React, { useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { ClothingCategory, ClothingItem, Outfit } from '../types';
import { Trash2, Filter, X, Eye, Calendar, Sparkles, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const ClosetPage: React.FC = () => {
  const { clothes, savedOutfits, deleteClothingItem, deleteOutfit, profile } = useWardrobe();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'items' | 'outfits'>((location.state as any)?.activeTab || 'items');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Modal State
  const [viewingOutfit, setViewingOutfit] = useState<Outfit | null>(null);
  const [outfitToDelete, setOutfitToDelete] = useState<string | null>(null);

  const filteredClothes = activeCategory === 'All' 
    ? clothes 
    : clothes.filter(item => item.category === activeCategory);

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      // Directly delete for better UX responsiveness and to avoid browser dialog issues
      deleteClothingItem(id);
  };

  const handleDeleteOutfit = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      setOutfitToDelete(id);
  };

  const confirmDelete = () => {
      if (outfitToDelete) {
          deleteOutfit(outfitToDelete);
          if (viewingOutfit?.id === outfitToDelete) {
              setViewingOutfit(null);
          }
          setOutfitToDelete(null);
      }
  };

  const renderOutfitCollage = (items: ClothingItem[]) => {
      const count = items.length;
      if (count === 0) return <div className="h-64 bg-p_light/50 rounded-2xl flex items-center justify-center text-p_brown font-medium border-2 border-dashed border-p_teal/20">Empty Outfit</div>;

      let content;
      
      if (count === 1) {
          content = (
              <div className="w-full h-full">
                  <img src={items[0].image} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" alt="Item" />
              </div>
          );
      } else if (count === 2) {
          content = (
              <div className="grid grid-cols-2 h-full w-full gap-0.5">
                  {items.map((item, i) => (
                      <div key={i} className="h-full w-full bg-white overflow-hidden">
                        <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="Item" />
                      </div>
                  ))}
              </div>
          );
      } else if (count === 3) {
          content = (
              <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-0.5">
                  <div className="row-span-2 h-full w-full bg-white overflow-hidden">
                    <img src={items[0].image} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="Item" />
                  </div>
                  <div className="h-full w-full bg-white overflow-hidden">
                    <img src={items[1].image} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="Item" />
                  </div>
                  <div className="h-full w-full bg-white overflow-hidden">
                    <img src={items[2].image} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="Item" />
                  </div>
              </div>
          );
      } else {
          // 4 or more
          content = (
              <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-0.5">
                  {items.slice(0, 4).map((item, i) => (
                      <div key={i} className="h-full w-full bg-white relative overflow-hidden group/item">
                          <img src={item.image} className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110" alt="Item" />
                          {i === 3 && count > 4 && (
                              <div className="absolute inset-0 bg-p_dark/70 flex items-center justify-center backdrop-blur-[1px]">
                                  <span className="text-white font-bold text-xl">+{count - 3}</span>
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          );
      }

      return (
          <div className="h-48 md:h-64 w-full rounded-2xl overflow-hidden border border-p_teal/10 shadow-sm bg-p_light relative group-hover:shadow-md transition-all">
              {content}
          </div>
      );
  };

  const renderOutfitModal = () => {
      if (!viewingOutfit || !profile) return null;

      const top = viewingOutfit.items.find(i => i.category === ClothingCategory.TOP || i.category === ClothingCategory.DRESS);
      const bottom = viewingOutfit.items.find(i => i.category === ClothingCategory.BOTTOM);
      const shoes = viewingOutfit.items.find(i => i.category === ClothingCategory.SHOES);
      const others = viewingOutfit.items.filter(i => 
          i.category !== ClothingCategory.TOP && 
          i.category !== ClothingCategory.DRESS && 
          i.category !== ClothingCategory.BOTTOM && 
          i.category !== ClothingCategory.SHOES
      );

      return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-p_dark/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-p_cream rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl relative border-4 border-p_dark flex flex-col max-h-[90vh]">
                  <div className="absolute top-4 right-4 z-50 flex gap-2">
                      <button 
                        onClick={(e) => {
                            e.preventDefault();
                            setOutfitToDelete(viewingOutfit.id);
                        }}
                        className="bg-white p-2 rounded-full text-p_red hover:bg-p_red hover:text-white transition-all transform hover:scale-110 shadow-md group"
                        title="Delete Outfit"
                      >
                          <Trash2 size={24} className="group-hover:rotate-12 transition-transform" />
                      </button>
                      <button 
                        onClick={() => setViewingOutfit(null)}
                        className="bg-white p-2 rounded-full hover:bg-p_dark hover:text-white transition-all transform hover:scale-110 shadow-md group"
                      >
                          <X size={24} className="group-hover:rotate-90 transition-transform" />
                      </button>
                  </div>
                  
                  <div className="p-6 md:p-8 bg-white border-b-2 border-p_dark/10 flex-shrink-0">
                      <h3 className="font-black text-lg md:text-xl text-p_dark uppercase tracking-wide">Outfit Preview</h3>
                      {viewingOutfit.aiFeedback && <p className="text-xs md:text-sm text-p_red font-medium mt-3 bg-p_red/10 p-3 rounded-xl leading-relaxed max-h-24 overflow-y-auto">{viewingOutfit.aiFeedback}</p>}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 md:p-10">
                      <div className="flex flex-col md:flex-row gap-10 h-full">
                          {/* Left Column: Items */}
                          <div className={`flex flex-col items-center gap-6 md:gap-8 ${viewingOutfit.tryOnImages ? 'md:w-1/3' : 'w-full'}`}>
                              <h4 className="text-sm font-bold text-p_brown uppercase tracking-widest w-full text-center">Selected Items</h4>
                              <div className="flex flex-col items-center gap-4 md:gap-6 w-full">
                                  {top && (
                                      <div className="w-40 h-40 md:w-48 md:h-48 bg-white rounded-3xl p-6 border-2 border-p_dark/10 shadow-sm transform hover:scale-105 transition duration-300">
                                          <img src={top.image} className="w-full h-full object-contain" alt="Top" />
                                      </div>
                                  )}
                                  <div className="flex gap-4 md:gap-6">
                                      {bottom && (
                                          <div className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-3xl p-4 border-2 border-p_dark/10 shadow-sm transform hover:scale-105 transition duration-300">
                                              <img src={bottom.image} className="w-full h-full object-contain" alt="Bottom" />
                                          </div>
                                      )}
                                      {shoes && (
                                          <div className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-3xl p-4 border-2 border-p_dark/10 shadow-sm transform hover:scale-105 transition duration-300">
                                              <img src={shoes.image} className="w-full h-full object-contain" alt="Shoes" />
                                          </div>
                                      )}
                                  </div>
                              </div>
                              {others.length > 0 && (
                                  <div className="flex gap-4 flex-wrap justify-center pt-6 border-t-2 border-p_dark/10 w-full">
                                      {others.map(item => (
                                          <div key={item.id} className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl p-3 border-2 border-p_dark/10 transform hover:scale-110 transition duration-300">
                                              <img src={item.image} className="w-full h-full object-contain" alt="Accessory" />
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>

                          {/* Right Column: Virtual Try-On Results */}
                          {viewingOutfit.tryOnImages && (
                              <div className="flex-1 border-t md:border-t-0 md:border-l border-p_dark/10 pt-8 md:pt-0 md:pl-10">
                                  <h4 className="text-sm font-bold text-p_brown uppercase tracking-widest w-full text-center mb-8 flex items-center justify-center gap-2">
                                     <User size={16} /> Generated 360° Try-On
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                                      {['front', 'left', 'right', 'back'].map(angle => {
                                          const img = viewingOutfit.tryOnImages?.[angle as keyof typeof viewingOutfit.tryOnImages];
                                          if (!img) return null;
                                          return (
                                              <div key={angle} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group relative border border-p_teal/10 aspect-[3/4] hover:scale-105 duration-300">
                                                   <img src={img} className="w-full h-full object-cover" alt={angle} />
                                                   <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-2 text-center font-bold uppercase backdrop-blur-sm">
                                                       {angle} View
                                                   </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="px-4 py-8 md:px-12 md:py-14 pb-32 min-h-screen page-enter max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4">
        <h1 className="text-3xl md:text-3xl font-black text-p_dark tracking-tight self-start">MY CLOSET</h1>
        <div className="flex w-full md:w-auto bg-white p-1 rounded-xl shadow-sm border border-p_teal/20">
            <button 
                onClick={() => setActiveTab('items')}
                className={`flex-1 md:flex-none px-6 md:px-8 py-2 md:py-3 rounded-lg text-sm font-bold transition-all transform hover:-translate-y-0.5 ${activeTab === 'items' ? 'bg-p_red text-white shadow-md' : 'text-p_brown hover:text-p_dark hover:bg-p_light'}`}
            >
                Clothes
            </button>
            <button 
                onClick={() => setActiveTab('outfits')}
                 className={`flex-1 md:flex-none px-6 md:px-8 py-2 md:py-3 rounded-lg text-sm font-bold transition-all transform hover:-translate-y-0.5 ${activeTab === 'outfits' ? 'bg-p_red text-white shadow-md' : 'text-p_brown hover:text-p_dark hover:bg-p_light'}`}
            >
                Outfits
            </button>
        </div>
      </div>

      {activeTab === 'items' ? (
        <>
            {/* Category Filter */}
            <div className="flex gap-2 md:gap-4 overflow-x-auto pb-4 md:pb-6 mb-2 md:mb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <button 
                    onClick={() => setActiveCategory('All')}
                    className={`px-4 md:px-6 py-2 md:py-3 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all border-2 transform hover:scale-105 ${activeCategory === 'All' ? 'bg-p_dark text-p_cream border-p_dark' : 'bg-white text-p_brown border-p_brown/20 hover:border-p_brown'}`}
                >
                    All Items
                </button>
                {Object.values(ClothingCategory).map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 md:px-6 py-2 md:py-3 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all border-2 transform hover:scale-105 ${activeCategory === cat ? 'bg-p_dark text-p_cream border-p_dark' : 'bg-white text-p_brown border-p_brown/20 hover:border-p_brown'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {filteredClothes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
                    <div className="bg-white p-8 md:p-10 rounded-full mb-6 md:mb-8 border-2 border-dashed border-p_teal/30">
                        <Filter className="w-10 h-10 md:w-12 md:h-12 text-p_teal" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-p_dark">No items found</h3>
                    <p className="text-sm md:text-base text-p_brown max-w-xs mt-3 font-medium">Your closet is looking a bit empty. Start by adding your favorite pieces.</p>
                    <Link to="/upload" className="mt-8 md:mt-10 px-8 md:px-10 py-3 md:py-4 bg-p_red text-white rounded-2xl hover:bg-red-500 font-bold shadow-lg btn-hover hover:scale-105 transition-transform">Add First Item</Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                    {filteredClothes.map(item => (
                        <div key={item.id} className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-p_teal/10 aspect-[3/4]">
                            {/* Image - Placed first to ensure content flow, but z-index handles stacking */}
                            <img src={item.image} alt={item.description} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            
                            {/* Enhanced Overlay with White Gradient for Dark Text Visibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-6 pointer-events-none z-10">
                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <p className="font-black text-xs md:text-sm text-p_dark">{item.color}</p>
                                    <p className="text-[10px] md:text-xs text-p_brown font-bold mt-1">{item.style}</p>
                                </div>
                            </div>

                            {/* Category Badge - High Z-Index */}
                            <div className="absolute top-3 left-3 md:top-4 md:left-4 z-20">
                                <span className="bg-p_dark/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-md uppercase tracking-wider shadow-sm">{item.category}</span>
                            </div>
                            
                            {/* Delete Button - Placed last in DOM and High Z-Index to ensure clickability */}
                            <button 
                                onClick={(e) => handleDeleteItem(e, item.id)}
                                className="absolute top-3 right-3 md:top-4 md:right-4 z-50 bg-white text-p_red p-2 md:p-2.5 rounded-full hover:bg-p_red hover:text-white transition-all shadow-lg cursor-pointer transform hover:scale-110 group/delete"
                                title="Delete Item"
                                type="button"
                            >
                                <Trash2 size={16} className="md:w-[18px] md:h-[18px] group-hover/delete:rotate-12 transition-transform" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </>
      ) : (
        /* Outfits Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {savedOutfits.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
                    <h3 className="text-2xl font-bold text-p_dark">No saved outfits</h3>
                    <Link to="/mannequin" className="mt-8 px-10 py-4 bg-p_red text-white rounded-2xl hover:bg-red-500 font-bold shadow-lg btn-hover hover:scale-105 transition-transform">Create Look</Link>
                </div>
            ) : (
                savedOutfits.map(outfit => (
                    <div 
                        key={outfit.id} 
                        className="relative bg-white rounded-[2rem] shadow-sm border border-p_teal/10 p-4 md:p-5 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group flex flex-col h-full"
                        onClick={() => setViewingOutfit(outfit)}
                    >
                        {/* Collage Grid */}
                        {renderOutfitCollage(outfit.items)}

                        <div className="mt-4 md:mt-5 flex justify-between items-end px-2">
                            <div>
                                <h3 className="font-bold text-p_dark uppercase tracking-wide text-xs md:text-sm flex items-center gap-2">
                                    <Sparkles size={14} className="text-p_red group-hover:rotate-12 transition-transform" />
                                    Outfit #{outfit.id.slice(-4)}
                                </h3>
                                <div className="flex items-center gap-2 mt-2 text-xs text-p_brown font-medium">
                                    <span className="bg-p_cream px-2 py-0.5 rounded-md">{outfit.items.length} Items</span>
                                    {outfit.date && (
                                        <span className="flex items-center gap-1 opacity-60">
                                            <Calendar size={10} /> {new Date(outfit.date).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="text-p_teal group-hover:text-p_dark transition-colors duration-300 transform group-hover:scale-110">
                                <Eye size={20} />
                            </div>
                        </div>
                        
                         {/* Delete Button - Clearly visible on top right */}
                        <button 
                            onClick={(e) => handleDeleteOutfit(e, outfit.id)}
                            className="absolute top-6 right-6 md:top-7 md:right-7 z-50 bg-white text-p_red p-2 md:p-2.5 rounded-full hover:bg-p_red hover:text-white transition-all shadow-lg border border-p_red/10 transform hover:scale-110 group/trash"
                            title="Delete Outfit"
                            type="button"
                        >
                            <Trash2 size={16} className="md:w-[18px] md:h-[18px] group-hover/trash:rotate-12 transition-transform" />
                        </button>
                    </div>
                ))
            )}
        </div>
      )}

      {viewingOutfit && renderOutfitModal()}

      {/* Delete Confirmation Modal */}
      {outfitToDelete && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-p_dark/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center border-4 border-p_cream transform scale-100 transition-all">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-inner animate-pulse">
                      <Trash2 size={32} className="md:w-[36px] md:h-[36px]" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-p_dark mb-3 tracking-tight">Delete Outfit?</h3>
                  <p className="text-p_brown font-medium mb-6 md:mb-8 leading-relaxed text-sm md:text-base">Are you sure you want to delete this outfit? This action cannot be undone.</p>
                  
                  <div className="flex gap-4">
                      <button 
                        onClick={() => setOutfitToDelete(null)}
                        className="flex-1 py-3 md:py-4 px-4 rounded-xl font-bold border-2 border-p_dark/10 text-p_dark hover:bg-p_light transition hover:scale-105"
                      >
                          No, Keep It
                      </button>
                      <button 
                        onClick={confirmDelete}
                        className="flex-1 py-3 md:py-4 px-4 rounded-xl font-bold bg-p_red text-white hover:bg-red-600 shadow-xl shadow-red-200 transition hover:scale-105"
                      >
                          Yes, Delete
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ClosetPage;
