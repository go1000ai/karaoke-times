"use client";

import { useState } from "react";

interface Props {
  generatorTab: React.ReactNode;
  savedTab: React.ReactNode;
}

const tabs = [
  { key: "generate", label: "Create Flyer", icon: "auto_awesome" },
  { key: "saved", label: "My Flyers", icon: "collections" },
] as const;

export default function FlyerTabs({ generatorTab, savedTab }: Props) {
  const [activeTab, setActiveTab] = useState<"generate" | "saved">("generate");

  return (
    <div>
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-black"
                : "text-text-muted hover:text-white"
            }`}
          >
            <span className="material-icons-round text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "generate" ? generatorTab : savedTab}
    </div>
  );
}
