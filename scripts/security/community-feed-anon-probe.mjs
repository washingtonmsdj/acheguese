import { randomUUID } from "node:crypto";
import {
  createAnonClient,
  createServiceRoleClient,
} from "../lib/supabase-client.mjs";

const anon = createAnonClient();
const probeId = randomUUID();
const profileId = randomUUID();
const locationId = randomUUID();
const storagePath = `${profileId}/post_image/v1/${probeId}.jpg`;

const outcomes = [];

const postResult = await anon
  .from("posts")
  .insert({
    author_profile_id: profileId,
    location_id: locationId,
    type: "post",
    content: `Anonymous security probe ${probeId}`,
    images: [],
  })
  .select("id")
  .maybeSingle();

outcomes.push({
  operation: "anonymous_post_insert",
  blocked: Boolean(postResult.error) && !postResult.data,
  code: postResult.error?.code ?? null,
});

const jpegSignature = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const storageResult = await anon.storage
  .from("media-assets")
  .upload(storagePath, jpegSignature, {
    contentType: "image/jpeg",
    upsert: false,
  });

outcomes.push({
  operation: "anonymous_post_image_upload",
  blocked: Boolean(storageResult.error),
  code: storageResult.error?.statusCode ?? null,
});

const unexpectedPostId = postResult.data?.id;
const unexpectedStoragePath = storageResult.data?.path;

if (unexpectedPostId || unexpectedStoragePath) {
  const admin = createServiceRoleClient();
  if (unexpectedPostId) {
    await admin.from("posts").delete().eq("id", unexpectedPostId);
  }
  if (unexpectedStoragePath) {
    await admin.storage.from("media-assets").remove([unexpectedStoragePath]);
  }
}

process.stdout.write(`${JSON.stringify({ outcomes }, null, 2)}\n`);

if (outcomes.some((outcome) => !outcome.blocked)) {
  throw new Error("Anonymous Community write probe was not blocked");
}
