import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const f = createUploadthing();

export const ourFileRouter = {
  channelAttachment: f({ image: { maxFileSize: "4MB", maxFileCount: 5 }, pdf: { maxFileSize: "16MB" }, text: { maxFileSize: "16MB" } })
    .middleware(async ({ req }) => {
      const session = await getSession();
      if (!session) throw new UploadThingError("Unauthorized");
      return { userId: session.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Create a StoredFile record
      const storedFile = await prisma.storedFile.create({
        data: {
          name: file.name,
          type: file.type || "unknown",
          size: file.size.toString(),
          url: file.url,
          key: file.key,
          uploadedById: metadata.userId,
          // We can optionally pass channelId or messageId from the client via middleware headers,
          // but for now, we just store the file. The client will attach the storedFile to a message
          // or channel when it gets the response back from the upload.
        }
      });
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { uploadedBy: metadata.userId, fileId: storedFile.id, fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
