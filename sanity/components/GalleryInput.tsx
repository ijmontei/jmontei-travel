"use client";

import React, { useRef, useState } from "react";
import { Button, Stack, Text } from "@sanity/ui";
import { insert, setIfMissing } from "sanity";
import type { ArrayOfObjectsInputProps } from "sanity";
import { useClient } from "sanity";

type Props = ArrayOfObjectsInputProps;

function generateRandomKey(): string {
  return Math.random().toString(36).substring(2, 14);
}

// Converts HEIC files to standard JPEG Blobs
async function maybeConvertHeic(file: File): Promise<File> {
  const name = file.name.toLowerCase();
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif");

  if (!isHeic) return file;

  const heic2any = (await import("heic2any")).default;
  const blob = (await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  })) as Blob;

  return new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
    type: "image/jpeg",
  });
}

/**
 * Resizes and compresses images locally using canvas before uploading.
 * This drops 5-15MB phone images down to ~300-500KB (1080p max dimension).
 */
async function resizeAndCompressImage(
  file: File,
  maxDimension = 1920,
  quality = 0.82
): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate downscaling ratios preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(file); // Fallback to original file if canvas fails
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            // Enforce clean JPEG filename extension
            const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            resolve(new File([blob], newFileName, { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export function GalleryInput(props: Props) {
  const { onChange, renderDefault, value } = props;

  const client = useClient({ apiVersion: "2024-01-01" });
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<string>("");

  async function handlePick(files: FileList | null) {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setStatus(`Preparing ${files.length} photos…`);

    try {
      if (!value) onChange(setIfMissing([]));

      const newItems: any[] = [];
      let i = 0;

      for (const raw of Array.from(files)) {
        i += 1;
        setStatus(`Processing & Uploading ${i}/${files.length}…`);

        // 1. Convert from HEIC if required
        const standardFile = await maybeConvertHeic(raw);

        // 2. Compress & resize to clean 1080p container in-memory
        const optimizedFile = await resizeAndCompressImage(standardFile, 1920, 0.82);

        // 3. Upload significantly smaller file payload
        const asset = await client.assets.upload("image", optimizedFile, {
          filename: optimizedFile.name,
        });

        newItems.push({
          _key: generateRandomKey(),
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
        });
      }

      onChange(insert(newItems, "after", [-1]));
      setStatus(`Uploaded ${files.length} photos successfully.`);
    } catch (err: any) {
      console.error(err);
      setStatus(err?.message ? `Upload failed: ${err.message}` : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      setTimeout(() => setStatus(""), 2500);
    }
  }

  return (
    <Stack space={3}>
      <Stack space={2}>
        <Button
          mode="default"
          text={isUploading ? "Uploading…" : "Batch add photos"}
          disabled={isUploading}
          onClick={() => fileRef.current?.click()}
        />
        <Text size={1} muted>
          Select multiple photos. Large files will downscale to 1080p and compress automatically before upload.
        </Text>

        {status ? (
          <Text size={1} muted>
            {status}
          </Text>
        ) : null}

        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          hidden
          onChange={(e) => handlePick(e.target.files)}
        />
      </Stack>

      {renderDefault(props)}
    </Stack>
  );
}