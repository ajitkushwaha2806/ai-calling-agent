import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { updateRestaurantWhatsappConfig } from "@/services/frontend/restaurantService";

function RestaurantCard({ restaurant, onSave }) {
  const [inputValue, setInputValue] = useState(restaurant.whatsappChatId || "");
  const [isSaving, setIsSaving] = useState(false);

  const hasChanged = inputValue !== (restaurant.whatsappChatId || "");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(restaurant.id, inputValue);
    } catch (err) {
      alert("Failed to save setting. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md">
      <div className="relative h-32 bg-slate-100 flex items-center justify-center">
        {restaurant.thumbnail ? (
          <img src={restaurant.thumbnail} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-4xl text-slate-300">🍽️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-lg font-bold text-white truncate drop-shadow-md">{restaurant.name}</h3>
          <p className="text-sm text-slate-200 truncate">{restaurant.subzone || "No Subzone"}</p>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp Chat ID
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. 919876543210@c.us"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
          <p className="text-xs text-slate-400 mt-1.5">
            The OpenWA chat ID to send recording URLs to.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={!hasChanged || isSaving}
          className={`mt-4 w-full flex items-center justify-center py-2 px-4 rounded-lg text-sm font-bold transition-all ${hasChanged
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            hasChanged ? "Save Configuration" : "Saved"
          )}
        </button>
      </div>
    </div>
  );
}

export function RestaurantSettings({ restaurants, selectedUser }) {
  const queryClient = useQueryClient();
  const userRestaurants = restaurants.filter(r => r.userId === selectedUser);

  const handleUpdateConfig = async (id, whatsappChatId) => {
    await updateRestaurantWhatsappConfig(id, whatsappChatId);
    // Optimistically update query cache
    queryClient.setQueryData(["restaurants"], (old) => {
      return old.map(r => r.id === id ? { ...r, whatsappChatId } : r);
    });
  };

  if (userRestaurants.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No restaurants found for this account.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userRestaurants.map((restaurant) => (
          <RestaurantCard 
            key={restaurant.id} 
            restaurant={restaurant} 
            onSave={handleUpdateConfig} 
          />
        ))}
      </div>
    </div>
  );
}
