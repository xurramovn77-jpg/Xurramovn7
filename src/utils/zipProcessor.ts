import JSZip from 'jszip';
import {
  MAX_EXTRACTED_BYTES,
  MAX_HTML_BYTES,
  MAX_ZIP_BYTES,
  MAX_ZIP_ENTRIES,
} from '../constants/nexplay';
import type { NexplayPackageRecord, ZipFileEntry } from '../types/nexplay';
import {
  findBlockedExt,
  formatSize,
  getMimeType,
  validateEntryPath,
  wrapSandboxedHtml,
} from './nexplayLogic';

export function revokeBlobList(urls: string[]): void {
  for (const url of urls || []) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore
    }
  }
}

export async function buildPackageSrcdoc(
  pkgRec: NexplayPackageRecord | null
): Promise<{ srcdoc: string; urls: string[] } | null> {
  if (!pkgRec) return null;
  const urls: string[] = [];
  const assets: Record<string, string> = {};

  if (pkgRec.files && typeof pkgRec.files === 'object') {
    for (const [fPath, fObj] of Object.entries(pkgRec.files)) {
      if (fPath === pkgRec.entryPath) continue;
      const bin = atob(fObj.b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: fObj.mime || 'application/octet-stream' });
      const bUrl = URL.createObjectURL(blob);
      urls.push(bUrl);
      assets[fPath] = bUrl;
    }
  }

  let entryHtml = pkgRec.htmlContent || '';
  if (pkgRec.files && pkgRec.entryPath && pkgRec.files[pkgRec.entryPath]) {
    const bin = atob(pkgRec.files[pkgRec.entryPath].b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    entryHtml = new TextDecoder('utf-8').decode(arr);
  }

  return { srcdoc: wrapSandboxedHtml(entryHtml, assets), urls };
}

export type PackageParseResult =
  | { ok: true; record: NexplayPackageRecord; suggestedTitle: string }
  | { ok: false; error: string };

export async function parseGamePackageFile(
  file: File,
  onProgress?: (pct: number, label: string) => void
): Promise<PackageParseResult> {
  const lowName = String(file.name || '').toLowerCase();
  const isHtml = lowName.endsWith('.html') || lowName.endsWith('.htm');
  const isZip = lowName.endsWith('.zip');

  if (!isHtml && !isZip) {
    return { ok: false, error: "Faqat .html, .htm yoki .zip paket yuklash mumkin." };
  }

  if (isHtml) {
    if (file.size > MAX_HTML_BYTES) {
      return {
        ok: false,
        error: `HTML fayl hajmi ${formatSize(MAX_HTML_BYTES)} dan oshmasligi kerak.`,
      };
    }
    onProgress?.(60, "HTML kodi o'qilmoqda...");
    const txt = await file.text();
    const cleanName = file.name.replace(/\.(html|htm)$/i, '').replace(/[-_]+/g, ' ').trim();
    return {
      ok: true,
      suggestedTitle: cleanName || "Yangi HTML5 o'yin",
      record: {
        packageId: `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        packageType: 'html',
        fileName: file.name,
        totalSize: file.size,
        fileCount: 1,
        entryPath: file.name,
        htmlCandidates: [file.name],
        htmlContent: txt,
      },
    };
  }

  if (file.size > MAX_ZIP_BYTES) {
    return {
      ok: false,
      error: `ZIP arxivi hajmi ${formatSize(MAX_ZIP_BYTES)} dan oshmasligi kerak.`,
    };
  }

  try {
    onProgress?.(40, 'ZIP arxivi ochilmoqda va xavfsizlik tekshirilmoqda...');
    const zip = await JSZip.loadAsync(file);
    const allNames = Object.keys(zip.files);
    if (allNames.length > MAX_ZIP_ENTRIES) {
      return {
        ok: false,
        error: `ZIP ichida fayllar soni juda ko'p (maksimum ${MAX_ZIP_ENTRIES}).`,
      };
    }

    const filesMap: Record<string, ZipFileEntry> = {};
    let extractedBytes = 0;
    const htmlCandidates: string[] = [];

    for (const rawName of allNames) {
      const entry = zip.files[rawName];
      if (!entry || entry.dir) continue;

      const pathCheck = validateEntryPath(rawName);
      if (!pathCheck.ok) {
        return {
          ok: false,
          error: `Xavfsizlik tekshiruvi rad etdi: ${pathCheck.reason}`,
        };
      }

      const blocked = findBlockedExt(pathCheck.path);
      if (blocked) {
        return {
          ok: false,
          error: `Taqiqlangan fayl turi aniqlandi (${blocked}): ${pathCheck.path}`,
        };
      }

      const b64 = await entry.async('base64');
      const u8 = await entry.async('uint8array');
      extractedBytes += u8.byteLength;
      if (extractedBytes > MAX_EXTRACTED_BYTES) {
        return {
          ok: false,
          error: `Ochilgan fayllar umumiy hajmi ${formatSize(MAX_EXTRACTED_BYTES)} dan oshib ketdi.`,
        };
      }

      filesMap[pathCheck.path] = {
        mime: getMimeType(pathCheck.path),
        size: u8.byteLength,
        b64,
      };

      if (pathCheck.path.toLowerCase().endsWith('.html') || pathCheck.path.toLowerCase().endsWith('.htm')) {
        htmlCandidates.push(pathCheck.path);
      }
    }

    if (htmlCandidates.length === 0) {
      return {
        ok: false,
        error: "ZIP arxiv ichida birorta ham .html yoki .htm kirish fayli topilmadi.",
      };
    }

    htmlCandidates.sort((a, b) => {
      const aRoot = a.toLowerCase() === 'index.html' ? 0 : a.toLowerCase().endsWith('/index.html') ? 1 : 2;
      const bRoot = b.toLowerCase() === 'index.html' ? 0 : b.toLowerCase().endsWith('/index.html') ? 1 : 2;
      return aRoot - bRoot || a.length - b.length;
    });

    const entryPath = htmlCandidates[0];
    const cleanTitle = file.name.replace(/\.zip$/i, '').replace(/[-_]+/g, ' ').trim();

    return {
      ok: true,
      suggestedTitle: cleanTitle || "Yangi ZIP o'yin",
      record: {
        packageId: `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        packageType: 'zip',
        fileName: file.name,
        totalSize: extractedBytes,
        fileCount: Object.keys(filesMap).length,
        entryPath,
        htmlCandidates,
        files: filesMap,
      },
    };
  } catch {
    return {
      ok: false,
      error: "ZIP arxivini o'qib bo'lmadi. Fayl shikastlangan bo'lishi mumkin.",
    };
  }
}
