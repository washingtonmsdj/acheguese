import React from "react";
import { useState, useEffect, useRef } from "react";
import { Search, X, User } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services";
interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
  neighborhood?: string;
  user_type?: string;
}

interface MentionInputProps {
  onMentionSelect: (profile: Profile) => void;
  selectedMentions: Profile[];
  onRemoveMention: (profileId: string) => void;
  placeholder?: string;
}

export function MentionInput({
  onMentionSelect,
  selectedMentions,
  onRemoveMention,
  placeholder = "Buscar pessoa para mencionar...",
}: MentionInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProfiles = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // ✅ SSOT - Buscar perfis por nome usando ProfileService
        const profiles = await profileService.searchProfilesByName(
          searchQuery,
          10,
        );

        // Filtrar perfis já mencionados
        const filtered = profiles.filter(
          (profile) => !selectedMentions.some((m) => m.id === profile.id),
        );
        setSearchResults(filtered);
        setShowResults(true);
      } catch (err) {
        logger.error("Error searching profiles:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchProfiles, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedMentions]);

  const handleSelectProfile = (profile: Profile) => {
    onMentionSelect(profile);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-3">
      {/* Perfis mencionados */}
      {selectedMentions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMentions.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20"
            >
              <Avatar className="w-5 h-5">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-[10px] bg-teal-500 text-white">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-teal-400">
                {profile.name}
              </span>
              <button
                onClick={() => onRemoveMention(profile.id)}
                className="hover:opacity-70 transition-opacity"
              >
                <X className="w-3 h-3 text-teal-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Campo de busca */}
      <div className="relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Resultados da busca */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-[#1E2529] border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {searchResults.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleSelectProfile(profile)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-teal-400 to-cyan-400 text-white">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {profile.name}
                  </p>
                  {profile.neighborhood && (
                    <p className="text-xs text-gray-400 truncate">
                      {profile.neighborhood}
                    </p>
                  )}
                </div>
                {profile.user_type === "business" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Empresa
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {showResults &&
          searchQuery.length >= 2 &&
          searchResults.length === 0 &&
          !isSearching && (
            <div className="absolute z-50 w-full mt-2 bg-[#1E2529] border border-white/10 rounded-lg shadow-xl p-4 text-center">
              <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nenhum profile encontrado</p>
            </div>
          )}
      </div>

      {selectedMentions.length > 0 && (
        <p className="text-xs text-gray-400">
          {selectedMentions.length}{" "}
          {selectedMentions.length === 1
            ? "pessoa mencionada"
            : "pessoas mencionadas"}
        </p>
      )}
    </div>
  );
}
