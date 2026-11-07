import React, { useState } from 'react';
import { Scan, Upload, Sparkles, RefreshCw, PlusCircle, CheckCircle, Lightbulb } from 'lucide-react';

interface Props {
  onAddCustomFruit?: (fruit: {
    id: string;
    name: string;
    color: string;
    innerColor: string;
    radius: number;
    points: number;
    emoji: string;
  }) => void;
}

const SAMPLE_IMAGES = [
  {
    name: 'أناناس استوائي',
    url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80',
    prompt: 'حلل هذه الفاكهة وحدد خصائصها في لعبة تقطيع الفواكه.',
  },
  {
    name: 'رمان ياقوتي ناضج',
    url: 'https://images.unsplash.com/photo-1541344999736-83eca872f240?w=400&q=80',
    prompt: 'ما هي مواصفات هذه الفاكهة إذا أضيفت كلعبة فواكه؟',
  },
  {
    name: 'كيوي ذهبي مقطوع',
    url: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=400&q=80',
    prompt: 'حلل تركيبة هذه الفاكهة وصعوبة تقطيعها بالسيف.',
  },
];

export const AiImageAnalyzer: React.FC<Props> = ({ onAddCustomFruit }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>(
    'حلل هذه الصورة بالتفصيل وحدد: نوع الفاكهة، نضارتها، مقترح النقاط في اللعبة، سرعة حركتها، ولون العصير المتطاير منها.'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setAnalysisResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = async (sample: typeof SAMPLE_IMAGES[0]) => {
    try {
      setLoading(true);
      setError(null);
      // Fetch sample and convert to base64
      const response = await fetch(sample.url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setCustomPrompt(sample.prompt);
        setAnalysisResult(null);
        setLoading(false);
      };
      reader.readAsDataURL(blob);
    } catch {
      setLoading(false);
      setError('تعذر تحميل العينة. يرجى رفع صورة من جهازك.');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('الرجاء اختيار أو رفع صورة للتحليل أولاً.');
      return;
    }

    setLoading(true);
    setError(null);
    setAddedSuccess(false);

    try {
      const res = await fetch('/api/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          prompt: customPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'فشل في تحليل الصورة.');
      }

      setAnalysisResult(data.analysis);
      setModelUsed(data.modelUsed || 'gemini-4-argon');
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء الاتصال بنموذج gemini-4-argon.');
    } finally {
      setLoading(false);
    }
  };

  const handleInjectIntoGame = () => {
    if (!onAddCustomFruit) return;

    // Create a special fruit based on the analyzed item
    const customId = `custom_${Date.now()}`;
    const newFruit = {
      id: customId,
      name: 'فاكهة الذكاء الاصطناعي',
      color: '#8b5cf6',
      innerColor: '#c084fc',
      radius: 40,
      points: 75,
      emoji: '✨',
    };

    onAddCustomFruit(newFruit);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400">
            <Scan className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              محلل الصور الذكي وفحص الفواكه (gemini-4-argon)
            </h3>
            <p className="text-xs text-slate-400">
              ارفع صورة أي فاكهة حقيقية أو عنصر، ودع الذكاء الاصطناعي يحللها ويحولها لمواصفات حقيقية داخل اللعبة!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            {/* Image Preview / Dropzone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                الصورة المراد تحليلها:
              </label>

              {selectedImage ? (
                <div className="relative group rounded-2xl overflow-hidden border border-slate-700 h-52 bg-slate-950 flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Target"
                    className="h-full w-full object-contain p-2"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setAnalysisResult(null);
                    }}
                    className="absolute top-2 left-2 px-3 py-1 bg-rose-500/80 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    تغيير الصورة
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors bg-slate-950/50">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-slate-200 font-bold block">
                      اضغط لاختيار صورة فاكهة من جهازك
                    </span>
                    <span className="text-[11px] text-slate-500">JPG, PNG, WebP</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Quick Samples */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400 font-medium">أو جرب عينة جاهزة:</span>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_IMAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-medium transition-colors text-center truncate"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Instruction */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                توجيهات التحليل المطلوبة:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading || !selectedImage}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>يقوم gemini-4-argon بفحص الصورة...</span>
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4" />
                  <span>تحليل الصورة وفحص العناصر</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex-1 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>نتائج التحليل من نموذج الذكاء الاصطناعي:</span>
                </span>
                {modelUsed && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {modelUsed}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="min-h-[280px] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center animate-bounce">
                    <Scan className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-white">
                    جاري التحليل المعمق عبر <span className="text-cyan-400">gemini-4-argon</span>...
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    يقوم النموذج بفحص ملامح الفاكهة، تشبع الألوان، تقدير الصلابة، وحساب النقاط المقترحة لها.
                  </p>
                </div>
              ) : analysisResult ? (
                <div className="min-h-[280px] max-h-[420px] overflow-y-auto p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {analysisResult}
                </div>
              ) : (
                <div className="min-h-[280px] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-2 text-slate-500">
                  <Lightbulb className="w-10 h-10 stroke-1" />
                  <p className="text-xs text-slate-400">
                    ارفع صورة واضغط على «تحليل الصورة» لعرض التقرير الشامل هنا.
                  </p>
                </div>
              )}
            </div>

            {/* Action to inject fruit into the game */}
            {analysisResult && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  هل أعجبك هذا العنصر؟ أضفه للعبة الآن ليظهر مع الفواكه الطائرة!
                </div>
                <button
                  onClick={handleInjectIntoGame}
                  className="py-2.5 px-4 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold text-xs flex items-center gap-2 transition-colors"
                >
                  {addedSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-purple-400" />
                      <span>تمت الإضافة بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>إضافة الفاكهة للعبة (+75 نقطة)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
