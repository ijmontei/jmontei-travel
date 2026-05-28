"use client";

import React, { useRef, useState } from "react";
import { Button, Stack, Text } from "@sanity/ui";
import { insert, setIfMissing } from "sanity";
import type { ArrayOfObjectsInputProps } from "sanity";
import { useClient } from "sanity";
import { randomKey } from "@sanity/util/content";

type Props = ArrayOfObjectsInputProps;

async function maybeConvertHeic(file: File): Promise<File> {
  const name = file.name.toLowerCase();
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif");

  if (!isHeic) return file;

  // 👇 Dynamically import ONLY in browser
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
        setStatus(`Uploading ${i}/${files.length}…`);

        const file = await maybeConvertHeic(raw);

        const asset = await client.assets.upload("image", file, {
          filename: file.name,
        });

        newItems.push({
          _key: randomKey(),
          _type: "image",
          asset: { _type: "reference", _ref: asset._id },
        });
      }

      onChange(insert(newItems, "after", [-1]));

      setStatus(`Uploaded ${files.length} photos.`);
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
          Select multiple photos at once. HEIC will be converted to JPG automatically.
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
