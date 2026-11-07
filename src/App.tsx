import React, { useState } from 'react';
import { Gamepad2, Package, Sparkles, Scan, Download } from 'lucide-react';
import { FruitCutterGame } from './components/FruitCutterGame';
import { ApkBuilderHub } from './components/ApkBuilderHub';
import { AiImageStudio } from './components/AiImageStudio';
import { AiImageAnalyzer } from './components/AiImageAnalyzer';
import { generateFullAndroidProjectZip } from './utils/apkProjectGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'game' | 'apk' | 'image-gen' | 'image-analyze'>('game');
  const [customFruit, setCustomFruit] = useState<any | null>(null);
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);

  const handleDownloadZipDirect = async () => {
    try {
      setIsDownloadingZip(true);
      const zipBlob = await generateFullAndroidProjectZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'FruitCutter-Complete-Android-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('game')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
              🍉
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-wide">قاطع الفواكه</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  com.mfth.fruitcutter
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                استوديو اللعبة ومولد حزم APK للأندرويد
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('game')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'game'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>اللعبة التفاعلية</span>
            </button>

            <button
              onClick={() => setActiveTab('apk')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'apk'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>بناء APK والدليل</span>
            </button>

            <button
              onClick={() => setActiveTab('image-gen')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'image-gen'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>إنشاء وتعديل الصور</span>
            </button>

            <button
              onClick={() => setActiveTab('image-analyze')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'image-analyze'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scan className="w-4 h-4" />
              <span>تحليل الصور</span>
            </button>
          </div>

          {/* Direct APK Package Download Button */}
          <button
            onClick={handleDownloadZipDirect}
            disabled={isDownloadingZip}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            title="تحميل مشروع الأندرويد الكامل كملف ZIP"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloadingZip ? 'جاري التحميل...' : 'تحميل مشروع APK (ZIP)'}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {activeTab === 'game' && (
          <div className="space-y-6">
            <FruitCutterGame
              customFruit={customFruit}
              customBackground={customBackground}
            />

            {/* Quick Helper below game */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setActiveTab('apk')}
                className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 cursor-pointer transition-all hover:border-amber-500/40 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      تحويل اللعبة إلى تطبيق APK
                    </h4>
                    <p className="text-xs text-slate-400">
                      حمّل المشروع الكامل الجاهز للبناء على GitHub أو Android Studio.
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('image-gen')}
                className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 cursor-pointer transition-all hover:border-purple-500/40 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      تصميم وتعديل صور الفواكه
                    </h4>
                    <p className="text-xs text-slate-400">
                      توليد صور بجودة 1K-4K بواسطة gemini-nano-banana-2.1.
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('image-analyze')}
                className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 cursor-pointer transition-all hover:border-cyan-500/40 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
                    <Scan className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      فحص وتحليل الصور
                    </h4>
                    <p className="text-xs text-slate-400">
                      تحليل الفواكه وتحويلها لعناصر حقيقية باللعبة عبر gemini-4-argon.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'apk' && <ApkBuilderHub />}

        {activeTab === 'image-gen' && (
          <AiImageStudio
            onApplyBackground={(bgUrl) => {
              setCustomBackground(bgUrl);
              setActiveTab('game');
            }}
          />
        )}

        {activeTab === 'image-analyze' && (
          <AiImageAnalyzer
            onAddCustomFruit={(fruit) => {
              setCustomFruit(fruit);
              setActiveTab('game');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        قاطع الفواكه • تطبيق أندرويد مجهز بنظام AdMob مع خط Cairo ومولد حزم APK سحابياً
      </footer>
    </div>
  );
}
