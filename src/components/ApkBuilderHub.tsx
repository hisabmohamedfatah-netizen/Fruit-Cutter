import React, { useState } from 'react';
import { Download, Smartphone, Github, Terminal, CheckCircle2, AlertCircle, FileCode, Send, Sparkles, HelpCircle } from 'lucide-react';
import { generateFullAndroidProjectZip } from '../utils/apkProjectGenerator';

export const ApkBuilderHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'studio' | 'pwa' | 'files'>('cloud');
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // AI Assistant Chat State
  const [chatQuestion, setChatQuestion] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'مرحباً بك! أنا مساعد تطوير تطبيقات الأندرويد الخاص بلعبة قاطع الفواكه. يمكنك سؤالي عن طريقة استخراج APK، أو ضبط إعلانات AdMob، أو رفع اللعبة على متجر Google Play.',
    },
  ]);

  const handleDownloadZip = async () => {
    try {
      setIsGeneratingZip(true);
      const zipBlob = await generateFullAndroidProjectZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'FruitCutter-Complete-Android-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuestion.trim() || chatLoading) return;

    const userText = chatQuestion.trim();
    setChatQuestion('');
    setChatHistory((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userText }),
      });
      const data = await res.json();
      if (data.answer) {
        setChatHistory((prev) => [...prev, { sender: 'ai', text: data.answer }]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { sender: 'ai', text: 'حدث خطأ أثناء معالجة السؤال. يرجى المحاولة مرة أخرى.' },
        ]);
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', text: 'تعذر الاتصال بالخادم. يرجى التأكد من تشغيل الخادم.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Darija & Arabic Explanation Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-teal-500/15 border border-amber-500/30 text-slate-200">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-amber-300">
              توضيح مهم حول ملفات المشروع وبناء APK (بالدارجة المغربية)
            </h3>
            <p className="text-sm leading-relaxed text-slate-300">
              أهلاً بك! الملفات الستة التي رفعتها (<code className="text-amber-300">build.gradle</code>, <code className="text-amber-300">settings.gradle</code>, <code className="text-amber-300">gradle.properties</code>...) هي فقط إعدادات الجذر (Root Configuration).
              لكي يتم تحويل المشروع إلى تطبيق <span className="font-bold text-emerald-400">APK</span> يشتغل على الهاتف، كان ينقصه مجلد التطبيق الرئيسي <code className="text-emerald-400">app/</code> الذي يحتوي على كود الجافا، وملف <code className="text-emerald-400">AndroidManifest.xml</code>، وواجهات وإعلانات AdMob.
            </p>
            <p className="text-sm text-emerald-300 font-bold">
              ✨ قمنا بإنشاء وتجهيز حزمة المشروع الكاملة 100% لك! يمكنك الآن تحميل المشروع بنقرة واحدة وتجميع APK بسهولة تامة عبر طريقتين مضمونتين:
            </p>
          </div>
        </div>

        {/* Big Action Download Button */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadZip}
            disabled={isGeneratingZip}
            className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-3 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            <span>
              {isGeneratingZip ? 'جاري تجميع حزمة المشروع...' : 'تحميل مشروع الأندرويد الكامل الجاهز للبناء (ZIP)'}
            </span>
          </button>

          {downloadSuccess && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-950/60 border border-emerald-500/40 px-3.5 py-2 rounded-2xl animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>تم تنزيل المشروع بنجاح! جاهز للتجميع.</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs for Guides */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('cloud')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
            activeTab === 'cloud'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Github className="w-4 h-4" />
          <span>تجميع سحابي مجاني (GitHub Actions) ⭐ الأسهل</span>
        </button>

        <button
          onClick={() => setActiveTab('studio')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
            activeTab === 'studio'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>بناء عبر Android Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('pwa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
            activeTab === 'pwa'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>تثبيت فوري على هاتفك (PWA)</span>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
            activeTab === 'files'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>محتويات الحزمة وهيكل الملفات</span>
        </button>
      </div>

      {/* Tab 1: GitHub Actions (Easiest Cloud Build) */}
      {activeTab === 'cloud' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">
                تجميع APK سحابياً عبر GitHub Actions (دون الحاجة لتثبيت برامج ثقيلة)
              </h4>
              <p className="text-xs text-slate-400">
                هذه هي أسهل وأسرع طريقة! السيرفر السحابي سيقوم ببناء الـ APK في أقل من دقيقتين مجاناً.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h5 className="font-bold text-sm text-slate-200">تحميل وفك الضغط</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                اضغط على الزر الأخضر أعلاه لتحميل ملف ZIP وفك ضغطه على حاسوبك.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h5 className="font-bold text-sm text-slate-200">مستودع GitHub جديد</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                ادخل إلى موقع github.com وأنشئ مستودعاً جديداً (New Repository) وارفع فيه الملفات.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h5 className="font-bold text-sm text-slate-200">البناء التلقائي</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                ملف <code className="text-emerald-400">build-apk.yml</code> مدمج بالفعل! سيبدأ GitHub ببناء التطبيق تلقائياً في تبويب Actions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                4
              </div>
              <h5 className="font-bold text-sm text-slate-200">تنزيل ملف APK</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                افتح تبويب <strong>Actions</strong> واضغط على آخر تشغيل، ثم حمّل ملف <strong className="text-emerald-400">FruitCutter-Debug-APK</strong>!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Android Studio Local Build */}
      {activeTab === 'studio' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">طريقة التجميع عبر برنامج Android Studio</h4>
              <p className="text-xs text-slate-400">
                إذا كان لديك برنامج Android Studio مثبت على حاسوبك وتريد استخراج الـ APK محلياً.
              </p>
            </div>
          </div>

          <ol className="space-y-3 text-sm text-slate-300 list-decimal list-inside pr-2">
            <li className="leading-relaxed">
              حمّل ملف ZIP المضغوط وفك الضغط عنه في مجلد باسم <code className="text-emerald-400">FruitCutter</code>.
            </li>
            <li className="leading-relaxed">
              افتح برنامج Android Studio واختر: <span className="font-bold text-white">File &gt; Open...</span> ثم حدد المجلد.
            </li>
            <li className="leading-relaxed">
              انتظر دقيقة واحدة حتى يقوم Gradle بعمل مزامنة (Sync) وتحميل المكتبات.
            </li>
            <li className="leading-relaxed">
              من القائمة العلوية اضغط على:
              <div className="mt-2 p-3 rounded-xl bg-slate-950 font-mono text-emerald-400 text-xs border border-slate-800 inline-block">
                Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)
              </div>
            </li>
            <li className="leading-relaxed">
              ستظهر لك نافذة صغيرة في الزاوية تفيد بنجاح البناء، اضغط على زر <span className="text-emerald-400 font-bold">locate</span> لتجد ملف <code className="text-amber-300">app-debug.apk</code> جاهزاً للتثبيت في هاتفك!
            </li>
          </ol>
        </div>
      )}

      {/* Tab 3: PWA Instant Mobile Install */}
      {activeTab === 'pwa' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">تثبيت اللعبة فوراً على هاتفك الذكي (تطبيق PWA)</h4>
              <p className="text-xs text-slate-400">
                يمكنك تجربة ولعب قاطع الفواكه على هاتفك كتطبيق حقيقي بملء الشاشة الآن دون انتظار ملف الـ APK!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <span className="text-xs text-emerald-400 font-bold">الخطوة 1:</span>
              <p className="text-sm font-semibold text-slate-200">افتح الرابط من الهاتف</p>
              <p className="text-xs text-slate-400">
                افتح رابط هذا التطبيق على هاتفك بواسطة متصفح Google Chrome.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <span className="text-xs text-emerald-400 font-bold">الخطوة 2:</span>
              <p className="text-sm font-semibold text-slate-200">اضغط على القائمة (⋮)</p>
              <p className="text-xs text-slate-400">
                اضغط على النقاط الثلاث في زاوية المتصفح أعلى الشاشة.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <span className="text-xs text-emerald-400 font-bold">الخطوة 3:</span>
              <p className="text-sm font-semibold text-slate-200">تثبيت التطبيق (Install)</p>
              <p className="text-xs text-slate-400">
                اختر <strong>«تثبيت التطبيق»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong> لتجده مع تطبيقات هاتفك!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Package Hierarchy Explorer */}
      {activeTab === 'files' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h4 className="text-lg font-bold text-white">هيكل ملفات حزمة مشروع الأندرويد المجمعة</h4>
          <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed border border-slate-800 overflow-x-auto">
            <div className="text-emerald-400 font-bold">📁 FruitCutter-Project/</div>
            <div className="pl-4">├── 📄 build.gradle <span className="text-slate-500">(ملفك الأصلي)</span></div>
            <div className="pl-4">├── 📄 settings.gradle <span className="text-slate-500">(ملفك الأصلي)</span></div>
            <div className="pl-4">├── 📄 gradle.properties <span className="text-slate-500">(ملفك الأصلي)</span></div>
            <div className="pl-4">├── 📄 gradlew & gradlew.bat <span className="text-slate-500">(ملف تنفيذ البناء)</span></div>
            <div className="pl-4">├── 📁 .github/workflows/</div>
            <div className="pl-8 text-amber-300">└── 📄 build-apk.yml <span className="text-slate-500">(تجميع APK تلقائياً على GitHub)</span></div>
            <div className="pl-4">└── 📁 app/ <span className="text-emerald-400 font-bold">(المجلد الذي كان ناقصاً وتم إنشاؤه بالكامل!)</span></div>
            <div className="pl-8">├── 📄 build.gradle <span className="text-slate-500">(مضبوط على com.mfth.fruitcutter ومكتبات AdMob)</span></div>
            <div className="pl-8">└── 📁 src/main/</div>
            <div className="pl-12">├── 📄 AndroidManifest.xml <span className="text-slate-500">(صلاحيات والـ AdMob App ID)</span></div>
            <div className="pl-12">├── 📁 java/com/mfth/fruitcutter/</div>
            <div className="pl-16">└── 📄 MainActivity.java <span className="text-slate-500">(تشغيل اللعبة والإعلانات)</span></div>
            <div className="pl-12">├── 📁 res/values/</div>
            <div className="pl-16">└── 📄 strings.xml <span className="text-slate-500">(اسم التطبيق: قاطع الفواكه)</span></div>
            <div className="pl-12">└── 📁 assets/game/</div>
            <div className="pl-16">└── 📄 index.html <span className="text-slate-500">(محرك لعبة قاطع الفواكه التفاعلية)</span></div>
          </div>
        </div>
      )}

      {/* Android Studio & APK AI Assistant */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-black text-lg">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span>المساعد الذكي لتطوير وبناء تطبيقات الأندرويد (Gemini AI)</span>
        </div>
        <p className="text-xs text-slate-400">
          اسأل أي سؤال باللغة العربية أو الدارجة حول: استخراج ملف APK، حل أخطاء Gradle، ضبط إعلانات AdMob، إنشاء Keystore لتوقيع التطبيق، أو شروط Google Play.
        </p>

        {/* Chat History */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {chatHistory.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
                item.sender === 'user'
                  ? 'bg-emerald-600 text-slate-950 font-medium mr-auto rounded-tl-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 ml-auto rounded-tr-sm'
              }`}
            >
              {item.text}
            </div>
          ))}
          {chatLoading && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>جاري التفكير وصياغة الإجابة...</span>
            </div>
          )}
        </div>

        {/* Chat Input Form */}
        <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={chatQuestion}
            onChange={(e) => setChatQuestion(e.target.value)}
            placeholder="مثال: كيفاش نغير معرّف AdMob؟ أو كيفاش ندير Sign لملف APK باش نحطو فـ Google Play؟"
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!chatQuestion.trim() || chatLoading}
            className="p-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl transition-colors disabled:opacity-40"
          >
            <Send className="w-5 h-5 fill-current" />
          </button>
        </form>
      </div>
    </div>
  );
};
