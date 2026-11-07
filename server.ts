import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared GoogleGenAI instance server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Generate & Edit Images using gemini-nano-banana-2.1
app.post('/api/gemini/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, baseImage, aspectRatio = '1:1', imageSize = '1K', isEdit = false } = req.body;

    if (!prompt && !baseImage) {
      return res.status(400).json({ error: 'الرجاء إدخال وصف للصورة أو اختيار صورة للتعديل.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'مفتاح GEMINI_API_KEY غير موجود في إعدادات الخادم.',
      });
    }

    const contentsParts: any[] = [];

    if (baseImage) {
      // Clean base64 prefix if present
      const matches = baseImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let mimeType = 'image/png';
      let data = baseImage;
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        data = matches[2];
      }
      contentsParts.push({
        inlineData: {
          mimeType,
          data,
        },
      });
    }

    if (prompt) {
      contentsParts.push({
        text: prompt,
      });
    }

    // Try gemini-nano-banana-2.1 first as requested, with fallback to gemini-3.1-flash-lite-image
    let response: any = null;
    let modelUsed = 'gemini-nano-banana-2.1';

    try {
      const config: any = {
        imageConfig: {
          aspectRatio,
          imageSize,
        },
      };

      response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: { parts: contentsParts },
        config,
      });
    } catch (primaryErr: any) {
      console.warn('Fallback to gemini-3.1-flash-lite-image due to:', primaryErr?.message);
      modelUsed = 'gemini-3.1-flash-lite-image';
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: { parts: contentsParts },
      });
    }

    let generatedImageUrl = '';
    let textResponse = '';

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textResponse += part.text;
      }
    }

    if (!generatedImageUrl && !textResponse) {
      return res.status(500).json({ error: 'لم يتمكن النموذج من توليد الصورة. حاول تغيير الوصف.' });
    }

    return res.json({
      success: true,
      imageUrl: generatedImageUrl,
      text: textResponse,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return res.status(500).json({
      error: error?.message || 'حدث خطأ أثناء إنشاء الصورة باستخدام الذكاء الاصطناعي.',
    });
  }
});

// Endpoint: Analyze Image using gemini-4-argon
app.post('/api/gemini/analyze-image', async (req: Request, res: Response) => {
  try {
    const { image, prompt = 'حلل هذه الصورة بالتفصيل، وإذا كانت فاكهة أو عنصر لعبة، حدد نقاطها، صلابتها، وطريقة تقطيعها في لعبة قاطع الفواكه.' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'الرجاء رفع صورة للتحليل.' });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let mimeType = 'image/png';
    let data = image;
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      data = matches[2];
    }

    let modelUsed = 'gemini-4-argon';
    let response: any = null;

    try {
      response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data,
              },
            },
            {
              text: `أنت خبير ألعاب ومصمم لعبة قاطع الفواكه (Fruit Cutter). قم بتحليل الصورة التالية باللغة العربية بأسلوب شيق وواضح:
1. تحديد محتوى الصورة وتفاصيلها.
2. إذا كانت فاكهة أو طعام: تقييمها كعنصر داخل لعبة تقطيع الفواكه (النقاط المقترحة، السرعة، تأثير التقطيع، هل هي فاكهة عادية أم نادرة أم قنبلة خطيرة؟).
3. تقديم نصائح إبداعية أو تكتيكية.
${prompt}`,
            },
          ],
        },
      });
    } catch (err: any) {
      console.warn('Fallback to gemini-3.8-flash for analysis:', err?.message);
      modelUsed = 'gemini-3.8-flash';
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });
    }

    const text = response.text || 'تم فحص الصورة بنجاح دون تفاصيل إضافية.';
    return res.json({
      success: true,
      analysis: text,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Image analysis error:', error);
    return res.status(500).json({
      error: error?.message || 'حدث خطأ أثناء تحليل الصورة.',
    });
  }
});

// Endpoint: AI APK & Game Assistant
app.post('/api/gemini/assistant', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'السؤال مطلوب.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `أنت مهندس خبير في تطوير تطبيقات الأندرويد وGame Developer لنظام Android Studio، مختص بمشروع قاطع الفواكه (Fruit Cutter) المعرف بـ com.mfth.fruitcutter.
أجب عن استفسار المستخدم باللغة العربية (أو الدارجة المغربية إذا سأل بالدارجة) بأسلوب مبسط وعملي ومباشر.
سؤال المستخدم:
${question}`,
    });

    return res.json({
      success: true,
      answer: response.text || '',
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'تعذر الإجابة على السؤال.',
    });
  }
});

// Setup Vite development server or production static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
