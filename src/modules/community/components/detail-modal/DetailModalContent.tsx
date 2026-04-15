import React from "react";
import { PostContent } from "../PostContent";
import { PostTags } from "../PostTags";
import { PollCard } from "../PollCard";
import { Poll } from "@/shared/types/poll";
import { PostType } from "../PostBadge";
import { INLINE_STYLES } from "../styles/communityDesignSystem";

interface CommunityPostContentProps {
  content: string;
  images?: string[];
  poll?: Poll;
  postType: PostType;
  postId: string;
  tags: string[];
  onTagClick?: (tag: string) => void;
}

interface CivicReportContentProps {
  description: string;
}

export const CommunityPostContent = ({
  content,
  images,
  poll,
  postType,
  postId,
  tags,
  onTagClick,
}: CommunityPostContentProps) => {
  return (
    <>
      <PostContent content={content} images={images} />

      {poll && postType === "enquete" && (
        <div className="mt-4">
          <PollCard pollId={postId} poll={poll} />
        </div>
      )}

      {tags.length > 0 && <PostTags tags={tags} onTagClick={onTagClick} />}
    </>
  );
};

export const CivicReportContent = ({
  description,
}: CivicReportContentProps) => {
  return (
    <p className="text-sm leading-relaxed" style={INLINE_STYLES.textSecondary}>
      {description}
    </p>
  );
};
