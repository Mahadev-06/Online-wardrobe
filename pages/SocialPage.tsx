
import React from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { Heart, MessageCircle, Share2, Users } from 'lucide-react';

const SocialPage: React.FC = () => {
  const { sharedLooks, savedOutfits, shareLook, profile } = useWardrobe();

  const handleShare = (outfitId: string) => {
    const outfit = savedOutfits.find(o => o.id === outfitId);
    if (outfit && profile) {
        shareLook({
            id: crypto.randomUUID(),
            user: profile.name || 'Me',
            outfit: outfit,
            likes: 0,
            comments: []
        });
        alert("Shared to community!");
    }
  };

  return (
    <div className="px-6 py-10 md:px-12 md:py-14 pb-32 max-w-4xl mx-auto page-enter">
      <div className="flex justify-between items-center mb-10">
        <div>
            <h1 className="text-3xl font-black text-slate-800">Community Style</h1>
            <p className="text-slate-500 mt-1 font-medium">Discover what others are wearing</p>
        </div>
        <div className="text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-bold cursor-pointer hover:bg-indigo-100 transition flex items-center gap-2">
            <Users size={16} /> Invite Friends
        </div>
      </div>

      <div className="space-y-10">
        {sharedLooks.length === 0 && savedOutfits.length > 0 && (
            <div className="bg-indigo-50 p-10 rounded-[2rem] text-center mb-8 border border-indigo-100">
                <h3 className="font-black text-xl text-indigo-900 mb-3">Be the first to post!</h3>
                <p className="text-indigo-700/80 font-medium mb-8 max-w-sm mx-auto">Share one of your saved looks to get feedback from the community.</p>
                <div className="flex gap-4 overflow-x-auto pb-4 justify-center">
                    {savedOutfits.slice(0,3).map(o => (
                        <div key={o.id} onClick={() => handleShare(o.id)} className="w-24 h-24 bg-white rounded-2xl shadow-sm flex items-center justify-center cursor-pointer hover:scale-105 transition hover:shadow-md border border-indigo-100/50">
                             <div className="flex -space-x-3">
                                 {o.items.slice(0,2).map((i,idx) => <img key={idx} src={i.image} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"/>)}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {sharedLooks.map((look) => (
            <div key={look.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition duration-300">
                {/* Header */}
                <div className="p-6 flex items-center gap-4 border-b border-slate-50">
                    <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md">
                        {look.user[0]}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-base">{look.user}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Just now</p>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-slate-50/50 p-8 flex flex-wrap justify-center gap-6 min-h-[250px] items-center">
                    {look.outfit.items.length > 0 ? (
                        look.outfit.items.map((item, idx) => (
                            <img key={idx} src={item.image} className="h-48 w-auto object-contain drop-shadow-lg transform hover:scale-110 transition duration-500" />
                        ))
                    ) : (
                        <div className="h-40 w-full flex items-center justify-center text-slate-400 italic font-medium">Outfit Preview</div>
                    )}
                </div>

                {/* AI Feedback Simulation */}
                {look.outfit.aiFeedback && (
                    <div className="px-6 pb-2">
                        <div className="bg-indigo-50/50 p-4 rounded-xl text-sm text-slate-600 border border-indigo-100/50">
                            <span className="font-bold text-indigo-600 uppercase text-xs tracking-wider mr-2">AI Stylist Note</span> 
                            <span className="italic">"{look.outfit.aiFeedback}"</span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="p-6 flex items-center gap-8">
                    <button className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition group">
                        <Heart size={24} className="group-hover:fill-current" /> <span className="text-base font-bold">{look.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition">
                        <MessageCircle size={24} /> <span className="text-base font-bold">{look.comments.length}</span>
                    </button>
                    <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition ml-auto">
                        <Share2 size={24} />
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default SocialPage;
