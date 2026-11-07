قاطع الفواكه - مشروع Android Studio

التعديلات التي تمت:
- applicationId: com.mfth.fruitcutter
- اسم التطبيق: قاطع الفواكه (app/src/main/res/values/strings.xml)
- ترجمة كاملة للعبة إلى العربية، واللغة العربية مفروضة دائمًا (خط Cairo مدمج)
- تغيير ألوان الخلفية + أيقونة وشاشة تحميل جديدتان
- معرّفات AdMob الخاصة بك (التطبيق، البانر، البيني) موضوعة، و is_testing = false

قبل النشر على Google Play يجب:
1) لا تنقر على إعلاناتك بنفسك. للتجربة اجعل is_testing = true في strings.xml ثم أعدها false قبل النشر
2) (مُنجز) معرّفات AdMob موضوعة
3) تغيير privacy_url و privacy_email في strings.xml، وملف assets/game/privarcypolicy.txt إلى بياناتك
4) رفع versionCode مع كل تحديث

طريقة الحصول على APK:
- Android Studio: افتح المجلد ثم Build > Build Bundle(s) / APK(s) > Build APK(s)
- أو ارفع المجلد إلى مستودع GitHub: تبويب Actions > Build APK > ثم نزّل الملف من Artifacts
(هذا APK تجريبي debug. للنشر على Google Play استخدم Build > Generate Signed Bundle / APK بمفتاحك الخاص.)
