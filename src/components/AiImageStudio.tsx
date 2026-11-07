import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Wand2, Download, RefreshCw, Upload, Check } from 'lucide-react';

interface Props {
  onApplyBackground?: (imageUrl: string) => void;
}

const PRESET_PROMPTS = [
  'أيقونة كرتونية لامعة ثلاثية الأبعاد للعبة قاطع الفواكه بطيخ مقطوع ونصف برتقالة على خلفية خضراء',
  'بطيخة طازجة نضرة مشقوقة إلى نصفين مع قطرات عصير حمراء متناثرة في الهواء ثلاثية الأبعاد فائقة الدقة',
  'سيف ساموراي كاتانا أسطوري مشتعل بالنار الزرقاء اللامعة مع تأثيرات شرار وبريق',
  'طاولة تقطيع خشبية دوجو يابانية فاخرة مع سكين حاد وتأثيرات إضاءة سينمائية للعبة',
  'فاكهة أناناس غريبة ثلاثية الأبعاد بتفاصيل ذهبية مشعة ومؤثرات خيالية',
];

export const AiImageStudio: React.FC<Props> = ({ onApplyBackground }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [imageSize, setImageSize] = useState<string>('1K');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [appliedBg, setAppliedBg] = useState<boolean>(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setBaseImage(reader.result as string);
      setIsEditMode(true);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateOrEdit = async () => {
    if (!prompt.trim() && !baseImage) {
      setError('الرجاء إدخال وصف للصورة أو رفع صورة للتعديل.');
      return;
    }

    setLoading(true);
    setError(null);
    setAppliedBg(false);

    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          baseImage: isEditMode ? baseImage : undefined,
          aspectRatio,
          imageSize,
          isEdit: isEditMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'فشل في إنشاء الصورة.');
      }

      setGeneratedImage(data.imageUrl);
      setGeneratedText(data.text);
      setModelUsed(data.modelUsed || 'gemini-nano-banana-2.1');
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء الاتصال بنموذج الذكاء الاصطناعي.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `fruit-cutter-ai-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleApplyAsBackground = () => {
    if (!generatedImage || !onApplyBackground) return;
    onApplyBackground(generatedImage);
    setAppliedBg(true);
    setTimeout(() => setAppliedBg(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              استوديو إنشاء وتعديل الصور بالذكاء الاصطناعي (gemini-nano-banana-2.1)
            </h3>
            <p className="text-xs text-slate-400">
              صمم أو عدّل فواكه مخصصة، شفرات سيوف، أيقونات للعبة، أو خلفيات طاولة التقطيع بدقة فائقة!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            {/* Mode Selector */}
            <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  !isEditMode
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                إنشاء صورة جديدة من نص
              </button>
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  isEditMode
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                تعديل صورة موجودة
              </button>
            </div>

            {/* If Edit Mode: Upload Image */}
            {isEditMode && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  ارفع الصورة المراد تعديلها:
                </label>
                {baseImage ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-700 h-44 bg-slate-950 flex items-center justify-center">
                    <img src={baseImage} alt="Base" className="h-full object-contain" />
                    <button
                      onClick={() => setBaseImage(null)}
                      className="absolute top-2 left-2 px-2.5 py-1 bg-rose-500/80 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      إزالة الصورة
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-950/50">
                    <Upload className="w-8 h-8 text-amber-400" />
                    <span className="text-xs text-slate-300 font-medium">
                      اضغط لاختيار صورة من جهازك لتعديلها
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

            {/* Prompt input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                {isEditMode
                  ? 'أدخل تعليمات التعديل (مثال: أضف شرائح برتقال طائرة، أو اجعل الخلفية مظلمة):'
                  : 'وصف الصورة المراد إنشاؤها بالذكاء الاصطناعي:'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder={
                  isEditMode
                    ? 'مثال: أضف تأثير توهج نيون أزرق حول الشفرة، أو اجعل الفاكهة تنقسم وتسكب عصيرها...'
                    : 'مثال: بطيخ أحمر مقطوع نصفين في الهواء مع رذاذ عصير أحمر لامع بأسلوب ثلاثي الأبعاد...'
                }
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-medium">أفكار مقترحة سريعة:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(p)}
                    className="text-[11px] px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition-colors text-right"
                  >
                    {p.length > 38 ? p.slice(0, 38) + '...' : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality & Aspect Ratio Options */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-300">أبعاد الصورة (Aspect Ratio):</span>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="1:1">1:1 (مربعة - للأيقونات والفواكه)</option>
                  <option value="16:9">16:9 (عريضة - لخلفيات اللعبة)</option>
                  <option value="9:16">9:16 (طولية - لشاشات الهواتف)</option>
                  <option value="4:3">4:3 (كلاسيكية)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-300">دقة الصورة (gemini-nano-banana-2.1):</span>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="1K">1K (عالية السرعة والجودة)</option>
                  <option value="2K">2K (فائقة الوضوح)</option>
                  <option value="4K">4K (أقصى دقة وتفاصيل)</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleGenerateOrEdit}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري المعالجة بالذكاء الاصطناعي...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>{isEditMode ? 'تطبيق التعديلات على الصورة' : 'توليد الصورة الآن'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex-1 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>معاينة الصورة الناتجة:</span>
                </span>
                {modelUsed && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {modelUsed}
                  </span>
                )}
              </div>

              {/* Display Area */}
              <div className="min-h-[320px] rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden relative group">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-spin">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-300 font-bold">
                      يقوم نموذج <span className="text-emerald-400">gemini-nano-banana-2.1</span> برسم تفاصيل صورتك الآن...
                    </p>
                    <span className="text-[11px] text-slate-500">قد يستغرق ذلك بضع ثوانٍ</span>
                  </div>
                ) : generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="AI Generated"
                    className="w-full h-full max-h-[420px] object-contain rounded-2xl shadow-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 p-6 text-slate-600 text-center">
                    <Sparkles className="w-10 h-10 stroke-1" />
                    <p className="text-xs text-slate-400">
                      لم يتم توليد أي صورة بعد. أدخل الوصف واضغط على زر التوليد لمعاينة النتيجة هنا.
                    </p>
                  </div>
                )}
              </div>

              {generatedText && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {generatedText}
                </div>
              )}
            </div>

            {/* Action buttons on image */}
            {generatedImage && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل الصورة (PNG)</span>
                </button>

                {onApplyBackground && (
                  <button
                    onClick={handleApplyAsBackground}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    {appliedBg ? <Check className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4" />}
                    <span>{appliedBg ? 'تم تعيينها كخلفية!' : 'تعيين كخلفية للعبة'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
